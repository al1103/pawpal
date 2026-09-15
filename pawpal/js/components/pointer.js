/* One pointer listener and one requestAnimationFrame loop for the whole app.
   Animal instances subscribe; the loop pauses when the tab is hidden. */
window.PP = window.PP || {};
PP.pointer = (function(){
  const pos = {x:innerWidth * 0.6, y:innerHeight * 0.45, seen:false, active:true, over:null};
  const tickers = new Set();
  let running = false, trailAt = 0;

  function set(x, y, over){
    pos.x = x; pos.y = y; pos.seen = true; pos.active = true;
    pos.over = over || null;
    if(PP.store.state.settings.cursorTrail !== false) trail(x, y);
  }

  addEventListener("mousemove", e => {
    const t = e.target instanceof Element ? e.target.closest("button,a,.fitem,.opt,.pick") : null;
    set(e.clientX, e.clientY, t);
  }, {passive:true});
  addEventListener("touchstart", e => { const t = e.touches[0]; if(t) set(t.clientX, t.clientY); }, {passive:true});
  addEventListener("touchmove",  e => { const t = e.touches[0]; if(t) set(t.clientX, t.clientY); }, {passive:true});
  addEventListener("mouseleave", () => { pos.active = false; });
  addEventListener("blur", () => { pos.active = false; });

  function trail(x, y){
    const now = performance.now();
    if(now - trailAt < 110) return;
    if(document.documentElement.dataset.motion === "off") return;
    trailAt = now;
    const root = document.getElementById("trailRoot");
    if(!root) return;
    const i = document.createElement("i");
    i.style.cssText = "left:" + x + "px;top:" + y + "px;width:14px;height:14px";
    i.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">' +
      '<ellipse cx="7.2" cy="8.4" rx="2.5" ry="3.2"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.3"/>' +
      '<ellipse cx="16.8" cy="8.4" rx="2.5" ry="3.2"/>' +
      '<path d="M12 12.4c3.3 0 5.6 2.2 5.6 4.6 0 2-1.6 3.2-3.5 2.7-1.4-.4-2.8-.4-4.2 0-1.9.5-3.5-.7-3.5-2.7 0-2.4 2.3-4.6 5.6-4.6Z"/></svg>';
    root.appendChild(i);
    setTimeout(() => i.remove(), 1100);
  }

  function add(fn){
    tickers.add(fn);
    if(!running){ running = true; requestAnimationFrame(loop); }
    return () => tickers.delete(fn);
  }
  function loop(now){
    if(document.hidden){ running = false; return; }   // pause expensive work
    tickers.forEach(fn => { try{ fn(now); }catch(e){ console.warn(e); } });
    if(tickers.size){ requestAnimationFrame(loop); } else { running = false; }
  }
  document.addEventListener("visibilitychange", () => {
    if(!document.hidden && !running && tickers.size){ running = true; requestAnimationFrame(loop); }
  });

  return {pos, add, count:() => tickers.size};
})();
