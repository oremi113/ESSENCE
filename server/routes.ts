import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema, 
  insertVoiceRecordingSchema, 
  insertMessageSchema 
} from "@shared/schema";
import { TOTAL_TRAINING_PHRASES } from "@shared/constants";
import { z } from "zod";
import { elevenLabsService } from "./elevenlabs";

// Safe profile update schema - only allow certain fields (voiceModelStatus is server-controlled)
const updateProfileSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(), 
  notes: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Profile routes
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      
      // Get counts for each profile
      const profilesWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          const [recordingsCount, messagesCount] = await Promise.all([
            storage.getRecordingCount(profile.id),
            storage.getMessageCount(profile.id)
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

  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
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

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateProfileSchema.parse(req.body);
      const profile = await storage.updateProfile(id, updates);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const [recordingsCount, messagesCount] = await Promise.all([
        storage.getRecordingCount(profile.id),
        storage.getMessageCount(profile.id)
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

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProfile(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Voice recording routes
  app.get("/api/profiles/:profileId/recordings", async (req, res) => {
    try {
      const { profileId } = req.params;
      const recordings = await storage.getVoiceRecordingsByProfile(profileId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  app.post("/api/profiles/:profileId/recordings", async (req, res) => {
    try {
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const recordingData = insertVoiceRecordingSchema.parse({
        ...req.body,
        profileId
      });
      
      // Validate phrase index range
      if (recordingData.phraseIndex < 0 || recordingData.phraseIndex >= TOTAL_TRAINING_PHRASES) {
        return res.status(400).json({ 
          error: `Invalid phrase index. Must be between 0 and ${TOTAL_TRAINING_PHRASES - 1}` 
        });
      }
      
      const recording = await storage.saveVoiceRecording(recordingData);
      
      // Update profile voice model status based on recording count
      const recordingCount = await storage.getRecordingCount(profileId);
      
      let voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 'not_submitted';
      let elevenLabsVoiceId: string | undefined;
      
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES) {
        // Training complete - create ElevenLabs voice model
        try {
          console.log(`Creating ElevenLabs voice for profile ${profile.name}...`);
          
          // Get all recordings for this profile
          const allRecordings = await storage.getVoiceRecordingsByProfile(profileId);
          
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
      }
      
      const updateData: any = { voiceModelStatus };
      if (elevenLabsVoiceId) {
        updateData.elevenLabsVoiceId = elevenLabsVoiceId;
      }
      
      await storage.updateProfile(profileId, updateData);
      
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

  app.delete("/api/profiles/:profileId/recordings/:phraseIndex", async (req, res) => {
    try {
      const { profileId, phraseIndex } = req.params;
      const deleted = await storage.deleteVoiceRecording(profileId, parseInt(phraseIndex));
      
      if (!deleted) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      // Update profile voice model status
      const recordingCount = await storage.getRecordingCount(profileId);
      const currentProfile = await storage.getProfile(profileId);
      
      let voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 'not_submitted';
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES && currentProfile?.elevenLabsVoiceId) {
        // Only mark as ready if we have both enough recordings AND a voice model
        voiceModelStatus = 'ready';
      }
      
      await storage.updateProfile(profileId, { voiceModelStatus });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Speech preview route (generates audio without saving message)
  app.post("/api/profiles/:profileId/tts", async (req, res) => {
    try {
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile has a ready voice model
      if (profile.voiceModelStatus !== 'ready' || !profile.elevenLabsVoiceId) {
        return res.status(400).json({ 
          error: "Voice model not ready. Complete voice training first." 
        });
      }
      
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required for speech generation" });
      }
      
      try {
        console.log(`Generating preview speech for profile ${profile.name}...`);
        
        // Generate speech using ElevenLabs
        const audioBuffer = await elevenLabsService.generateSpeech(
          content.trim(),
          profile.elevenLabsVoiceId
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

  // Message routes
  app.get("/api/profiles/:profileId/messages", async (req, res) => {
    try {
      const { profileId } = req.params;
      const messages = await storage.getMessagesByProfile(profileId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/profiles/:profileId/messages", async (req, res) => {
    try {
      const { profileId } = req.params;
      
      // Check if profile exists
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Check if profile has a ready voice model
      if (profile.voiceModelStatus !== 'ready' || !profile.elevenLabsVoiceId) {
        return res.status(400).json({ 
          error: "Voice model not ready. Complete voice training first." 
        });
      }
      
      // Generate speech using ElevenLabs
      let audioData: string | null = null;
      let duration = 30; // Default duration
      
      try {
        console.log(`Generating speech for profile ${profile.name}...`);
        
        const { content } = req.body;
        if (!content || !content.trim()) {
          return res.status(400).json({ error: "Content is required for speech generation" });
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
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        profileId,
        audioData,
        duration
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid message data", details: error.errors });
      } else {
        console.error("Error creating message:", error);
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMessage(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Voice model status route
  app.get("/api/profiles/:profileId/voice-status", async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const recordingCount = await storage.getRecordingCount(profileId);
      
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
