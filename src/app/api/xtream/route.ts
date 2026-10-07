import { NextRequest, NextResponse } from "next/server";

/**
 * CORS proxy for Xtream Codes player_api.php.
 *
 * Why this exists: Xtream panels do not send `Access-Control-Allow-Origin`,
 * so the browser cannot fetch JSON from them directly. This route forwards
 * the request server-side and returns the body with permissive CORS headers.
 *
 * Privacy:
 *   - This route does NOT log credentials.
 *   - It does NOT store anything.
 *   - It only forwards the URL passed in `?url=` and returns the body.
 *   - It is restricted to GET requests.
 *
 * The `url` query param must be a full http(s) URL pointing to a
 * `player_api.php` endpoint.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PATH = "/player_api.php";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400, headers: corsHeaders() }
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json(
      { error: "Invalid url" },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Only allow proxying to player_api.php endpoints
  if (!targetUrl.pathname.endsWith(ALLOWED_PATH)) {
    return NextResponse.json(
      { error: "Only player_api.php endpoints are allowed" },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http/https targets allowed" },
      { status: 403, headers: corsHeaders() }
    );
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; PersonalIPTVClient/1.0)",
      },
      // Do not follow redirects silently — surface them as errors.
      redirect: "manual",
      cache: "no-store",
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach upstream: ${message}` },
      { status: 502, headers: corsHeaders() }
    );
  }
}
