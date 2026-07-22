import { Radio } from "lucide-react";

type DownloadRow = {
  id: string;
  source: string;
  source_title: string;
  format: "mp3" | "mp4";
  status: string;
  reason: string | null;
  duration: number | null;
  fulfilled_at: string | null;
  created_at: string;
};

const statusTone: Record<string, string> = {
  complete: "bg-emerald-300 text-emerald-950",
  failed: "bg-rose-300 text-rose-950",
  expired: "bg-neutral-700 text-neutral-300",
  queued: "bg-amber-200 text-amber-950",
  probing: "bg-sky-200 text-sky-950",
  processing: "bg-violet-200 text-violet-950",
};

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  return value ? dateTime.format(new Date(value)) : "—";
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function DashboardDownloadsTable({
  downloads,
}: {
  downloads: DownloadRow[];
}) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#697386] uppercase">
            Live ledger
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Latest downloads
          </h2>
        </div>
        <p className="font-mono text-xs text-[#697386]">
          {downloads.length} records
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e1118]">
        {downloads.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <Radio className="mx-auto mb-3 text-[#697386]" size={22} />
              <p className="font-medium">No downloads yet</p>
              <p className="mt-1 text-sm text-[#697386]">
                New requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {downloads.map((download) => (
              <article
                key={download.id}
                className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[86px_minmax(0,1fr)_90px_130px] sm:items-center sm:px-5"
              >
                <div className="flex items-center gap-2 sm:block">
                  <span
                    className={`inline-flex rounded px-2 py-1 font-mono text-[10px] font-bold tracking-wide uppercase ${statusTone[download.status] ?? statusTone.expired}`}
                  >
                    {download.status}
                  </span>
                  <span className="font-mono text-[10px] text-[#697386] sm:mt-2 sm:block">
                    {download.format.toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#e9edf4]">
                    {download.source_title}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-[#697386]">
                    {download.source} · {download.id}
                  </p>
                  {download.reason ? (
                    <p className="mt-1 truncate text-xs text-rose-300">
                      {download.reason}
                    </p>
                  ) : null}
                </div>

                <p className="font-mono text-xs text-[#9aa4b5]">
                  {formatDuration(download.duration)}
                </p>
                <p className="text-xs text-[#697386] sm:text-right">
                  {formatDate(download.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
