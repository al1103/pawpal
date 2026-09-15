window.PP = window.PP || {};
PP.app = (function(){

  function applyTheme(){
    const s = PP.store.state.settings;
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    document.documentElement.dataset.theme = s.theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.motion = reduce ? "off" : (s.motion || "full");
  }

  /* the equipped background tints the whole environment */
  function applyBackground(){
    const pet = PP.store.state.pet;
    const bg = pet ? PP.data.getItem(pet.equipped.background) : null;
    const r = document.documentElement.style;
    if(bg && bg.accent){
      r.setProperty("--accent", bg.accent);
      r.setProperty("--accent-soft", bg.soft);
    }else{
      r.removeProperty("--accent");
      r.removeProperty("--accent-soft");
    }
  }

  function sleepClass(){
    document.body.classList.toggle("sleeping", !!(PP.store.state.pet && PP.store.state.pet.asleep));
  }

  /* first paint while the session is being restored — never a blank screen */
  function bootSkeleton(){
    const main = document.getElementById("main");
    main.innerHTML = '<div class="page"><div class="hero">' +
      '<div class="stack">' + PP.ui.skeleton(26) + PP.ui.skeleton(120) + PP.ui.skeleton(60) +
      '<div class="row">' + PP.ui.skeleton(52) + "</div></div>" +
      '<div class="stage">' + PP.ui.skeleton(380) + "</div></div></div>";
  }

  async function boot(){
    applyTheme();
    PP.ui.pawField();
    bootSkeleton();

    const restored = await PP.auth.restore();
    if(restored && restored.expired){
      PP.ui.toast("Your session expired — please sign in again.", {icon:"⏰", duration:4000});
    }

    if(PP.store.state.pet){
      PP.pet.applyTime();
      const needs = PP.pet.needsAttention();
      needs.slice(0, 1).forEach(n => PP.notifications.push(n.message, {icon:n.icon, href:"#/pet", sound:false}));
      const daily = PP.reward.status();
      if(!daily.claimedToday) PP.notifications.push("Daily reward available 🎁", {icon:"🎁", href:"#/pet", sound:false});
    }
    applyBackground();
    sleepClass();

    if(!location.hash) location.hash = "#/";
    PP.router.render();

    /* keep nav + environment in sync with the store */
    PP.store.subscribe((state, reason) => {
      if(reason === "pet" || reason === "user"){ applyBackground(); sleepClass(); PP.nav.refreshCoins(); }
      if(reason === "notifications" || reason === "user") PP.nav.render();
      if(reason === "settings") applyTheme();
    });

    /* audio may only start after a real interaction */
    const unlock = () => { PP.sound.unlock(); document.removeEventListener("pointerdown", unlock); };
    document.addEventListener("pointerdown", unlock);

    /* offline progress when returning to the tab */
    document.addEventListener("visibilitychange", () => {
      if(!document.hidden && PP.store.state.pet){
        PP.pet.applyTime();
        if(location.hash.indexOf("#/pet") === 0) PP.router.reload();
      }
    });

    /* time spent counts toward the profile */
    setInterval(() => {
      if(document.hidden || !PP.store.state.pet) return;
      const p = PP.store.state.pet;
      p.counters.playMinutes = (p.counters.playMinutes || 0) + 1;
      PP.store.savePet();
      PP.auth.addPlayMinutes(1);
    }, 60000);

    if(!PP.storage.available){
      PP.ui.toast("Storage is blocked in this browser — progress will not be saved.", {icon:"⚠️", duration:5000});
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return {applyTheme, applyBackground, boot};
})();
