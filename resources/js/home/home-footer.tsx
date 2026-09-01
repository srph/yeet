import { Fragment } from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";

const links = [
  {
    label: "About",
    href: "/about",
    external: false,
  },
  {
    label: "GitHub",
    href: "https://github.com/srph/yeet",
    external: true,
    desktopOnly: true,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/_srph",
    external: true,
    desktopOnly: true,
  },
];

/** Matches the breakpoint the rest of the page splits mobile/desktop on. */
const DESKTOP_ONLY = "hidden min-[880px]:inline";

const LINK =
  "text-neutral-600 transition-colors duration-150 hover:text-neutral-300 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200";

/**
 * The credit line and the outbound links, sat in flow at the end of the page.
 *
 * Deliberately not fixed: it is the last thing on the page, not chrome pinned
 * over it. Home gives it a row of its own under a 1fr content row, so it still
 * lands against the bottom of the viewport when the page is short.
 *
 * GitHub and Twitter are desktop-only. On a phone the row has to share its
 * width with the credit line, and About is the only one of the three that
 * leads anywhere a first-time visitor needs.
 */
export function HomeFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-6 text-sm leading-none",
        className,
      )}
    >
      <span className="text-neutral-600">
        Crafted by{" "}
        <a
          href="https://kierb.com"
          className="font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-300 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200"
          target="_blank"
        >
          Kier Borromeo
        </a>
      </span>
      <div className="flex items-center gap-2.5 md:gap-6">
        {links.map((link) => (
          <Fragment key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                className={cn(link.desktopOnly && DESKTOP_ONLY, LINK)}
                target="_blank"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className={cn(link.desktopOnly && DESKTOP_ONLY, LINK)}
              >
                {link.label}
              </Link>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
