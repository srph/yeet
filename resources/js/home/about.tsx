import { Fragment } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { IconButton } from "@/components/icon-button/icon-button";

const platforms = [
  { label: "YouTube", className: "bg-red-950 text-red-300" },
  { label: "X", className: "bg-neutral-800 text-neutral-200" },
  { label: "Facebook", className: "bg-blue-950 text-blue-300" },
  { label: "TikTok", className: "bg-rose-950 text-rose-300" },
  { label: "Douyin", className: "bg-orange-950 text-orange-300" },
] as const;

const limits: { label: string; value: string; bright?: boolean }[] = [
  { label: "Max file size", value: "200 MiB", bright: true },
  { label: "Rate limit", value: "10/min · 50/day" },
  { label: "Links expire", value: "7 days after ready" },
];

const feedback = [
  {
    kind: "DM on X",
    value: "@_srph",
    href: "https://twitter.com/_srph",
  },
  {
    kind: "Open an issue",
    value: "github.com/srph",
    href: "https://github.com/srph",
  },
  {
    kind: "DM on Discord",
    value: "@carebeyan",
    href: "https://discord.com/users/103690620308041728",
  },
] as const;

const footerLinks = [
  { label: "Home", href: "/", external: false },
  { label: "GitHub", href: "https://github.com/srph", external: true },
  { label: "Twitter", href: "https://twitter.com/_srph", external: true },
] as const;

/** Same leader-dot rail as HomeDownloadTracking's Spec. */
const Spec = ({
  label,
  value,
  bright,
}: {
  label: string;
  value: string;
  bright?: boolean;
}) => (
  <div className="flex items-baseline gap-2.5 py-[7px] text-sm">
    <dt className="whitespace-nowrap text-neutral-500">{label}</dt>
    <span className="h-px flex-1 -translate-y-[3px] bg-[repeating-linear-gradient(90deg,var(--color-neutral-700)_0_2px,transparent_2px_5px)]" />
    <dd
      className={`whitespace-nowrap tabular-nums ${bright ? "text-white" : "text-neutral-400"}`}
    >
      {value}
    </dd>
  </div>
);

const SectionHead = ({ no, title }: { no: string; title: string }) => (
  <div className="mb-4 flex items-center gap-2.5">
    <span className="rounded-md bg-blue-200 px-[7px] py-[3px] font-mono text-[11px] font-bold tracking-[0.05em] text-blue-950">
      {no}
    </span>
    <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
      {title}
    </span>
  </div>
);

export default function About() {
  return (
    <div className="fixed inset-0 overflow-y-auto text-white">
      <Head title="About" />

      <div className="grid min-h-full place-items-center px-4 pt-20 pb-16">
        <IconButton
          asChild
          className="fixed top-4 left-4 z-20 size-9 bg-white text-neutral-950 hover:bg-neutral-200"
        >
          <Link href="/" aria-label="Back to Yeet">
            <ArrowLeft size={16} strokeWidth={2.2} />
          </Link>
        </IconButton>

        <div className="fixed inset-x-0 top-0 z-10 flex items-center justify-center gap-2.5 px-4 py-5">
          <img src="/logo.svg" alt="" className="h-7 w-auto" />
          <span className="font-sans text-xl font-semibold text-white">Yeet</span>
        </div>

        <article className="w-full max-w-[440px]">
          <h1 className="mt-5 text-center text-[33px] font-semibold leading-[1.05] tracking-[-0.04em]">
            Paste a link,{" "}
            <span className="text-blue-200">get a file.</span>
          </h1>
          <p className="mt-3 text-center text-[15px] leading-normal text-neutral-400">
            A personal project of{" "}
            <a
              href="https://kierb.com"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-300 underline decoration-wavy decoration-blue-200 underline-offset-[3px] transition-colors duration-150 hover:text-white hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
            >
              mine
            </a>{" "}
            to download silly videos from different websites. Please go easy on
            it; there are rate limits so it stays up for everyone.
          </p>

          <section className="mt-[38px]">
            <SectionHead no="01" title="Supported" />
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform.label}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold ${platform.className}`}
                >
                  {platform.label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-neutral-500">
              Audio as <span className="font-semibold text-white">MP3</span>,
              video as <span className="font-semibold text-white">MP4</span>.
            </p>
          </section>

          <section className="mt-[38px]">
            <SectionHead no="02" title="Limits" />
            <dl>
              {limits.map((limit) => (
                <Spec
                  key={limit.label}
                  label={limit.label}
                  value={limit.value}
                  bright={limit.bright}
                />
              ))}
            </dl>
          </section>

          <section className="mt-[38px]">
            <SectionHead no="03" title="Feedback" />
            <div className="flex flex-col gap-2">
              {feedback.map((row) => (
                <a
                  key={row.href}
                  href={row.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex w-full items-center justify-between rounded-[14px] bg-neutral-900 px-4 py-[13px] text-left text-sm font-medium transition-colors duration-150 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                >
                  <span className="text-neutral-400">{row.kind}</span>
                  <span className="flex items-center gap-2 text-white transition-colors group-hover:text-blue-200">
                    {row.value}
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2.2}
                      className="text-neutral-600 transition-all duration-150 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-blue-200"
                    />
                  </span>
                </a>
              ))}
            </div>
          </section>
        </article>

        <div className="fixed inset-x-0 bottom-0 px-4 py-5">
          <div className="flex w-full items-center justify-between gap-6 text-sm leading-none">
            <span className="text-neutral-600">
              Crafted by{" "}
              <a
                href="https://kierb.com"
                className="font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-300 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                target="_blank"
                rel="noreferrer"
              >
                Kier Borromeo
              </a>
            </span>
            <div className="flex items-center gap-2.5">
              {footerLinks.map((link, i) => (
                <Fragment key={link.label}>
                  {i > 0 && (
                    <span className="size-0.5 shrink-0 rounded-full bg-neutral-800" />
                  )}
                  {link.external ? (
                    <a
                      href={link.href}
                      className="text-neutral-600 transition-colors duration-150 hover:text-neutral-300 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-neutral-600 transition-colors duration-150 hover:text-neutral-300 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
