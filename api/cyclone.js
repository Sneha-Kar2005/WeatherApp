// Vercel serverless function: proxies GDACS's live tropical-cyclone event
// list. GDACS sends no CORS headers, so the browser can't call it directly
// in production — this runs server-side instead. (In local dev, the same
// path is served by the Vite proxy in vite.config.js.)
export default async function handler(req, res) {
  try {
    const upstream = await fetch(
      "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC"
    );

    if (!upstream.ok) {
      res.status(502).json({ error: "GDACS feed unavailable" });
      return;
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: "GDACS feed unavailable" });
  }
}
