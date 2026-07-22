import { Head, router } from "@inertiajs/react";
import { LogOut } from "lucide-react";
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
  const handle = user.discord_handle
    ? `@${user.discord_handle}`
    : user.name;

  return (
    <>
      <Head title="Control room" />
      <div className="fixed inset-0 overflow-y-auto bg-neutral-950 font-sans text-neutral-50 tracking-[-0.011em] antialiased">
        <header className="mx-auto flex max-w-[960px] items-center gap-3 px-[26px] py-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-7 w-auto" />
            <span className="text-[19px] font-semibold tracking-[-0.02em]">
              Yeet Control Room
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              {user.discord_avatar ? (
                <img
                  src={user.discord_avatar}
                  alt=""
                  className="size-[30px] rounded-full bg-neutral-800"
                />
              ) : (
                <span
                  aria-hidden
                  className="size-[30px] rounded-full bg-linear-to-br from-[#5865f2] to-neutral-700"
                />
              )}
              <span className="hidden text-[12.5px] font-medium text-neutral-400 sm:inline">
                {handle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.post("/logout")}
              aria-label="Log out"
              className="grid size-8 place-items-center rounded-full border border-neutral-800 text-neutral-500 transition hover:border-neutral-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[960px] px-[26px] pt-5 pb-14">
          {flash.success ? (
            <div className="mb-5 border-l-2 border-blue-200 bg-blue-200/8 px-4 py-3 text-sm text-blue-200">
              {flash.success}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </>
  );
}
