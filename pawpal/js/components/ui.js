window.PP = window.PP || {};
PP.ui = (function(){
  const esc = PP.util.esc;

  /* ---------------- toast ---------------- */
  function toast(message, opts){
    opts = opts || {};
    const root = document.getElementById("toastRoot");
    if(!root) return;
    const node = PP.util.el('<div class="toast"><span class="em">' + esc(opts.icon || "🐾") +
                            '</span><span>' + esc(message) + "</span></div>");
    root.appendChild(node);
    const life = opts.duration || 2800;
    setTimeout(() => { node.classList.add("out"); setTimeout(() => node.remove(), 320); }, life);
    return node;
  }

  /* ---------------- modal ---------------- */
  let openModal = null;
  function modal(opts){
    close();
    const host = document.getElementById("modalRoot");
    if(host) host.innerHTML = "";        // clear any backdrop still fading out
    const back = PP.util.el('<div class="modal-back"></div>');
    const box = PP.util.el('<div class="modal' + (opts.wide ? " wide" : "") + '" role="dialog" aria-modal="true"></div>');
    box.innerHTML =
      '<div class="modal-head"><div><h3 id="modalTitle">' + esc(opts.title || "") + '</h3>' +
      (opts.subtitle ? '<p class="sub">' + esc(opts.subtitle) + "</p>" : "") + "</div>" +
      (opts.dismissable === false ? "" :
        '<button class="iconbtn" data-close aria-label="Close dialog">✕</button>') + "</div>" +
      '<div class="modal-body">' + (opts.html || "") + "</div>";
    box.setAttribute("aria-labelledby", "modalTitle");
    back.appendChild(box);
    document.getElementById("modalRoot").appendChild(back);

    const prevFocus = document.activeElement;
    const focusables = () => PP.util.$$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', box);
    setTimeout(() => { const f = focusables(); (f[0] || box).focus(); }, 40);

    function onKey(e){
      if(e.key === "Escape" && opts.dismissable !== false){ close(); }
      if(e.key === "Tab"){
        const f = focusables();
        if(!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    back.addEventListener("mousedown", e => {
      if(e.target === back && opts.dismissable !== false) close();
    });
    PP.util.on(box, "[data-close]", "click", () => close());

    openModal = {
      back, box,
      close(){
        document.removeEventListener("keydown", onKey);
        back.style.opacity = "0";
        setTimeout(() => back.remove(), 180);
        openModal = null;
        if(prevFocus && prevFocus.focus) prevFocus.focus();
        if(opts.onClose) opts.onClose();
      }
    };
    if(opts.mount) opts.mount(box, openModal);
    return openModal;
  }
  function close(){ if(openModal) openModal.close(); }

  /* ---------------- confetti ---------------- */
  function confetti(){
    if(document.documentElement.dataset.motion === "off") return;
    const root = PP.util.el('<div class="confetti"></div>');
    const colors = ["#E8A79B", "#B79BD4", "#8FBF9F", "#E3B15E", "#FFFDFC"];
    for(let i = 0; i < 60; i++){
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.5) + "s";
      p.style.animationDuration = (1.3 + Math.random() * 0.9) + "s";
      root.appendChild(p);
    }
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 3000);
  }

  /* ---------------- bars ---------------- */
  const STAT_META = {
    hunger:{icon:"🍎", label:"HUNGER"}, energy:{icon:"⚡", label:"ENERGY"},
    joy:{icon:"💗", label:"JOY"}, health:{icon:"🩹", label:"HEALTH"},
    curiosity:{icon:"👀", label:"CURIOSITY"}, xp:{icon:"✨", label:"XP"}
  };
  function barColor(v){ return v >= 60 ? "var(--good)" : v >= 30 ? "var(--warn)" : "var(--bad)"; }
  function bar(key, value, opts){
    opts = opts || {};
    const m = STAT_META[key] || {icon:"•", label:String(key).toUpperCase()};
    const v = Math.round(value);
    return '<div class="bar" data-bar="' + esc(key) + '">' +
      '<span class="ic" aria-hidden="true">' + m.icon + "</span>" +
      '<span class="txt"><span class="lbl">' + m.label + "</span>" +
      '<span class="track"><span class="fill" style="width:' + PP.util.clamp(v, 0, 100) + "%;background:" +
      (opts.color || barColor(v)) + '"></span></span></span>' +
      '<span class="val">' + (opts.suffix != null ? esc(opts.suffix) : v + "%") + "</span></div>";
  }
  function updateBars(root, pet){
    ["hunger", "energy", "joy", "health"].forEach(k => {
      const el = root.querySelector('[data-bar="' + k + '"]');
      if(!el) return;
      const v = Math.round(pet[k]);
      el.querySelector(".fill").style.width = PP.util.clamp(v, 0, 100) + "%";
      el.querySelector(".fill").style.background = barColor(v);
      el.querySelector(".val").textContent = v + "%";
    });
  }

  function skeleton(h){ return '<div class="sk" style="height:' + h + 'px"></div>'; }
  function empty(icon, title, body, action){
    return '<div class="empty"><span class="em">' + esc(icon) + "</span><strong>" + esc(title) + "</strong>" +
      "<span>" + esc(body) + "</span>" + (action || "") + "</div>";
  }

  /* ---------------- decorative paw field ---------------- */
  function pawField(){
    const host = document.getElementById("pawField");
    if(!host) return;
    const n = innerWidth < 720 ? 7 : 13;
    let html = "";
    for(let i = 0; i < n; i++){
      const s = 16 + Math.random() * 26;
      html += '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" style="left:' +
        (Math.random() * 94) + "%;top:" + (Math.random() * 92) + "%;transform:rotate(" +
        Math.round(Math.random() * 90 - 45) + "deg);opacity:" + (0.06 + Math.random() * 0.08).toFixed(2) + '">' +
        '<ellipse cx="7.2" cy="8.4" rx="2.5" ry="3.2"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.3"/>' +
        '<ellipse cx="16.8" cy="8.4" rx="2.5" ry="3.2"/>' +
        '<path d="M12 12.4c3.3 0 5.6 2.2 5.6 4.6 0 2-1.6 3.2-3.5 2.7-1.4-.4-2.8-.4-4.2 0-1.9.5-3.5-.7-3.5-2.7 0-2.4 2.3-4.6 5.6-4.6Z"/></svg>';
    }
    host.innerHTML = html;
  }

  const pawIcon = (size) => '<svg width="' + (size || 14) + '" height="' + (size || 14) +
    '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<ellipse cx="7.2" cy="8.4" rx="2.5" ry="3.2"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.3"/>' +
    '<ellipse cx="16.8" cy="8.4" rx="2.5" ry="3.2"/>' +
    '<path d="M12 12.4c3.3 0 5.6 2.2 5.6 4.6 0 2-1.6 3.2-3.5 2.7-1.4-.4-2.8-.4-4.2 0-1.9.5-3.5-.7-3.5-2.7 0-2.4 2.3-4.6 5.6-4.6Z"/></svg>';

  function levelUpCelebration(pet){
    confetti();
    PP.sound.play("levelup");
    toast(pet.name + " reached level " + pet.level + "! 🎉", {icon:"🎉", duration:3400});
  }
  function achievementPop(list){
    (list || []).forEach((a, i) => setTimeout(() =>
      toast("Achievement unlocked — " + a.name + " (+" + a.reward + " coins)", {icon:a.icon, duration:3600}), i * 700));
  }

  return {toast, modal, close, confetti, bar, updateBars, skeleton, empty, pawField, pawIcon,
          levelUpCelebration, achievementPop, barColor};
})();
