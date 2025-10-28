export default function handler(req, res) {
  try {
    res.status(200).json({
      ok: true,
      service: "KI Agent Sekretar (status)",
      timestamp: new Date().toISOString(),
      node: process.version,
      region: process.env.VERCEL_REGION || "unknown"
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
