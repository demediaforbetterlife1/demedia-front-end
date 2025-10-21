"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface LiveReactionsProps {
  postId: number;
  isVisible: boolean;
  onReactionCount?: (count: number) => void;
}

const REACTIONS = ["❤️", "🔥", "🎉", "😂", "👍", "😮"];

export default function LiveReactions({postId,isVisible,onReactionCount}: LiveReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleReaction = (emoji: string) => {
    // زيادة العداد
    setCounts((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));

    // إنشاء reaction طاير في مكان عشوائي
    const newReaction: Reaction = {
      id: Date.now(),
      emoji,
      x: Math.random() * 100,
      y: Math.random() * 100,
    };

    setFloatingReactions((prev) => [...prev, newReaction]);

    // إزالة بعد الأنيميشن
    setTimeout(() => {
      setFloatingReactions((prev) =>
        prev.filter((r) => r.id !== newReaction.id)
      );
    }, 1200);
  };

  useEffect(() => {
    // محاكاة وصول تفاعل مباشر من مستخدمين آخرين
    const interval = setInterval(() => {
      const randomEmoji = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      handleReaction(randomEmoji);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-[#0d1117] to-[#161b22] rounded-2xl p-4 overflow-hidden shadow-lg">
      <h2 className="text-white text-xl font-semibold mb-3">
        Live Reactions 💬
      </h2>

      {/* أزرار الريأكشن */}
      <div className="flex gap-4">
        {REACTIONS.map((emoji) => (
          <motion.button
            key={emoji}
            whileTap={{ scale: 1.2 }}
            onClick={() => handleReaction(emoji)}
            className="text-2xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full"
          >
            {emoji} {counts[emoji] ? counts[emoji] : ""}
          </motion.button>
        ))}
      </div>

      {/* الريأكشنات الطايرة */}
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              y: -100 - Math.random() * 50,
              x: (Math.random() - 0.5) * 100,
              scale: 1.5,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute text-3xl pointer-events-none select-none"
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
  );
}