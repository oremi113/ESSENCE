import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const voiceModelStatusEnum = pgEnum('voice_model_status', ['not_submitted', 'training', 'ready']);
export const messageCategoryEnum = pgEnum('message_category', ['children', 'partner', 'parents', 'future_me', 'family', 'other']);
export const actNumberEnum = pgEnum('act_number', ['1', '2', '3']);

// Users table (defined first for foreign key references)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  age: integer("age"),
  voiceModelId: varchar("voice_model_id", { length: 100 }), // ElevenLabs voice ID
  voiceTrainingComplete: integer("voice_training_complete").default(0), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tables
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  relation: text("relation").notNull(),
  notes: text("notes").default(''),
  voiceModelStatus: voiceModelStatusEnum("voice_model_status").default('not_submitted'),
  elevenLabsVoiceId: varchar("elevenlabs_voice_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar("profile_id").references(() => profiles.id, { onDelete: 'cascade' }),
  actNumber: actNumberEnum("act_number").notNull(),
  passageText: text("passage_text").notNull(), // The text that was read
  audioData: text("audio_data").notNull(), // Base64 encoded audio blob
  qualityStatus: text("quality_status").default('good'), // good, needs_improvement, excellent
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userActUnique: unique().on(table.userId, table.actNumber),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar("profile_id").references(() => profiles.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  category: messageCategoryEnum("category").default('other'),
  promptText: text("prompt_text").notNull(), // The template prompt chosen
  generatedText: text("generated_text").notNull(), // The customized message text
  audioData: text("audio_data"), // Generated AI voice audio (Base64 encoded)
  duration: integer("duration").default(0), // Duration in seconds
  isPrivate: integer("is_private").default(1), // 1 = true (default), 0 = false
  shareInterestExpressed: integer("share_interest_expressed").default(0), // Tracking if user wants sharing feature
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  voiceRecordings: many(voiceRecordings),
  messages: many(messages),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  voiceRecordings: many(voiceRecordings),
  messages: many(messages),
}));

export const voiceRecordingsRelations = relations(voiceRecordings, ({ one }) => ({
  user: one(users, {
    fields: [voiceRecordings.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [voiceRecordings.profileId],
    references: [profiles.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
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
  userId: true,
  profileId: true,
  actNumber: true,
  passageText: true,
  audioData: true,
  qualityStatus: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  profileId: true,
  title: true,
  category: true,
  promptText: true,
  generatedText: true,
  audioData: true,
  duration: true,
  isPrivate: true,
  shareInterestExpressed: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  age: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
