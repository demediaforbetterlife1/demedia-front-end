"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
    Check, 
    Star, 
    Crown, 
    Zap, 
    Shield, 
    Sparkles,
    Globe,
    Users,
    Heart,
    Target,
    Award,
    Trophy,
    X
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

interface PricingTier {
    id: string;
    name: string;
    duration: string;
    originalPrice: string;
    currentPrice: string;
    discount: string;
    features: string[];
    popular: boolean;
    icon: React.ComponentType<any>;
    color: string;
    bgGradient: string;
    borderColor: string;
}

const pricingTiers: PricingTier[] = [
    {
        id: "monthly",
        name: "Premium",
        duration: "1 Month",
        originalPrice: "$9.99",
        currentPrice: "$9.99",
        discount: "Special sign beside your name",
        features: [
            "Special sign beside your name in profile and posts",
            "Highlighted comments with special background",
            "Unlimited posts and stories",
            "Basic analytics",
            "Standard support",
            "Custom themes"
        ],
        popular: false,
        icon: Star,
        color: "text-blue-500",
        bgGradient: "from-blue-500/10 to-cyan-500/10",
        borderColor: "border-blue-500/30"
    },
    {
        id: "quarterly",
        name: "Pro",
        duration: "3 Months",
        originalPrice: "$24.99",
        currentPrice: "$24.99",
        discount: "Save 17%",
        features: [
            "Different special sign beside your name",
            "Highlighted comments with special background",
            "More features coming soon",
            "Everything in Premium",
            "Advanced analytics",
            "Priority support",
            "Premium themes",
            "Advanced AI features"
        ],
        popular: true,
        icon: Crown,
        color: "text-purple-500",
        bgGradient: "from-purple-500/10 to-pink-500/10",
        borderColor: "border-purple-500/30"
    },
    {
        id: "semiannual",
        name: "Elite",
        duration: "6 Months",
        originalPrice: "$44.99",
        currentPrice: "$44.99",
        discount: "Save 25%",
        features: [
            "We are thinking of the best features for you",
            "Everything in Pro",
            "Advanced features",
            "Priority support",
            "Custom integrations",
            "Team management",
            "24/7 support"
        ],
        popular: false,
        icon: Trophy,
        color: "text-yellow-500",
        bgGradient: "from-yellow-500/10 to-orange-500/10",
        borderColor: "border-yellow-500/30"
    }
];

const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "zh", name: "中文", flag: "🇨🇳" }
];

