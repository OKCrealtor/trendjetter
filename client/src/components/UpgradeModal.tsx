import { useState } from 'react';
import { X, Zap, Building2, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    icon: Zap,
    color: '#0891B2',
    features: [
      '1,000 generations/month',
      'AI-powered hashtag intelligence',
      'Trend analytics dashboard',
      'Collections & saved sets',
      'Content assistant',
      'Priority support',
    ],
  },
  {
    name: 'Agency',
    price: '$99',
    period: '/mo',
    priceId: import.meta.env.VITE_STRIPE_AGENCY_PRICE_ID,
    icon: Building2,
    color: '#111111',
    features: [
      '5,000 generations/month',
      'Everything in Pro',
      'Team seats',
      'Client management',
      'Bulk export',
      'Dedicated support',
    ],
  },
];

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  reason?: string; // e.g. "You've used all 5 free generations"
}

export default function UpgradeModal({ isOpen, onClose, currentPlan = 'free', reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleUpgrade = async (priceId: string, planName: string) => {
    if (!priceId) {
      toast({ title: 'Configuration error', description: 'Price ID not set — contact support.', variant: 'destructive' });
      return;
    }
    setLoading(planName);
    try {
      const res = await apiRequest('POST', '/api/stripe/checkout', { priceId });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ border: '1px solid #E4E4E7' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 style={{ fontFamily: 'Inter Tight, Inter, sans-serif', fontSize: 22, fontWeight: 700, color: '#111111', marginBottom: 6 }}>
              Upgrade TrendJetter
            </h2>
            {reason && (
              <p style={{ fontSize: 14, color: '#71717A' }}>{reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#111111] transition-colors"
            style={{ marginTop: 2 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.name.toLowerCase();
            return (
              <div
                key={plan.name}
                className="rounded-xl p-5"
                style={{
                  border: `1.5px solid ${plan.name === 'Agency' ? '#111111' : '#E4E4E7'}`,
                  background: plan.name === 'Agency' ? '#111111' : '#FAFAFA',
                  color: plan.name === 'Agency' ? '#FFFFFF' : '#111111',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: plan.name === 'Agency' ? '#FFFFFF' : plan.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{plan.name}</span>
                </div>
                <div className="flex items-end gap-1 mb-4">
                  <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Inter Tight, Inter, sans-serif' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.name === 'Agency' ? '#A1A1AA' : '#71717A', marginBottom: 4 }}>{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={13} style={{ marginTop: 2, flexShrink: 0, color: plan.name === 'Agency' ? '#0891B2' : '#111111' }} />
                      <span style={{ fontSize: 13, color: plan.name === 'Agency' ? '#D4D4D8' : '#52525B' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.priceId, plan.name)}
                  disabled={!!loading || isCurrentPlan}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: plan.name === 'Agency' ? '#FFFFFF' : '#111111',
                    color: plan.name === 'Agency' ? '#111111' : '#FFFFFF',
                    opacity: loading || isCurrentPlan ? 0.6 : 1,
                    cursor: loading || isCurrentPlan ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading === plan.name ? 'Redirecting...' : isCurrentPlan ? 'Current plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#A1A1AA', paddingBottom: 16 }}>
          Secure payment via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
