import { usePage } from "@inertiajs/react";
import { DashboardCookieBanner } from "./dashboard-cookie-banner";
import { DashboardDownloadsTable } from "./dashboard-downloads-table";
import { DashboardShell } from "./dashboard-shell";

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

export default function Dashboard() {
  const { downloads, cookieHealth, auth, flash } = usePage<PageProps>().props;

  return (
    <DashboardShell user={auth.user} flash={flash}>
      <main className="grid gap-6 py-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardDownloadsTable downloads={downloads} />
        <DashboardCookieBanner cookieHealth={cookieHealth} />
      </main>
    </DashboardShell>
  );
}
