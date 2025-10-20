"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Zap, Star, Flame, ThumbsUp, Laugh, PartyPopper } from "lucide-react";

export default function LiveReactionsDemo() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-4xl w-full border border-white/20 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold text-white mb-4"
                    >
                        🎉 New Feature: Live Reactions! 🎉
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-white/80 max-w-2xl mx-auto"
                    >
                        Express yourself with animated emoji reactions that appear in real-time on posts!
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Features */}
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">✨ Features</h2>
                        
                        <div className="space-y-4">
                            {[
                                { icon: Heart, text: "7 Different Emoji Reactions", color: "text-red-400" },
                                { icon: Zap, text: "Real-time Animated Effects", color: "text-yellow-400" },
                                { icon: Star, text: "Live Reaction Analytics", color: "text-purple-400" },
                                { icon: Flame, text: "Instant Visual Feedback", color: "text-orange-400" },
                                { icon: ThumbsUp, text: "User Engagement Tracking", color: "text-blue-400" },
                                { icon: Laugh, text: "Interactive Reaction Picker", color: "text-green-400" },
                                { icon: PartyPopper, text: "Mobile Responsive Design", color: "text-pink-400" },
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 + index * 0.1 }}
                                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    <span className="text-white font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Demo Area */}
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="relative"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">🎮 Try It Out</h2>
                        
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                                    U
                                </div>
                                <h3 className="text-white font-semibold">Sample Post</h3>
                                <p className="text-white/60 text-sm">Check out this amazing new feature!</p>
                            </div>

                            {/* Demo Reactions */}
                            <div className="flex justify-center space-x-2 mb-4">
                                {["❤️", "👍", "😂", "🔥", "⭐", "⚡", "🎉"].map((emoji, index) => (
                                    <motion.button
                                        key={emoji}
                                        whileHover={{ scale: 1.2, y: -5 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all duration-200"
                                    >
                                        {emoji}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium"
                                >
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span>Live Reactions Active</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-center mt-8"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Start Reacting Now! 🚀
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
}
