(function(){
const esc = PP.util.esc;

/* ============================ CUSTOMISE ============================ */
PP.pages.customize = {
  title:"Customise — Pawpal",
  auth:true, needsPet:true,
  render(root){
    const p = () => PP.store.state.pet;
    let view;

    root.innerHTML = `
    <div class="page">
      <a class="linky" href="#/pet" style="margin:10px 0 16px;display:inline-flex">← Back to ${esc(p().name)}</a>
      <div class="cz">
        <section class="panel" style="padding:10px">
          <div class="pet-stage" style="min-height:clamp(320px,50vh,500px);background:none;border:0">
            <div data-animal style="width:100%;height:100%"></div>
          </div>
        </section>
        <aside class="stack">
          <div class="panel">
            <h3 style="margin:0 0 10px">Name</h3>
            <div class="field">
              <div class="input" data-wrap="nm"><input id="nm" maxlength="24" value="${esc(p().name)}"></div>
              <span class="err" id="e-nm" role="alert"></span>
            </div>
            <button class="btn sm" data-rename>Save name</button>
          </div>

          <div class="panel">
            <h3 style="margin:0 0 12px">Colour</h3>
            <div class="swatches" data-palettes>
              ${PP.data.palettes.map(pal => `
                <button class="sw" data-pal="${pal.id}" aria-pressed="${pal.id === p().palette}"
                  title="${esc(pal.name)}" aria-label="${esc(pal.name)}"
                  style="background:${pal.fur}"></button>`).join("")}
            </div>
          </div>

          <div class="panel">
            <h3 style="margin:0 0 12px">Accessory</h3>
            <div class="opts" data-acc></div>
          </div>

          <div class="panel">
            <h3 style="margin:0 0 12px">Background</h3>
            <div class="opts" data-bg></div>
          </div>
        </aside>
      </div>
    </div>`;

    view = new PP.Animal({character:p().characterId, palette:p().palette,
                          accessory:p().equipped.accessory, interactive:true, state:"happy"});
    view.mount(root.querySelector("[data-animal]"));
    view.rest = "idle";

    function paintOptions(){
      root.querySelector("[data-acc]").innerHTML =
        `<button class="opt" data-acc-id="" aria-pressed="${!p().equipped.accessory}">
           <span class="em">🚫</span>None</button>` +
        PP.data.accessories.map(a => {
          const owned = PP.inventory.owns(a.id);
          return `<button class="opt" data-acc-id="${a.id}" ${owned ? "" : "disabled"}
                    aria-pressed="${p().equipped.accessory === a.id}"
                    title="${owned ? esc(a.name) : "Buy in the shop for " + a.price + " coins"}">
                    <span class="em">${a.icon}</span>${esc(a.name)}${owned ? "" : " 🔒"}</button>`;
        }).join("");
      root.querySelector("[data-bg]").innerHTML = PP.data.backgrounds.map(b => {
        const owned = PP.inventory.owns(b.id);
        return `<button class="opt" data-bg-id="${b.id}" ${owned ? "" : "disabled"}
                  aria-pressed="${p().equipped.background === b.id}"
                  title="${owned ? esc(b.name) : "Buy in the shop for " + b.price + " coins"}">
                  <span class="em">${b.icon}</span>${esc(b.name)}${owned ? "" : " 🔒"}</button>`;
      }).join("");
    }
    paintOptions();

    PP.util.on(root, "[data-pal]", "click", (e, b) => {
      PP.pet.customize({palette:b.dataset.pal});
      PP.util.$$("[data-pal]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      view.setPalette(b.dataset.pal);
      view.setState("happy");
      PP.sound.play("click");
    });
    PP.util.on(root, "[data-acc-id]", "click", (e, b) => {
      const id = b.dataset.accId;
      const res = id ? PP.inventory.equip(id) : PP.inventory.unequip("accessory");
      if(!res.ok){ PP.ui.toast(res.message, {icon:"🔒"}); return; }
      view.setAccessory(id || null);
      view.setState("happy"); view.fx("✨", 3);
      paintOptions();
      PP.ui.toast(res.message, {icon:id ? PP.data.getItem(id).icon : "🐾"});
    });
    PP.util.on(root, "[data-bg-id]", "click", (e, b) => {
      const res = PP.inventory.equip(b.dataset.bgId);
      if(!res.ok){ PP.ui.toast(res.message, {icon:"🔒"}); return; }
      paintOptions();
      PP.app.applyBackground();
      PP.ui.toast(res.message, {icon:PP.data.getItem(b.dataset.bgId).icon});
    });
    PP.util.on(root, "[data-rename]", "click", () => {
      const input = root.querySelector("#nm");
      const res = PP.pet.rename(input.value);
      if(!res.ok){
        root.querySelector("#e-nm").textContent = res.error;
        root.querySelector('[data-wrap="nm"]').classList.add("bad");
        PP.sound.play("error");
        return;
      }
      root.querySelector("#e-nm").textContent = "";
      root.querySelector('[data-wrap="nm"]').classList.remove("bad");
      view.say("I'm " + res.name + "!");
      view.setState("happy");
      PP.ui.toast("Saved — say hello to " + res.name, {icon:"💗"});
      PP.nav.render();
    });

    return () => view.destroy();
  }
};

/* ============================ INVENTORY ============================ */
PP.pages.inventory = {
  title:"Inventory — Pawpal",
  auth:true, needsPet:true,
  render(root){
    let tab = "food", mode = "owned";
    const CATS = [{id:"food", label:"Food"}, {id:"toys", label:"Toys"},
                  {id:"accessories", label:"Accessories"}, {id:"backgrounds", label:"Backgrounds"}];

    root.innerHTML = `
    <div class="page">
      <div class="spread" style="margin:14px 0 18px">
        <div><h2 style="margin:0">Inventory</h2>
          <p class="muted" style="font-weight:700;margin:4px 0 0">Everything ${esc(PP.store.state.pet.name)} owns — and the shop.</p></div>
        <div class="row">
          <span class="coinpill">🪙 <span data-coins>${PP.store.state.pet.coins}</span></span>
          <div class="filters">
            <button data-mode="owned" aria-pressed="true">Owned</button>
            <button data-mode="shop" aria-pressed="false">Shop</button>
          </div>
        </div>
      </div>
      <div class="inv-tabs" role="tablist">
        ${CATS.map(c => `<button role="tab" data-tab="${c.id}" aria-selected="${c.id === "food"}">${esc(c.label)}</button>`).join("")}
      </div>
      <div class="grid g4" data-list></div>
    </div>`;

    function card(item, qty, owned){
      const price = item.price;
      const equipped = item.slot && PP.store.state.pet.equipped[item.slot] === item.id;
      let action = "";
      if(mode === "shop"){
        action = `<button class="btn sm primary" data-buy="${item.id}">Buy · 🪙 ${price}</button>`;
      }else if(item.category === "food"){
        action = `<button class="btn sm" data-feed2="${item.id}">Feed</button>`;
      }else if(item.category === "toys"){
        action = `<button class="btn sm" data-use="${item.id}">Play</button>`;
      }else{
        action = equipped
          ? `<button class="btn sm ghost" data-unequip="${item.slot}">Unequip</button>`
          : `<button class="btn sm" data-equip="${item.id}">Equip</button>`;
      }
      return `<article class="iitem">
        <div class="spread"><span class="em">${item.icon}</span>
          <span class="tag ${item.rarity}">${PP.data.rarityLabel[item.rarity]}</span></div>
        <div class="nm">${esc(item.name)} ${qty ? `<span class="qty">×${qty}</span>` : ""}</div>
        <p>${esc(item.description)}</p>
        ${equipped ? '<span class="qty">Equipped ✓</span>' : ""}
        ${action}</article>`;
    }

    function paint(){
      const host = root.querySelector("[data-list]");
      if(mode === "shop"){
        const items = PP.inventory.shop(tab);
        host.innerHTML = items.length
          ? items.map(i => card(i, 0, PP.inventory.owns(i.id))).join("")
          : PP.ui.empty("🛒", "Nothing to buy here", "This category has no purchasable items.");
        return;
      }
      const owned = PP.inventory.list(tab);
      if(tab === "backgrounds"){
        const bgs = PP.data.backgrounds.filter(b => PP.inventory.owns(b.id));
        host.innerHTML = bgs.map(b => card(b, 0, true)).join("");
        return;
      }
      host.innerHTML = owned.length
        ? owned.map(({item, qty}) => card(item, qty, true)).join("")
        : PP.ui.empty("🎒", "Nothing here yet", "Switch to the shop to spend your coins.",
            '<button class="btn sm primary" data-mode="shop">Open shop</button>');
    }
    paint();

    PP.util.on(root, "[data-tab]", "click", (e, b) => {
      tab = b.dataset.tab;
      PP.util.$$("[data-tab]", root).forEach(x => x.setAttribute("aria-selected", String(x === b)));
      PP.sound.play("click");
      paint();
    });
    PP.util.on(root, "[data-mode]", "click", (e, b) => {
      mode = b.dataset.mode;
      PP.util.$$("[data-mode]", root).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.mode === mode)));
      paint();
    });
    PP.util.on(root, "[data-buy]", "click", (e, b) => {
      const res = PP.inventory.buy(b.dataset.buy);
      PP.ui.toast(res.message, {icon:res.ok ? "🪙" : "🚫"});
      if(!res.ok) PP.sound.play("error");
      root.querySelector("[data-coins]").textContent = PP.store.state.pet.coins;
      PP.nav.refreshCoins();
      paint();
    });
    PP.util.on(root, "[data-feed2]", "click", (e, b) => {
      const res = PP.pet.feed(b.dataset.feed2);
      PP.ui.toast(res.message, {icon:res.ok ? res.fx : "🚫"});
      if(res.unlocked) PP.ui.achievementPop(res.unlocked);
      paint(); PP.nav.render();
    });
    PP.util.on(root, "[data-use]", "click", (e, b) => {
      const res = PP.inventory.use(b.dataset.use);
      PP.ui.toast(res.message, {icon:res.ok ? "🎾" : "🚫"});
      paint(); PP.nav.render();
    });
    PP.util.on(root, "[data-equip]", "click", (e, b) => {
      const res = PP.inventory.equip(b.dataset.equip);
      PP.ui.toast(res.message, {icon:res.ok ? "✨" : "🚫"});
      PP.app.applyBackground();
      paint();
    });
    PP.util.on(root, "[data-unequip]", "click", (e, b) => {
      PP.inventory.unequip(b.dataset.unequip);
      PP.app.applyBackground();
      PP.ui.toast("Removed.", {icon:"🐾"});
      paint();
    });
  }
};

