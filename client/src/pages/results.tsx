import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Hash, ArrowLeft, Copy, Check, Star, ChevronDown, ChevronUp, TrendingUp, Zap, Target, BarChart2, MapPin, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { SearchResult, Hashtag } from '@shared/schema';

// ─── Helpers ───────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 88) return '#B45309';   // amber  — Viral Potential
  if (s >= 75) return '#16A34A';   // green  — Use Now
  if (s >= 62) return '#0891B2';   // teal   — Strong Pick
  if (s >= 48) return '#2563EB';   // blue   — Good Filler
  if (s >= 35) return '#D97706';   // yellow — Situational
  if (s >= 20) return '#EA580C';   // orange — Low Reach
  return '#DC2626';                // red    — Skip
}
function verdictLabel(s: number) {
  if (s >= 88) return '🔥 Viral Potential';
  if (s >= 75) return '⚡ Use Now';
  if (s >= 62) return '✓ Strong Pick';
  if (s >= 48) return '→ Good Filler';
  if (s >= 35) return '◎ Situational';
  if (s >= 20) return '↓ Low Reach';
  return '✕ Skip';
}
function verdictBg(s: number) {
  if (s >= 88) return { background: '#FEF3C7', color: '#B45309' };   // amber
  if (s >= 75) return { background: '#DCFCE7', color: '#15803D' };   // green
  if (s >= 62) return { background: '#CFFAFE', color: '#0E7490' };   // teal
  if (s >= 48) return { background: '#DBEAFE', color: '#1D4ED8' };   // blue
  if (s >= 35) return { background: '#FEF9C3', color: '#A16207' };   // yellow
  if (s >= 20) return { background: '#FFEDD5', color: '#C2410C' };   // orange
  return { background: '#FEE2E2', color: '#B91C1C' };                // red
}

const GROUP_META: Record<string, { label: string; icon: any; desc: string; color: string }> = {
  high_volume:  { label: 'High Volume',   icon: BarChart2,  desc: 'Massive reach, high competition',    color: '#6366F1' },
  medium:       { label: 'Medium Reach',  icon: Target,     desc: 'Balanced reach & discoverability',   color: '#0891B2' },
  niche:        { label: 'Niche',         icon: Hash,       desc: 'Targeted audience, low competition', color: '#16A34A' },
  local:        { label: 'Local',         icon: MapPin,     desc: 'Hyper-local community reach',        color: '#D97706' },
  trending:     { label: 'Trending Now',  icon: TrendingUp, desc: 'Rising fast this week',               color: '#DC2626' },
};

// ─── Animated score bar ────────────────────────────────────────────────────
function ScoreBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="flex-1 h-1.5 rounded-full bg-[#F4F4F5] overflow-hidden">
      <div className="h-full rounded-full score-bar" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

// ─── Exploding badge ──────────────────────────────────────────────────────
function ExplodingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: '#FEF3C7', color: '#B45309', letterSpacing: '0.05em' }}>
      <Flame size={9} /> Exploding
    </span>
  );
}

