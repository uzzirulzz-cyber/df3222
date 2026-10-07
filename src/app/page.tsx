"use client";

import { StorefrontPage } from "@/components/storefront-page";

/**
 * Public storefront landing page.
 *
 * OPEN TO EVERYONE — no login required, no redirect to /admin.
 *
 * Shows marketing content only (branding, features, device compatibility, CTAs).
 * No real IPTV channel names, no streams, no posters.
 *
 * The actual IPTV player with real content lives at /admin behind the Xtream
 * login.
 */
export default function Home() {
  return <StorefrontPage />;
}
