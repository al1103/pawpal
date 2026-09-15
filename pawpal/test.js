const {JSDOM} = require("jsdom");
const fs = require("fs"), path = require("path");
const DIR = "/home/claude/pawpal";

const errors = [];
const dom = new JSDOM(fs.readFileSync(path.join(DIR, "index.html"), "utf8"), {
  runScripts:"outside-only", pretendToBeVisual:true, url:"http://localhost/"
});
const w = dom.window;
w.addEventListener("error", e => errors.push("window error: " + e.message));
["log","warn","error"].forEach(k => { w.console[k] = (...a) => { if(k!=="log") errors.push(k+": "+a.join(" ")); }; });

// minimal stubs jsdom lacks
w.AudioContext = function(){ return {currentTime:0, state:"running", resume(){}, createOscillator(){return {frequency:{},connect(){},start(){},stop(){}};}, createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}, destination:{}}; };
w.scrollTo = () => {};
if(!w.matchMedia) w.matchMedia = () => ({matches:false, addEventListener(){}, addListener(){}});
w.crypto = w.crypto || {};

const files = [
 "js/data/characters.js","js/data/items.js","js/data/achievements.js",
 "js/core/util.js","js/core/storage.js","js/core/store.js",
 "js/services/sound.js","js/services/auth.js","js/services/notifications.js",
 "js/services/pet.js","js/services/inventory.js","js/services/reward.js",
 "js/components/pointer.js","js/components/animal.js","js/components/ui.js","js/components/nav.js",
 "js/pages/landing.js","js/pages/characters.js","js/pages/auth.js","js/pages/adopt.js",
 "js/pages/pet.js","js/pages/play.js","js/pages/pet-pages.js","js/pages/user.js",
 "js/router.js","js/app.js"
];
files.forEach(f => {
  try{ w.eval(fs.readFileSync(path.join(DIR, f), "utf8")); }
  catch(e){ errors.push("LOAD " + f + ": " + e.message); }
});

