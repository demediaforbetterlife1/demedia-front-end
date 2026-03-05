"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Feature {
  id: string;
  name: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  interval: string;
  intervalCount: number;
  features: Feature[];
}

interface Subscription {
  id: number;
  planType: string;
  planName: string;
  status: string;
  isTrialing: boolean;
  trialStart: string | null;
  trialEnd: string | null;
  trialEnded: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  features: string[];
  createdAt: string;
}

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend-production.up.railway.app';

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch available plans
      const plansRes = await fetch(`${API_URL}/api/subscription/plans`, {
        credentials: 'include'
      });

      if (!plansRes.ok) {
        throw new Error('Failed to fetch plans');
      }

      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      // Fetch current subscription if user is logged in
      if (user) {
        const subRes = await fetch(`${API_URL}/api/subscription/current`, {
          credentials: 'include'
        });

        if (subRes.ok) {
          const subData = await subRes.json();
          setCurrentSubscription(subData.subscription);
        }
      }
    } catch (err: any) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    try {
      setProcessingPlan(planId);
      setError(null);

      const response = await fetch(`${API_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ planId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription process');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/subscription/create-portal`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message || 'Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      alert('Subscription will be canceled at the end of your billing period');
      fetchPlansAndSubscription();
    } catch (err: any) {
      console.error('Cancel error:', err);
      setError(err.message || 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 text-lg">
          Unlock premium features and take your experience to the next level
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {currentSubscription && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
          
          {currentSubscription.isTrialing && !currentSubscription.trialEnded && currentSubscription.trialEnd && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">🎉 Free Trial Active!</p>
              <p className="text-sm text-green-700 mt-1">
                Your 7-day free trial ends on {new Date(currentSubscription.trialEnd).toLocaleDateString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                You won't be charged until your trial ends. Cancel anytime.
              </p>
            </div>
          )}
          
          <p className="text-gray-700 mb-4">
            <span className="font-medium">{currentSubscription.planName}</span> - Status: {currentSubscription.status}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {currentSubscription.cancelAtPeriodEnd ? (
              <>Cancels on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</>
            ) : currentSubscription.isTrialing && currentSubscription.trialEnd ? (
              <>Trial ends {new Date(currentSubscription.trialEnd).toLocaleDateString()}, then renews {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</>
            ) : (
              <>Renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</>
            )}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleManageSubscription}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Manage Subscription
            </button>
            {!currentSubscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planType === plan.id;
          const isProcessing = processingPlan === plan.id;
          const hasTrialBadge = plan.id === 'monthly' && !currentSubscription;

          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-8 relative ${
                isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {hasTrialBadge && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  7-Day Free Trial
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Billed every {plan.intervalCount > 1 ? `${plan.intervalCount} ` : ''}
                  {plan.interval}{plan.intervalCount > 1 ? 's' : ''}
                </p>
                {hasTrialBadge && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    Start your free 7-day trial today!
                  </p>
                )}
              </div>

              <div className="mb-8">
                <h4 className="font-semibold mb-3">Features:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {!currentSubscription && (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing ? 'Processing...' : hasTrialBadge ? 'Start Free Trial' : 'Subscribe Now'}
                </button>
              )}

              {isCurrentPlan && (
                <div className="text-center py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold">
                  Current Plan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="mt-8 text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Please <a href="/sign-in" className="underline font-semibold">log in</a> to subscribe to a plan
          </p>
        </div>
      )}
    </div>
  );
}
