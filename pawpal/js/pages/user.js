(function(){
const esc = PP.util.esc;
const AVATARS = ["🐾", "🐱", "🐶", "🐰", "🦊", "🐻", "🌸", "⭐", "🍀", "🫖"];

/* ============================ PROFILE ============================ */
PP.pages.profile = {
  title:"Profile — Pawpal",
  auth:true,
  render(root){
    const u = PP.store.state.user, p = PP.store.state.pet;
    const prog = p ? PP.data.levelProgress(p.xp) : null;
    let view = null;

    root.innerHTML = `
    <div class="page">
      <section class="panel" style="margin-top:14px">
        <div class="prof-head">
          <span class="av" data-av>${esc(u.avatar || "🐾")}</span>
          <div style="flex:1;min-width:200px">
            <h1 style="margin:0;font-size:clamp(26px,3.4vw,38px)">${esc(u.username)}</h1>
            <p class="muted" style="font-weight:700;margin:4px 0 0">Joined ${PP.util.dateLabel(u.createdAt)} ·
               ${PP.util.duration((u.playMinutes || 0) + (p ? p.counters.playMinutes || 0 : 0))} together</p>
            <p class="hint" style="margin:8px 0 0;max-width:52ch">${esc(u.bio || "No bio yet — add a line about you and your companion.")}</p>
          </div>
          <button class="btn" data-edit>Edit profile</button>
        </div>
      </section>

      ${p ? `
      <section class="grid g2" style="margin-top:18px">
        <div class="panel">
          <div class="spread" style="align-items:flex-start">
            <div>
              <h3 style="margin:0 0 2px">${esc(p.name)}</h3>
              <p class="muted" style="font-weight:700;margin:0">${esc(PP.pet.character().name)} ·
                 ${esc(PP.data.speciesLabel[p.species])} · level ${prog.level}</p>
            </div>
            <a class="btn sm" href="#/pet">Open</a>
          </div>
          <div style="height:220px;margin:6px 0 10px"><div data-animal style="height:100%"></div></div>
          <div class="stack">${PP.ui.bar("joy", p.joy)}${PP.ui.bar("energy", p.energy)}${PP.ui.bar("hunger", p.hunger)}</div>
        </div>
        <div class="panel">
          <h3 style="margin:0 0 14px">Your numbers</h3>
          <dl class="kv">
            <dt>LEVEL</dt><dd>${prog.level} (${prog.into}/${prog.need} XP)</dd>
            <dt>COINS</dt><dd>🪙 ${p.coins}</dd>
            <dt>DAYS TOGETHER</dt><dd>${p.counters.days}</dd>
            <dt>MEALS SERVED</dt><dd>${p.counters.feeds}</dd>
            <dt>GAMES PLAYED</dt><dd>${p.counters.games}</dd>
            <dt>BEST SCORE</dt><dd>${p.counters.bestGameScore || 0} stars</dd>
            <dt>FAVOURITE THING</dt><dd>${esc(PP.pet.character().favoriteActivity)}</dd>
          </dl>
          <h3 style="margin:22px 0 10px">Achievements</h3>
          <div class="row">
            ${PP.data.achievements.map(a => {
              const got = p.achievements.indexOf(a.id) >= 0;
              return `<span class="chip" title="${esc(a.name)}" style="${got ? "" : "opacity:.45"}">${got ? a.icon : "🔒"} ${esc(a.name)}</span>`;
            }).join("")}
          </div>
          <a class="btn sm" style="margin-top:16px" href="#/pet/achievements">See all</a>
        </div>
      </section>`
      : `<section class="panel" style="margin-top:18px">
           ${PP.ui.empty("🐾", "No companion yet", "Adopt one and this page fills up with your progress.",
             '<a class="btn primary" href="#/adopt">Adopt a companion</a>')}
         </section>`}
    </div>`;

    if(p){
      view = new PP.Animal({character:p.characterId, palette:p.palette, accessory:p.equipped.accessory, detail:"mini"});
      view.mount(root.querySelector("[data-animal]"));
    }

    PP.util.on(root, "[data-edit]", "click", () => {
      PP.ui.modal({
        title:"Edit profile",
        html:`
          <div class="field"><label for="pu">Username</label>
            <div class="input" data-wrap="username"><input id="pu" value="${esc(u.username)}" maxlength="24"></div>
            <span class="err" id="e-username"></span></div>
          <div class="field"><label for="pb">Bio</label>
            <div class="input" data-wrap="bio"><input id="pb" value="${esc(u.bio || "")}" maxlength="180"
              placeholder="A line about you"></div>
            <span class="err" id="e-bio"></span></div>
          <div class="field"><label>Avatar</label>
            <div class="row" data-avatars>
              ${AVATARS.map(a => `<button class="opt" data-avatar="${a}" aria-pressed="${a === u.avatar}"
                 style="min-width:52px"><span class="em">${a}</span></button>`).join("")}
            </div></div>
          <div class="row" style="justify-content:flex-end;margin-top:18px">
            <button class="btn ghost" data-close>Cancel</button>
            <button class="btn primary" data-save>Save changes</button></div>`,
        mount(box){
          let avatar = u.avatar || "🐾";
          PP.util.on(box, "[data-avatar]", "click", (e, b) => {
            avatar = b.dataset.avatar;
            PP.util.$$("[data-avatar]", box).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
          });
          PP.util.on(box, "[data-save]", "click", async () => {
            const res = await PP.auth.updateProfile({
              username:box.querySelector("#pu").value.trim(),
              bio:box.querySelector("#pb").value.trim(),
              avatar
            });
            if(!res.ok){
              Object.keys(res.errors).forEach(k => {
                const el = box.querySelector("#e-" + k);
                if(el) el.textContent = res.errors[k];
              });
              PP.sound.play("error");
              return;
            }
            PP.ui.close();
            PP.ui.toast("Profile saved", {icon:"✅"});
            PP.nav.render();
            PP.router.reload();
          });
        }
      });
    });

    return () => view && view.destroy();
  }
};

/* ============================ SETTINGS ============================ */
PP.pages.settings = {
  title:"Settings — Pawpal",
  render(root){
    const s = () => PP.store.state.settings;

    const toggle = (key, title, desc) => `
      <div class="set-row">
        <div><div class="t">${esc(title)}</div><div class="d">${esc(desc)}</div></div>
        <button class="switch" role="switch" data-toggle="${key}" aria-checked="${!!s()[key]}"
                aria-label="${esc(title)}"></button>
      </div>`;

    root.innerHTML = `
    <div class="page">
      <h2 style="margin:14px 0 4px">Settings</h2>
      <p class="muted" style="font-weight:700;margin:0 0 22px">Everything here is saved on this device.</p>

      <div class="grid g2">
        <section class="panel">
          <h3 style="margin:0 0 6px">Appearance</h3>
          <div class="set-group">
            ${toggle("darkMode", "Dark mode", "A dusk palette designed for the mascot, not an inverted page.")}
            <div class="set-row">
              <div><div class="t">Animation intensity</div><div class="d">Lower it if motion feels busy on this device.</div></div>
              <select class="sel" data-motion>
                <option value="full">Full</option><option value="low">Reduced</option><option value="off">Minimal</option>
              </select>
            </div>
            ${toggle("cursorTrail", "Cursor paw trail", "Tiny paw prints that follow your cursor.")}
          </div>
        </section>

        <section class="panel">
          <h3 style="margin:0 0 6px">Gameplay & sound</h3>
          <div class="set-group">
            ${toggle("sound", "Sound effects", "Short synthesised tones for feeding, playing and level ups.")}
            ${toggle("notifications", "Notifications", "Hunger reminders, level ups and achievements in the bell menu.")}
            ${toggle("autosave", "Auto-save", "Write progress after every action. Turning this off keeps changes in memory only.")}
          </div>
        </section>

        <section class="panel">
          <h3 style="margin:0 0 6px">Account</h3>
          <div class="set-group">
            <div class="set-row">
              <div><div class="t">${PP.store.state.user ? esc(PP.store.state.user.email) : "Not signed in"}</div>
                <div class="d">${PP.store.state.user ? "Signed in on this device." : "Sign in to keep a companion."}</div></div>
              ${PP.store.state.user
                ? '<button class="btn sm ghost" data-logout>Log out</button>'
                : '<a class="btn sm primary" href="#/login">Log in</a>'}
            </div>
            <div class="set-row">
              <div><div class="t">Language</div><div class="d">Interface language.</div></div>
              <select class="sel" data-lang><option value="en">English</option></select>
            </div>
          </div>
        </section>

        <section class="panel">
          <h3 style="margin:0 0 6px">Privacy & data</h3>
          <div class="set-group">
            <div class="set-row">
              <div><div class="t">Where your data lives</div>
                <div class="d">Account, pet and settings are stored in this browser only. Nothing is uploaded, and passwords are hashed before saving.</div></div>
            </div>
            <div class="set-row">
              <div><div class="t">Reset settings</div><div class="d">Restore theme, sound and motion defaults.</div></div>
              <button class="btn sm ghost" data-reset>Reset</button>
            </div>
            ${PP.store.state.pet ? `
            <div class="set-row">
              <div><div class="t">Release ${esc(PP.store.state.pet.name)}</div>
                <div class="d">Deletes your pet and all progress on this device. This cannot be undone.</div></div>
              <button class="btn sm ghost" data-release>Release</button>
            </div>` : ""}
          </div>
        </section>
      </div>
    </div>`;

    root.querySelector("[data-motion]").value = s().motion;
    root.querySelector("[data-lang]").value = s().language;
    /* darkMode is stored as theme */
    root.querySelector('[data-toggle="darkMode"]').setAttribute("aria-checked", String(s().theme === "dark"));

    PP.util.on(root, "[data-toggle]", "click", (e, b) => {
      const key = b.dataset.toggle;
      const next = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", String(next));
      if(key === "darkMode"){ PP.store.setSettings({theme:next ? "dark" : "light"}); PP.app.applyTheme(); }
      else PP.store.setSettings({[key]:next});
      PP.sound.play("click");
      if(key === "sound" && next){ PP.sound.unlock(); PP.sound.play("notification"); }
    });
    root.querySelector("[data-motion]").addEventListener("change", e => {
      PP.store.setSettings({motion:e.target.value});
      PP.app.applyTheme();
      PP.ui.toast("Animation set to " + e.target.value, {icon:"🎚️"});
    });
    root.querySelector("[data-lang]").addEventListener("change", e => {
      PP.store.setSettings({language:e.target.value});
    });
    PP.util.on(root, "[data-reset]", "click", () => {
      PP.store.resetSettings(); PP.app.applyTheme(); PP.router.reload();
      PP.ui.toast("Settings restored to defaults", {icon:"↩️"});
    });
    PP.util.on(root, "[data-logout]", "click", () => {
      PP.auth.logout(); PP.nav.render(); location.hash = "#/";
      PP.ui.toast("Signed out", {icon:"👋"});
    });
    PP.util.on(root, "[data-release]", "click", () => {
      const name = PP.store.state.pet.name;
      PP.ui.modal({
        title:"Release " + name + "?",
        subtitle:"All levels, coins and items are lost. There is no undo.",
        html:`<div class="row" style="justify-content:flex-end;margin-top:8px">
                <button class="btn ghost" data-close>Keep ${esc(name)}</button>
                <button class="btn primary" data-confirm>Release</button></div>`,
        mount(box){
          PP.util.on(box, "[data-confirm]", "click", () => {
            PP.pet.reset(); PP.ui.close(); PP.nav.render();
            PP.ui.toast(name + " went back to the meadow.", {icon:"🌾"});
            location.hash = "#/";
          });
        }
      });
    });
  }
};

/* ============================ 404 ============================ */
PP.pages.notFound = {
  title:"Page not found — Pawpal",
  render(root){
    let view;
    root.innerHTML = `
    <div class="page center" style="display:grid;justify-items:center;gap:8px;padding-top:20px">
      <div style="width:min(100%,420px);height:min(44vh,360px)"><div data-animal style="height:100%"></div></div>
      <h1 style="font-size:clamp(34px,6vw,60px);margin:0">Nothing here</h1>
      <p class="lede" style="margin:4px auto 20px">That page wandered off. Your companion is still where you left them.</p>
      <div class="row" style="justify-content:center">
        <a class="btn primary" href="#/">Back home</a>
        <a class="btn" href="#/pet">Go to my pet</a>
      </div>
    </div>`;
    view = new PP.Animal({character:"yuki", interactive:true, state:"surprised"});
    view.mount(root.querySelector("[data-animal]"));
    view.rest = "idle";
    return () => view.destroy();
  }
};
})();