/* ============================ ACHIEVEMENTS ============================ */
PP.pages.achievements = {
  title:"Achievements — Pawpal",
  auth:true, needsPet:true,
  render(root){
    const p = PP.store.state.pet;
    const unlocked = PP.data.achievements.filter(a => p.achievements.indexOf(a.id) >= 0);
    const locked = PP.data.achievements.filter(a => p.achievements.indexOf(a.id) < 0);

    const row = (a, isLocked) => {
      const pr = a.progress(p);
      const pct = Math.min(100, Math.round((pr.now / pr.goal) * 100));
      return `<article class="ach ${isLocked ? "locked" : ""}">
        <span class="em" aria-hidden="true">${isLocked ? "🔒" : a.icon}</span>
        <div>
          <h4>${esc(a.name)} ${isLocked ? "" : "✓"}</h4>
          <p>${esc(a.description)} · reward 🪙 ${a.reward}</p>
          ${isLocked ? `<div class="bar" style="margin-top:8px;grid-template-columns:1fr auto">
            <span class="txt"><span class="track"><span class="fill" style="width:${pct}%"></span></span></span>
            <span class="val">${Math.min(pr.now, pr.goal)}/${pr.goal}</span></div>` : ""}
        </div></article>`;
    };

    root.innerHTML = `
    <div class="page">
      <div class="spread" style="margin:14px 0 20px">
        <div><h2 style="margin:0">Achievements</h2>
          <p class="muted" style="font-weight:700;margin:4px 0 0">${unlocked.length} of ${PP.data.achievements.length} unlocked with ${esc(p.name)}.</p></div>
        <a class="btn sm" href="#/pet">Back to pet</a>
      </div>
      ${unlocked.length ? `<div class="grid g2">${unlocked.map(a => row(a, false)).join("")}</div>` : ""}
      <h3 style="margin:26px 0 12px">Still to earn</h3>
      ${locked.length ? `<div class="grid g2">${locked.map(a => row(a, true)).join("")}</div>`
        : PP.ui.empty("🏆", "Everything unlocked", "You and " + p.name + " did it all. Keep visiting anyway.")}
    </div>`;
  }
};
})();
