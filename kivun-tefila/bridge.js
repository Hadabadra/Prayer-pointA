/* כיוון תפילה 2.6.0 — שימוש בגשר "אחת שאלתי" (127.0.0.1:47917-47921) כשהוא מותקן:
   מיקום מ-Windows (מדויק יותר ממיקום לפי IP) ומשוב ל-GitHub. בלי גשר — הכול ממשיך כמו קודם.
   הרשאה: network.localhost. צימוד: בפעם הראשונה הגשר מציג חלון אישור במחשב, והמפתח נשמר ב-storage. */
(function () {
  const O = window.Otzaria, PORTS = [47917, 47918, 47919, 47920, 47921], KEY = "bridgeToken";
  const dat = r => (r && r.data !== undefined ? r.data : r);
  let port = null, token = null, probed = false;
  async function raw(p, path, method, body, ms) {
    const headers = { "X-Otzaria-Bridge": "1", "Content-Type": "application/json; charset=utf-8" };
    if (token) headers["X-Otzaria-Token"] = token;
    const prm = { url: `http://127.0.0.1:${p}${path}`, method, headers, timeoutMs: ms || 8000 };
    if (method !== "GET") prm.body = JSON.stringify(body || {});
    let it = O.call("network.fetchStream", prm); if (it && it.then) it = await it;
    if (!it || !it[Symbol.asyncIterator]) throw new Error("transport");
    let text = "";
    for await (const c of it) { if (c && c.type === "data" && typeof c.body === "string") text += c.body; else if (c && typeof c.body === "string" && c.type !== "response") text += c.body }
    return JSON.parse(text);
  }
  async function find() {
    if (!O) return null;
    if (probed) return port;
    probed = true;
    try { const v = dat(await O.call("storage.get", { key: KEY })); if (typeof v === "string" && v.length >= 32) token = v } catch (e) {}
    for (const p of PORTS) { try { const j = await raw(p, "/health", "GET", null, 1500); if (j && j.ok && j.data && j.data.name === "otzaria-bridge") { port = p; return p } } catch (e) {} }
    return null;
  }
  async function call(path, body, ms) {
    if (!(await find())) throw new Error("no_bridge");
    let j = await raw(port, path, "POST", body, ms);
    if (!j.ok && j.error && j.error.code === "unpaired") {
      const r = await raw(port, "/pair/request", "POST", { client: "kivun-tefila", name: "כיוון תפילה" }, 120000);
      if (!r.ok) throw Object.assign(new Error((r.error && r.error.message) || "unpaired"), { code: "unpaired" });
      token = r.data.token; try { await O.call("storage.set", { key: KEY, value: token }) } catch (e) {}
      j = await raw(port, path, "POST", body, ms);
    }
    if (!j.ok) throw Object.assign(new Error((j.error && j.error.message) || "error"), { code: j.error && j.error.code });
    return j.data;
  }
  window.KT_BRIDGE = {
    available: async () => !!(await find()),
    location: () => call("/sys/location", { maxAgeSec: 300, timeoutSec: 15 }, 25000),
    feedback: p => call("/feedback", { text: p.body, title: p.title, plugin: p.plugin, version: p.version, repo: p.repo, kind: p.kind }, 10000),
  };
  /* משוב: קודם הגשר, ואם אין — ישירות למתווך כמו קודם */
  window.ktRelay = function (p) {
    return KT_BRIDGE.feedback(p).catch(() => fetch("https://achat-relay.e0548433917.workers.dev", { method: "POST", mode: "no-cors", body: JSON.stringify(p) }));
  };
  /* מיקום: קודם הגשר (Windows Location), ואם אין — מיקום משוער לפי רשת כמו קודם */
  const btn = document.getElementById("bOn");
  if (btn && O) {
    const prev = btn.onclick;
    btn.onclick = async function (e) {
      const txt = document.getElementById("txt");
      if (!(await find())) return prev && prev.call(this, e);
      txt.textContent = "מאתר מיקום דרך Windows…";
      try {
        const d = await KT_BRIDGE.location();
        setPos([+d.lat, +d.lon], "מיקום מ-Windows (דיוק כ-" + Math.round(d.accuracy) + " מ׳)", d.accuracy, true); rev();
      } catch (er) {
        if (er.code === "location_off") txt.textContent = er.message.split(" Windows location")[0] + " בינתיים: מיקום משוער לפי רשת.";
        if (prev) setTimeout(() => prev.call(this, e), er.code === "location_off" ? 2500 : 0);
      }
    };
  }
})();
