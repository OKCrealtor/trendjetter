import {
  users, searches, hashtags, collections, collectionTags, trendRecords, contentGenerations
} from '@shared/schema';
import type {
  User, InsertUser,
  Search, InsertSearch,
  Hashtag, InsertHashtag,
  Collection, InsertCollection,
  CollectionTag, InsertCollectionTag,
  TrendRecord,
  ContentGeneration, InsertContentGeneration,
  SearchResult
} from '@shared/schema';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { eq, desc, and } from 'drizzle-orm';

const sqlite = new Database('data.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite);

// Auto-create tables using raw SQL (Drizzle sync migrations)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    searches_this_month INTEGER NOT NULL DEFAULT 0,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    location_city TEXT NOT NULL,
    location_state TEXT,
    location_country TEXT NOT NULL DEFAULT 'US',
    industry TEXT NOT NULL,
    content_topic TEXT NOT NULL,
    platform TEXT NOT NULL,
    goal TEXT NOT NULL,
    total_hashtags INTEGER NOT NULL DEFAULT 0,
    strategy_notes TEXT,
    platform_tip TEXT,
    posting_recommendation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hashtags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    group_type TEXT NOT NULL,
    popularity_score INTEGER NOT NULL DEFAULT 50,
    competition_score INTEGER NOT NULL DEFAULT 50,
    opportunity_score INTEGER NOT NULL DEFAULT 50,
    local_relevance_score INTEGER NOT NULL DEFAULT 50,
    overall_score INTEGER NOT NULL DEFAULT 50,
    estimated_posts TEXT,
    trend_direction TEXT NOT NULL DEFAULT 'stable'
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    platform TEXT,
    tag_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS collection_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    hashtag_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trend_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL,
    platform TEXT NOT NULL,
    industry TEXT,
    location_city TEXT,
    trend_score INTEGER NOT NULL DEFAULT 50,
    velocity TEXT NOT NULL DEFAULT 'stable',
    estimated_posts TEXT,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    platform TEXT NOT NULL,
    tone TEXT NOT NULL DEFAULT 'professional',
    caption TEXT,
    hashtags TEXT,
    seo_keywords TEXT,
    posting_schedule TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed demo user if not exists
const existingUser = sqlite.prepare('SELECT id FROM users WHERE id = 1').get();
if (!existingUser) {
  sqlite.prepare(`
    INSERT INTO users (id, email, name, plan, searches_this_month, avatar)
    VALUES (1, 'demo@trendjetter.com', 'Creator Demo', 'pro', 3, NULL)
  `).run();
}

// Seed some trend records if empty
const trendCount = (sqlite.prepare('SELECT COUNT(*) as c FROM trend_records').get() as { c: number }).c;
if (trendCount === 0) {
  const trendSeeds = [
    // Fitness — Instagram
    { tag: '#fitnessmotivation', platform: 'instagram', industry: 'fitness', city: null, score: 94, velocity: 'rising', posts: '38.2M' },
    { tag: '#workoutroutine', platform: 'instagram', industry: 'fitness', city: null, score: 91, velocity: 'rising', posts: '22.7M' },
    { tag: '#hiitworkout', platform: 'instagram', industry: 'fitness', city: null, score: 88, velocity: 'rising', posts: '14.3M' },
    { tag: '#gymlife', platform: 'instagram', industry: 'fitness', city: null, score: 85, velocity: 'stable', posts: '45.1M' },
    { tag: '#personaltrainer', platform: 'instagram', industry: 'fitness', city: null, score: 83, velocity: 'stable', posts: '18.6M' },
    { tag: '#fitnessmotivation2026', platform: 'instagram', industry: 'fitness', city: null, score: 92, velocity: 'rising', posts: '4.1M' },
    { tag: '#homeworkout', platform: 'instagram', industry: 'fitness', city: null, score: 89, velocity: 'rising', posts: '19.8M' },
    // Fitness — TikTok
    { tag: '#gymtok', platform: 'tiktok', industry: 'fitness', city: null, score: 96, velocity: 'rising', posts: '28.4M' },
    { tag: '#fittok', platform: 'tiktok', industry: 'fitness', city: null, score: 93, velocity: 'rising', posts: '31.2M' },
    { tag: '#workoutcheck', platform: 'tiktok', industry: 'fitness', city: null, score: 90, velocity: 'rising', posts: '15.7M' },
    { tag: '#fitnessjourney', platform: 'tiktok', industry: 'fitness', city: null, score: 87, velocity: 'stable', posts: '22.9M' },
    // Food & Beverage — Instagram
    { tag: '#foodphotography', platform: 'instagram', industry: 'food_beverage', city: null, score: 92, velocity: 'rising', posts: '55.3M' },
    { tag: '#foodie', platform: 'instagram', industry: 'food_beverage', city: null, score: 88, velocity: 'stable', posts: '72.1M' },
    { tag: '#recipeideas', platform: 'instagram', industry: 'food_beverage', city: null, score: 91, velocity: 'rising', posts: '18.4M' },
    { tag: '#homecooking', platform: 'instagram', industry: 'food_beverage', city: null, score: 86, velocity: 'rising', posts: '24.6M' },
    // Beauty — Instagram
    { tag: '#skincare', platform: 'instagram', industry: 'beauty', city: null, score: 93, velocity: 'rising', posts: '48.7M' },
    { tag: '#makeuptutorial', platform: 'instagram', industry: 'beauty', city: null, score: 90, velocity: 'rising', posts: '33.2M' },
    { tag: '#grwm', platform: 'instagram', industry: 'beauty', city: null, score: 94, velocity: 'rising', posts: '28.1M' },
    { tag: '#skincareRoutine', platform: 'instagram', industry: 'beauty', city: null, score: 89, velocity: 'rising', posts: '21.5M' },
    // Travel — Instagram
    { tag: '#travelgram', platform: 'instagram', industry: 'travel', city: null, score: 87, velocity: 'stable', posts: '82.4M' },
    { tag: '#wanderlust', platform: 'instagram', industry: 'travel', city: null, score: 85, velocity: 'stable', posts: '91.2M' },
    { tag: '#hiddengems', platform: 'instagram', industry: 'travel', city: null, score: 92, velocity: 'rising', posts: '12.3M' },
    // Fashion — Instagram
    { tag: '#ootd', platform: 'instagram', industry: 'fashion', city: null, score: 88, velocity: 'stable', posts: '104.7M' },
    { tag: '#styleinspo', platform: 'instagram', industry: 'fashion', city: null, score: 90, velocity: 'rising', posts: '29.4M' },
    // Photography — Instagram
    { tag: '#portraitphotography', platform: 'instagram', industry: 'photography', city: null, score: 89, velocity: 'rising', posts: '24.1M' },
    { tag: '#goldenhour', platform: 'instagram', industry: 'photography', city: null, score: 87, velocity: 'stable', posts: '18.9M' },
    // Music — TikTok
    { tag: '#musicproducer', platform: 'tiktok', industry: 'music', city: null, score: 91, velocity: 'rising', posts: '19.3M' },
    { tag: '#newmusic', platform: 'tiktok', industry: 'music', city: null, score: 88, velocity: 'rising', posts: '42.7M' },
    // Gaming — TikTok
    { tag: '#gamingtok', platform: 'tiktok', industry: 'gaming', city: null, score: 94, velocity: 'rising', posts: '35.8M' },
    { tag: '#gamingcommunity', platform: 'tiktok', industry: 'gaming', city: null, score: 90, velocity: 'rising', posts: '22.4M' },
    // Luxury Travel — Instagram (high-spend: avg $180 CPM, luxury buyer audience)
    { tag: '#luxurytravel', platform: 'instagram', industry: 'travel', city: null, score: 94, velocity: 'rising', posts: '3.2M' },
    { tag: '#luxurytravel2026', platform: 'instagram', industry: 'travel', city: null, score: 91, velocity: 'rising', posts: '847K' },
    { tag: '#luxurytravelgram', platform: 'instagram', industry: 'travel', city: null, score: 88, velocity: 'rising', posts: '1.4M' },
    { tag: '#travelinfluencer', platform: 'instagram', industry: 'travel', city: null, score: 86, velocity: 'rising', posts: '2.9M' },
    // Wellness — Instagram (high-spend: supplements, coaching, retreats)
    { tag: '#wellnesslifestyle', platform: 'instagram', industry: 'fitness', city: null, score: 93, velocity: 'rising', posts: '18.7M' },
    { tag: '#wellnesscoach', platform: 'instagram', industry: 'fitness', city: null, score: 90, velocity: 'rising', posts: '6.2M' },
    { tag: '#wellnesslifestyle2026', platform: 'instagram', industry: 'fitness', city: null, score: 88, velocity: 'rising', posts: '2.1M' },
    { tag: '#holistichealth', platform: 'instagram', industry: 'fitness', city: null, score: 87, velocity: 'rising', posts: '9.4M' },
    // Skincare — Instagram (high-spend: beauty is #1 CPM category)
    { tag: '#skincareroutine', platform: 'instagram', industry: 'beauty', city: null, score: 95, velocity: 'rising', posts: '21.5M' },
    { tag: '#antiaging', platform: 'instagram', industry: 'beauty', city: null, score: 91, velocity: 'rising', posts: '8.3M' },
    { tag: '#glowyskin', platform: 'instagram', industry: 'beauty', city: null, score: 89, velocity: 'rising', posts: '14.6M' },
    // Real Estate (still supported)
    { tag: '#realestate', platform: 'instagram', industry: 'real_estate', city: null, score: 82, velocity: 'stable', posts: '34.5M' },
    { tag: '#realestateagent', platform: 'instagram', industry: 'real_estate', city: null, score: 88, velocity: 'stable', posts: '15.2M' },
  ];

    const insertTrend = sqlite.prepare(`
    INSERT INTO trend_records (tag, platform, industry, location_city, trend_score, velocity, estimated_posts)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of trendSeeds) {
    insertTrend.run(t.tag, t.platform, t.industry, t.city ?? null, t.score, t.velocity, t.posts);
  }
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(id: number, plan: string): Promise<User | undefined>;
  incrementSearchCount(userId: number): Promise<void>;

  // Searches
  createSearch(search: InsertSearch): Promise<Search>;
  getSearch(id: number): Promise<Search | undefined>;
  getSearchesByUser(userId: number, limit?: number): Promise<Search[]>;
  getSearchResult(id: number): Promise<SearchResult | undefined>;
  deleteSearch(id: number): Promise<void>;

  // Hashtags
  createHashtags(tags: InsertHashtag[]): Promise<Hashtag[]>;
  getHashtagsBySearch(searchId: number): Promise<Hashtag[]>;
  getHashtagsByUser(userId: number, limit?: number): Promise<Hashtag[]>;

  // Collections
  createCollection(col: InsertCollection): Promise<Collection>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<void>;
  updateCollectionTagCount(id: number, delta: number): Promise<void>;

  // Collection Tags
  addTagToCollection(ct: InsertCollectionTag): Promise<CollectionTag>;
  getTagsInCollection(collectionId: number): Promise<CollectionTag[]>;
  removeTagFromCollection(id: number): Promise<void>;

  // Trends
  getTrends(platform?: string, industry?: string, city?: string): Promise<TrendRecord[]>;

  // Content Generations
  createContentGeneration(gen: InsertContentGeneration): Promise<ContentGeneration>;
  getContentGenerationsByUser(userId: number, limit?: number): Promise<ContentGeneration[]>;
}

export class DatabaseStorage implements IStorage {
  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get() as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get() as User | undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    return db.insert(users).values(user).returning().get() as User;
  }

  async updateUserPlan(id: number, plan: string): Promise<User | undefined> {
    return db.update(users).set({ plan }).where(eq(users.id, id)).returning().get() as User | undefined;
  }

  async incrementSearchCount(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      db.update(users).set({ searchesThisMonth: user.searchesThisMonth + 1 }).where(eq(users.id, userId)).run();
    }
  }

  // --- Searches ---
  async createSearch(search: InsertSearch): Promise<Search> {
    return db.insert(searches).values(search).returning().get() as Search;
  }

  async getSearch(id: number): Promise<Search | undefined> {
    return db.select().from(searches).where(eq(searches.id, id)).get() as Search | undefined;
  }

  async getSearchesByUser(userId: number, limit = 20): Promise<Search[]> {
    return db.select().from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.id))
      .limit(limit)
      .all() as Search[];
  }

  async getSearchResult(id: number): Promise<SearchResult | undefined> {
    const search = await this.getSearch(id);
    if (!search) return undefined;
    const tags = await this.getHashtagsBySearch(id);
    const groups: SearchResult['hashtagGroups'] = {
      high_volume: [],
      medium: [],
      niche: [],
      local: [],
      trending: [],
    };
    for (const t of tags) {
      const g = t.groupType as keyof typeof groups;
      if (groups[g]) groups[g].push(t);
    }
    return { ...search, hashtagGroups: groups };
  }

  async deleteSearch(id: number): Promise<void> {
    db.delete(searches).where(eq(searches.id, id)).run();
  }

  // --- Hashtags ---
  async createHashtags(tags: InsertHashtag[]): Promise<Hashtag[]> {
    if (tags.length === 0) return [];
    const result: Hashtag[] = [];
    for (const tag of tags) {
      const h = db.insert(hashtags).values(tag).returning().get() as Hashtag;
      result.push(h);
    }
    return result;
  }

  async getHashtagsBySearch(searchId: number): Promise<Hashtag[]> {
    return db.select().from(hashtags).where(eq(hashtags.searchId, searchId)).all() as Hashtag[];
  }

  async getHashtagsByUser(userId: number, limit = 50): Promise<Hashtag[]> {
    return db.select().from(hashtags)
      .where(eq(hashtags.userId, userId))
      .limit(limit)
      .all() as Hashtag[];
  }

  // --- Collections ---
  async createCollection(col: InsertCollection): Promise<Collection> {
    return db.insert(collections).values(col).returning().get() as Collection;
  }

  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return db.select().from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.id))
      .all() as Collection[];
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return db.select().from(collections).where(eq(collections.id, id)).get() as Collection | undefined;
  }

  async deleteCollection(id: number): Promise<void> {
    db.delete(collectionTags).where(eq(collectionTags.collectionId, id)).run();
    db.delete(collections).where(eq(collections.id, id)).run();
  }

  async updateCollectionTagCount(id: number, delta: number): Promise<void> {
    const col = await this.getCollection(id);
    if (col) {
      db.update(collections).set({ tagCount: Math.max(0, col.tagCount + delta) }).where(eq(collections.id, id)).run();
    }
  }

  // --- Collection Tags ---
  async addTagToCollection(ct: InsertCollectionTag): Promise<CollectionTag> {
    const result = db.insert(collectionTags).values(ct).returning().get() as CollectionTag;
    await this.updateCollectionTagCount(ct.collectionId, 1);
    return result;
  }

  async getTagsInCollection(collectionId: number): Promise<CollectionTag[]> {
    return db.select().from(collectionTags)
      .where(eq(collectionTags.collectionId, collectionId))
      .all() as CollectionTag[];
  }

  async removeTagFromCollection(id: number): Promise<void> {
    const ct = db.select().from(collectionTags).where(eq(collectionTags.id, id)).get() as CollectionTag | undefined;
    if (ct) {
      db.delete(collectionTags).where(eq(collectionTags.id, id)).run();
      await this.updateCollectionTagCount(ct.collectionId, -1);
    }
  }

  // --- Trends ---
  async getTrends(platform?: string, industry?: string, city?: string): Promise<TrendRecord[]> {
    let query = db.select().from(trendRecords);
    const conditions = [];
    if (platform) conditions.push(eq(trendRecords.platform, platform));
    if (industry) conditions.push(eq(trendRecords.industry, industry));
    if (city) conditions.push(eq(trendRecords.locationCity, city));

    if (conditions.length > 0) {
      return (query.where(and(...conditions)) as any).orderBy(desc(trendRecords.trendScore)).limit(50).all() as TrendRecord[];
    }
    return (query as any).orderBy(desc(trendRecords.trendScore)).limit(50).all() as TrendRecord[];
  }

  // --- Content Generations ---
  async createContentGeneration(gen: InsertContentGeneration): Promise<ContentGeneration> {
    return db.insert(contentGenerations).values(gen).returning().get() as ContentGeneration;
  }

  async getContentGenerationsByUser(userId: number, limit = 10): Promise<ContentGeneration[]> {
    return db.select().from(contentGenerations)
      .where(eq(contentGenerations.userId, userId))
      .orderBy(desc(contentGenerations.id))
      .limit(limit)
      .all() as ContentGeneration[];
  }
}

export const storage = new DatabaseStorage();
