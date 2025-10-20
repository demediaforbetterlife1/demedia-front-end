"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ThumbsUp,
  Laugh,
  Flame,
  Star,
  Zap,
  PartyPopper,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import ReactionAnalytics from "./ReactionAnalytics";

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
  { emoji: "❤️", icon: Heart, color: "text-red-500", bgColor: "bg-red-500/20" },
  { emoji: "👍", icon: ThumbsUp, color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { emoji: "😂", icon: Laugh, color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  { emoji: "🔥", icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { emoji: "⭐", icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/20" },
  { emoji: "⚡", icon: Zap, color: "text-cyan-500", bgColor: "bg-cyan-500/20" },
  { emoji: "🎉", icon: PartyPopper, color: "text-pink-500", bgColor: "bg-pink-500/20" },
];

export default function LiveReactions({ postId, isVisible, onReactionCount }: LiveReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // helper to sum counts safely
  const sumCounts = (counts: Record<string, number> | undefined | null) =>
    Object.values(counts || {}).map((v) => Number(v) || 0).reduce((a, b) => a + b, 0);

  const fetchReactions = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/posts/${postId}/reactions`);
      if (response.ok) {
        const data = await response.json();

        // normalize counts -> ensure numbers
        const rawCounts: Record<string, unknown> = data.counts || {};
        const normalizedCounts: Record<string, number> = {};
        Object.entries(rawCounts).forEach(([k, v]) => {
          normalizedCounts[k] = Number(v) || 0;
        });

        setReactionCounts(normalizedCounts);
        setUserReactions((data.userReactions && typeof data.userReactions === "object") ? data.userReactions : {});

        // notify parent