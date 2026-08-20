import { usePage } from "@inertiajs/react";
import { DashboardCookieBanner } from "./dashboard-cookie-banner";
import { DashboardDownloadsTable } from "./dashboard-downloads-table";
import { DashboardShell } from "./dashboard-shell";
import { DashboardViewsCard } from "./dashboard-views-card";

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

type Analytics = {
  total: number;
  month: number;
  previous_month: number | null;
  since: string | null;
};

type PageProps = {
  downloads: DownloadRow[];
  cookieHealth: CookieHealth | null;
  analytics: Analytics;
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

export default function Dashboard() {
  const { downloads, cookieHealth, analytics, auth, flash } =
    usePage<PageProps>().props;

  return (
    <DashboardShell user={auth.user} flash={flash}>
      <main className="grid gap-1">
        <DashboardViewsCard analytics={analytics} />
        <DashboardCookieBanner cookieHealth={cookieHealth} />
        <DashboardDownloadsTable downloads={downloads} />
      </main>
    </DashboardShell>
  );
}