export default function PricingPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30',
                    card: 'bg-white/90 backdrop-blur-sm shadow-lg border border-white/20',
                    text: 'text-gray-900',
                    textSecondary: 'text-gray-600',
                    border: 'border-gray-200/50',
                    hover: 'hover:bg-white/80 hover:shadow-xl transition-all duration-300',
                    gradient: 'from-blue-500/10 via-purple-500/10 to-pink-500/10',
                    accent: 'text-blue-600',
                    accentBg: 'bg-gradient-to-r from-blue-50 to-purple-50',
                    button: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
                    buttonSecondary: 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200/50 shadow-md hover:shadow-lg'
                };
            case 'super-light':
                return {
                    bg: 'bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20',
                    card: 'bg-white/95 backdrop-blur-sm shadow-xl border border-white/30',
                    text: 'text-gray-800',
                    textSecondary: 'text-gray-500',
                    border: 'border-gray-100/50',
                    hover: 'hover:bg-white/90 hover:shadow-2xl transition-all duration-300',
                    gradient: 'from-blue-400/10 via-purple-400/10 to-pink-400/10',
                    accent: 'text-blue-500',
                    accentBg: 'bg-gradient-to-r from-blue-50/80 to-purple-50/80',
                    button: 'bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl',
                    buttonSecondary: 'bg-white/90 hover:bg-white text-gray-600 border border-gray-100/50 shadow-lg hover:shadow-xl'
                };
            case 'dark':
                return {
                    bg: 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20',
                    card: 'bg-gray-800/90 backdrop-blur-sm shadow-2xl border border-gray-700/50',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700/50',
                    hover: 'hover:bg-gray-700/80 hover:shadow-2xl transition-all duration-300',
                    gradient: 'from-cyan-500/20 via-purple-500/20 to-pink-500/20',
                    accent: 'text-cyan-400',
                    accentBg: 'bg-gradient-to-r from-cyan-900/30 to-purple-900/30',
                    button: 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl hover:shadow-2xl',
                    buttonSecondary: 'bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600/50 shadow-lg hover:shadow-xl'
                };
            case 'super-dark':
                return {
                    bg: 'bg-gradient-to-br from-black via-gray-900/50 to-blue-900/20',
                    card: 'bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800/50',
                    text: 'text-gray-100',
                    textSecondary: 'text-gray-400',
                    border: 'border-gray-800/50',
                    hover: 'hover:bg-gray-800/90 hover:shadow-2xl transition-all duration-300',
                    gradient: 'from-cyan-400/20 via-purple-400/20 to-pink-400/20',
                    accent: 'text-cyan-300',
                    accentBg: 'bg-gradient-to-r from-cyan-900/40 to-purple-900/40',
                    button: 'bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black shadow-xl hover:shadow-2xl',
                    buttonSecondary: 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700/50 shadow-lg hover:shadow-xl'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    card: 'bg-gray-800',
                    text: 'text-white',
                    textSecondary: 'text-gray-300',
                    border: 'border-gray-700',
                    hover: 'hover:bg-gray-700',
                    gradient: 'from-cyan-500/20 to-purple-500/20',
                    accent: 'text-cyan-400',
                    accentBg: 'bg-cyan-900/20',
                    button: 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl hover:shadow-2xl',
                    buttonSecondary: 'bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600/50 shadow-lg hover:shadow-xl'
                };
        }
    };

    const themeClasses = getThemeClasses();

    const handleSubscribe = (tier: PricingTier) => {
        // TODO: Implement subscription logic
        console.log(`Subscribing to ${tier.name} plan`);
    };

    return (
        <div className={`min-h-screen ${themeClasses.bg} py-12 px-4`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Crown className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h1 className={`text-4xl md:text-6xl font-bold ${themeClasses.text} mb-4`}>
                            Choose Your Plan
                        </h1>
                        <p className={`text-xl ${themeClasses.textSecondary} max-w-3xl mx-auto`}>
                            Unlock the full potential of your social media presence with our premium features
                        </p>
                    </motion.div>

                    {/* Language Selector */}
                    <div className="relative inline-block">
                        <button
                            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${themeClasses.buttonSecondary} transition-all duration-300`}
                        >
                            <Globe className="w-4 h-4" />
                            <span>{languages.find(l => l.code === selectedLanguage)?.flag}</span>
                            <span>{languages.find(l => l.code === selectedLanguage)?.name}</span>
                        </button>

                        {showLanguageSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`absolute top-full mt-2 right-0 ${themeClasses.card} rounded-xl shadow-2xl border ${themeClasses.border} p-2 z-50 max-h-60 overflow-y-auto`}
                            >
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang.code);
                                            setShowLanguageSelector(false);
                                        }}
                                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:${themeClasses.hover} transition-colors ${
                                            selectedLanguage === lang.code ? themeClasses.accentBg : ''
                                        }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span className={`text-sm ${themeClasses.text}`}>{lang.name}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {pricingTiers.map((tier, index) => {
                        const Icon = tier.icon;
                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`relative ${themeClasses.card} rounded-3xl p-8 border ${tier.borderColor} ${
                                    tier.popular ? 'ring-2 ring-purple-500/50 scale-105' : ''
                                } transition-all duration-300 hover:scale-105`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                                            <Star className="w-4 h-4" />
                                            <span>Most Popular</span>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <div className={`w-16 h-16 ${tier.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                        <Icon className={`w-8 h-8 ${tier.color}`} />
                                    </div>
                                    <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                                        {tier.name}
                                    </h3>
                                    <p className={`${themeClasses.textSecondary} mb-4`}>
                                        {tier.duration}
                                    </p>
                                    <div className="mb-4">
                                        <div className={`text-4xl font-bold ${themeClasses.text} mb-2`}>
                                            {tier.currentPrice}
                                        </div>
                                        <div className={`text-sm ${themeClasses.textSecondary} line-through`}>
                                            {tier.originalPrice}
                                        </div>
                                        <div className={`text-sm font-medium ${tier.color}`}>
                                            {tier.discount}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {tier.features.map((feature, featureIndex) => (
                                        <motion.div
                                            key={featureIndex}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: featureIndex * 0.1 }}
                                            className="flex items-center space-x-3"
                                        >
                                            <div className={`w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                            <span className={`text-sm ${themeClasses.textSecondary}`}>
                                                {feature}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubscribe(tier)}
                                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                                        tier.popular
                                            ? `${themeClasses.button} shadow-xl`
                                            : `${themeClasses.buttonSecondary}`
                                    }`}
                                >
                                    {tier.currentPrice === "Coming Soon" ? "Coming Soon" : "Get Started"}
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Features Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className={`${themeClasses.card} rounded-3xl p-8`}
                >
                    <h2 className={`text-3xl font-bold ${themeClasses.text} text-center mb-8`}>
                        Why Choose Our Platform?
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Zap, title: "Lightning Fast", description: "Optimized for speed and performance" },
                            { icon: Shield, title: "Secure", description: "Enterprise-grade security and privacy" },
                            { icon: Sparkles, title: "AI Powered", description: "Advanced AI features and automation" },
                            { icon: Users, title: "Community", description: "Connect with like-minded creators" }
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className={`w-12 h-12 ${themeClasses.accentBg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                                        <Icon className={`w-6 h-6 ${themeClasses.accent}`} />
                                    </div>
                                    <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                                        {feature.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16"
                >
                    <h2 className={`text-3xl font-bold ${themeClasses.text} text-center mb-8`}>
                        Frequently Asked Questions
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                question: "Can I change my plan anytime?",
                                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
                            },
                            {
                                question: "Is there a free trial?",
                                answer: "Yes! All plans come with a 7-day free trial. No credit card required."
                            },
                            {
                                question: "What payment methods do you accept?",
                                answer: "We accept all major credit cards, PayPal, and cryptocurrency payments."
                            },
                            {
                                question: "Can I cancel anytime?",
                                answer: "Absolutely! You can cancel your subscription at any time with no cancellation fees."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`${themeClasses.card} rounded-xl p-6`}
                            >
                                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                                    {faq.question}
                                </h3>
                                <p className={`${themeClasses.textSecondary}`}>
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
