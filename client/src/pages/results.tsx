import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Hash, ArrowLeft, Copy, Check, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { SearchResult, Hashtag } from '@shared/schema';

// ─── Helpers ───────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return '#16A34A';
  if (s >= 55) return '#0891B2';
  if (s >= 35) return '#D97706';
  return '#DC2626';
}
function verdictLabel(s: number) {
  if (s >= 75) return 'Use This Now';
  if (s >= 55) return 'Good Pick';
  if (s >= 35) return 'Situational';
  return 'Skip';
}
function verdictClass(s: number) {
  if (s >= 75) return 'verdict-use';
  if (s >= 55) return 'verdict-good';
  if (s >= 35) return 'verdict-situational';
  return 'verdict-skip';
}

const GROUP_LABELS: Record<string, string> = {
  high_volume:  'High Volume',
  medium:       'Medium Reach',
  niche:        'Niche',
  local:        'Local',
  trending:     'Trending',
};

// ─── Animated score bar ────────────────────────────────────────────────────
function ScoreBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div ref={ref} className="flex-1 h-1.5 rounded-full bg-[#F4F4F5] overflow-hidden">
      <div
        className="h-full rounded-full score-bar"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}

// ─── Hashtag row ───────────────────────────────────────────────────────────
function HashtagRow({ tag, rank }: { tag: Hashtag; rank: number }) {
  const [open, setOpen] = useState(rank <= 2);
  const [copied, setCopied] = useState(false);
  const score = tag.overallScore ?? 0;
  const color = scoreColor(score);

  function copy() {
    navigator.clipboard.writeText(tag.tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-[#E4E4E7] rounded-xl overflow-hidden mb-2 bg-white transition-shadow hover:shadow-sm">
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {/* Rank */}
        <span className="text-[12px] font-medium text-[#A1A1AA] tabular w-5 shrink-0">{rank}</span>

        {/* Tag */}
        <span className="font-mono text-[13px] font-medium text-[#111111] flex-1 min-w-0 truncate" style={{ letterSpacing: 0 }}>
          {tag.tag}
        </span>

        {/* Score */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[18px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color, letterSpacing: '-0.03em' }}>
            {score}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${verdictClass(score)}`}
            style={{ letterSpacing: '-0.01em' }}>
            {verdictLabel(score)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={copy}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-[#A1A1AA]" />}
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            {open ? <ChevronUp size={13} className="text-[#A1A1AA]" /> : <ChevronDown size={13} className="text-[#A1A1AA]" />}
          </button>
        </div>
      </div>

      {/* Expanded scores */}
      {open && (
        <div className="px-5 pb-5 border-t border-[#F4F4F5]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4">
            {[
              { label: 'Popularity',       value: tag.popularityScore ?? 0 },
              { label: 'Competition',      value: 100 - (tag.competitionScore ?? 0), invert: true },
              { label: 'Opportunity',      value: tag.opportunityScore ?? 0 },
              { label: 'Local Relevance',  value: tag.localRelevanceScore ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[12px] text-[#71717A] w-28 shrink-0">{label}</span>
                <ScoreBar value={value} color={scoreColor(value)} />
                <span className="text-[12px] font-semibold tabular w-7 text-right" style={{ color: scoreColor(value) }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Group section ─────────────────────────────────────────────────────────
function GroupSection({ groupKey, tags }: { groupKey: string; tags: Hashtag[] }) {
  const [open, setOpen] = useState(true);
  const topScore = Math.round(tags.reduce((s, t) => s + (t.overallScore ?? 0), 0) / tags.length);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full text-left mb-3 group cursor-pointer"
      >
        <h3 className="text-[13px] font-semibold text-[#111111]" style={{ letterSpacing: '-0.01em' }}>
          {GROUP_LABELS[groupKey] ?? groupKey}
        </h3>
        <span className="text-[11px] text-[#A1A1AA]">{tags.length} tags</span>
        <span className="text-[11px] font-medium" style={{ color: scoreColor(topScore) }}>Avg {topScore}</span>
        <div className="ml-auto">
          {open ? <ChevronUp size={13} className="text-[#A1A1AA]" /> : <ChevronDown size={13} className="text-[#A1A1AA]" />}
        </div>
      </button>
      {open && tags.map((tag, i) => <HashtagRow key={tag.id} tag={tag} rank={i + 1} />)}
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
  const topTags = [...allTags].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)).slice(0, 3);
  const avgScore = allTags.length ? Math.round(allTags.reduce((s, t) => s + (t.overallScore ?? 0), 0) / allTags.length) : 0;

  function copyAll() {
    const text = allTags.map(t => t.tag).join(' ');
    navigator.clipboard.writeText(text);
    toast({ title: 'All hashtags copied!' });
  }

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-[14px] text-[#DC2626]">Failed to load results.</p>
      <Link href="/generator"><a className="no-underline btn-primary mt-4 inline-flex">Try again</a></Link>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/generator">
        <a className="no-underline flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-[#111111] transition-colors mb-6">
          <ArrowLeft size={13} /> Generate new
        </a>
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-[#F4F4F5]" />)}
        </div>
      ) : data && (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[22px] font-bold text-[#111111] mb-1" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.025em' }}>
              {data.contentTopic}
            </h1>
            <p className="text-[13px] text-[#71717A]">
              {data.platform} · {data.locationCity}{data.locationState ? `, ${data.locationState}` : ''} · {allTags.length} hashtags
            </p>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bento-tile text-center py-5">
              <p className="text-[28px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color: scoreColor(avgScore), letterSpacing: '-0.03em' }}>{avgScore}</p>
              <p className="label-eyebrow mt-1">Avg Score</p>
            </div>
            <div className="bento-tile text-center py-5">
              <p className="text-[28px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color: '#111111', letterSpacing: '-0.03em' }}>{allTags.length}</p>
              <p className="label-eyebrow mt-1">Total Tags</p>
            </div>
            <div className="bento-tile text-center py-5">
              <p className="text-[28px] font-bold tabular" style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color: '#16A34A', letterSpacing: '-0.03em' }}>
                {allTags.filter(t => (t.overallScore ?? 0) >= 75).length}
              </p>
              <p className="label-eyebrow mt-1">Use This Now</p>
            </div>
          </div>

          {/* Top picks */}
          {topTags.length > 0 && (
            <div className="bento-tile p-5 mb-6" style={{ background: '#111111', borderColor: '#111111' }}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Top Picks</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topTags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <span className="font-mono text-[13px] font-medium" style={{ color: '#FFFFFF' }}>{tag.tag}</span>
                    <span className="text-[12px] font-bold tabular" style={{ color: scoreColor(tag.overallScore ?? 0) }}>{tag.overallScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy all */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-[#111111]" style={{ letterSpacing: '-0.015em' }}>All Hashtags</h2>
            <button onClick={copyAll} className="btn-secondary text-[13px] py-1.5 px-4 flex items-center gap-1.5">
              <Copy size={13} /> Copy All
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
