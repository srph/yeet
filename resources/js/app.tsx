import "../css/app.css";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

createInertiaApp({
  title: (title) => (title ? `${title} - Yeet` : "Yeet"),

  resolve: (name) => {
    // Home stays under ./home (name "home" → ./home/home.tsx). Dashboard
    // pages use a folder prefix (e.g. "dashboard/dashboard-login").
    const path = name.includes("/")
      ? `./${name}.tsx`
      : `./home/${name}.tsx`;

    return resolvePageComponent(
      path,
      import.meta.glob(["./home/**/*.tsx", "./dashboard/**/*.tsx"]),
    );
  },

  setup({ el, App, props }) {
    // Was providers.tsx. React Query still owns all data fetching — Inertia
    // is only rendering the view, so no props flow through it.
    const queryClient = new QueryClient();

    createRoot(el).render(
      <QueryClientProvider client={queryClient}>
        <App {...props} />
      </QueryClientProvider>,
    );
  },
});
