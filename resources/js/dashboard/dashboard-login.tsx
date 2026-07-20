import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, LockKeyhole } from "lucide-react";

type LoginProps = {
  flash: { error?: string };
};

export default function Login() {
  const { flash } = usePage<LoginProps>().props;

  return (
    <>
      <Head title="Internal access" />
      <main className="fixed inset-0 grid overflow-y-auto bg-[#090b10] px-5 py-10 text-[#e9edf4]">
        <div className="m-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-[#8791a3] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          >
            <ArrowLeft size={15} />
            Back to Yeet
          </Link>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151e] shadow-2xl shadow-black/30">
            <div className="border-b border-white/10 px-7 py-8">
              <div className="mb-7 grid size-11 place-items-center rounded-full bg-[#ffcf5c] text-[#17130a]">
                <LockKeyhole size={19} strokeWidth={2.4} />
              </div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#697386] uppercase">
                Restricted area
              </p>
              <h1 className="mt-2 font-playfair text-3xl">Internal access</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#9aa4b5]">
                Sign in with an approved Discord account to view download
                activity and system health.
              </p>
            </div>

            <div className="px-7 py-7">
              {flash.error ? (
                <p className="mb-4 border-l-2 border-rose-300 bg-rose-300/8 px-3 py-2.5 text-sm text-rose-200">
                  {flash.error}
                </p>
              ) : null}

              <a
                href="/auth/discord"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#5865f2] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#6975f5] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
              >
                <DiscordMark />
                Continue with Discord
              </a>

              <p className="mt-4 text-center font-mono text-[10px] leading-5 text-[#697386]">
                Access is checked against the configured Discord ID allowlist.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function DiscordMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 fill-current"
    >
      <path d="M19.5 5.34A17.1 17.1 0 0 0 15.27 4l-.52 1.06a15.8 15.8 0 0 0-5.5 0L8.72 4A17.2 17.2 0 0 0 4.5 5.34C1.82 9.32 1.1 13.2 1.46 17.03a17 17 0 0 0 5.2 2.63l1.27-1.73a11 11 0 0 1-1.99-.95l.49-.38c3.84 1.78 8.01 1.78 11.8 0l.5.38c-.64.38-1.3.7-2 .95l1.27 1.73a17 17 0 0 0 5.2-2.63c.44-4.44-.75-8.28-3.7-11.69ZM8.8 14.7c-1.16 0-2.1-1.07-2.1-2.38 0-1.3.92-2.38 2.1-2.38 1.18 0 2.12 1.08 2.1 2.38 0 1.31-.93 2.38-2.1 2.38Zm6.4 0c-1.16 0-2.1-1.07-2.1-2.38 0-1.3.92-2.38 2.1-2.38 1.18 0 2.12 1.08 2.1 2.38 0 1.31-.92 2.38-2.1 2.38Z" />
    </svg>
  );
}
