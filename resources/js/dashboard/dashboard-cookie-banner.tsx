import { router } from "@inertiajs/react";
import { Activity, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  return value ? dateTime.format(new Date(value)) : "—";
}

export function DashboardCookieBanner({
  cookieHealth,
}: {
  cookieHealth: CookieHealth | null;
}) {
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
              <h2 className="mt-1 text-lg font-semibold">YouTube cookies</h2>
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
              [
                "File updated",
                formatDate(cookieHealth?.file_modified_at ?? null),
              ],
              [
                "File fingerprint",
                cookieHealth?.cookie_file_fingerprint
                  ? cookieHealth.cookie_file_fingerprint.slice(0, 12)
                  : "—",
              ],
              [
                "Session expiry",
                formatDate(cookieHealth?.session_expires_at ?? null),
              ],
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
  );
}
