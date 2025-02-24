"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLineIcon, LoaderCircleIcon, PlayIcon } from "lucide-react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useTransform,
  useMotionValue,
} from "framer-motion";
import { useYeetMutation } from "./mutations";
import { useDownloadMeta } from "./queries";
import invariant from "tiny-invariant";

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

  const handleDownload = () => {
    const a = document.createElement("a");
    invariant(downloadMeta, "Download Metadata is required");
    invariant(downloadMeta.downloadUrl, "Download URL is required");
    invariant(downloadMeta.downloadFileName, "Download file name is required");
    a.href = downloadMeta.downloadUrl;
    a.download = downloadMeta.downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-900 p-4 text-white">
      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {downloadMeta ? (
            <motion.div
              key="queued"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <div className="flex gap-4">
                <div>
                  <div className="w-[520px] text-left">
                    {downloadMeta.status === "failed" ? (
                      <div className="text-4xl text-white">
                        <DecryptedText text="Task failed" />{" "}
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="successfully" />
                        </span>
                      </div>
                    ) : downloadMeta.status === "complete" ? (
                      <div className="text-4xl text-white">
                        <DecryptedText text="Dish is" />{" "}
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="served" />
                        </span>
                      </div>
                    ) : downloadMeta.status === "processing" ? (
                      <div className="text-4xl text-white">
                        <DecryptedText text="Let 'im" />{" "}
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="cook" />
                        </span>
                      </div>
                    ) : (
                      <div className="text-4xl text-white">
                        <DecryptedText text="POV: You're" />{" "}
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="in line" />
                        </span>
                      </div>
                    )}

                    <div className="h-2"></div>

                    <div className="text-4xl font-bold text-neutral-500">
                      {downloadMeta.youtubeTitle}
                    </div>

                    <div className="h-4"></div>

                    {downloadMeta.status !== "failed" ? (
                      <div>
                        <MotionConfig
                          transition={{
                            duration: 0.4,
                            type: "spring",
                            bounce: 0,
                          }}
                        >
                          <motion.button
                            layout
                            className={`inline-flex h-[40px] items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-black ${
                              downloadMeta.status !== "complete"
                                ? "cursor-not-allowed opacity-75"
                                : "opacity-100"
                            }`}
                            disabled={downloadMeta.status !== "complete"}
                            onClick={handleDownload}
                            aria-label={
                              downloadMeta.status === "complete"
                                ? "Download Now"
                                : "Processing Download"
                            }
                          >
                            <motion.div
                              style={{ clipPath: "inset(0 0 0 0)" }}
                              animate={{
                                width:
                                  downloadMeta.status !== "complete"
                                    ? 145
                                    : 101,
                              }}
                            >
                              <motion.div
                                className="flex gap-0.5"
                                animate={{
                                  x:
                                    downloadMeta.status !== "complete"
                                      ? 0
                                      : -78,
                                }}
                              >
                                <div>Processing</div>
                                <div>Download</div>
                                <div>Now</div>
                              </motion.div>
                            </motion.div>

                            <AnimatePresence mode="popLayout" initial={false}>
                              {downloadMeta.status !== "complete" ? (
                                <motion.div
                                  key="loading"
                                  initial={{
                                    opacity: 0,
                                    x: 8,
                                    filter: `blur(4px)`,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    filter: `blur(0px)`,
                                  }}
                                >
                                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="complete"
                                  initial={{
                                    opacity: 0,
                                    x: -8,
                                    filter: `blur(4px)`,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    filter: `blur(0px)`,
                                  }}
                                >
                                  <ArrowDownToLineIcon className="h-4 w-4" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </MotionConfig>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="relative w-[320px]">
                  {downloadMeta.youtubeThumbnail ? (
                    <>
                      <a
                        href={downloadMeta.youtubeUrl}
                        target="_blank"
                        className={`${
                          downloadMeta.status === "complete"
                            ? ""
                            : "animate-pulse"
                        }`}
                      >
                        <img
                          src={downloadMeta.youtubeThumbnail}
                          className={`aspect-video w-full rounded-lg bg-neutral-800`}
                        />
                      </a>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-red-700">
                          <PlayIcon className="size-6" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-800"></div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-4xl text-white">
                <span className="font-playfair font-bold italic">Yeet</span>
              </div>

              <div className="text-2xl text-neutral-500">
                Download videos from YouTube
              </div>

              <div className="h-4"></div>

              <div className="w-full max-w-md space-y-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtu.be/IBDhuu7CoMI"
                      className="w-full rounded-full border border-neutral-700 bg-neutral-800 py-3 pl-4 pr-[112px] text-sm font-medium outline-none transition placeholder:text-neutral-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    />
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormat(format === "mp3" ? "mp4" : "mp3")
                        }
                        className="inline-flex items-center rounded-full bg-neutral-700 px-3 py-1 text-xs font-bold transition hover:bg-neutral-600"
                      >
                        {format.toUpperCase()}
                      </button>

                      <motion.button
                        type="submit"
                        className="relative overflow-hidden rounded-full bg-yellow-500 p-2"
                        initial="initial"
                        animate={isYeetPending ? "animate" : "initial"}
                        whileHover={isYeetPending ? undefined : "hover"}
                        disabled={isYeetPending}
                      >
                        <AnimatePresence mode="popLayout">
                          {isYeetPending ? (
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.9 }}
                              transition={{ duration: 0.5 }}
                              className="animate-spin"
                            >
                              <LoaderCircleIcon className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            <motion.div
                              className="relative z-10"
                              variants={{
                                initial: {
                                  x: 0,
                                },
                                hover: {
                                  x: [0, 32, -32, 0],
                                  transition: {
                                    duration: 0.5,
                                    times: [0, 0.25, 0.25, 0.5],
                                  },
                                },
                              }}
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}

const encrypt = (input: string) => {
  return input
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : String.fromCharCode(33 + Math.floor(Math.random() * 94))
    )
    .join("");
};

// speed = how long it takes for each loop to complete
// characters per loop = 1
const DecryptedText = ({
  text,
  speed = 100,
}: {
  text: string;
  speed?: number;
}) => {
  const cursor = useMotionValue(0);

  useEffect(() => {
    cursor.set(0);

    const interval = setInterval(() => {
      if (cursor.get() === text.length) return;
      cursor.set(cursor.get() + 1);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const display = useTransform(cursor, (cursor) => {
    return text.slice(0, cursor) + encrypt(text.slice(cursor));
  });

  return <motion.span>{display}</motion.span>;
};
