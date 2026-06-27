// ── Trend refresh: Google Trends signal + Claude Haiku mapping ──────────────
import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';
import type { TrendRecord } from '../shared/schema';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  real_estate:   ['home buying', 'real estate market', 'mortgage rates', 'housing market', 'property investment'],
  fitness:       ['workout trends', 'fitness motivation', 'gym tips', 'weight loss', 'healthy lifestyle'],
  food:          ['food trends', 'recipe ideas', 'restaurant trends', 'cooking tips', 'meal prep'],
  fashion:       ['fashion trends', 'style tips', 'outfit ideas', 'clothing brands', 'streetwear'],
  technology:    ['tech trends', 'AI tools', 'startup news', 'app development', 'gadgets'],
  beauty:        ['beauty trends', 'skincare routine', 'makeup tips', 'haircare', 'self care'],
  travel:        ['travel tips', 'vacation ideas', 'budget travel', 'travel destinations', 'digital nomad'],
  business:      ['entrepreneur tips', 'small business', 'side hustle', 'business growth', 'marketing strategy'],
  entertainment: ['viral videos', 'pop culture', 'streaming shows', 'music trends', 'celebrity news'],
  education:     ['online learning', 'study tips', 'career advice', 'professional development', 'skills training'],
  health:        ['mental health', 'wellness tips', 'nutrition advice', 'healthcare', 'mindfulness'],
  finance:       ['personal finance', 'investing tips', 'crypto news', 'saving money', 'financial freedom'],
};

const PLATFORM_CONTEXT: Record<string, string> = {
  instagram: 'Instagram Reels and feed posts, max 5 hashtags',
  tiktok:    'TikTok For You Page, max 5 hashtags',
  youtube:   'YouTube Shorts and videos, up to 15 hashtags',
  linkedin:  'LinkedIn professional content, 3-5 hashtags',
  x:         'X/Twitter, 1-2 hashtags',
  facebook:  'Facebook posts, 2-3 hashtags',
};

async function fetchGoogleTrendingTerms(keywords: string[]): Promise<string[]> {
  const results: string[] = [];
  try {
    const fetch = (await import('node-fetch')).default as any;
    // Google Trends daily trending searches RSS — no key needed
    const r = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
    );
    const xml = await r.text();
    // Extract <title> tags from RSS items (skip first which is feed title)
    const matches = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)];
    const terms = matches.map(m => m[1]).filter(Boolean).slice(0, 20);
    // Filter to terms that loosely relate to our keywords
    const kwLower = keywords.map(k => k.toLowerCase());
    const relevant = terms.filter(t =>
      kwLower.some(k => k.split(' ').some(word => t.toLowerCase().includes(word)))
    );
    results.push(...(relevant.length > 0 ? relevant : terms.slice(0, 5)));
  } catch (_) { /* blocked or timeout — Claude runs solo */ }
  return results.slice(0, 8);
}

export async function refreshTrends(platform: string, industry: string): Promise<void> {
  const keywords = INDUSTRY_KEYWORDS[industry] ?? INDUSTRY_KEYWORDS.business;

  let trendingTerms: string[] = [];
  try { trendingTerms = await fetchGoogleTrendingTerms(keywords); } catch (_) {}

  const termsBlock = trendingTerms.length > 0
    ? `\n\nCurrently trending in the US right now (use as signal for what's culturally relevant):\n${trendingTerms.map(t => `- ${t}`).join('\n')}`
    : '';

  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prompt = `You are a social media trend analyst. Generate 20 trending hashtags for ${platform} in the ${industry.replace(/_/g, ' ')} space as of ${month}.${termsBlock}

Platform: ${PLATFORM_CONTEXT[platform] ?? platform}

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "tag": "#hashtagname",
    "trendScore": 85,
    "velocity": "rising",
    "estimatedPosts": 450000
  }
]

Rules:
- Mix: 6 niche tags (trendScore 40-64), 8 mid-tier (65-84), 6 hot/trending (85-98)
- trendScore 1-100 based on current momentum
- velocity: "rising", "stable", or "declining" only
- estimatedPosts: realistic total post count for that hashtag
- Tags must be relevant to ${industry.replace(/_/g, ' ')} creators on ${platform} in 2026
- No year numbers in any hashtag
- No em dashes`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as any).text?.trim() ?? '[]';
  let parsed: any[] = [];
  try {
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(clean);
  } catch (_) {
    console.error('refreshTrends: failed to parse Claude response', raw.slice(0, 200));
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return;

  const records = parsed.map((item: any) => ({
    tag:            String(item.tag ?? '').trim(),
    platform,
    industry,
    trendScore:     Number(item.trendScore) || 50,
    velocity:       ['rising', 'stable', 'declining'].includes(item.velocity) ? item.velocity : 'stable',
    estimatedPosts: Number(item.estimatedPosts) || null,
    locationCity:   null as string | null,
    locationState:  null as string | null,
    updatedAt:      new Date(),
  })).filter(r => r.tag.startsWith('#'));

  if (records.length > 0) {
    await storage.upsertTrendBatch(records);
    console.log(`refreshTrends: updated ${records.length} tags for ${platform}/${industry}`);
  }
}
