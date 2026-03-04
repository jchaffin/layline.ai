/**
 * Test script for POST /api/knowledge
 * Run with: npx tsx scripts/test-knowledge-api.ts [query]
 * Ensure the dev server is running: npm run dev
 *
 * Pass session via env so the request is authenticated:
 *   SESSION_COOKIE="next-auth.session-token=YOUR_TOKEN" npm run test:knowledge
 * Get the token from DevTools → Application → Cookies after signing in at localhost:3000
 */

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SESSION_COOKIE = process.env.SESSION_COOKIE;

async function main() {
  const query = process.argv[2] || "distributed systems experience";
  console.log("Calling POST /api/knowledge with query:", query);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SESSION_COOKIE) {
    headers["Cookie"] = SESSION_COOKIE;
  } else {
    console.warn("No SESSION_COOKIE env set — request may be redirected to signin.");
  }

  const res = await fetch(`${BASE}/api/knowledge`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, limit: 3 }),
    redirect: "manual",
  });

  console.log("Status:", res.status, res.statusText);
  if (res.status === 302 || res.status === 401) {
    console.log(
      "Tip: Set SESSION_COOKIE (e.g. next-auth.session-token=...) from browser cookies after signing in."
    );
  }
  const data = await res.json().catch(() => ({}));
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
