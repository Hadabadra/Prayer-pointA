/* גשר "אחת שאלתי" — זיהוי מיקום מ-Windows. הועתק מכיוון תפילה 2.6.2 (bridge.js), בשינוי שם הלקוח.
   הרשאה: network.localhost + 127.0.0.1/localhost ב-network.allowlist. בלי גשר — נופלים ל-navigator.geolocation. */
(function () {
  const O = window.Otzaria, PORTS = [47917, 47918, 47919, 47920, 47921], KEY = "bridgeToken";
  const dat = r => (r && r.data !== undefined ? r.data : r);
  let port = null, token = null, probed = 0;
  async function raw(p, path, method, body, ms) {
    const headers = { "X-Otzaria-Bridge": "1", "Content-Type": "application/json; charset=utf-8" };
    if (token) headers["X-Otzaria-Token"] = token;
    const prm = { url: `http://127.0.0.1:${p}${path}`, method, headers, timeoutMs: ms || 8000 };
    if (method !== "GET") prm.body = JSON.stringify(body || {});
    // 2.6.2: אוצריא מחזירה לפעמים {success, data: <זרם>} ולא את הזרם עצמו (כמו בצופה PDF).
    // בלי הפריסה הזו הגשר "לא נמצא" אף פעם, ו"מיקום משוער" נפל ישר למיקום לפי רשת.
    const isIt = x => x && typeof x[Symbol.asyncIterator] === "function";
    let it = O.call("network.fetchStream", prm); if (!isIt(it) && it && it.then) it = await it;
    if (!isIt(it) && it && it.success === false) throw Object.assign(new Error((it.error && it.error.message) || "transport"), { code: "transport" });
    if (!isIt(it) && it && isIt(it.data)) it = it.data;
    if (!isIt(it)) throw new Error("transport");
    let text = "";
    for await (const c of it) { if (c && c.type === "data" && typeof c.body === "string") text += c.body; else if (c && typeof c.body === "string" && c.type !== "response") text += c.body }
    return JSON.parse(text);
  }
  async function find() {
    if (!O) return null;
    // 2.6.1: לא נועלים על "אין גשר" — אם הגשר עלה אחרי התוסף, מנסים שוב (לכל היותר פעם ב-20 שנ')
    if (port) return port;
    if (probed && Date.now() - probed < 20000) return null;
    probed = Date.now();
    try { const v = dat(await O.call("storage.get", { key: KEY })); if (typeof v === "string" && v.length >= 32) token = v } catch (e) {}
    for (const p of PORTS) { try { const j = await raw(p, "/health", "GET", null, 1500); if (j && j.ok && j.data && j.data.name === "otzaria-bridge") { port = p; return p } } catch (e) {} }
    return null;
  }
  async function call(path, body, ms) {
    if (!(await find())) throw new Error("no_bridge");
    let j = await raw(port, path, "POST", body, ms);
    if (!j.ok && j.error && j.error.code === "unpaired") {
      const r = await raw(port, "/pair/request", "POST", { client: "gvulot-eruv", name: "גבולות עירוב" }, 120000);
      if (!r.ok) throw Object.assign(new Error((r.error && r.error.message) || "unpaired"), { code: "unpaired" });
      token = r.data.token; try { await O.call("storage.set", { key: KEY, value: token }) } catch (e) {}
      j = await raw(port, path, "POST", body, ms);
    }
    if (!j.ok && j.error && j.error.code === "transport") port = null;
    if (!j.ok) throw Object.assign(new Error((j.error && j.error.message) || "error"), { code: j.error && j.error.code });
    return j.data;
  }
  window.ERUV_BRIDGE = {
    available: async () => !!(await find()),
    location: () => call("/sys/location", { maxAgeSec: 300, timeoutSec: 15 }, 25000),
    compass: () => call("/sys/compass", {}, 4000),
  };
})();
