// Vercel serverless function: proxies a single GDACS event's track geometry
// (official forecast track points + uncertainty cone). Same CORS problem as
// cyclone.js, same local-dev proxy setup in vite.config.js.
export default async function handler(req, res) {
  const { eventtype, eventid, episodeid } = req.query;

  const isValidId = (v) => /^\d+$/.test(String(v ?? ""));
  if (eventtype !== "TC" || !isValidId(eventid) || !isValidId(episodeid)) {
    res.status(400).json({ error: "Invalid eventtype/eventid/episodeid" });
    return;
  }

  try {
    const upstream = await fetch(
      `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=${eventid}&episodeid=${episodeid}`
    );

    if (!upstream.ok) {
      res.status(502).json({ error: "GDACS track feed unavailable" });
      return;
    }

    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: "GDACS track feed unavailable" });
  }
}
