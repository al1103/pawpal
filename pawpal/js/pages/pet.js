(function(){
const esc = PP.util.esc;

PP.pages.pet = {
  title:"My pet — Pawpal",
  auth:true, needsPet:true,
  render(root){
    let view = null, timer = null;
    const pet = () => PP.store.state.pet;

    function header(){
      const p = pet(), prog = PP.data.levelProgress(p.xp);
      return `
        <div class="pet-top">
          <div>
            <h1>${PP.util.greeting()}, ${esc(PP.store.state.user.username)} 👋</h1>
            <div class="sub" data-sub></div>
          </div>
          <div class="row">
            <span class="lvl"><span class="ring2" style="--p:${prog.pct}"><span data-lv>${prog.level}</span></span>
              <span><strong style="font-size:13px">Level ${prog.level}</strong><br>
              <span class="qty" data-xp>${prog.into}/${prog.need} XP</span></span></span>
            <span class="coinpill">🪙 <span data-coins>${p.coins}</span></span>
            <button class="btn sm" data-daily>🎁 Daily</button>
          </div>
        </div>`;
    }

    function shell(){
      const p = pet(), ch = PP.pet.character();
      root.innerHTML = `
      <div class="page">
        ${header()}
        <div class="pet-layout">
          <aside class="panel sidecard">
            <h3>${esc(p.name)}'s status</h3>
            <div class="stack" data-bars>
              ${PP.ui.bar("hunger", p.hunger)}${PP.ui.bar("energy", p.energy)}
              ${PP.ui.bar("joy", p.joy)}${PP.ui.bar("health", p.health)}
            </div>
            <div style="margin-top:18px">
              <div class="bar" data-bar="xp"><span class="ic">✨</span>
                <span class="txt"><span class="lbl">EXPERIENCE</span>
                <span class="track"><span class="fill" data-xpfill style="width:0%;background:var(--accent)"></span></span></span>
                <span class="val" data-xpval></span></div>
            </div>
            <p class="hint" style="margin-top:16px" data-needs></p>
            <div class="stack" style="margin-top:14px">
              <a class="btn sm block" href="#/pet/customize">🎨 Customise</a>
              <a class="btn sm block" href="#/pet/inventory">🎒 Inventory</a>
              <a class="btn sm block" href="#/pet/achievements">🏆 Achievements</a>
            </div>
          </aside>

          <section class="pet-stage${p.asleep ? " night" : ""}" data-stage>
            <div data-animal style="width:100%;height:100%"></div>
            <div class="actions-bar" data-actions></div>
          </section>

          <aside class="panel sidecard side-b">
            <h3>Together</h3>
            <dl class="kv">
              <dt>CHARACTER</dt><dd>${esc(ch.name)} · ${esc(PP.data.speciesLabel[ch.species])}</dd>
              <dt>ADOPTED</dt><dd>${PP.util.dateLabel(p.createdAt)}</dd>
              <dt>DAYS</dt><dd data-days>${p.counters.days}</dd>
              <dt>MEALS</dt><dd data-feeds>${p.counters.feeds}</dd>
              <dt>GAMES</dt><dd data-games>${p.counters.games}</dd>
              <dt>BEST SCORE</dt><dd>${p.counters.bestGameScore || 0}</dd>
            </dl>
            <h3 style="margin-top:22px">Favourites</h3>
            <p class="hint">Loves ${PP.data.getItem(ch.favoriteFood).icon} ${esc(PP.data.getItem(ch.favoriteFood).name.toLowerCase())}
               — feeding it gives extra joy and XP.</p>
            <div class="foodgrid" style="margin-top:12px" data-quickfood></div>
          </aside>
        </div>
      </div>`;

      view = new PP.Animal({
        character:p.characterId, palette:p.palette, accessory:p.equipped.accessory,
        interactive:true,
        onClick:() => {
          PP.sound.unlock();
          const res = PP.pet.interact();
          if(!res.ok){ if(res.message) PP.ui.toast(res.message, {icon:"💤"}); return; }
          view.setState("happy"); view.say(res.message); view.fx("✨", 4);
          after(res);
        }
      });
      view.mount(root.querySelector("[data-animal]"));
      view.setState(PP.pet.moodState(), {rest:true});
      paintActions();
      paintQuickFood();
      paint();
    }

    function paintActions(){
      const p = pet();
      root.querySelector("[data-actions]").innerHTML = p.asleep
        ? `<button data-act="wake"><span class="em">☀️</span>Wake up</button>
           <button data-act="stats"><span class="em">📊</span>Status</button>`
        : `<button data-act="feed"><span class="em">🍎</span>Feed</button>
           <button data-act="pet"><span class="em">❤️</span>Pet</button>
           <button data-act="play"><span class="em">🎾</span>Play</button>
           <button data-act="sleep"><span class="em">😴</span>Sleep</button>
           <button data-act="interact"><span class="em">✨</span>Interact</button>`;
    }

    function paintQuickFood(){
      const host = root.querySelector("[data-quickfood]");
      const food = PP.inventory.list("food").slice(0, 4);
      host.innerHTML = food.length
        ? food.map(({item, qty}) => `
            <button class="fitem" data-feed="${item.id}">
              <span class="em">${item.icon}</span><span class="nm">${esc(item.name)}</span>
              <span class="meta">+${item.hunger} hunger</span><span class="qty">×${qty}</span>
            </button>`).join("")
        : PP.ui.empty("🧺", "No food left", "Visit the shop in your inventory.",
            '<a class="btn sm" href="#/pet/inventory">Open shop</a>');
    }

    function paint(){
      const p = pet();
      if(!root.querySelector("[data-bars]")) return;
      PP.ui.updateBars(root.querySelector("[data-bars]"), p);
      const prog = PP.data.levelProgress(p.xp);
      root.querySelector("[data-xpfill]").style.width = prog.pct + "%";
      root.querySelector("[data-xpval]").textContent = prog.into + "/" + prog.need;
      root.querySelector("[data-lv]").textContent = prog.level;
      root.querySelector("[data-xp]").textContent = prog.into + "/" + prog.need + " XP";
      root.querySelector(".ring2").style.setProperty("--p", prog.pct);
      root.querySelector("[data-coins]").textContent = p.coins;
      root.querySelector("[data-days]").textContent = p.counters.days;
      root.querySelector("[data-feeds]").textContent = p.counters.feeds;
      root.querySelector("[data-games]").textContent = p.counters.games;

      const needs = PP.pet.needsAttention();
      root.querySelector("[data-needs]").textContent = p.asleep
        ? p.name + " is asleep — energy is refilling."
        : needs.length ? needs[0].message : p.name + " is doing great right now.";
      root.querySelector("[data-sub]").textContent =
        p.name + " · " + (p.asleep ? "napping 😴" : PP.pet.moodState() === "hungry" ? "hungry 🍎" : "happy to see you");
      root.querySelector("[data-stage]").classList.toggle("night", !!p.asleep);
      PP.nav.refreshCoins();
    }

    /* shared post-action handling: animation, toast, level-up, achievements */
    function after(res){
      if(res.message) PP.ui.toast(res.message, {icon:res.fx || "🐾"});
      if(res.level && res.level.leveledUp){
        view.setState("levelup");
        PP.ui.levelUpCelebration(pet());
      }
      if(res.unlocked && res.unlocked.length) PP.ui.achievementPop(res.unlocked);
      paint(); paintQuickFood(); paintActions();
      PP.nav.render();
    }

    function feedModal(){
      const food = PP.inventory.list("food");
      PP.ui.modal({
        title:"What's for dinner?",
        subtitle:PP.pet.character().name + " loves " + PP.data.getItem(PP.pet.character().favoriteFood).name.toLowerCase() + ".",
        html:food.length
          ? '<div class="foodgrid">' + food.map(({item, qty}) => `
              <button class="fitem" data-feed="${item.id}">
                <span class="em">${item.icon}</span><span class="nm">${esc(item.name)}</span>
                <span class="meta">+${item.hunger} hunger · +${item.joy} joy</span>
                <span class="qty">×${qty}</span></button>`).join("") + "</div>"
          : PP.ui.empty("🧺", "The cupboard is empty", "Buy food from the shop with your coins.",
              '<a class="btn sm primary" href="#/pet/inventory" data-close>Open shop</a>')
      });
    }

    function playModal(){
      const toys = PP.inventory.list("toys");
      PP.ui.modal({
        title:"Time to play",
        subtitle:"Games earn coins, XP and a lot of joy.",
        html:`
          <div class="foodgrid">
            <button class="fitem" data-game="stars"><span class="em">⭐</span><span class="nm">Catch the star</span>
              <span class="meta">30s · coins + XP</span></button>
            ${toys.map(({item, qty}) => `
              <button class="fitem" data-toy="${item.id}"><span class="em">${item.icon}</span>
                <span class="nm">${esc(item.name)}</span><span class="meta">+${item.joy} joy</span>
                <span class="qty">×${qty}</span></button>`).join("")}
          </div>
          ${toys.length ? "" : '<p class="hint" style="margin-top:14px">Buy toys in the inventory shop for quick play sessions.</p>'}`
      });
    }

    function dailyModal(){
      const st = PP.reward.status();
      PP.ui.modal({
        title:"Daily reward",
        subtitle:st.claimedToday ? "Claimed today — come back tomorrow for day " + Math.min(7, st.day + 1) + "."
                                 : "Day " + st.day + " of your streak.",
        html:'<div class="foodgrid">' + PP.data.dailyRewards.map(r => `
              <div class="fitem" style="cursor:default;${r.day === st.day ? "outline:2px solid var(--accent)" : ""}
                   ${r.day < st.day ? "opacity:.5" : ""}">
                <span class="em">${r.icon}</span><span class="nm">Day ${r.day}</span>
                <span class="meta">${esc(r.label)}</span></div>`).join("") + "</div>" +
              '<div class="row" style="margin-top:20px;justify-content:flex-end">' +
              (st.claimedToday ? '<button class="btn" data-close>Close</button>'
                               : '<button class="btn primary" data-claim>Claim day ' + st.day + "</button>") + "</div>",
        mount(box){
          PP.util.on(box, "[data-claim]", "click", () => {
            const res = PP.reward.claim();
            PP.ui.close();
            PP.ui.toast(res.message, {icon:"🎁"});
            if(res.ok){ PP.ui.confetti(); view.setState("happy"); view.fx("🪙", 5); }
            paint(); paintQuickFood(); PP.nav.render();
          });
        }
      });
    }

    /* ---------- events ---------- */
    document.addEventListener("click", onGlobalClick);
    function onGlobalClick(e){
      const feedBtn = e.target.closest("[data-feed]");
      if(feedBtn){
        const res = PP.pet.feed(feedBtn.dataset.feed);
        PP.ui.close();
        if(!res.ok){ PP.ui.toast(res.message, {icon:"🚫"}); return; }
        view.setState("eating"); view.fx(res.fx, 4); view.say(res.loved ? "Yum!" : "Nom nom");
        after(res);
        return;
      }
      const toyBtn = e.target.closest("[data-toy]");
      if(toyBtn){
        const res = PP.inventory.use(toyBtn.dataset.toy);
        PP.ui.close();
        if(!res.ok){ PP.ui.toast(res.message, {icon:"🚫"}); return; }
        view.setState("playing"); view.fx(res.fx, 4);
        after(res);
        return;
      }
      const game = e.target.closest("[data-game]");
      if(game){
        PP.ui.close();
        PP.play.start(game.dataset.game, result => {
          const res = PP.pet.finishGame({score:result.score, gameId:game.dataset.game});
          view.setState("playing"); view.fx("⭐", 5);
          after(res);
        });
      }
    }

    PP.util.on(root, "[data-act]", "click", (e, b) => {
      PP.sound.unlock();
      const act = b.dataset.act;
      if(act === "feed") return feedModal();
      if(act === "play") return playModal();
      if(act === "stats") return PP.ui.toast(pet().name + " is asleep — energy is refilling.", {icon:"😴"});
      if(act === "pet"){
        const res = PP.pet.petIt();
        if(!res.ok){ PP.ui.toast(res.message || "Give it a moment.", {icon:"⏳"}); return; }
        view.setState("petting"); view.fx("💗", 6);
        after(res);
        return;
      }
      if(act === "sleep"){
        const res = PP.pet.sleep();
        if(!res.ok) return;
        view.setState("sleeping", {rest:true});
        after(res);
        return;
      }
      if(act === "wake"){
        const res = PP.pet.wake();
        if(!res.ok) return;
        view.setState("surprised");
        view.rest = "idle";
        after(res);
        return;
      }
      if(act === "interact"){
        const res = PP.pet.interact();
        if(!res.ok){ PP.ui.toast(res.message, {icon:"💤"}); return; }
        view.setState("happy"); view.say(res.message); view.fx("✨", 4);
        after(res);
      }
    });
    PP.util.on(root, "[data-daily]", "click", dailyModal);

    shell();

    /* live decay tick + idle mood refresh */
    timer = setInterval(() => {
      PP.pet.applyTime();
      paint();
      if(view && !view.stateUntil) view.setState(PP.pet.moodState(), {rest:true});
    }, 20000);

    /* nudge if something needs attention */
    const needs = PP.pet.needsAttention();
    if(needs.length) setTimeout(() => PP.notifications.push(needs[0].message, {icon:needs[0].icon, href:"#/pet"}), 800);

    return () => {
      clearInterval(timer);
      document.removeEventListener("click", onGlobalClick);
      if(view) view.destroy();
    };
  }
};
})();
