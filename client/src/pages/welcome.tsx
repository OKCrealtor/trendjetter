import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Check, Zap, Building2, ArrowRight, Hash } from 'lucide-react';
import TrendJetterLogo from '@/components/TrendJetterLogo';
import type { User } from '@shared/schema';

// ── Confetti particle ────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; angle: number; spin: number; life: number;
}

const CONFETTI_COLORS = ['#111111', '#0891B2', '#0E7490', '#6366F1', '#A855F7', '#F59E0B', '#10B981'];

function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement>, active: boolean) {
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Spawn burst
    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 1,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 6 + 4,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8,
        life: 1,
      });
    }

    function tick() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0.01);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.angle += p.spin;
        p.life -= 0.008;

        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 4);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, canvasRef]);
}

// ── Plan details ─────────────────────────────────────────────────────────────
const PLAN_INFO: Record<string, {
  name: string; icon: any; color: string; bg: string;
  headline: string; sub: string; perks: string[];
}> = {
  pro: {
    name: 'Pro',
    icon: Zap,
    color: '#111111',
    bg: '#F4F4F5',
    headline: "You're now on Pro.",
    sub: '1,000 searches per month. 30 hashtags per generation. Full intelligence scores across all 6 platforms.',
    perks: [
      '1,000 generations/month',
      '30 hashtags per search',
      'All 6 platforms',
      'Trend analytics dashboard',
      'Collections & saved sets',
      'Priority support',
    ],
  },
  agency: {
    name: 'Agency',
    icon: Building2,
    color: '#FFFFFF',
    bg: '#111111',
    headline: "You're now on Agency.",
    sub: '5,000 searches per month. 30 hashtags per generation. Everything in Pro, built for high-volume creators and teams.',
    perks: [
      '5,000 generations/month',
      '30 hashtags per search',
      'Everything in Pro',
      'White-label reports',
      'API access',
      'Dedicated support',
    ],
  },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [visible, setVisible] = useState(false);

  // Read plan from /api/me (webhook already ran by the time Stripe redirects)
  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
    staleTime: 0,
    refetchOnMount: true,
  });

  const planKey = (user?.plan ?? 'pro') as 'pro' | 'agency';
  const plan = PLAN_INFO[planKey] ?? PLAN_INFO.pro;
  const PlanIcon = plan.icon;

  // Resize canvas to match window
  useEffect(() => {
    function resize() {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Trigger entrance + confetti once user data loads
  useEffect(() => {
    if (!user) return;
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setConfettiActive(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user]);

  useConfetti(canvasRef, confettiActive);

  const isAgency = planKey === 'agency';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, #D0D0D6 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Logo top-left */}
      <div className="fixed top-5 left-6 z-10">
        <TrendJetterLogo height={28} color="#111111" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Success checkmark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: isAgency ? '#111111' : '#F0FDF4', border: '1px solid', borderColor: isAgency ? '#111111' : '#BBF7D0' }}
          >
            <Check size={28} strokeWidth={2.5} color={isAgency ? '#FFFFFF' : '#16A34A'} />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1
            className="text-[32px] font-bold text-[#111111] mb-3 leading-tight"
            style={{ fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.03em' }}
          >
            {plan.headline}
          </h1>
          <p className="text-[15px] text-[#52525B] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            {plan.sub}
          </p>
        </div>

        {/* Plan card */}
        <div
          className="rounded-2xl border p-6 mb-6"
          style={{
            background: isAgency ? '#111111' : '#FFFFFF',
            borderColor: isAgency ? '#111111' : '#E4E4E7',
          }}
        >
          {/* Plan badge */}
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: isAgency ? 'rgba(255,255,255,0.15)' : '#F4F4F5' }}
            >
              <PlanIcon size={15} color={isAgency ? '#FFFFFF' : '#111111'} />
            </div>
            <div>
              <p
                className="text-[13px] font-semibold leading-none mb-0.5"
                style={{ color: isAgency ? '#FFFFFF' : '#111111', fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.01em' }}
              >
                {plan.name} Plan
              </p>
              <p className="text-[11px] leading-none" style={{ color: isAgency ? 'rgba(255,255,255,0.5)' : '#A1A1AA' }}>
                Active
              </p>
            </div>
          </div>

          {/* Perks list */}
          <div className="space-y-2.5">
            {plan.perks.map(perk => (
              <div key={perk} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isAgency ? 'rgba(255,255,255,0.15)' : '#F0FDF4' }}
                >
                  <Check size={9} strokeWidth={2.5} color={isAgency ? '#FFFFFF' : '#16A34A'} />
                </div>
                <span
                  className="text-[13px]"
                  style={{ color: isAgency ? 'rgba(255,255,255,0.85)' : '#52525B', fontFamily: 'Inter, sans-serif' }}
                >
                  {perk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          data-testid="welcome-cta"
          onClick={() => navigate('/generator')}
          className="w-full h-12 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
          style={{
            background: '#111111',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          <Hash size={16} />
          Start generating
          <ArrowRight size={15} className="ml-0.5" />
        </button>

        <p
          className="text-center text-[12px] text-[#A1A1AA] mt-4 cursor-pointer hover:text-[#71717A] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
          onClick={() => navigate('/dashboard')}
        >
          Go to dashboard →
        </p>
      </div>
    </div>
  );
}
