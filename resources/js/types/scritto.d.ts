import type {} from "react";

/**
 * `@scritto/react` ships this declaration for `<scritto-text>` but not for
 * `<scritto-flow>`, which has no wrapper component — importing the core
 * registers both custom elements and you write the flow as a bare tag.
 * Same shape the package uses for its own, so the two read alike.
 */
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "scritto-flow": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        >;
      }
    }
  }
}
