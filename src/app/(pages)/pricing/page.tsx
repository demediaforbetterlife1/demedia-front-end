'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  interval: string;
  intervalCount: number;
  trialDays: number;
  features: string[];
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/plans`);
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/status`, {
        credentials: 'include',
      });
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    setSubscribing(planId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/create-checkout-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planType: planId }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert(error.message || 'Failed to start checkout');
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Crown className="w-12 h-12 text-yellow-400" />
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Unlock premium features and take your experience to the next level
          </p>
        </motion.div>

        {/* Current Subscription Status */}
        {subscriptionStatus?.hasSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-green-500/20 border border-green-500/50 rounded-2xl text-center"
          >
            <p className="text-green-300 text-lg">
              ✨ You're currently on the{' '}
              <span className="font-bold capitalize">{subscriptionStatus.planType}</span> plan
              {subscriptionStatus.isInTrial && ' (Free Trial)'}
            </p>
            {subscriptionStatus.cancelAtPeriodEnd && (
              <p className="text-yellow-300 mt-2">
                Your subscription will end on{' '}
                {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isMonthly = plan.id === 'monthly';
            const isPopular = isMonthly;
            const hasCurrentPlan =
              subscriptionStatus?.planType === plan.id && subscriptionStatus?.isPremium;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${
                  isPopular
                    ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600'
                    : 'bg-gray-800/50 border border-gray-700'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-white">
                      {isMonthly ? '$9.99' : '$23.99'}
                    </span>
                    <span className="text-gray-300">
                      / {plan.intervalCount > 1 ? `${plan.intervalCount} months` : 'month'}
                    </span>
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-green-300 mt-2 font-semibold">
                      🎉 {plan.trialDays}-day free trial
                    </p>
                  )}
                  {!isMonthly && (
                    <p className="text-yellow-300 mt-2 font-semibold">💰 Save 20%</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing === plan.id || hasCurrentPlan}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    hasCurrentPlan
                      ? 'bg-gray-600 cursor-not-allowed'
                      : isPopular
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {subscribing === plan.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                      Processing...
                    </>
                  ) : hasCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {plan.trialDays > 0 ? 'Start Free Trial' : 'Subscribe Now'}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'How does the free trial work?',
                a: 'The monthly plan includes a 7-day free trial. You can cancel anytime during the trial and won\'t be charged. After the trial, you\'ll be automatically billed monthly.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.',
              },
              {
                q: 'Can I switch plans?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your billing cycle.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Trusted by thousands of users worldwide</p>
          <div className="flex items-center justify-center gap-8 text-gray-500">
            <div>🔒 Secure Payment</div>
            <div>✓ Money-back Guarantee</div>
            <div>⚡ Instant Access</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
