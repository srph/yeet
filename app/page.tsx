"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useYeetMutation } from "./mutations";
import { useDownloadMeta } from "./queries";

interface YeetResponse {
  downloadUrl: string;
  videoDetails: {
    title: string;
    duration: string;
    thumbnail: string;
  };
}

export default function Home() {
  const [url, setUrl] = useState("");

  const {
    mutateAsync: yeet,
    data: yeetData,
    isPending: isYeetPending,
  } = useYeetMutation();

  const downloadStatus = useDownloadMeta(yeetData?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await yeet(url);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          YEET
        </h1>
        <p className="text-zinc-400 text-center text-sm">
          Yeet videos off YouTube
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isYeetPending}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium 
                     hover:opacity-90 disabled:opacity-50 transition"
          >
            {isYeetPending ? "YEETING..." : "YEET!"}
          </motion.button>
        </form>

        <AnimatePresence>
          {downloadStatus?.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 10, rotate: 0 }}
              animate={{
                opacity: 1,
                y: [-10, 10],
                rotate: [-5, 5],
                transition: {
                  y: { repeat: Infinity, repeatType: "reverse", duration: 0.5 },
                  rotate: {
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 0.5,
                  },
                },
              }}
              exit={{ opacity: 0, y: 10 }}
              className="text-green-400 text-center font-bold"
            >
              YEET IN PROGRESS! 🚀
            </motion.div>
          )}

          {downloadStatus?.status === "failed" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{
                opacity: 1,
                x: [10, -10],
                transition: { x: { repeat: 3, duration: 0.2 } },
              }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-center"
            >
              Failed to yeet! Try again.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
