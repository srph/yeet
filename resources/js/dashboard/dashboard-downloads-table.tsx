import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { DownloadStatus } from "@/components/download-status/download-status";
import { SourceIcon } from "@/components/source-icon/source-icon";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/toggle-group/toggle-group";
import { Tooltip, TooltipProvider } from "@/components/tooltip/tooltip";
import { useNow } from "@/hooks/use-now";
import { isSource, SOURCES } from "@/sources";
import { isDownloadStatus } from "@/types";

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

const gmt8Parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
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

/** "(GMT+8) dd m, y h:mm:ss AM/PM" — mono zone label, sans for the timestamp. */
function formatGmt8Tooltip(iso: string) {
  const parts = Object.fromEntries(
    gmt8Parts
      .formatToParts(new Date(iso))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return (
    <>
      <span className="font-mono">(GMT+8)</span>{" "}
      <span>
        {parts.day} {parts.month}, {parts.year} {parts.hour}:{parts.minute}:
        {parts.second} {parts.dayPeriod}
      </span>
    </>
  );
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

function matchesFilter(status: string, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "active") {
    return status === "queued" || status === "probing" || status === "processing";
  }
  return status === filter;
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
    <TooltipProvider>
      <section className="min-w-0">
        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3 px-0.5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em]">
            Recently
          </h3>
          <ToggleGroup
            value={[filter]}
            // Unpressing the active filter would empty the group and leave
            // nothing to anchor the pill to, so hold the last one.
            onValueChange={([next]) => next && setFilter(next)}
            aria-label="Filter downloads"
          >
            {FILTERS.map((chip) => (
              <ToggleGroupItem key={chip.id} value={chip.id}>
                {chip.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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
              <table className="w-full min-w-180 table-fixed border-collapse">
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
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-neutral-600">
                      Status
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-neutral-600">
                      Format
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-neutral-600">
                      Title
                    </th>
                    <th className="px-1 py-2.5 text-left text-xs font-medium text-neutral-600">
                      Source
                    </th>
                    <th className="px-1 py-2.5 text-right text-xs font-medium text-neutral-600">
                      Length
                    </th>
                    <th className="px-1 py-2.5 text-right text-xs font-medium text-neutral-600">
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
                      // Rows come off Inertia as loose strings, so narrow
                      // before indexing rather than trusting the column.
                      const source = isSource(download.source)
                        ? SOURCES[download.source]
                        : null;

                      return (
                        <tr
                          key={download.id}
                          className="border-b border-neutral-800/60 last:border-b-0 hover:bg-white/[0.015]"
                        >
                          <td className="overflow-hidden px-1 py-3 align-middle whitespace-nowrap">
                            {isDownloadStatus(download.status) ? (
                              <DownloadStatus status={download.status} />
                            ) : (
                              // A value the frontend doesn't know about is
                              // worth showing verbatim rather than coercing
                              // into the nearest tone.
                              <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-neutral-500 uppercase">
                                {download.status}
                              </span>
                            )}
                          </td>
                          <td className="overflow-hidden px-1 py-3 align-middle whitespace-nowrap">
                            {/* Same height, radius and face as the status
                                tag beside it, one step quieter — the row
                                reads as one system rather than two widgets. */}
                            <span className="inline-flex h-[22px] items-center rounded-[4px] bg-neutral-500/14 px-2 font-mono text-[10px] font-bold tracking-[0.12em] text-neutral-400">
                              {download.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="overflow-hidden px-1 py-3 align-middle">
                            <span className="block truncate text-[13.5px] font-semibold tracking-[-0.02em]">
                              {download.status === "complete" &&
                              download.download_url ? (
                                <a
                                  href={download.download_url}
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
                                className={`grid size-4 shrink-0 place-items-center rounded-[5px] text-white ${source?.badge ?? "bg-neutral-800"}`}
                              >
                                {isSource(download.source) && (
                                  <SourceIcon
                                    source={download.source}
                                    variant="badge"
                                    className="size-2.5"
                                  />
                                )}
                              </span>
                              <span className="truncate">
                                {source?.host ?? download.source}
                              </span>
                              <ArrowUpRight
                                size={12}
                                strokeWidth={2.25}
                                className="shrink-0 text-blue-200 opacity-0 group-hover:opacity-100"
                              />
                            </a>
                          </td>
                          <td className="overflow-hidden px-1 py-3 text-right align-middle font-mono text-[12.5px] whitespace-nowrap tabular-nums text-neutral-300">
                            {formatDuration(download.duration)}
                          </td>
                          <td className="overflow-hidden px-1 py-3 text-right align-middle text-xs whitespace-nowrap tabular-nums text-neutral-600">
                            <Tooltip content={formatGmt8Tooltip(download.created_at)}>
                              <span className="cursor-default">
                                {formatCreatedAgo(download.created_at, now)}
                              </span>
                            </Tooltip>
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
    </TooltipProvider>
  );
}
