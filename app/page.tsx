"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useYeetMutation } from "./mutations";
import { useDownloadMeta } from "./queries";

export default function Home() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp4");

  const {
    mutateAsync: yeet,
    data: yeetData,
    isPending: isYeetPending,
  } = useYeetMutation();

  const {
    data: downloadMeta,
    isPending: isDownloadMetaPending,
    isError: isDownloadMetaError,
  } = useDownloadMeta(yeetData?.id);

  console.log({ yeetData });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await yeet(url);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-4 text-white">
      <div className="text-4xl text-white">
        <span className="font-playfair font-bold italic">Yeet</span>
      </div>

      <div className="text-2xl text-neutral-500">
        Download videos from YouTube
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="w-full rounded-full border border-neutral-700 bg-neutral-800 py-3 pl-4 pr-[8.5rem] outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <button
                onClick={() => setFormat(format === "mp3" ? "mp4" : "mp3")}
                className="rounded-full bg-neutral-700 px-3 py-1 text-sm transition hover:bg-neutral-600"
              >
                {format.toUpperCase()}
              </button>
              <button
                onClick={() => {
                  /* handle submit */
                }}
                className="rounded-full bg-purple-500 p-2 transition hover:bg-purple-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        <AnimatePresence>
          {downloadMeta?.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 10, rotate: 0 }}
              animate={{
                opacity: 1,
                y: [-10, 10],
                rotate: [-5, 5],
                transition: {
                  y: {
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 0.5,
                  },
                  rotate: {
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 0.5,
                  },
                },
              }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center font-bold text-green-400"
            >
              YEET IN PROGRESS! 🚀
            </motion.div>
          )}

          {downloadMeta?.status === "failed" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{
                opacity: 1,
                x: [10, -10],
                transition: { x: { repeat: 3, duration: 0.2 } },
              }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400"
            >
              Failed to yeet! Try again.
            </motion.div>
          )}

          {downloadMeta?.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{
                opacity: 1,
                x: [10, -10],
                transition: { x: { repeat: 3, duration: 0.2 } },
              }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400"
            >
              Your video will be processed in a few.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex gap-4">
        <div>
          <div className="w-[520px] text-left">
            <div className="text-4xl text-white">
              You may now{" "}
              <span className="font-playfair font-bold italic">download</span>
            </div>

            <div className="text-4xl font-bold text-neutral-500">
              Rick Astley - Never Gonna Give You Up
            </div>

            <div className="mb-2"></div>

            <button className="inline-flex h-[40px] rounded-full bg-white px-4 py-2 text-black">
              Download
            </button>
          </div>
        </div>

        <div className="w-[320px]">
          <div className="aspect-video w-full rounded-lg bg-neutral-900"></div>
        </div>
      </div>
    </div>
  );
}
