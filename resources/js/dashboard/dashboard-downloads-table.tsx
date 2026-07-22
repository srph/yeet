import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/hooks/use-now";

type DownloadRow = {
  id: string;
  source: string;
  source_url: string;
  source_title: string;
  format: "mp3" | "mp4";
  status: string;
  reason: string | null;
  duration: number | null;
  download_url: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

type Filter = "all" | "active" | "complete" | "failed";

const STATUS_TONE: Record<string, { text: string; dot: string }> = {
  complete: { text: "text-blue-200", dot: "bg-blue-200" },
  failed: { text: "text-red-400", dot: "bg-red-400" },
  processing: { text: "text-violet-300", dot: "bg-violet-300" },
  probing: { text: "text-sky-300", dot: "bg-sky-300" },
  queued: { text: "text-neutral-400", dot: "bg-neutral-400" },
  expired: { text: "text-neutral-600", dot: "bg-neutral-600" },
};

const SOURCE_BADGE: Record<string, string> = {
  youtube: "bg-red-700",
  x: "bg-neutral-950 border border-neutral-700",
  facebook: "bg-blue-600",
  tiktok: "bg-rose-600",
  douyin: "bg-orange-600",
};

const SOURCE_HOST: Record<string, string> = {
  youtube: "youtube.com",
  x: "x.com",
  facebook: "facebook.com",
  tiktok: "tiktok.com",
  douyin: "douyin.com",
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "complete", label: "Complete" },
  { id: "failed", label: "Failed" },
];

const COLUMN_WIDTHS = {
  status: 110,
  format: 66,
  source: 128,
  length: 56,
  created: 100,
} as const;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const gmt8Parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

function formatCreatedAgo(iso: string, now: number) {
  const elapsed = Math.max(0, now - new Date(iso).getTime());

  if (elapsed >= YEAR) return plural(Math.floor(elapsed / YEAR), "year");
  if (elapsed >= MONTH) return plural(Math.floor(elapsed / MONTH), "month");
  if (elapsed >= DAY) return plural(Math.floor(elapsed / DAY), "day");
  if (elapsed >= HOUR) return plural(Math.floor(elapsed / HOUR), "hour");
  if (elapsed >= MINUTE) return plural(Math.floor(elapsed / MINUTE), "minute");
  return plural(Math.floor(elapsed / SECOND), "second");
}

