import { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HomeDefaultRolldown } from "./home-default-rolldown";
import { HomeDefaultSourceTags } from "./home-default-source-tags";

export function HomeDefault({
  url,
  format,
  isYeetPending,
  yeetErrorMessage,
  onUrlChange,
  onFormatChange,
  onSubmit,
}: {
  url: string;
  format: "mp3" | "mp4";
  isYeetPending: boolean;
  yeetErrorMessage: string | null;
  onUrlChange: (url: string) => void;
  onFormatChange: (format: "mp3" | "mp4") => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  // Keep last message mounted so 1fr → 0fr has content to collapse.
  const [displayedError, setDisplayedError] = useState(yeetErrorMessage);
  if (yeetErrorMessage !== null && yeetErrorMessage !== displayedError) {
    setDisplayedError(yeetErrorMessage);
  }

  return (
    <>
      <HomeDefaultRolldown />

      <div className="h-4"></div>

      <form onSubmit={onSubmit}>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://youtu.be/IBDhuu7CoMI"
            className="w-full rounded-full border border-neutral-700 bg-neutral-800 py-3 pl-4 pr-[112px] text-sm font-medium outline-none transition placeholder:text-neutral-500 focus:border-blue-200 focus:ring-1 focus:ring-blue-200"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => onFormatChange(format === "mp3" ? "mp4" : "mp3")}
              className="inline-flex items-center rounded-full bg-neutral-700 px-3 py-1 text-xs font-bold transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
            >
              {format.toUpperCase()}
            </button>

            <motion.button
              type="submit"
              className="relative overflow-hidden rounded-full bg-blue-200 text-blue-950 size-8 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
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

        <motion.div
          initial={false}
          animate={{ gridTemplateRows: yeetErrorMessage ? "1fr" : "0fr" }}
          transition={{ duration: 0.2, type: "spring", bounce: 0 }}
          onAnimationComplete={() => {
            if (!yeetErrorMessage) setDisplayedError(null);
          }}
          className="grid"
        >
          <div className="min-h-0 overflow-hidden">
            <div className="h-2"></div>
            <motion.div
              initial={false}
              animate={{
                opacity: yeetErrorMessage ? 1 : 0,
                y: yeetErrorMessage ? 0 : -8,
              }}
              transition={{ duration: 0.2, type: "spring", bounce: 0 }}
            >
              <div className="text-center text-sm leading-none text-red-600">
                {displayedError}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </form>

      <div className="h-4"></div>

      <HomeDefaultSourceTags onSelect={onUrlChange} />
    </>
  );
}
