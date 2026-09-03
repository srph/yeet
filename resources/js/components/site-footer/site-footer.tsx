import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";

/** The link back across the two pages: whichever one you are not on. */
const counterpart = {
  home: { label: "About", href: "/about" },
  about: { label: "Home", href: "/" },
};

const links = [
  {
    label: "GitHub",
    href: "https://github.com/srph/yeet",
    desktopOnly: true,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/_srph",
    desktopOnly: true,
  },
];

/** Matches the breakpoint the rest of the page splits mobile/desktop on. */
const DESKTOP_ONLY = "hidden min-[880px]:inline";

const LINK =
  "text-neutral-600 transition-colors duration-0 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200";

/**
 * The credit line and the outbound links, sat in flow at the end of the page.
 *
 * Deliberately not fixed: it is the last thing on the page, not chrome pinned
 * over it. Both pages give it a row of its own under a 1fr content row, so it
 * still lands against the bottom of the viewport when the page is short.
 *
 * GitHub and Twitter are desktop-only. On a phone the row has to share its
 * width with the credit line, and the counterpart link is the only one of the
 * three that leads anywhere a first-time visitor needs.
 *
 * tracking-normal is set here rather than inherited: Home's outer wrapper is
 * tracking-tight and About's is not, so the same row rendered at two different
 * letter-spacings. justify-between turns any difference in text width straight
 * into a difference in the gap, so the footer pins its own.
 */
export function SiteFooter({ className }: { className?: string }) {
  const { url } = usePage();
  const here = url.split("?")[0] === "/about" ? "about" : "home";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-6 text-sm leading-none tracking-normal",
        className,
      )}
    >
      <span className="text-neutral-600">
        Crafted by{" "}
        <a
          href="https://kierb.com"
          className="font-medium text-neutral-500 transition-colors duration-0 hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          target="_blank"
          rel="noreferrer"
        >
          Kier Borromeo
        </a>
      </span>
      <div className="flex items-center gap-2.5 md:gap-6">
        <Link href={counterpart[here].href} className={LINK}>
          {counterpart[here].label}
        </Link>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={cn(link.desktopOnly && DESKTOP_ONLY, LINK)}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
