import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ArrowUpRightIcon } from "lucide-react";
import { SourceIcon } from "@/components/source-icon/source-icon";
import { formatFileSize } from "@/lib/fs";
import { SOURCES } from "@/sources";
import type { DownloadMeta } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

export const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
};

const formatElapsed = (value: number) => {
  const seconds = Math.max(0, Math.round(value));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/** Keep the extension visible, including when the source id is long. */
const truncateFileName = (name: string, head = 8) => {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return name.length > head + 3 ? `${name.slice(0, head)}...` : name;
  const base = name.slice(0, dot);
  return base.length > head ? `${base.slice(0, head)}...${name.slice(dot + 1)}` : name;
};

const formatExpiry = (iso: string) => {
  const remaining = new Date(iso).getTime() - Date.now();
  if (remaining <= 0) return "any moment now";
  const hours = Math.round(remaining / 3_600_000);
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
};

type NumberValue = { to: number; format: (value: number) => string };
type SpecRow = {
  id: string;
  label: string;
  value: ReactNode;
  number?: NumberValue;
  bright?: boolean;
  title?: string;
  uppercase?: boolean;
  stacked?: boolean;
};

const encrypt = (text: string) => [...text].map((char) =>
  char === " " ? char : String.fromCharCode(33 + Math.floor(Math.random() * 94)),
).join("");

/** Reserve the final width and keep the accessible text out of the scramble. */
function SpecText({
  text, reveal, delay = 0, scrambleExit = true,
}: {
  text: string;
  reveal: boolean;
  delay?: number;
  scrambleExit?: boolean;
}) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  const first = useRef(true);
  const display = useMotionValue(reveal && !reduce ? encrypt(text) : text);

  useEffect(() => {
    const initial = first.current;
    first.current = false;
    if (reduce || (initial && !reveal) || (!present && !scrambleExit)) {
      display.set(text);
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      let cursor = present ? 0 : text.length;
      const tick = () => {
        display.set(text.slice(0, cursor) + encrypt(text.slice(cursor)));
        if (present ? cursor >= text.length : cursor <= 0) clearInterval(interval);
        cursor += present ? 1 : -1;
      };
      tick();
      interval = setInterval(tick, present ? 28 : 20);
    }, present && initial ? delay * 1000 : 0);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, reveal, delay, reduce, present, scrambleExit, display]);

  return (
    <span className="inline-grid">
      <span className="invisible col-start-1 row-start-1" aria-hidden>{text}</span>
      <motion.span className="col-start-1 row-start-1" aria-hidden>{display}</motion.span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

function SpecNumber({ number, reveal, delay }: {
  number: NumberValue;
  reveal: boolean;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  const value = useMotionValue(reveal && !reduce ? 0 : number.to);
  const display = useTransform(value, number.format);

  useEffect(() => {
    if (reduce || !present) {
      value.set(number.to);
      return;
    }
    // D's 720ms cubic count-up. Polls do not replay it: the effect is keyed
    // to the numeric target, not the freshly deserialized metadata object.
    const controls = animate(value, number.to, {
      duration: 0.72,
      delay: reveal ? delay : 0,
      ease: (progress) => 1 - Math.pow(1 - progress, 3),
    });
    return () => controls.stop();
  }, [number.to, reveal, delay, reduce, present, value]);

  const final = number.format(number.to);
  return (
    <span className="inline-grid">
      <span className="invisible col-start-1 row-start-1" aria-hidden>{final}</span>
      <motion.span className="col-start-1 row-start-1 justify-self-end" aria-hidden>{display}</motion.span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

function AnimatedSpec({ row, entering, delay }: {
  row: SpecRow;
  entering: boolean;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  // Keep each row's arrival beat when polling or a sibling changes the list.
  const [entry] = useState({ reveal: entering, delay });
  const d = reduce ? 0 : entry.delay;
  const timing = (duration: number, delay = 0) => ({
    duration: reduce ? 0 : duration,
    delay: reduce ? 0 : delay,
    ease: EASE,
  });

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: "auto", transition: timing(0.24, d) }}
      exit={{ height: 0, transition: timing(0.26, 0.26) }}
      className="overflow-hidden"
    >
      <motion.div
        initial={{ opacity: row.stacked ? 0 : 1 }}
        animate={{ opacity: 1, transition: timing(0.3, d + 0.12) }}
        exit={{ opacity: 0, transition: timing(0.18, 0.16) }}
        className={row.stacked ? "pt-2 pb-1.5 text-xs" : "flex items-baseline gap-2 py-1.5 text-xs"}
      >
        <motion.dt
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: timing(0.16, d + 0.06) }}
          className={row.stacked ? "mb-1 text-neutral-600" : "font-mono whitespace-nowrap uppercase tracking-wide text-neutral-600"}
        >
          <SpecText text={row.label} reveal={false} scrambleExit={false} />
        </motion.dt>
        {!row.stacked && (
          <motion.span
            aria-hidden
            initial={{ transform: "translateY(-3px) scaleX(0)" }}
            animate={{ transform: "translateY(-3px) scaleX(1)", transition: timing(0.38, d + 0.08) }}
            exit={{ transform: "translateY(-3px) scaleX(0)", transition: timing(0.28) }}
            style={{ transformOrigin: present ? "left" : "right" }}
            className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--color-neutral-800)_0_2px,transparent_2px_5px)]"
          />
        )}
        <motion.dd
          title={row.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: timing(0.16, d + (row.number ? 0.09 : 0.22)) }}
          className={`${row.stacked ? "leading-snug break-all" : `whitespace-nowrap font-mono tracking-wide tabular-nums ${row.uppercase === false ? "normal-case" : "uppercase"}`} ${row.bright ? "text-white" : "text-neutral-400"}`}
        >
          {row.number ? (
            <SpecNumber number={row.number} reveal={entry.reveal} delay={d + 0.09} />
          ) : typeof row.value === "string" && !row.stacked ? (
            <SpecText text={row.value} reveal={entry.reveal} delay={d + 0.22} />
          ) : row.value}
        </motion.dd>
      </motion.div>
    </motion.div>
  );
}

