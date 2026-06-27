import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { TrendingUp, Hash, ArrowUpRight, Copy, Check, ChevronDown, ChevronUp, Flame, AlertTriangle, RefreshCw } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import type { TrendRecord } from '@shared/schema';

// ── Scoring helpers (mirrors results.tsx) ─────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 75) return '#16A34A';
  if (s >= 55) return '#0891B2';
  if (s >= 35) return '#D97706';
  return '#DC2626';
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

function verdictBg(s: number): React.CSSProperties {
  if (s >= 88) return { background: '#FEF3C7', color: '#B45309' };
  if (s >= 75) return { background: '#DCFCE7', color: '#15803D' };
  if (s >= 62) return { background: '#D1FAE5', color: '#059669' };
  if (s >= 48) return { background: '#E0F2FE', color: '#0369A1' };
  if (s >= 35) return { background: '#F3F4F6', color: '#6B7280' };
  if (s >= 20) return { background: '#FEE2E2', color: '#B91C1C' };
  return { background: '#F4F4F5', color: '#A1A1AA' };
}

function getInsight(trend: TrendRecord): string {
  const score = trend.trendScore ?? 0;
  const v = trend.velocity ?? 'stable';
  const tag = trend.tag;
  if (v === 'exploding') return `${tag} is seeing explosive growth right now — early movers are getting outsized reach. Post this week before saturation sets in.`;
  if (v === 'rising' && score >= 75) return `Strong upward momentum on ${tag}. The algorithm is actively surfacing this tag — now is the window.`;
  if (v === 'rising') return `${tag} is gaining traction this week. A solid choice with growing visibility across ${trend.platform ?? 'this platform'}.`;
  if (v === 'stable' && score >= 62) return `${tag} is a reliable performer — consistent reach without the noise. Good baseline tag for any set.`;
  if (v === 'declining') return `${tag} is losing momentum. It was bigger before — only use if directly relevant to your content.`;
  return `${tag} shows moderate activity on ${trend.platform ?? 'this platform'}. Worth including as filler but not as a primary tag.`;
}

const PLATFORMS  = ['All', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'X', 'Facebook'];
const INDUSTRIES = ['All', 'Fitness', 'Food & Beverage', 'Beauty', 'Travel', 'Real Estate', 'Technology'];

