import { 
  type User, 
  type InsertUser,
  type Profile,
  type InsertProfile,
  type VoiceRecording,
  type InsertVoiceRecording,
  type Message,
  type InsertMessage,
  profiles,
  voiceRecordings,
  messages,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

// Voice recording interface for ESSENCE
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile methods (all scoped by userId)
  getProfile(id: string, userId: string): Promise<Profile | undefined>;
  getAllProfiles(userId: string): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, userId: string, updates: Partial<Profile>): Promise<Profile | undefined>;
  deleteProfile(id: string, userId: string): Promise<boolean>;
  
  // Voice recording methods (scoped by userId)
  getVoiceRecording(profileId: string, recordingIndex: number, userId: string): Promise<VoiceRecording | undefined>;
  getVoiceRecordingsByProfile(profileId: string, userId: string): Promise<VoiceRecording[]>;
  getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]>;
  saveVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording>;
  deleteVoiceRecording(profileId: string, recordingIndex: number, userId: string): Promise<boolean>;
  getRecordingCount(profileId: string, userId: string): Promise<number>;
  getRecordingCountByUser(userId: string): Promise<number>;
  
  // Message methods (scoped by userId)
  getMessage(id: string, userId: string): Promise<Message | undefined>;
  getMessagesByProfile(profileId: string, userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string, userId: string): Promise<boolean>;
  getMessageCount(profileId: string, userId: string): Promise<number>;
}

// Mock data for DEV mode
const DEV_USER_ID = 'dev-user-123';
const DEV_PROFILES: Profile[] = [
  {
    id: 'profile-1',
    userId: DEV_USER_ID,
    name: 'My Children',
    relation: 'Children',
    notes: 'Messages for my kids to listen to in the future',
    voiceModelStatus: 'not_submitted',
    elevenLabsVoiceId: null,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'profile-2',
    userId: DEV_USER_ID,
    name: 'My Partner',
    relation: 'Spouse',
    notes: 'Love notes and special messages',
    voiceModelStatus: 'not_submitted',
    elevenLabsVoiceId: null,
    createdAt: new Date('2024-02-01')
  }
];

// In-memory storage for dev mode recordings
const DEV_RECORDINGS: Map<string, VoiceRecording> = new Map();

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Profile methods
  async getProfile(id: string, userId: string): Promise<Profile | undefined> {
    // DEV MODE: Return mock profiles for dev user
    if (userId === DEV_USER_ID && process.env.NODE_ENV === 'development') {
      return DEV_PROFILES.find(p => p.id === id);
    }
    
    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, userId)
      ));
    return profile || undefined;
  }

  async getAllProfiles(userId: string): Promise<Profile[]> {
    // DEV MODE: Return mock profiles for dev user
    if (userId === DEV_USER_ID && process.env.NODE_ENV === 'development') {
      return DEV_PROFILES;
    }
    
    return await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .orderBy(desc(profiles.createdAt));
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateProfile(id: string, userId: string, updates: Partial<Profile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set(updates)
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, userId)
      ))
      .returning();
    return profile || undefined;
  }

  async deleteProfile(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(profiles)
      .where(and(
        eq(profiles.id, id),
        eq(profiles.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // Voice recording methods
  async getVoiceRecording(profileId: string, recordingIndex: number, userId: string): Promise<VoiceRecording | undefined> {
    const [recording] = await db
      .select()
      .from(voiceRecordings)
      .where(and(
        eq(voiceRecordings.profileId, profileId),
        eq(voiceRecordings.recordingIndex, recordingIndex),
        eq(voiceRecordings.userId, userId)
      ));
    return recording || undefined;
  }

  async getVoiceRecordingsByProfile(profileId: string, userId: string): Promise<VoiceRecording[]> {
    // DEV MODE: Return mock recordings for dev user
    if (userId === DEV_USER_ID && process.env.NODE_ENV === 'development') {
      const profileRecordings: VoiceRecording[] = [];
      DEV_RECORDINGS.forEach((recording, key) => {
        if (recording.profileId === profileId) {
          profileRecordings.push(recording);
        }
      });
      return profileRecordings.sort((a, b) => a.recordingIndex - b.recordingIndex);
    }
    
    return await db
      .select()
      .from(voiceRecordings)
      .where(and(
        eq(voiceRecordings.profileId, profileId),
        eq(voiceRecordings.userId, userId)
      ))
      .orderBy(voiceRecordings.recordingIndex);
  }

  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    return await db
      .select()
      .from(voiceRecordings)
      .where(eq(voiceRecordings.userId, userId))
      .orderBy(voiceRecordings.recordingIndex);
  }

  async saveVoiceRecording(insertRecording: InsertVoiceRecording): Promise<VoiceRecording> {
    // DEV MODE: Store recordings in memory for dev user
    if (insertRecording.userId === DEV_USER_ID && process.env.NODE_ENV === 'development') {
      const key = `${insertRecording.profileId}-${insertRecording.recordingIndex}`;
      const recording: VoiceRecording = {
        id: key,
        ...insertRecording,
        qualityStatus: insertRecording.qualityStatus || 'approved',
        createdAt: new Date()
      };
      DEV_RECORDINGS.set(key, recording);
      console.log('[DEV] Saved recording to memory:', key);
      return recording;
    }
    
    // Use upsert to atomically insert or update recording
    const [recording] = await db
      .insert(voiceRecordings)
      .values(insertRecording)
      .onConflictDoUpdate({
        target: [voiceRecordings.profileId, voiceRecordings.recordingIndex],
        set: {
          passageText: insertRecording.passageText,
          audioData: insertRecording.audioData,
          qualityStatus: insertRecording.qualityStatus,
          createdAt: new Date()
        }
      })
      .returning();
    return recording;
  }

  async deleteVoiceRecording(profileId: string, recordingIndex: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(voiceRecordings)
      .where(and(
        eq(voiceRecordings.profileId, profileId),
        eq(voiceRecordings.recordingIndex, recordingIndex),
        eq(voiceRecordings.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecordingCount(profileId: string, userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(voiceRecordings)
      .where(and(
        eq(voiceRecordings.profileId, profileId),
        eq(voiceRecordings.userId, userId)
      ));
    return result.count;
  }

  async getRecordingCountByUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(voiceRecordings)
      .where(eq(voiceRecordings.userId, userId));
    return result.count;
  }

  // Message methods
  async getMessage(id: string, userId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.userId, userId)
      ));
    return message || undefined;
  }

  async getMessagesByProfile(profileId: string, userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.profileId, profileId),
        eq(messages.userId, userId)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async deleteMessage(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getMessageCount(profileId: string, userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.profileId, profileId),
        eq(messages.userId, userId)
      ));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
