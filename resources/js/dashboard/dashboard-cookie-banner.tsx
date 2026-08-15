import { router } from "@inertiajs/react";
import { Check, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/chip/chip";
import {
  LayerCard,
  LayerCardContent,
  LayerCardSecondary,
} from "@/components/layer-card/layer-card";

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

function formatRelative(value: string | null) {
  if (!value) return "—";

  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return formatDate(value);
}

function Spec({
  label,
  value,
  bright,
}: {
  label: string;
  value: string;
  bright?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2.5 py-1 text-[12.5px]">
      <dt className="whitespace-nowrap text-neutral-500">{label}</dt>
      <span className="h-px flex-1 self-center bg-[repeating-linear-gradient(90deg,var(--color-neutral-700)_0_2px,transparent_2px_5px)]" />
      <dd
        className={`whitespace-nowrap tabular-nums ${bright ? "text-white" : "text-neutral-300"}`}
      >
        {value}
      </dd>
    </div>
  );
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
  const isHealthy = cookieHealth?.status === "healthy";
  const statusLabel = cookieHealth
    ? isHealthy
      ? "Active"
      : "Needs Attention"
    : "Not checked";
  const chipVariant = cookieHealth
    ? isHealthy
      ? "success"
      : "danger"
    : "default";

  return (
    <section>
      <LayerCard>
        <LayerCardSecondary className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-medium text-white">
              Cookie Health
            </span>
            <Chip variant={chipVariant}>
              {isHealthy ? <Check size={10} strokeWidth={3} /> : null}
              {statusLabel}
            </Chip>
          </div>

          <button
            type="button"
            onClick={queueHealthcheck}
            disabled={checkInProgress}
            className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-blue-200 px-3 py-1.5 text-[12px] font-bold tracking-[-0.01em] text-blue-950 transition hover:bg-blue-300 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          >
            <RefreshCw
              size={12}
              className={
                checkInProgress
                  ? "animate-spin"
                  : "group-hover:animate-spin-once group-focus-visible:animate-spin-once"
              }
            />
            {submittingCheck
              ? "Queueing…"
              : waitingForCheck
                ? "Waiting…"
                : "Run probe"}
          </button>
        </LayerCardSecondary>

        <LayerCardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-0.5 px-1 py-1 sm:grid-cols-2">
            <Spec
              label="Last checked"
              value={formatRelative(cookieHealth?.checked_at ?? null)}
              bright
            />
            <Spec
              label="Session expiry"
              value={formatDate(cookieHealth?.session_expires_at ?? null)}
            />
            <Spec
              label="Cookies found"
              value={cookieHealth?.cookie_count?.toString() ?? "—"}
            />
            <Spec
              label="Fingerprint"
              value={
                cookieHealth?.cookie_file_fingerprint
                  ? cookieHealth.cookie_file_fingerprint.slice(0, 10)
                  : "—"
              }
            />
          </dl>
        </LayerCardContent>
      </LayerCard>
    </section>
  );
}
