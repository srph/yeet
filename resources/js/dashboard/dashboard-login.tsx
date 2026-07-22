import { Head, usePage } from "@inertiajs/react";
import { Button } from "@/components/button/button";

type LoginProps = {
  flash: { error?: string };
};

export default function Login() {
  const { flash } = usePage<LoginProps>().props;

  return (
    <>
      <Head title="Internal access" />
      <main className="fixed inset-0 overflow-y-auto bg-neutral-950 font-sans text-white">
        <div
          aria-hidden
          className="pointer-events-none fixed left-[40%] top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.08),transparent_66%)]"
        />

        <div className="relative mx-auto flex min-h-full max-w-[460px] flex-col items-start justify-center p-6 text-left">
          <img
            src="/logo.svg"
            alt=""
            className="h-[46px] w-auto drop-shadow-[0_16px_40px_-16px_rgba(191,219,254,0.6)]"
          />

          <h1 className="mt-10 max-w-[19ch] text-[30px] font-semibold leading-[1.22] tracking-[-0.02em]">
            Welcome back, homie.{" "}
            <span className="font-medium text-neutral-400">
              Wait a second, are you sure you're supposed to be here?
            </span>
          </h1>

          {flash.error ? (
            <p className="mt-6 border-l-2 border-rose-300 bg-rose-300/8 px-3 py-2.5 text-sm text-rose-200">
              {flash.error}
            </p>
          ) : null}

          <div className="mt-8 max-md:absolute max-md:inset-x-6 max-md:bottom-6 max-md:mt-0">
            <Button asChild className="w-full px-[22px]">
              <a href="/auth/discord">
                <DiscordMark />
                Continue with Discord
              </a>
            </Button>
          </div>
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
      className="size-[19px] fill-current"
    >
      <path d="M19.5 5.34A17.1 17.1 0 0 0 15.27 4l-.52 1.06a15.8 15.8 0 0 0-5.5 0L8.72 4A17.2 17.2 0 0 0 4.5 5.34C1.82 9.32 1.1 13.2 1.46 17.03a17 17 0 0 0 5.2 2.63l1.27-1.73a11 11 0 0 1-1.99-.95l.49-.38c3.84 1.78 8.01 1.78 11.8 0l.5.38c-.64.38-1.3.7-2 .95l1.27 1.73a17 17 0 0 0 5.2-2.63c.44-4.44-.75-8.28-3.7-11.69ZM8.8 14.7c-1.16 0-2.1-1.07-2.1-2.38 0-1.3.92-2.38 2.1-2.38 1.18 0 2.12 1.08 2.1 2.38 0 1.31-.93 2.38-2.1 2.38Zm6.4 0c-1.16 0-2.1-1.07-2.1-2.38 0-1.3.92-2.38 2.1-2.38 1.18 0 2.12 1.08 2.1 2.38 0 1.31-.92 2.38-2.1 2.38Z" />
    </svg>
  );
}
