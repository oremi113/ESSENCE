import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema, 
  insertVoiceRecordingSchema, 
  insertMessageSchema,
  insertUserSchema
} from "@shared/schema";
import { TOTAL_TRAINING_PHRASES } from "@shared/constants";
import { z } from "zod";
import { elevenLabsService } from "./elevenlabs";
import { passport, hashPassword, requireAuth } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Profile creation schema - only validates fields from request body (userId comes from session)
const createProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relation: z.string().min(1, "Relation is required"),
  notes: z.string().optional().default(''),
});

// Safe profile update schema - only allow certain fields (voiceModelStatus is server-controlled)
const updateProfileSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(), 
  notes: z.string().optional(),
});

// Helper to get authenticated user ID from request
function getUserId(req: any): string {
  if (!req.user || !req.user.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint to check auth status
  app.get("/api/debug/auth", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated?.() ?? false,
      hasUser: !!req.user,
      user: req.user,
      nodeEnv: process.env.NODE_ENV,
      hasSession: !!req.session,
    });
  });

  // Authentication routes
  app.post("/api/signup", async (req, res, next) => {
    const serverInfo = {
      pid: process.pid,
      dbType: process.env.DATABASE_URL?.includes('helium') ? 'HELIUM' : 'NEON',
      timestamp: new Date().toISOString()
    };
    console.log('[SIGNUP] Starting signup - SERVER INFO:', serverInfo);
    console.log('[SIGNUP] DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.log('[SIGNUP] Request body:', req.body);
    
    try {
      const { email, password, name, age } = req.body;
      
      // Validate input
      if (!email || !password) {
        console.log('[SIGNUP] Validation failed: missing email or password');
        return res.status(400).json({ 
          error: "Email and password are required",
          serverInfo  // Include server info in error response
        });
      }
      
      if (password.length < 6) {
        console.log('[SIGNUP] Validation failed: password too short');
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      console.log('[SIGNUP] Checking if user exists');
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      if (existingUser) {
        console.log('[SIGNUP] User already exists:', email);
        return res.status(400).json({ error: "Email already registered" });
      }
      
      console.log('[SIGNUP] Hashing password');
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      console.log('[SIGNUP] Creating user in database');
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null,
          age: age || null,
        })
        .returning();
      
      console.log('[SIGNUP] User created successfully:', newUser.id);
      
      // Log in the user automatically
      const { password: _, ...userWithoutPassword } = newUser;
      console.log('[SIGNUP] Attempting to log in user');
      req.login(userWithoutPassword, (err) => {
        if (err) {
          console.error('[SIGNUP] Login error:', err);
          console.error('[SIGNUP] Error details:', JSON.stringify(err, null, 2));
          return next(err);
        }
        
        console.log('[SIGNUP] Login successful, sending response');
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      const serverInfo = {
        pid: process.pid,
        dbType: process.env.DATABASE_URL?.includes('helium') ? 'HELIUM' : 'NEON',
        timestamp: new Date().toISOString()
      };
      console.error('[SIGNUP] Error occurred:', error);
      console.error('[SIGNUP] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[SIGNUP] Server info on error:', serverInfo);
      return res.status(500).json({ 
        error: "Failed to create account",
        details: error instanceof Error ? error.message : 'Unknown error',
        serverInfo  // Include server info in error response
      });
    }
  });
  
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        res.json({ user });
      });
    })(req, res, next);
  });
  
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // Profile routes (all protected)
  app.get("/api/profiles", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profiles = await storage.getAllProfiles(userId);
      
      // Get counts for each profile
      const profilesWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          const [recordingsCount, messagesCount] = await Promise.all([
            storage.getRecordingCount(profile.id, userId),
            storage.getMessageCount(profile.id, userId)
          ]);
          
          return {
            ...profile,
            recordingsCount,
            messagesCount
          };
        })
      );
      
      res.json(profilesWithCounts);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profileData = createProfileSchema.parse(req.body);
      const profile = await storage.createProfile({ ...profileData, userId });
      res.json({
        ...profile,
        recordingsCount: 0,
        messagesCount: 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid profile data", details: error.errors });
      } else {
        console.error("Error creating profile:", error);
        res.status(500).json({ error: "Failed to create profile" });
      }
    }
  });

  app.put("/api/profiles/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const updates = updateProfileSchema.parse(req.body);
      const profile = await storage.updateProfile(id, userId, updates);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const [recordingsCount, messagesCount] = await Promise.all([
        storage.getRecordingCount(profile.id, userId),
        storage.getMessageCount(profile.id, userId)
      ]);
      
      res.json({
        ...profile,
        recordingsCount,
        messagesCount
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/profiles/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      // Get profile to check for ElevenLabs voice
      const profile = await storage.getProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Clean up ElevenLabs voice if it exists
      if (profile.elevenLabsVoiceId) {
        try {
          console.log(`Deleting ElevenLabs voice ${profile.elevenLabsVoiceId} for profile ${profile.name}`);
          await elevenLabsService.deleteVoice(profile.elevenLabsVoiceId);
        } catch (error) {
          console.warn(`Failed to delete ElevenLabs voice ${profile.elevenLabsVoiceId}:`, error);
          // Continue with profile deletion even if voice deletion fails
        }
      }
      
      const deleted = await storage.deleteProfile(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Voice recording routes (all protected)
  app.get("/api/profiles/:profileId/recordings", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      const recordings = await storage.getVoiceRecordingsByProfile(profileId, userId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  app.post("/api/profiles/:profileId/recordings", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      const { phraseIndex, phraseText, audioData } = req.body;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId, userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Validate act index (0-2 for 3 acts)
      if (phraseIndex < 0 || phraseIndex >= TOTAL_TRAINING_PHRASES) {
        return res.status(400).json({ 
          error: `Invalid act index. Must be between 0 and ${TOTAL_TRAINING_PHRASES - 1}` 
        });
      }
      
      // Direct 1:1 mapping: index 0→Act 1, 1→Act 2, 2→Act 3
      const actNumber = String(phraseIndex + 1) as '1' | '2' | '3';
      
      // Create recording data with userId
      const recordingData = insertVoiceRecordingSchema.parse({
        profileId,
        actNumber,
        passageText: phraseText,
        audioData,
        qualityStatus: 'good',
        userId
      });
      
      const recording = await storage.saveVoiceRecording(recordingData);
      
      // Update profile voice model status based on recording count
      const recordingCount = await storage.getRecordingCount(profileId, userId);
      
      let voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 'not_submitted';
      let elevenLabsVoiceId: string | undefined;
      
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES) {
        // Training complete - create ElevenLabs voice model if it doesn't exist
        if (!profile.elevenLabsVoiceId) {
          try {
            console.log(`Creating ElevenLabs voice for profile ${profile.name}...`);
            
            // Get all recordings for this profile
            const allRecordings = await storage.getVoiceRecordingsByProfile(profileId, userId);
            
            // Convert base64 audio data to buffers for ElevenLabs
            const audioFiles = allRecordings.map((recording, index) => {
              const { buffer, mimeType } = elevenLabsService.convertBase64ToBuffer(recording.audioData);
              return {
                name: `sample_${index + 1}`,
                data: buffer,
                mimeType
              };
            });
            
            // Create voice in ElevenLabs
            elevenLabsVoiceId = await elevenLabsService.createVoice(
              `${profile.name} Voice`,
              `Custom voice for ${profile.name} (${profile.relation})`,
              audioFiles
            );
            
            voiceModelStatus = 'ready';
            console.log(`ElevenLabs voice created successfully: ${elevenLabsVoiceId}`);
            
          } catch (error) {
            console.error('Failed to create ElevenLabs voice:', error);
            // Keep status as training if voice creation fails
            voiceModelStatus = 'training';
          }
        } else {
          // Voice already exists, mark as ready
          voiceModelStatus = 'ready';
        }
      }
      
      const updateData: any = { voiceModelStatus };
      if (elevenLabsVoiceId) {
        updateData.elevenLabsVoiceId = elevenLabsVoiceId;
      }
      
      await storage.updateProfile(profileId, userId, updateData);
      
      res.json(recording);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recording data", details: error.errors });
      } else {
        console.error("Error saving recording:", error);
        res.status(500).json({ error: "Failed to save recording" });
      }
    }
  });

  app.delete("/api/profiles/:profileId/recordings/:phraseIndex", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId, phraseIndex } = req.params;
      const actIndex = parseInt(phraseIndex);
      
      // Direct 1:1 mapping: index 0→Act 1, 1→Act 2, 2→Act 3
      const actNumber = String(actIndex + 1) as '1' | '2' | '3';
      
      const deleted = await storage.deleteVoiceRecording(profileId, actNumber, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      // Update profile voice model status
      const recordingCount = await storage.getRecordingCount(profileId, userId);
      const currentProfile = await storage.getProfile(profileId, userId);
      
      let voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 'not_submitted';
      let updateData: any = { voiceModelStatus };
      
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
        
        // If we dropped below threshold and had a voice, clean it up
        if (currentProfile?.elevenLabsVoiceId) {
          try {
            console.log(`Cleaning up ElevenLabs voice ${currentProfile.elevenLabsVoiceId} (below threshold)`);
            await elevenLabsService.deleteVoice(currentProfile.elevenLabsVoiceId);
          } catch (error) {
            console.warn(`Failed to delete ElevenLabs voice ${currentProfile.elevenLabsVoiceId}:`, error);
          }
          updateData.elevenLabsVoiceId = null;
        }
        
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES && currentProfile?.elevenLabsVoiceId) {
        // Only mark as ready if we have both enough recordings AND a voice model
        voiceModelStatus = 'ready';
      } else if (recordingCount === 0) {
        // No recordings left, clean up voice if exists
        if (currentProfile?.elevenLabsVoiceId) {
          try {
            console.log(`Cleaning up ElevenLabs voice ${currentProfile.elevenLabsVoiceId} (no recordings)`);
            await elevenLabsService.deleteVoice(currentProfile.elevenLabsVoiceId);
          } catch (error) {
            console.warn(`Failed to delete ElevenLabs voice ${currentProfile.elevenLabsVoiceId}:`, error);
          }
          updateData.elevenLabsVoiceId = null;
        }
      }
      
      await storage.updateProfile(profileId, userId, updateData);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Speech preview route (generates audio without saving message) - protected
  app.post("/api/profiles/:profileId/tts", requireAuth, async (req, res) => {
    try {
      console.log('[TTS] Request received for profile:', req.params.profileId);
      console.log('[TTS] User from request:', req.user);
      const userId = getUserId(req);
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId, userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile has a ready voice model
      // In DEV mode, use a default voice if no custom voice exists
      const isDevMode = process.env.NODE_ENV === 'development';
      let voiceId = profile.elevenLabsVoiceId;
      
      if (!voiceId) {
        if (isDevMode) {
          // Use ElevenLabs' default "Rachel" voice for testing
          voiceId = '21m00Tcm4TlvDq8ikWAM';
          console.log('[DEV MODE] Using default ElevenLabs voice for testing:', voiceId);
        } else {
          return res.status(400).json({ 
            error: "Voice model not ready. Complete voice training first." 
          });
        }
      }
      
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required for speech generation" });
      }
      
      // Enforce content length limit (2000 chars = ~13 minute TTS at 150 WPM)
      if (content.trim().length > 2000) {
        return res.status(413).json({ 
          error: "Content too long. Maximum 2000 characters allowed." 
        });
      }
      
      try {
        console.log(`Generating preview speech for profile ${profile.name}...`);
        
        // Generate speech using ElevenLabs
        const audioBuffer = await elevenLabsService.generateSpeech(
          content.trim(),
          voiceId
        );
        
        // Convert to base64 for frontend
        const audioData = elevenLabsService.convertBufferToBase64(audioBuffer, 'audio/mpeg');
        
        // Estimate duration (rough calculation: ~150 words per minute, ~5 chars per word)
        const estimatedWords = content.length / 5;
        const duration = Math.max(Math.floor((estimatedWords / 150) * 60), 5); // Min 5 seconds
        
        console.log(`Preview speech generated successfully. Duration: ${duration}s`);
        
        res.json({ audioData, duration });
        
      } catch (error) {
        console.error('Failed to generate preview speech:', error);
        return res.status(500).json({ 
          error: "Failed to generate speech. Please try again." 
        });
      }
      
    } catch (error) {
      console.error("Error in TTS preview:", error);
      res.status(500).json({ error: "Failed to process TTS request" });
    }
  });

  // Message routes (all protected)
  app.get("/api/profiles/:profileId/messages", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      const messages = await storage.getMessagesByProfile(profileId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/profiles/:profileId/messages", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId, userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile has a ready voice model
      if (profile.voiceModelStatus !== 'ready' || !profile.elevenLabsVoiceId) {
        return res.status(400).json({ 
          error: "Voice model not ready. Complete voice training first." 
        });
      }
      
      // Use audioData from frontend if provided (already generated via preview),
      // otherwise generate it now
      const { content, audioData: providedAudioData, duration: providedDuration } = req.body;
      let audioData: string | null = providedAudioData || null;
      let duration = providedDuration || 30;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      // If audioData wasn't already generated, generate it now
      if (!audioData) {
        try {
          console.log(`Generating speech for profile ${profile.name}...`);
          
          // Enforce content length limit
          if (content.trim().length > 2000) {
            return res.status(413).json({ 
              error: "Content too long. Maximum 2000 characters allowed." 
            });
          }
          
          // Generate speech using ElevenLabs
          const audioBuffer = await elevenLabsService.generateSpeech(
            content.trim(),
            profile.elevenLabsVoiceId
          );
          
          // Convert to base64 for storage
          audioData = elevenLabsService.convertBufferToBase64(audioBuffer, 'audio/mpeg');
          
          // Estimate duration (rough calculation: ~150 words per minute, ~5 chars per word)
          const estimatedWords = content.length / 5;
          duration = Math.max(Math.floor((estimatedWords / 150) * 60), 5); // Min 5 seconds
          
          console.log(`Speech generated successfully. Duration: ${duration}s`);
          
        } catch (error) {
          console.error('Failed to generate speech:', error);
          return res.status(500).json({ 
            error: "Failed to generate speech. Please try again." 
          });
        }
      } else {
        console.log(`Using pre-generated audio for profile ${profile.name}`);
      }
      
      // Map frontend data to schema fields
      const { title, category } = req.body;
      
      console.log('Creating message with data:', { title, content, category, audioData: audioData ? 'present' : 'null', duration, profileId });
      
      const messageData = insertMessageSchema.parse({
        userId,
        profileId,
        title,
        category,
        promptText: content, // Using content for both fields until templates are implemented
        generatedText: content,
        audioData,
        duration,
        isPrivate: 1, // Default to private
        shareInterestExpressed: 0 // Default to not interested
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating message:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid message data", details: error.errors });
      } else {
        console.error("Error creating message:", error);
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const deleted = await storage.deleteMessage(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Voice model status route - protected
  app.get("/api/profiles/:profileId/voice-status", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      const profile = await storage.getProfile(profileId, userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const recordingCount = await storage.getRecordingCount(profileId, userId);
      
      res.json({
        voiceModelStatus: profile.voiceModelStatus,
        recordingCount,
        totalRequired: TOTAL_TRAINING_PHRASES
      });
    } catch (error) {
      console.error("Error fetching voice status:", error);
      res.status(500).json({ error: "Failed to fetch voice status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
