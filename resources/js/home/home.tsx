import { Fragment, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { Head } from "@inertiajs/react";
import { useYeetMutation } from "../mutations";
import { useDownloadMeta } from "../queries";
import invariant from "tiny-invariant";
import { HomeDefault } from "./home-default";
import { HomeDownloadTracking } from "./home-download-tracking";

// @TODO: Improve failed downloads
export default function Home() {
  const [url, setUrl] = useState("");

  const [format, setFormat] = useState<"mp3" | "mp4">("mp4");

  const {
    mutateAsync: yeet,
    data: yeetData,
    isPending: isYeetPending,
    isError: isYeetError,
    reset: resetYeet,
  } = useYeetMutation();

  const { data: downloadMeta } = useDownloadMeta(yeetData?.id);

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

  const handleDownloadAnother = () => {
    resetYeet();
    setUrl("");
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 pt-20 pb-16 text-white">
      <Head title="Video Downloader" />

      <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-center gap-2.5 px-4 py-5">
        <img src="/logo.svg" alt="" className="h-7 w-auto" />
        <span className="font-sans text-xl font-semibold text-white">Yeet</span>
      </div>

      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {downloadMeta ? (
            <motion.div
              key="queued"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <HomeDownloadTracking
                meta={downloadMeta}
                onRetry={handleRetry}
                onDownload={handleDownload}
                onDownloadAnother={handleDownloadAnother}
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
              <HomeDefault
                url={url}
                format={format}
                isYeetPending={isYeetPending}
                isYeetError={isYeetError}
                onUrlChange={setUrl}
                onFormatChange={setFormat}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>

      <div className="fixed inset-x-0 bottom-0 grid place-items-center px-4 py-5">
        <div className="flex w-full items-center justify-between gap-6 text-sm leading-none sm:w-auto sm:justify-center">
          <span className="text-neutral-600">
            Crafted by{" "}
            <a
              href="https://kierb.com"
              className="font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
              target="_blank"
            >
              Kier Borromeo
            </a>
          </span>
          <div className="flex items-center gap-2.5">
            {links.map((link, i) => (
              <Fragment key={link.label}>
                {i > 0 && (
                  <span className="size-0.5 shrink-0 rounded-full bg-neutral-800" />
                )}
                <a
                  href={link.href}
                  className="text-neutral-600 transition-colors duration-150 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                  target="_blank"
                >
                  {link.label}
                </a>
              </Fragment>
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
