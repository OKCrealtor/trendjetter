import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"), // free | pro | agency
  searchesThisMonth: integer("searches_this_month").notNull().default(0),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Searches table
export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  locationCity: text("location_city").notNull(),
  locationState: text("location_state"),
  locationCountry: text("location_country").notNull().default("US"),
  industry: text("industry").notNull(),
  contentTopic: text("content_topic").notNull(),
  platform: text("platform").notNull(),
  goal: text("goal").notNull(),
  totalHashtags: integer("total_hashtags").notNull().default(0),
  strategyNotes: text("strategy_notes"),
  platformTip: text("platform_tip"),
  postingRecommendation: text("posting_recommendation"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertSearchSchema = createInsertSchema(searches).omit({ id: true, createdAt: true });
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;

// Hashtags table
export const hashtags = sqliteTable("hashtags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  searchId: integer("search_id").notNull(),
  userId: integer("user_id").notNull(),
  tag: text("tag").notNull(),
  groupType: text("group_type").notNull(), // high_volume | medium | niche | local | trending
  popularityScore: integer("popularity_score").notNull().default(50),
  competitionScore: integer("competition_score").notNull().default(50),
  opportunityScore: integer("opportunity_score").notNull().default(50),
  localRelevanceScore: integer("local_relevance_score").notNull().default(50),
  overallScore: integer("overall_score").notNull().default(50),
  estimatedPosts: text("estimated_posts"), // stored as string to avoid bigint issues
  trendDirection: text("trend_direction").notNull().default("stable"), // rising | stable | declining
});

export const insertHashtagSchema = createInsertSchema(hashtags).omit({ id: true });
export type InsertHashtag = z.infer<typeof insertHashtagSchema>;
export type Hashtag = typeof hashtags.$inferSelect;

// Collections table
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform"),
  tagCount: integer("tag_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, tagCount: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Collection Tags join table
export const collectionTags = sqliteTable("collection_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: integer("collection_id").notNull(),
  hashtagId: integer("hashtag_id").notNull(),
  tag: text("tag").notNull(),
  addedAt: text("added_at").notNull().default(new Date().toISOString()),
});

export const insertCollectionTagSchema = createInsertSchema(collectionTags).omit({ id: true, addedAt: true });
export type InsertCollectionTag = z.infer<typeof insertCollectionTagSchema>;
export type CollectionTag = typeof collectionTags.$inferSelect;

// Trend Records table
export const trendRecords = sqliteTable("trend_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tag: text("tag").notNull(),
  platform: text("platform").notNull(),
  industry: text("industry"),
  locationCity: text("location_city"),
  trendScore: integer("trend_score").notNull().default(50),
  velocity: text("velocity").notNull().default("stable"),
  estimatedPosts: text("estimated_posts"),
  recordedAt: text("recorded_at").notNull().default(new Date().toISOString()),
});

export type TrendRecord = typeof trendRecords.$inferSelect;

// Content Generations table
export const contentGenerations = sqliteTable("content_generations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(),
  platform: text("platform").notNull(),
  tone: text("tone").notNull().default("professional"),
  caption: text("caption"),
  hashtags: text("hashtags"), // JSON array
  seoKeywords: text("seo_keywords"), // JSON array
  postingSchedule: text("posting_schedule"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertContentGenerationSchema = createInsertSchema(contentGenerations).omit({ id: true, createdAt: true });
export type InsertContentGeneration = z.infer<typeof insertContentGenerationSchema>;
export type ContentGeneration = typeof contentGenerations.$inferSelect;

// Type for the full search result (search + hashtags grouped)
export type SearchResult = Search & {
  hashtagGroups: {
    high_volume: Hashtag[];
    medium: Hashtag[];
    niche: Hashtag[];
    local: Hashtag[];
    trending: Hashtag[];
  };
};
