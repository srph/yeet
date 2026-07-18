import { useState } from "react";
import { LoaderCircleIcon, MoveUpRightIcon } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { Head } from "@inertiajs/react";
import { useYeetMutation } from "../mutations";
import { useDownloadMeta } from "../queries";
import invariant from "tiny-invariant";
import { DownloadStatus } from "../download-status";

const snappy = [0.19, 1, 0.22, 1];

const bezier = () => {
  return `cubic-bezier(${snappy.join(",")})`;
};

// @TODO: Improve failed downloads
export default function Home() {
  const [url, setUrl] = useState("");

  const [format, setFormat] = useState<"mp3" | "mp4">("mp4");

  const {
    mutateAsync: yeet,
    data: yeetData,
    isPending: isYeetPending,
    isError: isYeetError,
    reset,
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

  const handleRetry = async () => {
    await yeet({ url, format });
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    invariant(downloadMeta, "Download Metadata is required");
    invariant(downloadMeta.download_url, "Download URL is required");
    invariant(downloadMeta.storage_file_name, "Download file name is required");
    a.href = downloadMeta.download_url;
    a.download = downloadMeta.storage_file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid place-items-center min-h-screen p-4 text-white">
      <Head title="Video Downloader" />

      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {downloadMeta ? (
            <motion.div
              key="queued"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <DownloadStatus
                meta={downloadMeta}
                onRetry={handleRetry}
                onDownload={handleDownload}
              />
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
                Download videos from YouTube, X &amp; Facebook
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
                            key="pending"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="size-full grid place-items-center"
                          >
                            <div className="animate-[spin_0.25s_linear_infinite]">
                              <LoaderCircleIcon className="h-4 w-4" />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="default"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="size-full grid place-items-center"
                          >
                            <div className="grid size-full translate-x-0 hover:translate-x-full transition-transform duration-150 eaes-out">
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

                <div className="h-6">
                  <div className="h-2"></div>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isYeetError ? (
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
                    ) : null}
                  </AnimatePresence>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>

      <div className="fixed inset-x-0 bottom-0 grid place-items-center">
        <div className="flex items-center justify-between w-full max-w-[720px] py-2 border-t border-neutral-900">
          <span className="text-center text-sm leading-none text-neutral-700">
            Crafted by Kier Borromeo
          </span>

          <div className="flex gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group flex items-center text-center text-sm leading-none text-neutral-700"
                target="_blank"
              >
                {link.label}
                <div className="w-3 pl-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150 ease-out">
                  <MoveUpRightIcon className="size-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const links = [
  {
    label: "GitHub",
    href: "https://github.com/srph",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/_srph",
  },
];
