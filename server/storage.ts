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
  
  // Profile methods
  getProfile(id: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
  
  // Voice recording methods
  getVoiceRecording(userId: string, actNumber: '1' | '2' | '3'): Promise<VoiceRecording | undefined>;
  getVoiceRecordingsByProfile(profileId: string): Promise<VoiceRecording[]>;
  getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]>;
  saveVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording>;
  deleteVoiceRecording(profileId: string, actNumber: '1' | '2' | '3'): Promise<boolean>;
  getRecordingCount(profileId: string): Promise<number>;
  getRecordingCountByUser(userId: string): Promise<number>;
  
  // Message methods
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByProfile(profileId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<boolean>;
  getMessageCount(profileId: string): Promise<number>;
}

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
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles).orderBy(desc(profiles.createdAt));
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, id))
      .returning();
    return profile || undefined;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const result = await db.delete(profiles).where(eq(profiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Voice recording methods
  async getVoiceRecording(userId: string, actNumber: '1' | '2' | '3'): Promise<VoiceRecording | undefined> {
    const [recording] = await db
      .select()
      .from(voiceRecordings)
      .where(and(
        eq(voiceRecordings.userId, userId),
        eq(voiceRecordings.actNumber, actNumber)
      ));
    return recording || undefined;
  }

  async getVoiceRecordingsByProfile(profileId: string): Promise<VoiceRecording[]> {
    return await db
      .select()
      .from(voiceRecordings)
      .where(eq(voiceRecordings.profileId, profileId))
      .orderBy(voiceRecordings.actNumber);
  }

  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    return await db
      .select()
      .from(voiceRecordings)
      .where(eq(voiceRecordings.userId, userId))
      .orderBy(voiceRecordings.actNumber);
  }

  async saveVoiceRecording(insertRecording: InsertVoiceRecording): Promise<VoiceRecording> {
    // Use upsert to atomically insert or update recording
    const [recording] = await db
      .insert(voiceRecordings)
      .values(insertRecording)
      .onConflictDoUpdate({
        target: [voiceRecordings.profileId, voiceRecordings.actNumber],
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

  async deleteVoiceRecording(profileId: string, actNumber: '1' | '2' | '3'): Promise<boolean> {
    const result = await db
      .delete(voiceRecordings)
      .where(and(
        eq(voiceRecordings.profileId, profileId),
        eq(voiceRecordings.actNumber, actNumber)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecordingCount(profileId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(voiceRecordings)
      .where(eq(voiceRecordings.profileId, profileId));
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
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByProfile(profileId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.profileId, profileId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMessageCount(profileId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.profileId, profileId));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
