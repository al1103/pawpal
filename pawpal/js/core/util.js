window.PP = window.PP || {};
PP.util = (function(){
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const uid = p => (p || "id") + "-" + Math.random().toString(36).slice(2, 9);
  const lerp = (a, b, t) => a + (b - a) * t;

  function timeAgo(ts){
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if(s < 60) return "just now";
    if(s < 3600) return Math.floor(s / 60) + "m ago";
    if(s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }
  function dateLabel(ts){
    return new Date(ts).toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"});
  }
  function duration(mins){
    if(mins < 60) return Math.round(mins) + " min";
    const h = Math.floor(mins / 60);
    return h + "h " + Math.round(mins % 60) + "m";
  }
  function greeting(){
    const h = new Date().getHours();
    if(h < 5) return "Still up";
    if(h < 12) return "Good morning";
    if(h < 18) return "Good afternoon";
    return "Good evening";
  }
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function on(root, sel, type, fn){
    root.addEventListener(type, e => {
      const t = e.target.closest(sel);
      if(t && root.contains(t)) fn(e, t);
    });
  }
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  /* Non-reversible digest for the mock auth store. Async-capable, with a
     synchronous fallback where WebCrypto is unavailable (file:// in old browsers). */
  async function digest(text){
    try{
      if(window.crypto && crypto.subtle){
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      }
    }catch(e){ /* fall through */ }
    let h = 5381;
    for(let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return "fb" + h.toString(16);
  }

  return {esc, clamp, uid, lerp, timeAgo, dateLabel, duration, greeting, el, $, $$, on, emailOk, digest};
})();