const PP = w.PP;
function step(name, fn){
  try{ fn(); console.info("  ok  " + name); }
  catch(e){ errors.push("STEP " + name + ": " + e.message + "\n" + (e.stack||"").split("\n")[1]); console.info("  FAIL " + name); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(60); // boot

  step("boot rendered landing", () => {
    if(!w.document.querySelector(".hero")) throw new Error("no hero");
    if(!w.document.querySelector("#topbar .nav")) throw new Error("no nav");
    if(!w.document.querySelector(".animal svg")) throw new Error("no mascot svg");
  });

  for(const hash of ["#/characters","#/character/milo","#/character/nope","#/login","#/register","#/settings","#/nowhere"]){
    step("route " + hash, () => {
      w.location.hash = hash;
      w.dispatchEvent(new w.Event("hashchange"));
      if(!w.document.querySelector("#main .page")) throw new Error("empty page for " + hash);
    });
  }

  step("guard: /pet redirects when logged out", () => {
    w.location.hash = "#/pet";
    w.dispatchEvent(new w.Event("hashchange"));
    if(w.location.hash.indexOf("#/login") !== 0) throw new Error("expected login redirect, got " + w.location.hash);
  });

  await step("register", async () => {});
  const res = await PP.auth.register({username:"Zilong", email:"z@example.com", password:"supersecret", confirm:"supersecret", remember:true});
  step("register ok", () => { if(!res.ok) throw new Error(JSON.stringify(res.errors)); });
  step("password not stored in plain text", () => {
    const raw = JSON.stringify(w.localStorage.getItem("pawpal:users"));
    if(raw.indexOf("supersecret") >= 0) throw new Error("plain password found in storage");
  });
  const bad = await PP.auth.register({username:"x", email:"nope", password:"short", confirm:"no"});
  step("register validation", () => {
    if(bad.ok) throw new Error("invalid form accepted");
    ["username","email","password","confirm"].forEach(k => { if(!bad.errors[k]) throw new Error("missing error " + k); });
  });

  step("adopt flow page", () => {
    w.location.hash = "#/adopt";
    w.dispatchEvent(new w.Event("hashchange"));
    if(!w.document.querySelector("[data-pick]")) throw new Error("no character picker");
  });

  step("create pet", () => {
    const p = PP.pet.create("tito", "Tito");
    if(!p || p.name !== "Tito") throw new Error("pet not created");
    if(PP.store.state.pet.coins < 120) throw new Error("wrong starting coins: " + PP.store.state.pet.coins);
  });

  step("pet dashboard renders", () => {
    w.location.hash = "#/pet";
    w.dispatchEvent(new w.Event("hashchange"));
    if(!w.document.querySelector(".pet-stage .animal svg")) throw new Error("no pet on stage");
    if(w.document.querySelectorAll("[data-act]").length < 5) throw new Error("missing actions");
  });

  step("feed changes state", () => {
    const before = PP.store.state.pet.hunger;
    const r = PP.pet.feed("fish");
    if(!r.ok) throw new Error(r.message);
    if(PP.store.state.pet.hunger <= before) throw new Error("hunger did not rise");
    if(PP.store.state.pet.counters.feeds !== 1) throw new Error("counter not incremented");
    if((PP.store.state.pet.inventory.fish || 0) !== 2) throw new Error("inventory not decremented");
  });
  step("feed missing item fails cleanly", () => {
    const r = PP.pet.feed("frisbee");
    if(r.ok) throw new Error("fed a frisbee");
  });
  step("pet + cooldown", () => {
    const a = PP.pet.petIt();
    if(!a.ok) throw new Error("first pet failed");
    const b = PP.pet.petIt();
    if(b.ok) throw new Error("cooldown not enforced");
  });
  step("sleep / wake", () => {
    if(!PP.pet.sleep().ok) throw new Error("sleep failed");
    if(PP.pet.feed("apple").ok) throw new Error("fed while asleep");
    if(!PP.pet.wake().ok) throw new Error("wake failed");
  });
  step("game rewards", () => {
    const coins = PP.store.state.pet.coins;
    const r = PP.pet.finishGame({score:10, gameId:"stars"});
    if(!r.ok || PP.store.state.pet.coins <= coins) throw new Error("no coins awarded");
  });
  step("xp and levels", () => {
    PP.pet.addXp(400);
    if(PP.store.state.pet.level < 3) throw new Error("level did not rise, got " + PP.store.state.pet.level);
    const prog = PP.data.levelProgress(PP.store.state.pet.xp);
    if(prog.pct < 0 || prog.pct > 100) throw new Error("bad progress pct");
  });
  step("achievements unlock", () => {
    if(PP.store.state.pet.achievements.indexOf("first-friend") < 0) throw new Error("first-friend not unlocked");
  });
  step("shop: buy and not enough coins", () => {
    PP.store.state.pet.coins = 100;
    const ok = PP.inventory.buy("apple");
    if(!ok.ok) throw new Error(ok.message);
    PP.store.state.pet.coins = 1;
    const no = PP.inventory.buy("crown");
    if(no.ok) throw new Error("bought without coins");
  });
  step("equip accessory requires ownership", () => {
    const no = PP.inventory.equip("crown");
    if(no.ok) throw new Error("equipped unowned crown");
    PP.inventory.add("bow", 1);
    if(!PP.inventory.equip("bow").ok) throw new Error("could not equip owned bow");
    if(PP.store.state.pet.equipped.accessory !== "bow") throw new Error("accessory not set");
  });
  step("daily reward once per day", () => {
    const a = PP.reward.claim();
    if(!a.ok) throw new Error(a.message);
    const b = PP.reward.claim();
    if(b.ok) throw new Error("claimed twice");
  });
  step("time decay from timestamps", () => {
    const p = PP.store.state.pet;
    p.hunger = 90; p.lastUpdated = Date.now() - 6*3600*1000;
    PP.store.setPet(p);
    PP.pet.applyTime();
    if(PP.store.state.pet.hunger >= 90) throw new Error("no decay applied");
    if(PP.store.state.pet.hunger < 40) throw new Error("decay too punishing: " + PP.store.state.pet.hunger);
  });

  for(const hash of ["#/pet/customize","#/pet/inventory","#/pet/achievements","#/profile","#/settings","#/pet"]){
    step("route " + hash, () => {
      w.location.hash = hash;
      w.dispatchEvent(new w.Event("hashchange"));
      if(!w.document.querySelector("#main .page")) throw new Error("empty page");
    });
  }

  step("persistence across reload", () => {
    const stored = JSON.parse(w.localStorage.getItem("pawpal:pet:" + PP.store.state.user.id));
    if(!stored || stored.name !== "Tito") throw new Error("pet not persisted");
  });

  step("notifications", () => {
    PP.notifications.push("test message", {icon:"🔔"});
    if(PP.notifications.unread() < 1) throw new Error("unread count wrong");
    PP.notifications.markAllRead();
    if(PP.notifications.unread() !== 0) throw new Error("mark all read failed");
  });

  step("dark mode", () => {
    PP.store.setSettings({theme:"dark"});
    PP.app.applyTheme();
    if(w.document.documentElement.dataset.theme !== "dark") throw new Error("theme not applied");
    PP.store.setSettings({theme:"light"});
    PP.app.applyTheme();
  });

  step("logout clears pet from state", () => {
    PP.auth.logout();
    if(PP.store.state.pet) throw new Error("pet still loaded");
    if(!w.localStorage.getItem("pawpal:users")) throw new Error("users wiped");
  });
  step("login restores pet", async () => {});
  const lg = await PP.auth.login({email:"z@example.com", password:"supersecret"});
  step("login ok + pet restored", () => {
    if(!lg.ok) throw new Error(JSON.stringify(lg.errors));
    if(!PP.store.state.pet || PP.store.state.pet.name !== "Tito") throw new Error("pet not restored after login");
  });
  const wrong = await PP.auth.login({email:"z@example.com", password:"wrongpass"});
  step("wrong password rejected", () => { if(wrong.ok) throw new Error("accepted wrong password"); });

  step("no dead links", () => {
    const routes = PP.router.ROUTES.map(r => r.path);
    const bad = [];
    ["#/","#/characters","#/pet","#/pet/inventory","#/settings","#/profile"].forEach(h => {
      w.location.hash = h; w.dispatchEvent(new w.Event("hashchange"));
      Array.from(w.document.querySelectorAll(String.raw`#main a[href^="#/"], #topbar a[href^="#/"], #bottomnav a[href^="#/"]`)).forEach(a => {
        const p = a.getAttribute("href").split("?")[0].slice(1).replace(/\/+$/,"") || "/";
        const ok = routes.some(r => {
          const rp = r.split("/"), pp = p.split("/");
          return rp.length === pp.length && rp.every((seg,i) => seg.startsWith(":") || seg === pp[i]);
        });
        if(!ok) bad.push(a.getAttribute("href"));
      });
    });
    if(bad.length) throw new Error("unknown routes: " + [...new Set(bad)].join(", "));
  });

  // ---------- UI interaction pass ----------
  function click(sel, root){
    const el = (root||w.document).querySelector(sel);
    if(!el) throw new Error("missing element " + sel);
    el.dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
    return el;
  }
  w.location.hash = "#/pet"; w.dispatchEvent(new w.Event("hashchange"));
  await wait(1300);  // let the feed cooldown lapse
  step("UI: feed modal opens and feeds", () => {
    click('[data-act="feed"]');
    const m = w.document.querySelector(".modal");
    if(!m) throw new Error("no modal");
    const before = PP.store.state.pet.counters.feeds;
    click("[data-feed]", m);
    if(PP.store.state.pet.counters.feeds !== before + 1) throw new Error("feed click did nothing");
  });
  await wait(260);
  step("UI: modal closed after feeding", () => {
    if(w.document.querySelector(".modal")) throw new Error("modal did not close");
  });
  step("UI: toast rendered", () => {
    if(!w.document.querySelector("#toastRoot .toast")) throw new Error("no toast");
  });
  await wait(260);
  step("UI: play modal + mini-game runs", () => {
    click('[data-act="play"]');
    click('[data-game="stars"]', w.document.querySelector(".modal"));
    if(!w.document.querySelector(".game")) throw new Error("game field missing");
  });
  await wait(260);
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", {key:"Escape", bubbles:true}));
  await wait(260);
  step("UI: modal escape closes", () => {
    if(w.document.querySelector(".modal")) throw new Error("escape did not close modal");
  });
  step("UI: pet action button", () => {
    w.location.hash = "#/pet"; w.dispatchEvent(new w.Event("hashchange"));
    const joy = PP.store.state.pet.joy;
    click('[data-act="pet"]');
    if(PP.store.state.pet.joy < joy) throw new Error("joy dropped");
  });
  step("UI: sleep switches action bar", () => {
    click('[data-act="sleep"]');
    if(!w.document.querySelector('[data-act="wake"]')) throw new Error("wake button missing");
    click('[data-act="wake"]');
    if(!w.document.querySelector('[data-act="feed"]')) throw new Error("feed button missing after wake");
  });
  step("UI: customise palette + rename", () => {
    w.location.hash = "#/pet/customize"; w.dispatchEvent(new w.Event("hashchange"));
    click('[data-pal="mint"]');
    if(PP.store.state.pet.palette !== "mint") throw new Error("palette not saved");
    w.document.querySelector("#nm").value = "Mochi";
    click("[data-rename]");
    if(PP.store.state.pet.name !== "Mochi") throw new Error("rename failed");
  });
  step("UI: inventory shop buy", () => {
    w.location.hash = "#/pet/inventory"; w.dispatchEvent(new w.Event("hashchange"));
    PP.store.state.pet.coins = 500;
    click('[data-mode="shop"]');
    const buy = w.document.querySelector("[data-buy]");
    if(!buy) throw new Error("no shop items");
    buy.dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
    if(PP.store.state.pet.coins >= 500) throw new Error("coins not spent");
  });
  step("UI: landing character switcher", () => {
    w.location.hash = "#/"; w.dispatchEvent(new w.Event("hashchange"));
    click('[data-pick="milo"]');
    if(w.document.querySelector('[data-pick="milo"]').getAttribute("aria-selected") !== "true") throw new Error("not selected");
  });
  step("UI: notifications panel", () => {
    PP.notifications.push("hello there", {icon:"🔔"});
    PP.nav.render();
    click('[data-panel="notif"]');
    if(!w.document.querySelector(".pop .nitem")) throw new Error("panel empty");
  });
  step("a11y: labels present", () => {
    const svg = w.document.querySelector(".animal svg");
    if(!svg.getAttribute("aria-label")) throw new Error("mascot has no label");
    const unlabeled = Array.from(w.document.querySelectorAll("#topbar button"))
      .filter(b => !b.textContent.trim() && !b.getAttribute("aria-label"));
    if(unlabeled.length) throw new Error(unlabeled.length + " unlabeled buttons");
  });

  step("no cross-page handler leaks", () => {
    ["#/", "#/characters", "#/adopt", "#/", "#/adopt"].forEach(h => {
      w.location.hash = h; w.dispatchEvent(new w.Event("hashchange"));
    });
    const pick = w.document.querySelector('[data-pick="yuki"]');
    pick.dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
    if(pick.getAttribute("aria-pressed") !== "true") throw new Error("adopt picker broken after revisits");
  });
  step("animation tickers do not accumulate", () => {
    w.location.hash = "#/settings"; w.dispatchEvent(new w.Event("hashchange"));
    w.location.hash = "#/"; w.dispatchEvent(new w.Event("hashchange"));
    const n = PP.pointer.count ? PP.pointer.count() : null;
    if(n !== null && n > 12) throw new Error("too many live animals: " + n);
  });

  await wait(80);
  console.info("\n=== errors (" + errors.length + ") ===");
  errors.slice(0, 25).forEach(e => console.info("- " + e));
  process.exit(errors.length ? 1 : 0);
})();
