import { Head, router, usePage } from "@inertiajs/react";
import {
  Activity,
  Clock3,
  Download,
  LogOut,
  Radio,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

type CookieHealth = {
  status: "healthy" | "unhealthy";
  message: string;
  cookie_count: number;
  session_cookie: string | null;
  session_expires_at: string | null;
  file_modified_at: string | null;
  cookie_file_fingerprint: string | null;
  probe_title: string | null;
  checked_at: string;
};

type PageProps = {
  downloads: DownloadRow[];
  cookieHealth: CookieHealth | null;
  auth: {
    user: {
      name: string;
      email: string;
      discord_handle: string | null;
      discord_avatar: string | null;
    };
  };
  flash: { success?: string; error?: string };
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

export default function Dashboard() {
  const { downloads, cookieHealth, auth, flash } = usePage<PageProps>().props;
  const [submittingCheck, setSubmittingCheck] = useState(false);
  const [waitingForCheck, setWaitingForCheck] = useState(false);
  const previousCheck = useRef<string | null>(null);

  const queueHealthcheck = () => {
    previousCheck.current = cookieHealth?.checked_at ?? null;
    setSubmittingCheck(true);
    router.post(
      "/dashboard/cookie-health",
      {},
      {
        preserveScroll: true,
        onSuccess: () => setWaitingForCheck(true),
        onFinish: () => setSubmittingCheck(false),
      },
    );
  };

  useEffect(() => {
    if (
      waitingForCheck &&
      cookieHealth?.checked_at &&
      cookieHealth.checked_at !== previousCheck.current
    ) {
      setWaitingForCheck(false);
    }
  }, [cookieHealth?.checked_at, waitingForCheck]);

  useEffect(() => {
    if (!waitingForCheck) return;

    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;

      if (attempts > 15) {
        window.clearInterval(interval);
        setWaitingForCheck(false);
        return;
      }

      router.reload({ only: ["cookieHealth"], preserveScroll: true });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [waitingForCheck]);

  const checkInProgress = submittingCheck || waitingForCheck;

  return (
    <>
      <Head title="Control room" />
      <div className="fixed inset-0 overflow-y-auto bg-[#090b10] text-[#e9edf4]">
        <div className="mx-auto min-h-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full bg-[#ffcf5c] text-black">
                <Download size={17} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#8791a3] uppercase">
                  Yeet operations
                </p>
                <h1 className="font-playfair text-xl leading-none">
                  Control room
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{auth.user.name}</p>
                <p className="text-xs text-[#8791a3]">
                  {auth.user.discord_handle
                    ? `@${auth.user.discord_handle}`
                    : auth.user.email}
                </p>
              </div>
              {auth.user.discord_avatar ? (
                <img
                  src={auth.user.discord_avatar}
                  alt=""
                  className="size-9 rounded-full bg-white/10"
                />
              ) : null}
              <button
                type="button"
                onClick={() => router.post("/logout")}
                aria-label="Log out"
                className="grid size-9 place-items-center rounded-full border border-white/10 text-[#8791a3] transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          {flash.success ? (
            <div className="mt-5 border-l-2 border-[#ffcf5c] bg-[#ffcf5c]/8 px-4 py-3 text-sm text-[#f6d98d]">
              {flash.success}
            </div>
          ) : null}

          <main className="grid gap-6 py-7 lg:grid-cols-[minmax(0,1fr)_360px]">
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

            <aside>
              <div className="sticky top-6 overflow-hidden rounded-xl border border-white/10 bg-[#11151e]">
                <div className="relative border-b border-white/10 px-5 py-5">
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${
                      cookieHealth?.status === "healthy"
                        ? "bg-emerald-300"
                        : cookieHealth
                          ? "bg-rose-300"
                          : "bg-[#697386]"
                    }`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#697386] uppercase">
                        Credential signal
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        YouTube cookies
                      </h2>
                    </div>
                    <div
                      className={`grid size-9 place-items-center rounded-full ${
                        cookieHealth?.status === "healthy"
                          ? "bg-emerald-300/15 text-emerald-300"
                          : cookieHealth
                            ? "bg-rose-300/15 text-rose-300"
                            : "bg-white/5 text-[#697386]"
                      }`}
                    >
                      {cookieHealth?.status === "healthy" ? (
                        <ShieldCheck size={18} />
                      ) : (
                        <Activity size={18} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <p className="text-3xl font-semibold tracking-tight">
                    {cookieHealth
                      ? cookieHealth.status === "healthy"
                        ? "Active"
                        : "Needs attention"
                      : "Not checked"}
                  </p>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-[#9aa4b5]">
                    {cookieHealth?.message ??
                      "Queue the first live probe to establish cookie health."}
                  </p>

                  <dl className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    {[
                      ["Last checked", formatDate(cookieHealth?.checked_at ?? null)],
                      ["File updated", formatDate(cookieHealth?.file_modified_at ?? null)],
                      [
                        "File fingerprint",
                        cookieHealth?.cookie_file_fingerprint
                          ? cookieHealth.cookie_file_fingerprint.slice(0, 12)
                          : "—",
                      ],
                      ["Session expiry", formatDate(cookieHealth?.session_expires_at ?? null)],
                      ["Cookies found", cookieHealth?.cookie_count?.toString() ?? "—"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <dt className="text-xs text-[#697386]">{label}</dt>
                        <dd className="max-w-48 text-right font-mono text-[11px] text-[#c1c8d3]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <button
                    type="button"
                    onClick={queueHealthcheck}
                    disabled={checkInProgress}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ffcf5c] px-4 py-3 text-sm font-bold text-[#17130a] transition hover:bg-[#ffda7c] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                  >
                    <RefreshCw
                      size={15}
                      className={checkInProgress ? "animate-spin" : ""}
                    />
                    {submittingCheck
                      ? "Queueing…"
                      : waitingForCheck
                        ? "Waiting for worker…"
                        : "Check now"}
                  </button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#697386]">
                    <Clock3 size={12} />
                    Runs Mondays at 03:00
                  </p>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </>
  );
}
