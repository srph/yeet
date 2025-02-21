"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useTransform,
  useMotionValue,
} from "framer-motion";
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
                    {downloadMeta.status === "complete" ? (
                      <div className="text-4xl text-white">
                        <DecryptedText text="We're done" />{" "}
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="cooking" />
                        </span>
                      </div>
                    ) : downloadMeta.status === "processing" ? (
                      <div className="text-4xl text-white">
                        <DecryptedText text="Let us" />
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="cook" />
                        </span>
                      </div>
                    ) : (
                      <div className="text-4xl text-white">
                        <DecryptedText text="Your request is" />
                        <span className="font-playfair font-bold italic">
                          <DecryptedText text="queued" />
                        </span>
                      </div>
                    )}

                    <div className="text-4xl font-bold text-neutral-500">
                      Rick Astley - Never Gonna Give You Up
                    </div>

                    <div className="mb-2"></div>

                    {downloadMeta.downloadUrl ? (
                      <a
                        href={downloadMeta.downloadUrl}
                        target="_blank"
                        className="inline-flex h-[40px] rounded-full bg-white px-4 py-2 text-black"
                      >
                        Download
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="w-[320px]">
                  {downloadMeta.youtubeThumbnail ? (
                    <img
                      src={downloadMeta.youtubeThumbnail}
                      className={`aspect-video w-full ${
                        downloadMeta.status === "complete"
                          ? "animate-pulse"
                          : ""
                      } rounded-lg bg-neutral-800`}
                    />
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
                        className="overflow-hidden rounded-full bg-yellow-500 p-2 transition hover:bg-yellow-600"
                        initial="initial"
                        animate="initial"
                        whileHover="hover"
                      >
                        <FireEffect />
                        <motion.div
                          variants={{
                            initial: {
                              x: 0,
                            },
                            hover: {
                              x: [0, 32, -32, 0],
                              type: "spring",
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

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  life: number;
  opacity: number;
}

export const FireEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const createParticle = () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 10,
      y: canvas.height + 5,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 1,
      vy: -Math.random() * 2 - 2,
      life: 1,
      opacity: 1,
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // spawn new particles
      if (particles.current.length < 30) {
        particles.current.push(createParticle());
      }

      // update and draw particles
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98; // slight deceleration
        p.life -= 0.02;
        p.opacity = p.life;
        p.size *= 0.99;

        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.size
        );
        gradient.addColorStop(0, `rgba(255, 150, 50, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return p.life > 0;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      width={60}
      height={60}
    />
  );
};