/** "(GMT + 8) dd m, y hh:mm:ss" */
function formatGmt8Tooltip(iso: string) {
  const parts = Object.fromEntries(
    gmt8Parts
      .formatToParts(new Date(iso))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `(GMT + 8) ${parts.day} ${parts.month}, ${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";

  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

function formatRelative(from: number, now: number) {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function matchesFilter(status: string, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "active") {
    return status === "queued" || status === "probing" || status === "processing";
  }
  return status === filter;
}

function SourceIcon({ source }: { source: string }) {
  if (source === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5" aria-hidden>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
      </svg>
    );
  }

  if (source === "x") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5" aria-hidden>
        <path d="M18.2 2.2h3.4l-7.4 8.5L23 21.8h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2.2h7l4.8 6.4 5.4-6.4Zm-1.2 17.6h1.9L7.1 4.1H5.1l11.9 15.7Z" />
      </svg>
    );
  }

  return null;
}

export function DashboardDownloadsTable({
  downloads,
}: {
  downloads: DownloadRow[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [loadedAt] = useState(() => Date.now());
  const now = useNow();

  const rows = downloads.filter((download) =>
    matchesFilter(download.status, filter),
  );

  return (
    <section className="min-w-0">
      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3 px-0.5">
        <h3 className="text-[15px] font-semibold tracking-[-0.02em]">
          Recently
        </h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter downloads">
          {FILTERS.map((chip) => {
            const on = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                aria-pressed={on}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold tracking-[-0.01em] transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200 ${
                  on
                    ? "border-transparent bg-neutral-800 text-white"
                    : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="grid min-h-48 place-items-center text-center">
          <div>
            <p className="font-medium">No downloads yet</p>
            <p className="mt-1 text-sm text-neutral-600">
              New requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse">
              <colgroup>
                <col style={{ width: COLUMN_WIDTHS.status }} />
                <col style={{ width: COLUMN_WIDTHS.format }} />
                <col />
                <col style={{ width: COLUMN_WIDTHS.source }} />
                <col style={{ width: COLUMN_WIDTHS.length }} />
                <col style={{ width: COLUMN_WIDTHS.created }} />
              </colgroup>
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-1 py-2.5 text-left text-[11px] font-medium text-neutral-600">
                    Status
                  </th>
                  <th className="px-1 py-2.5 text-left text-[11px] font-medium text-neutral-600">
                    Format
                  </th>
                  <th className="px-1 py-2.5 text-left text-[11px] font-medium text-neutral-600">
                    Title
                  </th>
                  <th className="px-1 py-2.5 text-left text-[11px] font-medium text-neutral-600">
                    Source
                  </th>
                  <th className="px-1 py-2.5 text-right text-[11px] font-medium text-neutral-600">
                    Length
                  </th>
                  <th className="px-1 py-2.5 text-right text-[11px] font-medium text-neutral-600">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-1 py-10 text-center text-sm text-neutral-600"
                    >
                      No downloads match this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((download) => {
                    const tone =
                      STATUS_TONE[download.status] ?? STATUS_TONE.expired;

                    return (
                      <tr
                        key={download.id}
                        className="border-b border-neutral-800/60 last:border-b-0 hover:bg-white/[0.015]"
                      >
                        <td className="overflow-hidden px-1 py-3 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 text-[12.5px] font-semibold ${tone.text}`}
                          >
                            <span
                              className={`size-[7px] shrink-0 rounded-full ${tone.dot}`}
                              aria-hidden
                            />
                            {statusLabel(download.status)}
                          </span>
                        </td>
                        <td className="overflow-hidden px-1 py-3 align-middle whitespace-nowrap">
                          <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-[10.5px] font-bold text-neutral-300">
                            {download.format.toUpperCase()}
                          </span>
                        </td>
                        <td className="overflow-hidden px-1 py-3 align-middle">
                          <span className="block truncate text-[13.5px] font-semibold tracking-[-0.02em]">
                            {download.status === "complete" &&
                            download.download_url ? (
                              <a
                                href={download.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="transition hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                              >
                                {download.source_title}
                              </a>
                            ) : (
                              download.source_title
                            )}
                            {download.reason ? (
                              <>
                                {" "}
                                <span className="font-normal text-neutral-600">
                                  ·
                                </span>{" "}
                                <span className="font-normal text-red-400">
                                  {download.reason}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </td>
                        <td className="overflow-hidden px-1 py-3 align-middle whitespace-nowrap">
                          <a
                            href={download.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex max-w-full items-center gap-1.5 text-xs text-neutral-500 transition hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                          >
                            <span
                              className={`grid size-4 shrink-0 place-items-center rounded-[5px] text-white ${SOURCE_BADGE[download.source] ?? "bg-neutral-800"}`}
                            >
                              <SourceIcon source={download.source} />
                            </span>
                            <span className="truncate">
                              {SOURCE_HOST[download.source] ?? download.source}
                            </span>
                            <ArrowUpRight
                              size={12}
                              strokeWidth={2.25}
                              className="shrink-0 text-blue-200 opacity-0 group-hover:opacity-100"
                            />
                          </a>
                        </td>
                        <td className="overflow-hidden px-1 py-3 text-right align-middle text-[12.5px] whitespace-nowrap tabular-nums text-neutral-300">
                          {formatDuration(download.duration)}
                        </td>
                        <td className="overflow-hidden px-1 py-3 text-right align-middle text-xs whitespace-nowrap tabular-nums text-neutral-600">
                          <span
                            className="cursor-default"
                            title={formatGmt8Tooltip(download.created_at)}
                          >
                            {formatCreatedAgo(download.created_at, now)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-neutral-800 px-1 pt-3 text-xs text-neutral-600">
            <span>
              <span className="font-semibold text-neutral-300">
                {downloads.length}
              </span>{" "}
              total downloads
            </span>
            <span className="tabular-nums">
              Last updated {formatRelative(loadedAt, now)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
