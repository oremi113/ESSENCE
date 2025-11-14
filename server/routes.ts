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
  // Authentication routes
  app.post("/api/signup", async (req, res, next) => {
    try {
      const { email, password, name, age, city } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          error: "Email and password are required"
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null,
          age: age || null,
          city: city || null,
        })
        .returning();
      
      // Log in the user automatically
      const { password: _, ...userWithoutPassword } = newUser;
      req.login(userWithoutPassword, (err) => {
        if (err) {
          console.error('Signup login error:', err);
          return next(err);
        }
        
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ 
        error: "Failed to create account"
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
      
      // Validate recording index (0-24 for 25 prompts)
      if (phraseIndex < 0 || phraseIndex >= TOTAL_TRAINING_PHRASES) {
        return res.status(400).json({ 
          error: `Invalid recording index. Must be between 0 and ${TOTAL_TRAINING_PHRASES - 1}` 
        });
      }
      
      // Create recording data with userId
      const recordingData = insertVoiceRecordingSchema.parse({
        profileId,
        recordingIndex: phraseIndex,
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
            
            // Use all 25 recordings for ElevenLabs voice creation
            const audioFiles = allRecordings.map((recording, index) => {
              const { buffer, mimeType } = elevenLabsService.convertBase64ToBuffer(recording.audioData);
              return {
                name: `sample_${index + 1}`,
                data: buffer,
                mimeType
              };
            });
            
            console.log(`Using all ${audioFiles.length} recordings for ElevenLabs voice creation`);
            
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
      const recordingIndex = parseInt(phraseIndex);
      
      const deleted = await storage.deleteVoiceRecording(profileId, recordingIndex, userId);
      
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

  // Retry voice creation for profiles with complete recordings but no voice - protected
  app.post("/api/profiles/:profileId/retry-voice-creation", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId, userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check recording count
      const recordingCount = await storage.getRecordingCount(profileId, userId);
      if (recordingCount < TOTAL_TRAINING_PHRASES) {
        return res.status(400).json({ 
          error: `Need ${TOTAL_TRAINING_PHRASES} recordings to create voice. Current: ${recordingCount}` 
        });
      }
      
      // Check if voice already exists
      if (profile.elevenLabsVoiceId) {
        return res.status(400).json({ 
          error: "Voice already exists for this profile",
          voiceId: profile.elevenLabsVoiceId 
        });
      }
      
      try {
        console.log(`Manually creating ElevenLabs voice for profile ${profile.name}...`);
        
        // Get all recordings for this profile
        const allRecordings = await storage.getVoiceRecordingsByProfile(profileId, userId);
        
        // Use all 25 recordings for ElevenLabs voice creation
        const audioFiles = allRecordings.map((recording, index) => {
          const { buffer, mimeType } = elevenLabsService.convertBase64ToBuffer(recording.audioData);
          return {
            name: `sample_${index + 1}`,
            data: buffer,
            mimeType
          };
        });
        
        console.log(`Using all ${audioFiles.length} recordings for ElevenLabs voice creation`);
        
        // Create voice in ElevenLabs
        const elevenLabsVoiceId = await elevenLabsService.createVoice(
          `${profile.name} Voice`,
          `Custom voice for ${profile.name} (${profile.relation})`,
          audioFiles
        );
        
        // Update profile with voice ID and ready status
        await storage.updateProfile(profileId, userId, {
          elevenLabsVoiceId,
          voiceModelStatus: 'ready'
        });
        
        console.log(`ElevenLabs voice created successfully: ${elevenLabsVoiceId}`);
        
        res.json({ 
          success: true, 
          voiceId: elevenLabsVoiceId,
          status: 'ready'
        });
        
      } catch (error) {
        console.error('Failed to create ElevenLabs voice:', error);
        res.status(500).json({ 
          error: "Failed to create voice model",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Error in retry voice creation:", error);
      res.status(500).json({ error: "Failed to retry voice creation" });
    }
  });

  // Speech preview route (generates audio without saving message) - protected
  app.post("/api/profiles/:profileId/tts", requireAuth, async (req, res) => {
    try {
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

  // ==========================================
  // STAGED VOICE TRAINING ROUTES (NEW)
  // ==========================================
  
  // Get current training prompt with progress
  app.get("/api/voice/training/current", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Import voice training script
      const { voiceTrainingScript } = await import("@shared/voiceTrainingScript");
      const { getPersonalizedLine, getTimeOfDay, getGeneration } = await import("@shared/personalizationHelper");
      
      // Find current stage
      const currentStage = voiceTrainingScript.find(s => s.stage === user.currentStage);
      if (!currentStage) {
        return res.json({ complete: true, stage: user.currentStage });
      }
      
      // Calculate progress
      const completedCount = user.completedPrompts?.length || 0;
      const progressPercentage = Math.round((completedCount / 25) * 100);
      
      // Derive the correct prompt index from completed count (don't trust current_prompt_index which may drift)
      // Within the current stage, find which prompts have been completed
      const stageStartId = currentStage.prompts[0].id;
      const stageEndId = currentStage.prompts[currentStage.prompts.length - 1].id;
      const completedInStage = user.completedPrompts?.filter((id: number) => id >= stageStartId && id <= stageEndId).length || 0;
      const nextPromptIndex = Math.min(completedInStage, currentStage.prompts.length - 1);
      
      // Resync current_prompt_index if it has drifted
      if (nextPromptIndex !== user.currentPromptIndex) {
        await db.update(users)
          .set({ currentPromptIndex: nextPromptIndex })
          .where(eq(users.id, userId));
      }
      
      // Get current prompt using the corrected index
      const currentPrompt = currentStage.prompts[nextPromptIndex];
      
      if (!currentPrompt || completedInStage >= currentStage.prompts.length) {
        // Stage complete
        return res.json({ 
          stageComplete: true, 
          stage: user.currentStage,
          nextStage: user.currentStage < 3 ? user.currentStage + 1 : null
        });
      }
      
      // Build user context for personalization
      const birthYear = user.age ? new Date().getFullYear() - user.age : 0;
      const userContext = {
        name: user.name || 'there',
        city: user.city || undefined,
        hometown: user.city || undefined,
        timeOfDay: getTimeOfDay(),
        generation: getGeneration(birthYear),
        relationship: 'default' as any
      };
      
      // Get personalized line
      const displayLine = getPersonalizedLine(currentPrompt, userContext);
      
      res.json({
        stage: currentStage.stage,
        stageTitle: currentStage.title,
        stageDescription: currentStage.description,
        estimatedTime: currentStage.estimatedTime,
        promptNumber: completedCount + 1,
        totalPrompts: 25,
        progressPercentage,
        currentPrompt: {
          id: currentPrompt.id,
          instruction: currentPrompt.instruction,
          displayLine: displayLine
        }
      });
      
    } catch (error) {
      console.error("Error getting current prompt:", error);
      res.status(500).json({ error: "Failed to get current prompt" });
    }
  });
  
  // Save progress and move to next prompt
  app.post("/api/voice/training/save-progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { promptId, duration = 0 } = req.body;
      
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Import voice training script
      const { voiceTrainingScript } = await import("@shared/voiceTrainingScript");
      
      // Update completed prompts if not already included
      const completedPrompts = user.completedPrompts || [];
      if (!completedPrompts.includes(promptId)) {
        completedPrompts.push(promptId);
      }
      
      // Update total recording time
      const totalRecordingTime = (user.totalRecordingTime || 0) + duration;
      
      // Get current stage
      const currentStage = voiceTrainingScript.find(s => s.stage === user.currentStage);
      if (!currentStage) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      
      // Determine next prompt/stage
      let nextStage = user.currentStage;
      let nextPromptIndex = user.currentPromptIndex + 1;
      let stageComplete = false;
      let stage1Complete = user.stage1Complete || 0;
      let stage2Complete = user.stage2Complete || 0;
      let stage3Complete = user.stage3Complete || 0;
      
      if (nextPromptIndex >= currentStage.prompts.length) {
        // Current stage complete
        stageComplete = true;
        
        if (user.currentStage === 1) {
          stage1Complete = 1;
          nextStage = 2;
        } else if (user.currentStage === 2) {
          stage2Complete = 1;
          nextStage = 3;
        } else if (user.currentStage === 3) {
          stage3Complete = 1;
        }
        
        nextPromptIndex = 0;
      }
      
      // Update user in database
      await db.update(users)
        .set({
          completedPrompts,
          totalRecordingTime,
          currentStage: nextStage,
          currentPromptIndex: nextPromptIndex,
          stage1Complete,
          stage2Complete,
          stage3Complete,
          lastSaved: new Date(),
          trainingStartedAt: user.trainingStartedAt || new Date(),
          trainingCompletedAt: stage3Complete ? new Date() : user.trainingCompletedAt,
          voiceTrainingComplete: stage3Complete
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        progress: completedPrompts.length,
        stageComplete,
        completedStage: stageComplete ? user.currentStage : null,
        nextStage: stageComplete ? nextStage : null
      });
      
    } catch (error) {
      console.error("Error saving progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });
  
  // Set current stage (for stage selection)
  app.post("/api/voice/training/set-stage", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { stage } = req.body;
      
      if (!stage || stage < 1 || stage > 3) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      
      // Update user's current stage and reset prompt index
      await db.update(users)
        .set({
          currentStage: stage,
          currentPromptIndex: 0
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true, stage });
    } catch (error) {
      console.error("Error setting stage:", error);
      res.status(500).json({ error: "Failed to set stage" });
    }
  });
  
  // Get all stage statuses
  app.get("/api/voice/training/stages", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Import voice training script
      const { voiceTrainingScript } = await import("@shared/voiceTrainingScript");
      
      // Build stage status array
      const stages = voiceTrainingScript.map(stage => {
        let complete = false;
        if (stage.stage === 1) complete = user.stage1Complete === 1;
        if (stage.stage === 2) complete = user.stage2Complete === 1;
        if (stage.stage === 3) complete = user.stage3Complete === 1;
        
        return {
          stage: stage.stage,
          title: stage.title,
          description: stage.description,
          estimatedTime: stage.estimatedTime,
          promptCount: stage.prompts.length,
          complete,
          locked: stage.stage > user.currentStage,
          current: stage.stage === user.currentStage
        };
      });
      
      const completedCount = user.completedPrompts?.length || 0;
      const overallProgress = Math.round((completedCount / 25) * 100);
      
      res.json({
        stages,
        overallProgress,
        completedPrompts: completedCount,
        totalPrompts: 25
      });
      
    } catch (error) {
      console.error("Error getting stage statuses:", error);
      res.status(500).json({ error: "Failed to get stage statuses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