// ── TrendCard — matches HashtagRow style from results.tsx ─────────────────────
function TrendCard({ trend }: { trend: TrendRecord }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);

  const score       = trend.trendScore ?? 0;
  const velocity    = trend.velocity ?? 'stable';
  const isExploding = velocity === 'exploding' || (velocity === 'rising' && score >= 75);
  const isRising    = velocity === 'rising' && !isExploding;
  const isSkip      = score < 35;
  const leftColor   = scoreColor(score);

  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(trend.tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`rounded-xl overflow-hidden bg-white transition-all hover:shadow-sm ${isSkip ? 'opacity-60' : ''}`}
      style={{ border: '1px solid #E4E4E7', borderLeft: `3px solid ${leftColor}` }}
      data-testid={`trend-${trend.id}`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>

        {/* Tag + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono text-[13px] font-semibold ${isSkip ? 'text-[#A1A1AA] line-through' : 'text-[#111111]'}`}>
              {trend.tag}
            </span>
            {isExploding && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                style={{ background: '#FEF3C7', color: '#B45309' }}>
                <Flame size={8} /> Exploding
              </span>
            )}
            {isRising && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <TrendingUp size={8} /> Rising this week
              </span>
            )}
            {isSkip && (
              <span className="inline-flex items-center gap-1 text-[9px] text-[#A1A1AA]">
                <AlertTriangle size={9} /> avoid
              </span>
            )}
          </div>
          {/* Platform + industry sub-line */}
          <p className="text-[10px] text-[#A1A1AA] mt-0.5 capitalize">
            {trend.platform ?? ''}{trend.industry ? ` · ${trend.industry}` : ''}
          </p>
        </div>

        {/* Score + verdict */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[18px] font-bold tabular"
            style={{ fontFamily: 'Inter Tight, Inter, sans-serif', color: leftColor, letterSpacing: '-0.03em' }}>
            {score}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={verdictBg(score)}>
            {verdictLabel(score)}
          </span>
        </div>

        {/* Copy + expand */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={copy} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors">
            {copied
              ? <Check size={12} className="text-green-600" />
              : <Copy size={12} className="text-[#A1A1AA]" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#F4F4F5] transition-colors"
          >
            {open
              ? <ChevronUp   size={12} className="text-[#A1A1AA]" />
              : <ChevronDown size={12} className="text-[#A1A1AA]" />}
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-[#F4F4F5]">
          <p className="text-[12px] text-[#52525B] mt-3 leading-relaxed">{getInsight(trend)}</p>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F4F4F5] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wide font-medium">Velocity</span>
              <span className="text-[11px] font-bold capitalize"
                style={{ color: velocity === 'exploding' ? '#B45309' : velocity === 'rising' ? '#DC2626' : velocity === 'stable' ? '#0891B2' : '#A1A1AA' }}>
                {velocity === 'exploding' ? '🔥 Exploding' : velocity === 'rising' ? '↑ Rising' : velocity === 'stable' ? '→ Stable' : '↓ Declining'}
              </span>
            </div>
            {trend.estimatedPosts && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wide font-medium">Volume</span>
                <span className="text-[11px] font-bold text-[#52525B]">~{trend.estimatedPosts} posts</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <Link href="/generator">
                <a className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0891B2] hover:text-[#0E7490] transition-colors no-underline">
                  Generate with this <ArrowUpRight size={11} />
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const [platform, setPlatform] = useState('All');
  const [industry, setIndustry] = useState('All');

  const params = new URLSearchParams();
  if (platform !== 'All') params.set('platform', platform.toLowerCase());
  if (industry !== 'All') params.set('industry', industry.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'));

  const { data: trendsData, isLoading } = useQuery<{ trends: TrendRecord[]; lastRefreshed: string | null; refreshing: boolean }>({
    queryKey: ['/api/trends', platform, industry],
    queryFn: () => apiRequest('GET', `/api/trends?${params}`).then(r => r.json()),
    refetchInterval: (data) => data?.refreshing ? 8000 : false,
  });

  const trends       = trendsData?.trends ?? [];
  const lastRefreshed = trendsData?.lastRefreshed ? new Date(trendsData.lastRefreshed) : null;
  const isRefreshing  = trendsData?.refreshing ?? false;

  function formatAge(d: Date | null) {
    if (!d) return null;
    const hours = Math.round((Date.now() - d.getTime()) / 3600000);
    if (hours < 1) return 'Updated just now';
    if (hours < 24) return `Updated ${hours}h ago`;
    const days = Math.round(hours / 24);
    return `Updated ${days}d ago`;
  }

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/trends/refresh', {
      platform: platform !== 'All' ? platform.toLowerCase() : 'instagram',
      industry: industry !== 'All' ? industry.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_') : 'general',
    }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/trends'] }),
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#111111] mb-1"
            style={{ fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.025em' }}>
            Trending Hashtags
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-[14px] text-[#71717A]">What's gaining momentum right now.</p>
            {isRefreshing && (
              <span className="flex items-center gap-1 text-[11px] text-[#0891B2] font-medium">
                <RefreshCw size={10} className="animate-spin" /> Refreshing data...
              </span>
            )}
            {!isRefreshing && lastRefreshed && (
              <span className="text-[11px] text-[#A1A1AA]">{formatAge(lastRefreshed)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="button-refresh-trends"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4E4E7] text-[12px] font-medium text-[#52525B] hover:border-[#A1A1AA] hover:text-[#111111] transition-all cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={12} className={refreshMutation.isPending ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/generator">
            <a className="no-underline btn-primary text-[13px]">Generate for me</a>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bento-tile p-4 mb-6">
        <div className="flex items-start gap-6 flex-wrap">
          <div>
            <p className="label-eyebrow mb-2">Platform</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  data-testid={`filter-platform-${p.toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                    platform === p
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label-eyebrow mb-2">Industry</p>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map(i => (
                <button
                  key={i}
                  onClick={() => setIndustry(i)}
                  data-testid={`filter-industry-${i.toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                    industry === i
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]'
                  }`}
                >{i}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-[#F4F4F5]" />)}
        </div>
      ) : !trends || trends.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp size={32} className="mx-auto text-[#D4D4D8] mb-3" />
          <p className="text-[14px] text-[#A1A1AA]">No trends found for this filter combination.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {trends.map(t => <TrendCard key={t.id} trend={t} />)}
        </div>
      )}
    </div>
  );
}
