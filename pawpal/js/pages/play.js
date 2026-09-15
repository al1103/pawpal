/* Mini-games. `start(id, onFinish)` opens the game in a modal and reports the score. */
(function(){
PP.play = (function(){

  function start(gameId, onFinish){
    if(gameId !== "stars") return;
    let score = 0, time = 30, running = true, raf = null, spawnAt = 0, tickAt = 0;
    const stars = [];

    const modal = PP.ui.modal({
      title:"Catch the star",
      subtitle:"Tap every star before it fades. 30 seconds.",
      wide:true,
      html:`<div class="gamebar"><span>⭐ <span data-score>0</span></span>
              <span data-time>30s</span></div>
            <div class="game" data-field tabindex="0" aria-label="Game field — stars appear, click them"></div>
            <p class="hint" style="margin-top:12px">Tip: stars are worth more when you catch them quickly.</p>`,
      onClose(){ stop(false); }
    });

    const field = modal.box.querySelector("[data-field]");
    const scoreEl = modal.box.querySelector("[data-score]");
    const timeEl = modal.box.querySelector("[data-time]");
    PP.sound.unlock();

    function spawn(){
      const r = field.getBoundingClientRect();
      const s = document.createElement("button");
      s.className = "star";
      s.type = "button";
      s.setAttribute("aria-label", "Catch star");
      s.textContent = Math.random() < 0.15 ? "🌟" : "⭐";
      const x = 30 + Math.random() * (r.width - 60);
      const y = 30 + Math.random() * (r.height - 60);
      s.style.left = x + "px"; s.style.top = y + "px";
      const born = performance.now();
      s.addEventListener("click", ev => {
        ev.stopPropagation();
        if(!running || s.dataset.hit) return;
        s.dataset.hit = "1";
        const quick = performance.now() - born < 900;
        score += (s.textContent === "🌟" ? 3 : 1) + (quick ? 1 : 0);
        scoreEl.textContent = score;
        s.classList.add("hit");
        PP.sound.play("coin");
        setTimeout(() => s.remove(), 320);
      });
      field.appendChild(s);
      stars.push({el:s, until:performance.now() + 1700});
    }

    function loop(now){
      if(!running) return;
      if(now > spawnAt){ spawn(); spawnAt = now + 520 + Math.random() * 380; }
      if(now > tickAt){
        tickAt = now + 1000;
        time -= 1;
        timeEl.textContent = Math.max(0, time) + "s";
        if(time <= 0){ stop(true); return; }
      }
      for(let i = stars.length - 1; i >= 0; i--){
        if(now > stars[i].until){
          if(!stars[i].el.dataset.hit) stars[i].el.remove();
          stars.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(loop);
    }

    function stop(finished){
      if(!running) return;
      running = false;
      cancelAnimationFrame(raf);
      stars.forEach(s => s.el.remove());
      if(!finished) return;
      PP.ui.close();
      setTimeout(() => {
        const coins = Math.round(score * 2.5), xp = Math.round(score * 3);
        PP.ui.modal({
          title:"Game over — " + score + " caught!",
          subtitle:"Nice reflexes.",
          html:`<div class="foodgrid">
                  <div class="fitem" style="cursor:default"><span class="em">⭐</span><span class="nm">${score}</span><span class="meta">stars</span></div>
                  <div class="fitem" style="cursor:default"><span class="em">🪙</span><span class="nm">+${coins}</span><span class="meta">coins</span></div>
                  <div class="fitem" style="cursor:default"><span class="em">✨</span><span class="nm">+${xp}</span><span class="meta">XP</span></div>
                </div>
                <div class="row" style="margin-top:20px;justify-content:flex-end">
                  <button class="btn ghost" data-again>Play again</button>
                  <button class="btn primary" data-close>Done</button></div>`,
          mount(box){
            PP.util.on(box, "[data-again]", "click", () => { PP.ui.close(); setTimeout(() => start("stars", onFinish), 160); });
          }
        });
        if(onFinish) onFinish({score, gameId:"stars"});
      }, 180);
    }

    spawnAt = performance.now() + 250;
    tickAt = performance.now() + 1000;
    raf = requestAnimationFrame(loop);
  }

  return {start};
})();
})();
