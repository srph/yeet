import { useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { Head } from "@inertiajs/react";
import { useYeetMutation } from "../mutations";
import { useDownloadMeta } from "../queries";
import invariant from "tiny-invariant";
import { cn } from "@/lib/utils";
import { HomeDefault } from "./home-default";
import { HomeDownloadActions } from "./home-download-actions";
import { HomeDownloadTracking } from "./home-download-tracking";
import { HomeFooter } from "./home-footer";

// @TODO: Improve failed downloads
export default function Home() {
  const [url, setUrl] = useState("");

  const [format, setFormat] = useState<"mp3" | "mp4">("mp4");

  const {
    mutateAsync: yeet,
    data: yeetData,
    error: yeetError,
    isPending: isYeetPending,
    isError: isYeetError,
    reset: resetYeet,
  } = useYeetMutation();

  const { data: downloadMeta, refetch: refetchDownloadMeta } = useDownloadMeta(
    yeetData?.id,
  );

  // The inline players stream from download_url, which is presigned for an
  // hour and minted per serialization. A tab left open past that fails its
  // next range request; refetching the row mints a fresh link.
  //
  // Keyed on the URL that failed so a genuinely dead object (pruned, S3 down)
  // costs one retry rather than a request loop: the refetch returns the same
  // link, the player errors again, and this URL's turn is already spent.
  const spentSourceUrl = useRef<string | null>(null);

  const handleSourceError = () => {
    const failed = downloadMeta?.download_url;
    if (!failed || spentSourceUrl.current === failed) return;

    spentSourceUrl.current = failed;
    void refetchDownloadMeta();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      await yeet({ url, format });
    } catch {
      // Surfaced via yeetErrorMessage
    }
  };

  const handleRetry = async () => {
    try {
      await yeet({ url, format });
    } catch {
      // Surfaced via download tracking / yeetErrorMessage
    }
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

  const isTracking = Boolean(downloadMeta);

  return (
    // Every other page in this app opts back into scrolling the same way:
    // app.css sets body { overflow-hidden } globally, so a page's own root has
    // to be the scrollport. Home was the only one that never did, which is why
    // a tall spec sheet had nowhere to go and grew up under the logo instead.
    <div className="fixed inset-0 overflow-y-auto text-white">
      <Head title="Video Downloader" />

      {/* The logo floats over that scroll, so on mobile tracking it needs a
          ground of its own — without one the plate slides up behind bare
          text on its way past. */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-10 flex items-center justify-center gap-2.5 px-4 py-5",
          isTracking &&
            "bg-linear-to-b from-neutral-950 from-60% to-transparent pb-8 min-[880px]:bg-none min-[880px]:pb-5",
        )}
      >
        <img src="/logo.svg" alt="" width="444" height="457" className="h-7 w-auto" />
        <span className="font-sans text-xl font-semibold text-white">Yeet</span>
      </div>

      <div
        className={cn(
          "grid min-h-full justify-items-center px-4",
          isTracking
            ? // Top-aligned against a fixed pad on mobile rather than centred:
              // the plate then lands in the same place whatever the spec sheet
              // does underneath it. pb-44 is the docked CTA's full height —
              // 56px of scrim over two 44px buttons and their bottom pad — so
              // the last spec row can still be scrolled clear of the fade.
              "items-start pt-24 pb-44 min-[880px]:items-center min-[880px]:pt-20 min-[880px]:pb-16"
            : // 1fr over auto: the form centres in the space the footer leaves,
              // and the footer sits against the bottom of a short page without
              // being pinned there.
              "grid-rows-[1fr_auto] items-center pt-20 pb-5",
        )}
      >
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
                  onSourceError={handleSourceError}
                />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-120 min-w-0"
              >
                <HomeDefault
                  url={url}
                  format={format}
                  isYeetPending={isYeetPending}
                  yeetErrorMessage={isYeetError ? yeetError.message : null}
                  onUrlChange={setUrl}
                  onFormatChange={setFormat}
                  onSubmit={handleSubmit}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </MotionConfig>

        {/* The tracking screen has no footer at all: the bottom of the phone
            belongs to the dock, and the spec sheet is the whole point of the
            screen. */}
        {isTracking ? null : <HomeFooter className="mt-8" />}
      </div>

      {/* ── the docked CTA ── */}
      {/* Rendered here rather than inside the rail so it is nowhere near the
          transform the tracking screen animates in on: a transformed ancestor
          would become the containing block and this would stop being fixed to
          the viewport. The scrim is what lets the spec sheet run underneath —
          it fades into the page ground instead of colliding with the button.
          pointer-events stay off everywhere but the buttons themselves, so the
          fade band doesn't swallow taps on the rows showing through it. */}
      <AnimatePresence>
        {downloadMeta ? (
          <motion.div
            key="dock"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-neutral-950 from-55% to-transparent px-4 pt-14 pb-[max(1.25rem,env(safe-area-inset-bottom))] min-[880px]:hidden"
          >
            <div className="pointer-events-auto mx-auto w-[min(1000px,100vw_-_2rem)]">
              <HomeDownloadActions
                status={downloadMeta.status}
                onRetry={handleRetry}
                onDownload={handleDownload}
                onDownloadAnother={handleDownloadAnother}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
