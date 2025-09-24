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
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'ready';
      }
      
      await storage.updateProfile(profileId, { voiceModelStatus });
      
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
      
      let voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 'not_submitted';
      if (recordingCount > 0 && recordingCount < TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'training';
      } else if (recordingCount >= TOTAL_TRAINING_PHRASES) {
        voiceModelStatus = 'ready';
      }
      
      await storage.updateProfile(profileId, { voiceModelStatus });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ error: "Failed to delete recording" });
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
      
      // TODO: Add voice synthesis API integration here
      // For now, we'll simulate the AI voice generation process
      const messageData = insertMessageSchema.parse({
        ...req.body,
        profileId,
        // audioData: will be generated by AI service in future
        duration: Math.floor(Math.random() * 120) + 30 // Mock duration
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
