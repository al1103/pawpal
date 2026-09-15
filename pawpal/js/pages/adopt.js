(function(){
const esc = PP.util.esc;

PP.pages.adopt = {
  title:"Adopt — Pawpal",
  auth:true,
  render(root){
    const q = PP.router.query();
    let step = 1;
    let chosen = PP.data.characters.find(c => c.id === q.character) || PP.data.characters[0];
    let name = chosen.name;
    let view = null;

    root.innerHTML = `
      <div class="page">
        <h1 class="center" style="font-size:clamp(28px,4vw,42px);margin:16px 0 4px">Adopt a companion</h1>
        <p class="center muted" style="font-weight:700;margin:0">Four short steps. You can change everything later.</p>
        <div class="steps" data-steps></div>
        <div data-body></div>
      </div>`;

    const body = root.querySelector("[data-body]");
    const STEPS = ["Choose", "Name", "Confirm", "Welcome"];

    function steps(){
      root.querySelector("[data-steps]").innerHTML = STEPS.map((s, i) => {
        const n = i + 1;
        return `<span class="s ${n === step ? "on" : n < step ? "done" : ""}">
                  <span class="n">${n < step ? "✓" : n}</span>${esc(s)}</span>` +
               (n < STEPS.length ? '<span class="sep"></span>' : "");
      }).join("");
    }

    function mountAnimal(host, opts){
      if(view) view.destroy();
      view = new PP.Animal(Object.assign({character:chosen.id, interactive:true}, opts || {}));
      view.mount(host);
      return view;
    }

    function renderStep(){
      steps();
      if(step === 1) return stepChoose();
      if(step === 2) return stepName();
      if(step === 3) return stepConfirm();
      return stepWelcome();
    }

    /* ---------- 1. choose + learn ---------- */
    function stepChoose(){
      body.innerHTML = `
        <section class="panel featured">
          <div class="stage" style="height:clamp(300px,44vh,420px)"><div data-animal style="height:100%"></div></div>
          <div>
            <span class="tag ${chosen.rarity}">${PP.data.rarityLabel[chosen.rarity]}</span>
            <h2 style="font-size:clamp(26px,3.4vw,40px);margin:12px 0 2px" data-nm>${esc(chosen.name)}</h2>
            <p class="muted" style="font-weight:800;margin:0" data-tg>${esc(chosen.tagline)} · ${esc(PP.data.speciesLabel[chosen.species])}</p>
            <p class="lede" style="max-width:44ch" data-ds>${esc(chosen.description)}</p>
            <div class="stack" style="max-width:320px" data-st></div>
            <p class="hint" data-fav style="margin-top:14px"></p>
            <button class="btn primary lg" style="margin-top:18px" data-next>Choose ${esc(chosen.name)} →</button>
          </div>
        </section>
        <h3 style="margin:30px 0 14px">Everyone looking for a home</h3>
        <div class="pickgrid">
          ${PP.data.characters.map(c => `
            <button class="pick" data-pick="${c.id}" aria-pressed="${c.id === chosen.id}">
              <span class="thumb" style="background:${PP.data.getPalette(c.palette).soft}">
                <span data-mini="${c.id}" style="display:block;width:88%;height:88%"></span></span>
              <strong>${esc(c.name)}</strong>
              <span class="qty">${esc(c.personality[0])} · ${PP.data.rarityLabel[c.rarity]}</span>
            </button>`).join("")}
        </div>`;
      mountAnimal(body.querySelector("[data-animal]"));
      paintChosen();
      body.querySelectorAll("[data-mini]").forEach(host => {
        const v = new PP.Animal({character:host.dataset.mini, detail:"mini", interactive:"static"});
        v.mount(host);
        minis.push(v);
      });
    }
    const minis = [];

    function paintChosen(){
      const b = body;
      if(!b.querySelector("[data-nm]")) return;
      b.querySelector("[data-nm]").textContent = chosen.name;
      b.querySelector("[data-tg]").textContent = chosen.tagline + " · " + PP.data.speciesLabel[chosen.species];
      b.querySelector("[data-ds]").textContent = chosen.description;
      b.querySelector("[data-st]").innerHTML =
        PP.ui.bar("joy", chosen.stats.joy) + PP.ui.bar("energy", chosen.stats.energy) + PP.ui.bar("curiosity", chosen.stats.curiosity);
      const f = PP.data.getItem(chosen.favoriteFood);
      b.querySelector("[data-fav]").textContent = "Loves " + f.name.toLowerCase() + " " + f.icon +
        " · starts with " + Object.keys(chosen.startingItems).map(id => PP.data.getItem(id).name.toLowerCase()).join(", ");
      b.querySelector("[data-next]").textContent = "Choose " + chosen.name + " →";
    }

    /* ---------- 2. name ---------- */
    function stepName(){
      body.innerHTML = `
        <section class="panel featured">
          <div class="stage" style="height:clamp(280px,40vh,400px)"><div data-animal style="height:100%"></div></div>
          <div>
            <h2 style="font-size:clamp(24px,3vw,34px);margin:0 0 6px">Give your new friend a name</h2>
            <p class="lede" style="margin-top:0">1–20 characters. You can rename them any time from customisation.</p>
            <div class="field" style="max-width:360px">
              <label for="petname">Name</label>
              <div class="input" data-wrap="petname"><input id="petname" maxlength="24" value="${esc(name)}"></div>
              <span class="err" id="e-petname" role="alert"></span>
            </div>
            <div class="row" style="margin-top:12px">
              ${["Mochi", "Peanut", "Suki", "Bao", chosen.name].map(s =>
                `<button class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join("")}
            </div>
            <div class="row" style="margin-top:24px">
              <button class="btn ghost" data-back>← Back</button>
              <button class="btn primary lg" data-next>Continue</button>
            </div>
          </div>
        </section>`;
      mountAnimal(body.querySelector("[data-animal]"));
      const input = body.querySelector("#petname");
      input.focus();
      input.addEventListener("input", () => { name = input.value; });
      input.addEventListener("keydown", e => { if(e.key === "Enter") body.querySelector("[data-next]").click(); });
    }

    /* ---------- 3. confirm ---------- */
    function stepConfirm(){
      const replacing = !!PP.store.state.pet;
      body.innerHTML = `
        <section class="panel featured">
          <div class="stage" style="height:clamp(280px,40vh,400px)"><div data-animal style="height:100%"></div></div>
          <div>
            <h2 style="font-size:clamp(24px,3vw,34px);margin:0 0 6px">Ready to bring ${esc(name)} home?</h2>
            <dl class="kv" style="margin:18px 0">
              <dt>NAME</dt><dd>${esc(name)}</dd>
              <dt>CHARACTER</dt><dd>${esc(chosen.name)} · ${esc(PP.data.speciesLabel[chosen.species])}</dd>
              <dt>PERSONALITY</dt><dd>${esc(chosen.personality.join(", "))}</dd>
              <dt>STARTER KIT</dt><dd>${Object.keys(chosen.startingItems).map(id =>
                  PP.data.getItem(id).icon + " " + PP.data.getItem(id).name + " ×" + chosen.startingItems[id]).join(" · ")}</dd>
              <dt>COINS</dt><dd>🪙 120 to begin with</dd>
            </dl>
            ${replacing ? `<p class="err" style="font-weight:700">You already care for
              ${esc(PP.store.state.pet.name)}. Adopting again replaces them and their progress.</p>` : ""}
            <div class="row" style="margin-top:8px">
              <button class="btn ghost" data-back>← Back</button>
              <button class="btn primary lg" data-next>${replacing ? "Replace and adopt" : "Confirm adoption"}</button>
            </div>
          </div>
        </section>`;
      mountAnimal(body.querySelector("[data-animal]"));
    }

    /* ---------- 4. welcome ---------- */
    function stepWelcome(){
      body.innerHTML = `
        <section class="panel center" style="display:grid;justify-items:center;gap:6px;padding:30px">
          <div class="stage" style="height:clamp(300px,44vh,430px);width:min(100%,560px)">
            <div data-animal style="height:100%"></div>
          </div>
          <h2 style="font-size:clamp(28px,4vw,44px);margin:0">Welcome home, ${esc(name)}! ❤️</h2>
          <p class="lede" style="margin:6px auto 18px">They are settling in. Feed them, play a round, and come back
             tomorrow for the daily reward.</p>
          <a class="btn primary lg" href="#/pet">Go to the pet dashboard</a>
        </section>`;
      mountAnimal(body.querySelector("[data-animal]"), {state:"happy"});
      view.fx("💗", 7);
      PP.ui.confetti();
      PP.sound.play("levelup");
    }

    /* ---------- events ---------- */
    PP.util.on(root, "[data-pick]", "click", (e, b) => {
      chosen = PP.data.getCharacter(b.dataset.pick);
      name = chosen.name;
      PP.util.$$("[data-pick]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      if(view) view.setCharacter(chosen.id);
      paintChosen();
      PP.sound.play("click");
    });
    PP.util.on(root, "[data-suggest]", "click", (e, b) => {
      name = b.dataset.suggest;
      const i = root.querySelector("#petname");
      if(i) i.value = name;
    });
    PP.util.on(root, "[data-back]", "click", () => { step = Math.max(1, step - 1); renderStep(); });
    PP.util.on(root, "[data-next]", "click", () => {
      if(step === 2){
        const clean = String(name || "").trim();
        if(clean.length < 1 || clean.length > 20){
          root.querySelector("#e-petname").textContent = "Names are 1–20 characters.";
          root.querySelector('[data-wrap="petname"]').classList.add("bad");
          PP.sound.play("error");
          return;
        }
        name = clean;
      }
      if(step === 3){
        PP.pet.create(chosen.id, name);
        PP.notifications.push("Welcome home, " + name + "! ❤️", {icon:"🏡", href:"#/pet"});
        PP.nav.render();
      }
      step = Math.min(4, step + 1);
      renderStep();
      window.scrollTo({top:0, behavior:"smooth"});
    });

    renderStep();
    return () => { if(view) view.destroy(); minis.forEach(v => v.destroy()); };
  }
};
})();
