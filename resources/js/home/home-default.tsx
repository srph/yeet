import { LoaderCircleIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HomeDefaultRolldown } from "./home-default-rolldown";

export function HomeDefault({
  url,
  format,
  isYeetPending,
  isYeetError,
  onUrlChange,
  onFormatChange,
  onSubmit,
}: {
  url: string;
  format: "mp3" | "mp4";
  isYeetPending: boolean;
  isYeetError: boolean;
  onUrlChange: (url: string) => void;
  onFormatChange: (format: "mp3" | "mp4") => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <div className="font-playfair text-center text-[64px] font-bold italic leading-none text-white">
        Yeet
      </div>

      <div className="h-2" />

      <HomeDefaultRolldown />

      <div className="h-4"></div>

      <form onSubmit={onSubmit}>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://youtu.be/IBDhuu7CoMI"
            className="w-full rounded-full border border-neutral-700 bg-neutral-800 py-3 pl-4 pr-[112px] text-sm font-medium outline-none transition placeholder:text-neutral-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => onFormatChange(format === "mp3" ? "mp4" : "mp3")}
              className="inline-flex items-center rounded-full bg-neutral-700 px-3 py-1 text-xs font-bold transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-yellow-500"
            >
              {format.toUpperCase()}
            </button>

            <motion.button
              type="submit"
              className="relative overflow-hidden rounded-full bg-yellow-500 size-8 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-yellow-500"
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
    </>
  );
}
