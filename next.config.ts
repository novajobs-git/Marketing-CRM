import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Next 15+ defaults dynamic-page client caching to 0s (a change from 30s
    // in Next 14), meaning every navigation — even revisiting a page you were
    // just on — does a full server round-trip. Since almost every page here
    // is dynamic (auth-gated), that default made navigation feel slow.
    // Restoring a short cache window lets the browser reuse a recently-visited
    // page instantly instead of re-fetching it. Mutations already call
    // revalidatePath(), which invalidates this cache for the client that made
    // the change; other open tabs/sessions may see data up to this many
    // seconds stale, which is an acceptable trade-off for this app.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
