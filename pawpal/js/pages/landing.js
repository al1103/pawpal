window.PP = window.PP || {}; PP.pages = PP.pages || {};
(function(){

PP.pages.landing = {
  title:"Pawpal — meet your new little companion",
  render(root){
    const esc = PP.util.esc;
    const chars = PP.data.characters;
    let current = PP.store.state.pet ? PP.data.getCharacter(PP.store.state.pet.characterId) : PP.data.getCharacter("tito");
    const views = [];

    root.innerHTML = `
    <div class="page">
      <section class="hero">
        <div>
          <span class="chip"><span class="dot">${PP.ui.pawIcon(12)}</span> Seven companions, one desk</span>
          <h1>Meet your<br>new <span class="tint">little</span><br>companion</h1>
          <p class="lede">Move your cursor and watch <span data-name>${esc(current.name)}</span> look right back at you.
             Adopt one, feed it, play with it, and it keeps growing while you are away.</p>
          <div class="hero-actions">
            <a class="btn primary lg" href="#/adopt"><span class="ic">${PP.ui.pawIcon(13)}</span> Adopt a companion</a>
            <a class="linky" href="#/characters">Browse all characters <span class="arrow">→</span></a>
          </div>
        </div>
        <div class="stage">
          <div data-hero-animal style="height:100%"></div>
          <aside class="statcard" aria-live="polite">
            <div class="nm" data-c-name>${esc(current.name.toUpperCase())}</div>
            <div class="ti" data-c-title>${esc(current.tagline)}</div>
            <div class="stack" style="margin-top:16px" data-c-stats></div>
          </aside>
        </div>
      </section>

      <div class="selector" role="tablist" aria-label="Preview a character">
        ${chars.map(c => `<button class="ch" role="tab" data-pick="${c.id}"
           aria-selected="${c.id === current.id}">${esc(c.name.toUpperCase())}<span class="ind"></span></button>`).join("")}
      </div>

      <section class="section" id="characters">
        <div class="section-head">
          <div>
            <h2>Meet the characters</h2>
            <p>Each one has its own temperament, favourite food and way of greeting you. Hover a card — they notice.</p>
          </div>
          <a class="linky" href="#/characters">See all <span class="arrow">→</span></a>
        </div>
        <div class="grid g3" data-cards>
          ${chars.slice(0, 6).map(c => `
            <article class="ccard">
              <div class="thumb" style="background:${PP.data.getPalette(c.palette).soft}">
                <div data-card-animal="${c.id}" style="width:86%;height:86%"></div>
              </div>
              <div class="nm">${esc(c.name)} <span class="tag ${c.rarity}">${PP.data.rarityLabel[c.rarity]}</span></div>
              <div class="pers">${esc(c.personality.join(" · "))}</div>
              <div class="mini">
                <span>💗 ${c.stats.joy}</span><span>⚡ ${c.stats.energy}</span><span>👀 ${c.stats.curiosity}</span>
              </div>
              <a class="btn sm" href="#/character/${c.id}">Meet ${esc(c.name)}</a>
            </article>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>How it works</h2>
          <p>Three steps, then it is just the two of you.</p></div></div>
        <div class="grid g3">
          <div class="step"><div class="n">1</div><h3>Choose your companion</h3>
            <p>Browse seven characters and pick the temperament that suits you. Rarity only changes looks, never care.</p></div>
          <div class="step"><div class="n">2</div><h3>Name and customise</h3>
            <p>Give them a name, pick a colour, add a bow or a tiny hat. Everything updates live on the preview.</p></div>
          <div class="step"><div class="n">3</div><h3>Spend time together</h3>
            <p>Feed, play, nap. They gain levels, you earn coins, and progress is waiting when you come back tomorrow.</p></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>Why people keep coming back</h2>
          <p>Short visits, real attachment.</p></div></div>
        <div class="grid g3">
          <div class="quote"><p>“I open Pawpal for two minutes between meetings. Milo does his one trick, I laugh, back to work.”</p>
            <div class="who"><span class="av">🦊</span> Ines · 41 days with Milo</div></div>
          <div class="quote"><p>“The eye tracking sold it. My daughter is convinced Nubi can see her through the screen.”</p>
            <div class="who"><span class="av">🐰</span> Daniel · 12 days with Nubi</div></div>
          <div class="quote"><p>“I came back after a week away expecting a dead pet. Yuki was just a bit hungry. Kind design.”</p>
            <div class="who"><span class="av">🐱</span> Priya · 88 days with Yuki</div></div>
        </div>
      </section>

      <section class="section">
        <div class="cta-band">
          <h2>Start your journey</h2>
          <p class="lede" style="margin:0 auto 24px">It takes about a minute. Pick a character, give them a name,
             and they are yours — on this device, for as long as you keep visiting.</p>
          <div class="row" style="justify-content:center">
            <a class="btn primary lg" href="#/adopt">Adopt a companion</a>
            <a class="btn lg" href="#/characters">Browse characters</a>
          </div>
        </div>
      </section>

      <footer class="site">
        <span>Pawpal Studio — companions that notice you</span>
        <nav>
          <a href="#/characters">Characters</a><a href="#/pet">My pet</a>
          <a href="#/settings">Settings</a><a href="#/register">Create account</a>
        </nav>
      </footer>
    </div>`;

    /* hero animal */
    const hero = new PP.Animal({character:current.id, interactive:true});
    hero.mount(root.querySelector("[data-hero-animal]"));
    views.push(hero);

    /* card animals (lighter detail — no body parallax) */
    PP.util.$$("[data-card-animal]", root).forEach(host => {
      const v = new PP.Animal({character:host.dataset.cardAnimal, detail:"mini",
                               onClick:() => { location.hash = "#/character/" + host.dataset.cardAnimal; }});
      v.mount(host);
      views.push(v);
    });

    function paintStats(c){
      root.querySelector("[data-c-stats]").innerHTML =
        PP.ui.bar("joy", c.stats.joy) + PP.ui.bar("energy", c.stats.energy) + PP.ui.bar("curiosity", c.stats.curiosity);
      root.querySelector("[data-c-name]").textContent = c.name.toUpperCase();
      root.querySelector("[data-c-title]").textContent = c.tagline;
      root.querySelector("[data-name]").textContent = c.name;
    }
    paintStats(current);

    PP.util.on(root, "[data-pick]", "click", (e, btn) => {
      const c = PP.data.getCharacter(btn.dataset.pick);
      if(c.id === current.id) return;
      current = c;
      PP.util.$$("[data-pick]", root).forEach(b => b.setAttribute("aria-selected", String(b.dataset.pick === c.id)));
      const host = root.querySelector("[data-hero-animal]");
      host.style.transition = "opacity .28s ease, transform .3s ease";
      host.style.opacity = "0"; host.style.transform = "translateX(-30px)";
      PP.sound.unlock(); PP.sound.play("click");
      setTimeout(() => {
        hero.setCharacter(c.id);
        paintStats(c);
        host.style.transform = "translateX(30px)";
        requestAnimationFrame(() => {
          host.style.opacity = "1"; host.style.transform = "none";
        });
      }, 290);
    });

    return () => views.forEach(v => v.destroy());
  }
};
})();
