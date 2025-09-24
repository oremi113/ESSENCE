import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const voiceModelStatusEnum = pgEnum('voice_model_status', ['not_submitted', 'training', 'ready']);
export const messageCategoryEnum = pgEnum('message_category', ['birthday', 'advice', 'story', 'love', 'other']);

// Tables
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  notes: text("notes").default(''),
  voiceModelStatus: voiceModelStatusEnum("voice_model_status").default('not_submitted'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  phraseIndex: integer("phrase_index").notNull(),
  phraseText: text("phrase_text").notNull(),
  audioData: text("audio_data").notNull(), // Base64 encoded audio blob
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  profilePhraseUnique: unique().on(table.profileId, table.phraseIndex),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: messageCategoryEnum("category").default('other'),
  audioData: text("audio_data"), // Generated AI voice audio (Base64 encoded)
  duration: integer("duration").default(0), // Duration in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  voiceRecordings: many(voiceRecordings),
  messages: many(messages),
}));

export const voiceRecordingsRelations = relations(voiceRecordings, ({ one }) => ({
  profile: one(profiles, {
    fields: [voiceRecordings.profileId],
    references: [profiles.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  profile: one(profiles, {
    fields: [messages.profileId],
    references: [profiles.id],
  }),
}));

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).pick({
  name: true,
  relation: true,
  notes: true,
});

export const insertVoiceRecordingSchema = createInsertSchema(voiceRecordings).pick({
  profileId: true,
  phraseIndex: true,
  phraseText: true,
  audioData: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  profileId: true,
  title: true,
  content: true,
  category: true,
  audioData: true,
  duration: true,
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
