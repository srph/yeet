"use client";

import { useState } from "react";
import { ArrowDownToLineIcon, LoaderCircleIcon, PlayIcon } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useYeetMutation } from "./mutations";
import { useDownloadMeta } from "./queries";
import invariant from "tiny-invariant";
import { DecryptedText } from "./decrypted-text";

// @TODO: Download high quality audio & video; stitch via ffmpeg
// @TODO: Handle expired downloads - set expiry date
// @TODO: CRON job to delete expired downloads
// @TODO: Improve failed downloads
export default function Home() {
  const [url, setUrl] = useState("");

  const [format, setFormat] = useState<"mp3" | "mp4">("mp4");

  const {
    mutateAsync: yeet,
    data: yeetData,
    isPending: isYeetPending,
    isError: isYeetError,
  } = useYeetMutation();

  const {
    data: downloadMeta,
    isPending: isDownloadMetaPending,
    isError: isDownloadMetaError,
  } = useDownloadMeta(yeetData?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await yeet({ url, format });
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
              className="lg:w-[348px]"
            >
              <div className="font-playfair text-center text-[64px] font-bold italic leading-none text-white">
                Yeet
              </div>

              <div className="h-2" />

              <div className="text-center text-2xl leading-none text-neutral-500">
                Download videos from YouTube
              </div>

              <div className="h-4"></div>

              <form onSubmit={handleSubmit}>
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
                      className="relative overflow-hidden rounded-full bg-yellow-500 size-8"
                      initial="unhovered"
                      whileHover="hover"
                      disabled={isYeetPending}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {isYeetPending ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="animate-[spin_0.25s_linear_infinite]">
                              <LoaderCircleIcon className="h-4 w-4" />
                            </div>
                          </motion.div>
                        ) : (
                          <div className="grid translate-x-0 hover:translate-x-full transition-transform duration-150 eaes-out">
                            <div className="grid place-items-center [grid-area:1/1] size-full">
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
                            </div>

                            <div className="grid place-items-center [grid-area:1/1] -translate-x-full size-full">
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
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

                <div className="h-6">
                  <div className="h-2"></div>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isYeetError ? (
                      <>
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{
                            duration: 0.2,
                            type: "spring",
                            bounce: 0,
                          }}
                        >
                          <div className="text-center text-sm leading-none text-red-600">
                            Yikes, server hiccup. Maybe try again?
                          </div>
                        </motion.div>
                      </>
                    ) : null}
                  </AnimatePresence>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
