"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import ReactionAnalytics from "@/components/ReactionAnalytics";

interface Reaction {
  id: string;
  emoji: string;
  userId: number;
  userName: string;
  timestamp: number;
  x: number;
  y: number;
}

interface LiveReactionsProps {
  postId: number;
  isVisible: boolean;
  onReactionCount?: (count: number) => void;
}

const REACTION_TYPES = [
  { emoji: "❤️", color: "text-red-500", bgColor: "bg-red-500/20" },
  { emoji: "👍", color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { emoji: "😂", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  { emoji: "🔥", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { emoji: "⭐", color: "text-purple-500", bgColor: "bg-purple-500/20" },
  { emoji: "⚡", color: "text-cyan-500", bgColor: "bg-cyan-500/20" },
  { emoji: "🎉", color: "text-pink-500", bgColor: "bg-pink-500/20" },
];

export default function LiveReactions({
  postId,
  isVisible,
  onReactionCount,
}: LiveReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sumCounts = (counts: Record<string, number> | undefined | null) =>
    Object.values(counts || {}).reduce((a, b) => a + (Number(b) || 0), 0);

  // ✅ Fetch Reactions from DB
  const fetchReactions = useCallback(async () => {
    if (!postId || !isVisible) return;
    try {
      const response = await apiFetch(`/api/posts/${postId}/reactions`);
      if (!response.ok) return console.error("Failed to fetch reactions:", response.status);

      const data = await response.json();
      const counts = data?.counts || {};
      const userReacts = data?.userReactions || {};

      const normalizedCounts: Record<string, number> = {};
      Object.entries(counts).forEach(([k, v]) => (normalizedCounts[k] = Number(v) || 0));

      setReactionCounts(normalizedCounts);
      setUserReactions(userReacts);
      onReactionCount?.(sumCounts(normalizedCounts));
    } catch (err) {
      console.error("Error fetching reactions:", err);
    }
  }, [postId, isVisible, onReactionCount]);

  useEffect(() => {
    fetchReactions();
    if (!isVisible) return;
    const interval = setInterval(fetchReactions, 3000);
    return () => clearInterval(interval);
  }, [fetchReactions, isVisible]);

  // ❤️ Add Reaction
  const addReaction = async (emoji: string) => {
    if (!user || !postId || isLoading) return;
    setIsLoading(true);

    try {
      const temp: Reaction = {
        id: crypto.randomUUID(),
        emoji,
        userId: Number(user.id),
        userName: user.name || "You",
        timestamp: Date.now(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
      };
      setReactions((prev) => [...prev, temp]);

      const response = await apiFetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        const counts = data?.counts || {};
        const normalized: Record<string, number> = {};
        Object.entries(counts).forEach(([k, v]) => (normalized[k] = Number(v) || 0));

        setReactionCounts(normalized);
        setUserReactions((prev) => ({ ...prev, [emoji]: true }));
        onReactionCount?.(sumCounts(normalized));
      }

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== temp.id));
      }, 2500);
    } catch (err) {
      console.error("Error adding reaction:", err);
    } finally {
      setIsLoading(false);
      setShowReactionPicker(false);
    }
  };

  // 💔 Remove Reaction
  const removeReaction = async (emoji: string) => {
    if (!user || !postId || isLoading) return;
    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/posts/${postId}/reactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        const counts = data?.counts || {};
        const normalized: Record<string, number> = {};
        Object.entries(counts).forEach(([k, v]) => (normalized[k] = Number(v) || 0));

        setReactionCounts(normalized);
        setUserReactions((prev) => ({ ...prev, [emoji]: false }));
        onReactionCount?.(sumCounts(normalized));
      }
    } catch (err) {
      console.error("Error removing reaction:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ⚠️ Don't render hidden posts
  if (!isVisible) return null;

  return (
    <div className="relative">
      {/* ✨ Flying Reactions */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
        style={{ minHeight: "200px" }}
      >
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.5, x: `${r.x}%`, y: `${r.y}%` }}
              animate={{
                opacity: 1,
                scale: 1.2,
                y: `${r.y - 20}%`,
                rotate: [0, -10, 10, -5, 0],
              }}
              exit={{ opacity: 0, scale: 0.5, y: `${r.y - 40}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute text-2xl pointer-events-none select-none"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 🧡 Reaction Controls */}
      <div className="absolute bottom-4 right-4 z-20">
        {/* Existing Counts */}
        {Object.entries(reactionCounts)
          .filter(([_, c]) => Number(c) > 0)
          .map(([emoji, count]) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                userReactions[emoji] ? removeReaction(emoji) : addReaction(emoji)
              }
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${
                userReactions[emoji]
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-white/80 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{emoji}</span>
              <span>{Number(count)}</span>
            </motion.button>
          ))}

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-12 right-0 bg-white rounded-2xl p-3 shadow-2xl border"
            >
              <div className="flex space-x-2">
                {REACTION_TYPES.map((r) => (
                  <motion.button
                    key={r.emoji}
                    whileHover={{ scale: 1.2, y: -4 }}
                    onClick={() => addReaction(r.emoji)}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      userReactions[r.emoji]
                        ? "bg-blue-500 text-white"
                        : `${r.bgColor} ${r.color}`
                    }`}
                  >
                    {r.emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics */}
        {Object.keys(reactionCounts).length > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAnalytics(true)}
            className="w-10 h-10 mb-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg"
            title="View Analytics"
          >
            <BarChart3 size={16} />
          </motion.button>
        )}

        {/* Main ❤️ Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowReactionPicker((p) => !p)}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-purple-600"
          }`}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ❤️
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Live Indicator */}
      <div className="absolute top-4 left-4 z-20">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-lg"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>Live Reactions</span>
        </motion.div>
      </div>

      {/* Analytics Modal */}
      <ReactionAnalytics
        postId={postId}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
}