import { Head, router } from "@inertiajs/react";
import { Download, LogOut } from "lucide-react";
import type { ReactNode } from "react";

type DashboardShellProps = {
  user: {
    name: string;
    email: string;
    discord_handle: string | null;
    discord_avatar: string | null;
  };
  flash: { success?: string; error?: string };
  children: ReactNode;
};

export function DashboardShell({ user, flash, children }: DashboardShellProps) {
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
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-[#8791a3]">
                  {user.discord_handle
                    ? `@${user.discord_handle}`
                    : user.email}
                </p>
              </div>
              {user.discord_avatar ? (
                <img
                  src={user.discord_avatar}
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

          {children}
        </div>
      </div>
    </>
  );
}
