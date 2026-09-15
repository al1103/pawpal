window.PP = window.PP || {}; PP.pages = PP.pages || {};
(function(){
const esc = PP.util.esc;

PP.pages.characters = {
  title:"Characters — Pawpal",
  render(root){
    let gridViews = [], featuredView = null;
    let filter = "all", query = "";
    let featured = PP.data.characters[0];

    const FILTERS = [
      {id:"all", label:"All"}, {id:"cat", label:"Cats"}, {id:"dog", label:"Dogs"},
      {id:"bunny", label:"Bunnies"}, {id:"fox", label:"Foxes"}, {id:"bear", label:"Bears"},
      {id:"rare", label:"Rare"}, {id:"popular", label:"Popular"}
    ];

    root.innerHTML = `
    <div class="page">
      <div class="section-head" style="margin-top:14px">
        <div><h2>Choose a character</h2>
        <p>Seven companions with different temperaments. Pick one to meet, then adopt when it clicks.</p></div>
        <label class="search">🔍<span class="sr">Search characters</span>
          <input type="search" placeholder="Search by name or trait" data-search></label>
      </div>

      <section class="panel featured" data-featured></section>

      <div class="spread" style="margin-top:34px">
        <div class="filters" role="group" aria-label="Filter characters">
          ${FILTERS.map(f => `<button data-filter="${f.id}" aria-pressed="${f.id === "all"}">${esc(f.label)}</button>`).join("")}
        </div>
        <span class="qty" data-count></span>
      </div>
      <div class="grid g6" style="margin-top:18px" data-grid></div>
    </div>`;

    const grid = root.querySelector("[data-grid]");
    const featuredBox = root.querySelector("[data-featured]");

    function match(c){
      const q = query.trim().toLowerCase();
      const hitQ = !q || c.name.toLowerCase().includes(q) || c.personality.join(" ").toLowerCase().includes(q) ||
                   c.tagline.toLowerCase().includes(q) || PP.data.speciesLabel[c.species].toLowerCase().includes(q);
      const hitF = filter === "all" ? true
        : filter === "rare" ? (c.rarity !== "common")
        : filter === "popular" ? c.popular
        : c.species === filter;
      return hitQ && hitF;
    }

    function renderFeatured(c){
      featured = c;
      featuredBox.innerHTML = `
        <div class="stage"><div data-feat style="height:100%"></div></div>
        <div>
          <span class="tag ${c.rarity}">${PP.data.rarityLabel[c.rarity]}</span>
          <h2 style="font-size:clamp(30px,4vw,46px);margin:12px 0 4px">${esc(c.name)}</h2>
          <p class="muted" style="font-weight:800;margin:0">${esc(c.tagline)} · ${esc(PP.data.speciesLabel[c.species])}</p>
          <p class="lede" style="max-width:46ch">${esc(c.description)}</p>
          <div class="stack" style="max-width:330px;margin-top:18px">
            ${PP.ui.bar("joy", c.stats.joy)}${PP.ui.bar("energy", c.stats.energy)}${PP.ui.bar("curiosity", c.stats.curiosity)}
          </div>
          <div class="row" style="margin-top:22px">
            <a class="btn primary" href="#/adopt?character=${c.id}">Adopt ${esc(c.name)}</a>
            <a class="btn" href="#/character/${c.id}">Details</a>
          </div>
        </div>`;
      if(featuredView) featuredView.destroy();
      featuredView = new PP.Animal({character:c.id, interactive:true});
      featuredView.mount(featuredBox.querySelector("[data-feat]"));
    }

    function renderGrid(){
      gridViews.forEach(v => v.destroy());
      gridViews = [];
      const list = PP.data.characters.filter(match);
      root.querySelector("[data-count]").textContent = list.length + (list.length === 1 ? " character" : " characters");
      if(!list.length){
        grid.innerHTML = PP.ui.empty("🔎", "No matches", "Try a different filter or clear the search.");
        return;
      }
      grid.innerHTML = list.map(c => `
        <article class="ccard">
          <div class="thumb" style="background:${PP.data.getPalette(c.palette).soft}">
            <div data-mini="${c.id}" style="width:86%;height:86%"></div>
          </div>
          <div class="nm">${esc(c.name)} <span class="tag ${c.rarity}">${PP.data.rarityLabel[c.rarity]}</span></div>
          <div class="pers">${esc(c.personality.join(" · "))}</div>
          <div class="mini"><span>💗 ${c.stats.joy}</span><span>⚡ ${c.stats.energy}</span><span>🍽️ ${c.stats.hunger}</span></div>
          <div class="row" style="gap:8px">
            <a class="btn sm" href="#/character/${c.id}" style="flex:1">Meet</a>
            <button class="btn sm ghost" data-feature="${c.id}">Preview</button>
          </div>
        </article>`).join("");
      PP.util.$$("[data-mini]", grid).forEach(host => {
        const v = new PP.Animal({character:host.dataset.mini, detail:"mini",
                                 onClick:() => { location.hash = "#/character/" + host.dataset.mini; }});
        v.mount(host); gridViews.push(v);
      });
    }

    PP.util.on(root, "[data-filter]", "click", (e, b) => {
      filter = b.dataset.filter;
      PP.util.$$("[data-filter]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      PP.sound.play("click");
      renderGrid();
    });
    PP.util.on(root, "[data-feature]", "click", (e, b) => {
      renderFeatured(PP.data.getCharacter(b.dataset.feature));
      featuredBox.scrollIntoView({behavior:"smooth", block:"center"});
    });
    root.querySelector("[data-search]").addEventListener("input", e => {
      query = e.target.value; renderGrid();
    });

    renderFeatured(featured);
    renderGrid();
    return () => { gridViews.forEach(v => v.destroy()); if(featuredView) featuredView.destroy(); };
  }
};

PP.pages.characterDetail = {
  title:"Character — Pawpal",
  render(root, params){
    const c = PP.data.characters.find(x => x.id === params.id);
    if(!c) return PP.pages.notFound.render(root);
    let view;

    root.innerHTML = `
    <div class="page">
      <a class="linky" href="#/characters" style="margin:10px 0 18px;display:inline-flex">← All characters</a>
      <section class="detail">
        <div class="panel" style="padding:10px">
          <div class="stage" style="height:clamp(340px,54vh,540px)"><div data-animal style="height:100%"></div></div>
        </div>
        <div>
          <span class="tag ${c.rarity}">${PP.data.rarityLabel[c.rarity]}</span>
          <h1 style="font-size:clamp(34px,5vw,56px);margin:12px 0 2px">${esc(c.name)}</h1>
          <p class="muted" style="font-weight:800;margin:0 0 14px">${esc(c.tagline)}</p>
          <p class="lede" style="max-width:48ch;margin-top:0">${esc(c.description)}</p>

          <div class="row" style="margin:16px 0 22px">
            ${c.personality.map(p => `<span class="chip">${esc(p)}</span>`).join("")}
          </div>

          <div class="panel" style="padding:20px">
            <div class="stack">
              ${PP.ui.bar("joy", c.stats.joy)}${PP.ui.bar("energy", c.stats.energy)}
              ${PP.ui.bar("hunger", c.stats.hunger)}${PP.ui.bar("curiosity", c.stats.curiosity)}
            </div>
            <dl class="kv" style="margin-top:20px">
              <dt>SPECIES</dt><dd>${esc(PP.data.speciesLabel[c.species])}</dd>
              <dt>FAVOURITE FOOD</dt><dd>${PP.data.getItem(c.favoriteFood).icon} ${esc(PP.data.getItem(c.favoriteFood).name)}</dd>
              <dt>FAVOURITE THING</dt><dd>${esc(c.favoriteActivity)}</dd>
              <dt>STARTS WITH</dt><dd>${Object.keys(c.startingItems).map(id =>
                  PP.data.getItem(id).icon + " " + c.startingItems[id] + "×").join(" · ")}</dd>
            </dl>
          </div>

          <div class="row" style="margin-top:22px">
            <a class="btn primary lg" href="#/adopt?character=${c.id}">Adopt this pet</a>
            <button class="btn lg" data-try>Try interaction</button>
          </div>
        </div>
      </section>
    </div>`;

    view = new PP.Animal({character:c.id, interactive:true});
    view.mount(root.querySelector("[data-animal]"));

    PP.util.on(root, "[data-try]", "click", () => {
      PP.sound.unlock();
      const seq = ["happy", "playing", "surprised"];
      const pick = seq[Math.floor(Math.random() * seq.length)];
      view.setState(pick);
      view.say(c.hello);
      view.fx(pick === "happy" ? "💗" : "✨", 5);
      PP.sound.play("pet");
    });

    return () => view.destroy();
  }
};
})();
