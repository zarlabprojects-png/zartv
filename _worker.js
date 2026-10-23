// ZA TV: Google Drive থেকে ভিডিও প্রক্সি (R2 লাগে না)
export default {
  async fetch(req, env) {
    const u = new URL(req.url), p = u.pathname;
    if (p.indexOf("/api/dvd/v/") !== 0) return env.ASSETS.fetch(req);
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("method", { status: 405 });
    const id = decodeURIComponent(p.slice(11));
    if (!/^[\w-]{10,100}$/.test(id)) return new Response("bad id", { status: 400 });
    const h = new Headers();
    const rg = req.headers.get("range");
    if (rg) h.set("range", rg);
    h.set("user-agent", "Mozilla/5.0");
    let r;
    try {
      r = await fetch("https://drive.usercontent.google.com/download?id=" + encodeURIComponent(id) + "&export=download&confirm=t", { method: req.method, headers: h, redirect: "follow" });
    } catch (e) {
      return new Response("drive error", { status: 502 });
    }
    let ct = r.headers.get("content-type") || "";
    if (!(r.status === 200 || r.status === 206) || /text\/html/i.test(ct)) {
      return new Response("drive unavailable", { status: 502 });
    }
    if (!ct || /octet-stream/i.test(ct)) ct = "video/mp4";
    const o = new Headers();
    o.set("content-type", ct);
    ["content-length", "content-range", "etag", "last-modified"].forEach(function (k) {
      const v = r.headers.get(k); if (v) o.set(k, v);
    });
    o.set("accept-ranges", "bytes");
    o.set("cache-control", "public, max-age=3600");
    return new Response(req.method === "HEAD" ? null : r.body, { status: r.status, headers: o });
  }
};