// ─── Hashtag row ───────────────────────────────────────────────────────────
function HashtagRow({ tag, rank, groupKey }: { tag: Hashtag; rank: number; groupKey: string }) {
  const [open, setOpen] = useState(rank <= 2);
  const [copied, setCopied] = useState(false);
  const score = tag.overallScore ?? 0;
  const color = scoreColor(score);
  const isExploding = tag.trendDirection === 'rising' && (tag.opportunityScore ?? 0) >= 65;
  const isTrending = groupKey === 'trending' || tag.trendDirection === 'rising';

  function copy() {
    navigator.clipboard.writeText(tag.tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`border rounded-xl overflow-hidden mb-2 bg-white transition-all hover:shadow-sm ${isExploding ? 'border-amber-200' : 'border-[#E4E4E7]'}`}
      style={isExploding ? { boxShadow: '0 0 0 1px #FCD34D22' } : {}}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        {/* Rank */}
        <span className="text-[11px] font-medium text-[#A1A1AA] tabular w-4 shrink-0">{rank}</span>

        {/* Tag + badges */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[13px] font-semibold text-[#111111]">{tag.tag}</span>
          {isExploding && <ExplodingBadge />}
          {!isExploding && isTrending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: '#FEE2E2', color: '#DC2626', letterSpacing: '0.05em' }}>
              <TrendingUp size={9} /> Rising
            </span>
          )}
        </div>

        {/* Score + verdict */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[20px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color, letterSpacing: '-0.03em' }}>
            {score}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={verdictBg(score)}>
            {verdictLabel(score)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={copy} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors">
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-[#A1A1AA]" />}
          </button>
          <button onClick={() => setOpen(o => !o)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors">
            {open ? <ChevronUp size={12} className="text-[#A1A1AA]" /> : <ChevronDown size={12} className="text-[#A1A1AA]" />}
          </button>
        </div>
      </div>

      {/* Expanded scores */}
      {open && (
        <div className="px-4 pb-4 border-t border-[#F4F4F5]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-3.5">
            {[
              { label: 'Popularity',      value: tag.popularityScore ?? 0 },
              { label: 'Low Competition', value: 100 - (tag.competitionScore ?? 0) },
              { label: 'Opportunity',     value: tag.opportunityScore ?? 0 },
              { label: 'Local Relevance', value: tag.localRelevanceScore ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[11px] text-[#71717A] w-28 shrink-0">{label}</span>
                <ScoreBar value={value} color={scoreColor(value)} />
                <span className="text-[11px] font-bold tabular w-6 text-right" style={{ color: scoreColor(value) }}>{value}</span>
              </div>
            ))}
          </div>
          {/* Momentum + confidence footer */}
          <div className="mt-3 pt-3 border-t border-[#F4F4F5] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap size={11} className="text-amber-500 shrink-0" />
              {(tag as any).momentum ? (
                <span className="text-[11px] text-[#71717A] truncate">
                  <span className="font-semibold text-[#111111]">{(tag as any).momentum}</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A]">
                  {tag.trendDirection === 'rising' ? 'Rising this week' : tag.trendDirection === 'declining' ? 'Losing momentum' : 'Stable performer'}
                </span>
              )}
            </div>
            {(tag as any).confidenceLevel && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0"
                style={(tag as any).confidenceLevel === 'high'
                  ? { background: '#DCFCE7', color: '#15803D' }
                  : (tag as any).confidenceLevel === 'medium'
                  ? { background: '#E0F2FE', color: '#0369A1' }
                  : { background: '#F4F4F5', color: '#71717A' }}>
                {(tag as any).confidenceLevel === 'high' ? '✓ High confidence' : (tag as any).confidenceLevel === 'medium' ? '~ Signal-based' : '≈ Estimated'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Group section ─────────────────────────────────────────────────────────
function GroupSection({ groupKey, tags }: { groupKey: string; tags: Hashtag[] }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const meta = GROUP_META[groupKey] ?? { label: groupKey, icon: Hash, desc: '', color: '#111111' };
  const Icon = meta.icon;
  const avgScore = Math.round(tags.reduce((s, t) => s + (t.overallScore ?? 0), 0) / tags.length);
  const explodingCount = tags.filter(t => t.trendDirection === 'rising' && (t.opportunityScore ?? 0) >= 65).length;

  function copyGroup() {
    navigator.clipboard.writeText(tags.map(t => t.tag).join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-5">
      {/* Group header */}
      <div className="flex items-center gap-3 mb-2.5">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 flex-1 text-left group cursor-pointer">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.color + '18' }}>
            <Icon size={12} style={{ color: meta.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#111111]">{meta.label}</span>
              <span className="text-[11px] text-[#A1A1AA]">{tags.length} tags</span>
              <span className="text-[11px] font-semibold" style={{ color: scoreColor(avgScore) }}>Avg {avgScore}</span>
              {explodingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: '#FEF3C7', color: '#B45309' }}>
                  <Flame size={8} /> {explodingCount} exploding
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#A1A1AA]">{meta.desc}</p>
          </div>
          <div>{open ? <ChevronUp size={13} className="text-[#A1A1AA]" /> : <ChevronDown size={13} className="text-[#A1A1AA]" />}</div>
        </button>
        <button onClick={copyGroup} className="flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-[#111111] transition-colors px-2 py-1 rounded-md hover:bg-[#F4F4F5]">
          {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy group'}</span>
        </button>
      </div>
      {open && tags.map((tag, i) => <HashtagRow key={tag.id} tag={tag} rank={i + 1} groupKey={groupKey} />)}
    </div>
  );
}

// ─── Exploding section ─────────────────────────────────────────────────────
function ExplodingSection({ tags }: { tags: Hashtag[] }) {
  const [copied, setCopied] = useState(false);
  if (tags.length === 0) return null;

  function copyAll() {
    navigator.clipboard.writeText(tags.map(t => t.tag).join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl p-5 mb-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #111111 0%, #1C1C1E 100%)', border: '1px solid #2C2C2E' }}>
      {/* Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
            <Flame size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Exploding Right Now</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{tags.length} tags gaining momentum this week</p>
          </div>
        </div>
        <button onClick={copyAll} className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer group"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => navigator.clipboard.writeText(tag.tag)}>
            <Zap size={10} className="text-amber-400 shrink-0" />
            <span className="font-mono text-[12px] font-semibold text-white">{tag.tag}</span>
            <span className="text-[11px] font-bold tabular" style={{ color: scoreColor(tag.overallScore ?? 0) }}>{tag.overallScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function ResultsPage({ id }: { id: string }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<SearchResult>({
    queryKey: ['/api/searches', id],
    queryFn: () => apiRequest('GET', `/api/searches/${id}`).then(r => r.json()),
  });

  const allTags = data?.hashtagGroups ? Object.values(data.hashtagGroups).flat() : [];
  const explodingTags = allTags.filter(t => t.trendDirection === 'rising' && (t.opportunityScore ?? 0) >= 65)
    .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0));
  const topTags = [...allTags].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)).slice(0, 5);
  const avgScore = allTags.length ? Math.round(allTags.reduce((s, t) => s + (t.overallScore ?? 0), 0) / allTags.length) : 0;
  const useNowCount = allTags.filter(t => (t.overallScore ?? 0) >= 62).length;

  function copyAll() {
    const text = allTags.map(t => t.tag).join(' ');
    navigator.clipboard.writeText(text);
    toast({ title: `${allTags.length} hashtags copied!` });
  }

  function copyTopPicks() {
    navigator.clipboard.writeText(topTags.map(t => t.tag).join(' '));
    toast({ title: 'Top picks copied!' });
  }

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-[14px] text-[#DC2626]">Failed to load results.</p>
      <Link href="/generator"><a className="no-underline btn-primary mt-4 inline-flex">Try again</a></Link>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/generator">
        <a className="no-underline flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-[#111111] transition-colors mb-6">
          <ArrowLeft size={13} /> New search
        </a>
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-[#F4F4F5]" />)}
        </div>
      ) : data && (
        <>
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-[22px] font-bold text-[#111111] mb-1" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.025em' }}>
              {data.contentTopic}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-[#71717A] capitalize">{data.platform}</span>
              {(data.locationCity || data.locationState) && (
                <>
                  <span className="text-[#E4E4E7]">·</span>
                  <span className="text-[12px] text-[#71717A]">{[data.locationCity, data.locationState].filter(Boolean).join(', ')}</span>
                </>
              )}
              <span className="text-[#E4E4E7]">·</span>
              <span className="text-[12px] text-[#71717A]">{allTags.length} hashtags</span>
              {explodingTags.length > 0 && (
                <>
                  <span className="text-[#E4E4E7]">·</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-600">
                    <Flame size={11} /> {explodingTags.length} exploding
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-2.5 mb-5">
            {[
              { label: 'Avg Score',  value: avgScore,     color: scoreColor(avgScore) },
              { label: 'Total Tags', value: allTags.length, color: '#111111' },
              { label: 'Strong+',    value: useNowCount,  color: '#16A34A' },
              { label: 'Exploding',  value: explodingTags.length, color: '#D97706' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bento-tile text-center py-4">
                <p className="text-[24px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color, letterSpacing: '-0.03em' }}>{value}</p>
                <p className="label-eyebrow mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Exploding tags spotlight */}
          <ExplodingSection tags={explodingTags} />

          {/* Top picks */}
          {topTags.length > 0 && (
            <div className="bento-tile p-4 mb-5 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-[#A1A1AA]" />
                  <span className="text-[12px] font-semibold text-[#111111]">Top Picks by Score</span>
                </div>
                <button onClick={copyTopPicks} className="flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-[#111111] transition-colors px-2 py-1 rounded hover:bg-[#F4F4F5]">
                  <Copy size={10} /> Copy
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topTags.map(tag => (
                  <div key={tag.id} onClick={() => navigator.clipboard.writeText(tag.tag)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E4E4E7] cursor-pointer hover:border-[#111111] transition-colors bg-white">
                    <span className="font-mono text-[12px] font-medium text-[#111111]">{tag.tag}</span>
                    <span className="text-[11px] font-bold" style={{ color: scoreColor(tag.overallScore ?? 0) }}>{tag.overallScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy all */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[#111111]" style={{ letterSpacing: '-0.01em' }}>All Hashtags by Group</h2>
            <button onClick={copyAll} className="btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5">
              <Copy size={12} /> Copy All {allTags.length}
            </button>
          </div>

          {/* Groups */}
          {data.hashtagGroups && Object.entries(data.hashtagGroups).map(([key, tags]) =>
            tags.length > 0 && <GroupSection key={key} groupKey={key} tags={tags} />
          )}
        </>
      )}
    </div>
  );
}