export function HomeDownloadSpecs({ meta }: { meta: DownloadMeta }) {
  const complete = meta.status === "complete";
  const rows: SpecRow[] = [
    {
      id: "source", label: "Source", value: (
        <a
          href={meta.source_url} target="_blank" rel="noreferrer"
          className="group inline-flex max-w-full items-center gap-1.5 transition hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
        >
          <SourceIcon source={meta.source} className="size-3 shrink-0" />
          <span className="truncate">{SOURCES[meta.source].label}</span>
          <ArrowUpRightIcon className="size-2.5 shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
        </a>
      ),
    },
    { id: "format", label: "Format", value: meta.format.toUpperCase(), bright: true },
  ];

  if (meta.duration !== null) rows.push({
    id: "length", label: "Length", value: "",
    number: { to: meta.duration, format: formatDuration },
  });
  if (meta.fulfilled_at !== null) rows.push({
    id: "took", label: "Took", value: "",
    number: {
      to: Math.max(0, (Date.parse(meta.fulfilled_at) - Date.parse(meta.created_at)) / 1000),
      format: formatElapsed,
    },
  });
  if (complete && meta.storage_file_size !== null) {
    const [amount, unit] = formatFileSize(meta.storage_file_size).split(" ");
    rows.push({
      id: "size", label: "File size", value: "", bright: true,
      number: {
        to: Number(amount),
        // Hold the final unit throughout the count, just as D does.
        format: (value) => `${unit === "B" || unit === "KB" ? Math.round(value) : value.toFixed(1)} ${unit}`,
      },
    });
  }
  // Prune retains the filename on the tombstone. Like Size, it describes
  // a downloadable file, so retract it when that file is no longer ready.
  if (complete && meta.storage_file_name) rows.push({
    id: "name", label: "File name", value: truncateFileName(meta.storage_file_name),
    title: meta.storage_file_name, bright: true, uppercase: false,
  });
  if (meta.status === "failed") rows.push({
    id: "reason", label: "Reason", value: meta.reason ?? "Unknown error", stacked: true,
  });
  else rows.push({
    id: "expiry",
    label: meta.status === "expired" ? "Expired" : "Expires",
    value: meta.status === "expired" ? "link is gone"
      : meta.expires_at ? formatExpiry(meta.expires_at) : "7 days once ready",
  });

  const previous = useRef(new Set(rows.map((row) => row.id)));
  const entering = rows.filter((row) => !previous.current.has(row.id)).map((row) => row.id);
  useEffect(() => { previous.current = new Set(rows.map((row) => row.id)); });

  return (
    <AnimatePresence initial={false}>
      {rows.map((row) => (
        <AnimatedSpec
          key={row.id} row={row} entering={entering.includes(row.id)}
          delay={Math.max(0, entering.indexOf(row.id)) * 0.11}
        />
      ))}
    </AnimatePresence>
  );
}
