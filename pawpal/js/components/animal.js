/* The mascot. One reusable component used on every page.
   Parts are individually animated: body, head, ears, pupils, eyelids, accessory. */
window.PP = window.PP || {};
PP.Animal = (function(){
  const clamp = PP.util.clamp, lerp = PP.util.lerp;

  const ACCESSORIES = {
    bow:'<g class="an-acc"><path d="M330 84c-28-24-60-10-56 17 3 21 32 27 56 11z" fill="var(--accent)"/>' +
        '<path d="M344 84c28-24 60-10 56 17-3 21-32 27-56 11z" fill="var(--accent)"/>' +
        '<circle cx="337" cy="97" r="13" fill="var(--belly)"/></g>',
    hat:'<g class="an-acc"><rect x="226" y="18" width="92" height="64" rx="16" fill="#4B3238"/>' +
        '<rect x="186" y="74" width="172" height="20" rx="10" fill="#4B3238"/>' +
        '<rect x="226" y="58" width="92" height="14" fill="var(--accent)"/></g>',
    scarf:'<g class="an-acc"><path d="M146 318c80 42 168 42 248 0 6 34-8 58-28 66-64 22-134 22-192 0-20-8-34-32-28-66Z" fill="var(--accent)"/>' +
        '<path d="M368 372c22 6 34 34 26 62-6 22-34 26-44 8-8-16-2-48 18-70Z" fill="var(--accent)" opacity=".85"/></g>',
    crown:'<g class="an-acc"><path d="M186 96 218 34l52 44 52-44 32 62z" fill="#E3B15E"/>' +
        '<circle cx="218" cy="30" r="10" fill="#F2D08A"/><circle cx="270" cy="70" r="10" fill="#F2D08A"/>' +
        '<circle cx="322" cy="30" r="10" fill="#F2D08A"/></g>'
  };

  const MARKUP = `
  <svg viewBox="0 0 540 600" role="img" aria-label="Interactive companion">
    <ellipse class="an-ground" cx="270" cy="566" rx="150" ry="20"/>
    <g class="an-bodyLayer">
      <g class="an-breathe" style="transform-origin:270px 560px">
        <g class="an-squash" style="transform-origin:270px 560px">
          <path class="an-tail" d="M392 486c66 10 106-30 100-82-4-36-40-54-62-34-20 18-8 48 14 50 16 2 24-8 24-18"
                fill="none" stroke-width="30" stroke-linecap="round"/>
          <circle class="an-tailPuff" cx="448" cy="474" r="38" style="display:none"/>
          <path class="an-body" d="M270 286c104 0 168 82 168 170 0 70-72 102-168 102S102 526 102 456c0-88 64-170 168-170Z"/>
          <ellipse class="an-belly" cx="270" cy="474" rx="90" ry="68"/>
          <ellipse class="an-paw" cx="196" cy="544" rx="42" ry="23"/>
          <ellipse class="an-paw" cx="344" cy="544" rx="42" ry="23"/>
          <g class="an-head" style="transform-origin:270px 356px">
            <g class="an-earL"><path class="an-earOut an-earLOut" d=""/><path class="an-earIn an-earLIn" d=""/></g>
            <g transform="translate(540,0) scale(-1,1)">
              <g class="an-earR"><path class="an-earOut an-earROut" d=""/><path class="an-earIn an-earRIn" d=""/></g>
            </g>
            <ellipse class="an-headShape" cx="270" cy="228" rx="154" ry="142"/>
            <ellipse class="an-shade" cx="270" cy="332" rx="120" ry="40" opacity=".16"/>
            <ellipse class="an-muzzle" cx="270" cy="286" rx="78" ry="52" style="display:none"/>
            <ellipse class="an-cheek" cx="150" cy="276" rx="26" ry="16"/>
            <ellipse class="an-cheek" cx="390" cy="276" rx="26" ry="16"/>
            <g class="an-blinkL" style="transform-origin:196px 216px">
              <ellipse class="an-sclera" cx="196" cy="216" rx="34" ry="38"/>
              <g class="an-pupilL" style="transform-origin:196px 216px">
                <ellipse class="an-pupilCore" cx="196" cy="216" rx="16" ry="18"/>
                <circle cx="190" cy="208" r="6" fill="#fff" opacity=".92"/>
                <circle cx="202" cy="225" r="2.8" fill="#fff" opacity=".5"/>
              </g>
            </g>
            <g class="an-blinkR" style="transform-origin:344px 216px">
              <ellipse class="an-sclera" cx="344" cy="216" rx="34" ry="38"/>
              <g class="an-pupilR" style="transform-origin:344px 216px">
                <ellipse class="an-pupilCore" cx="344" cy="216" rx="16" ry="18"/>
                <circle cx="338" cy="208" r="6" fill="#fff" opacity=".92"/>
                <circle cx="350" cy="225" r="2.8" fill="#fff" opacity=".5"/>
              </g>
            </g>
            <g class="an-happyEyes">
              <path class="an-arc" d="M168 224q28-30 56 0"/>
              <path class="an-arc" d="M316 224q28-30 56 0"/>
            </g>
            <path class="an-nose" d="M254 268q16-10 32 0 0 18-16 22-16-4-16-22Z"/>
            <path class="an-mouth" d="M270 292q-14 16-28 4M270 292q14 16 28 4"/>
            <path class="an-mouthOpen" d="M240 292q30 44 60 0 z" fill="#B5757B" stroke="none"/>
            <g class="an-whiskers">
              <path class="an-whisker" d="M104 250q-32-8-50-20M108 274q-34 2-54-4M104 298q-30 10-46 20"/>
              <path class="an-whisker" d="M436 250q32-8 50-20M432 274q34 2 54-4M436 298q30 10 46 20"/>
            </g>
            <g class="an-sweat"><path d="M414 150c10 16 16 26 16 34a16 16 0 0 1-32 0c0-8 6-18 16-34Z" fill="#9FC4DE" opacity=".8"/></g>
            <g class="an-accSlot"></g>
          </g>
        </g>
      </g>
    </g>
    <g class="an-zzz" transform="translate(400 150)">
      <text>z</text><text>z</text><text>z</text>
    </g>
  </svg>
  <div class="overlay"><div class="bubble"></div></div>`;

  /* transient states return to the resting state automatically */
  const TRANSIENT = {happy:1600, eating:2200, petting:2000, surprised:1100, levelup:2600, playing:2400};

  class AnimalView{
    constructor(opts){
      opts = opts || {};
      this.characterId = opts.character || "tito";
      this.paletteId   = opts.palette || null;
      this.accessory   = opts.accessory || null;
      this.interactive = opts.interactive !== false;
      this.mini        = opts.detail === "mini";
      this.onClick     = opts.onClick || null;
      this.state       = opts.state || "idle";
      this.rest        = opts.state || "idle";

      this.t = {ex:0, ey:0, hx:0, hy:0, bx:0, by:0, cur:0};
      this.c = {ex:0, ey:0, hx:0, hy:0, bx:0, by:0, cur:0};
      this.blink = 1; this.blinkUntil = 0; this.nextBlink = performance.now() + 2500;
      this.react = 0; this.spin = 0; this.stateUntil = 0;
      this.face = {x:0, y:0, w:300};
      this._destroyed = false;
    }

    mount(container){
      this.root = PP.util.el('<div class="animal"></div>');
      this.root.innerHTML = MARKUP;
      container.innerHTML = "";
      container.appendChild(this.root);

      const q = s => this.root.querySelector(s);
      this.svg = q("svg");
      this.el = {
        bodyLayer:q(".an-bodyLayer"), breathe:q(".an-breathe"), squash:q(".an-squash"),
        head:q(".an-head"), earL:q(".an-earL"), earR:q(".an-earR"),
        pupilL:q(".an-pupilL"), pupilR:q(".an-pupilR"),
        blinkL:q(".an-blinkL"), blinkR:q(".an-blinkR"),
        ground:q(".an-ground"), tail:q(".an-tail"), tailPuff:q(".an-tailPuff"),
        muzzle:q(".an-muzzle"), whiskers:q(".an-whiskers"), accSlot:q(".an-accSlot"),
        bubble:q(".bubble"), overlay:q(".overlay"),
        earLOut:q(".an-earLOut"), earLIn:q(".an-earLIn"), earROut:q(".an-earROut"), earRIn:q(".an-earRIn")
      };

      this.applyCharacter();
      this.applyAccessory();
      this.setState(this.state, {rest:true});

      if(this.interactive){
        if(this.interactive !== "static") this.svg.setAttribute("tabindex", "0");
        this.svg.style.cursor = "pointer";
        this._click = () => { PP.sound.unlock(); this.poke(); };
        this._key = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); this._click(); } };
        this.svg.addEventListener("click", this._click);
        this.svg.addEventListener("keydown", this._key);
      }
      this._measure = () => this.measure();
      addEventListener("resize", this._measure, {passive:true});
      addEventListener("scroll", this._measure, {passive:true});
      this.measure();
      setTimeout(this._measure, 400);

      this._stop = PP.pointer.add(now => this.frame(now));
      return this;
    }

    measure(){
      if(!this.svg) return;
      const r = this.svg.getBoundingClientRect();
      this.face.x = r.left + r.width / 2;
      this.face.y = r.top + r.height * 0.38;
      this.face.w = Math.max(r.width, 180);
    }

    applyCharacter(){
      const ch = PP.data.getCharacter(this.characterId);
      const pal = PP.data.getPalette(this.paletteId || ch.palette);
      const s = this.root.style;
      s.setProperty("--fur", pal.fur); s.setProperty("--fur-dark", pal.furDark);
      s.setProperty("--belly", pal.belly); s.setProperty("--inner", pal.inner);
      s.setProperty("--accent", pal.accent);

      const ears = PP.data.ears[ch.species] || PP.data.ears.cat;
      this.el.earLOut.setAttribute("d", ears.out); this.el.earLIn.setAttribute("d", ears.in);
      this.el.earROut.setAttribute("d", ears.out); this.el.earRIn.setAttribute("d", ears.in);
      this.el.earL.style.transformOrigin = ears.pivot;
      this.el.earR.style.transformOrigin = ears.pivot;

      const sp = ch.species;
      const tailed = sp === "cat" || sp === "fox" || sp === "dog";
      this.el.tail.style.display = tailed ? "" : "none";
      this.el.tailPuff.style.display = tailed ? "none" : "";
      this.el.whiskers.style.display = (sp === "cat" || sp === "fox") ? "" : "none";
      this.el.muzzle.style.display = (sp === "bear" || sp === "fox" || sp === "dog") ? "" : "none";
      this.svg.setAttribute("aria-label", ch.name + ", " + ch.tagline + " — reacts to your cursor");
    }

    setCharacter(id, paletteId){
      this.characterId = id;
      this.paletteId = paletteId || null;
      if(this.root) this.applyCharacter();
    }
    setPalette(id){ this.paletteId = id; if(this.root) this.applyCharacter(); }

    setAccessory(id){ this.accessory = id; if(this.root) this.applyAccessory(); }
    applyAccessory(){
      this.el.accSlot.innerHTML = this.accessory && ACCESSORIES[this.accessory] ? ACCESSORIES[this.accessory] : "";
    }

    /* ---- animation state machine ---- */
    setState(name, opts){
      opts = opts || {};
      const prev = this.state;
      this.state = name;
      if(opts.rest || !TRANSIENT[name]) this.rest = name;
      this.stateUntil = TRANSIENT[name] ? performance.now() + (opts.duration || TRANSIENT[name]) : 0;
      if(name === "levelup") this.spin = 1;
      if(name === "surprised" || name === "happy") this.react = Math.max(this.react, 0.9);
      if(this.svg){
        this.svg.parentElement.className = "animal an-st-" + name;
      }
      return prev;
    }
    resting(){ return this.rest; }

    poke(){
      if(this.onClick){ this.onClick(this); return; }
      this.react = 1;
      const ch = PP.data.getCharacter(this.characterId);
      this.say(ch.hello);
      this.setState(this.rest === "sleeping" ? "sleeping" : "surprised");
      PP.sound.play("click");
    }

    say(text){
      if(!this.el.bubble) return;
      this.el.bubble.textContent = text;
      this.el.bubble.classList.remove("go");
      void this.el.bubble.offsetWidth;
      if(document.documentElement.dataset.motion === "off"){
        this.el.bubble.style.opacity = "1";
        clearTimeout(this._bt);
        this._bt = setTimeout(() => { this.el.bubble.style.opacity = "0"; }, 1500);
      }else{
        this.el.bubble.classList.add("go");
      }
    }

    fx(emoji, count){
      if(!this.el.overlay || document.documentElement.dataset.motion === "off") return;
      const n = count || 5;
      for(let i = 0; i < n; i++){
        const s = document.createElement("span");
        s.className = "fx";
        s.textContent = emoji;
        s.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(0) + "px");
        s.style.animationDelay = (i * 0.09) + "s";
        s.style.top = (32 + Math.random() * 16) + "%";
        this.el.overlay.appendChild(s);
        setTimeout(() => s.remove(), 1600 + i * 90);
      }
    }

    frame(now){
      if(this._destroyed) return;
      if(!this.root || !this.root.isConnected){ this.destroy(); return; }
      const off = document.documentElement.dataset.motion === "off";
      const low = document.documentElement.dataset.motion === "low";
      const t = now / 1000;

      /* transient state expiry */
      if(this.stateUntil && now > this.stateUntil) this.setState(this.rest, {rest:true});

      /* ---- aim ---- */
      const p = PP.pointer.pos;
      const sleeping = this.state === "sleeping";
      if(!sleeping && p.active && this.interactive !== "static"){
        const dx = p.x - this.face.x, dy = p.y - this.face.y;
        const nx = clamp(dx / (this.face.w * 0.62), -1, 1);
        const ny = clamp(dy / (this.face.w * 0.52), -1, 1);
        this.t.ex = nx; this.t.ey = ny; this.t.hx = nx; this.t.hy = ny; this.t.bx = nx; this.t.by = ny;
        const dist = Math.hypot(dx, dy), near = this.face.w * 0.52;
        let curiosity = clamp(1 - (dist - near * 0.35) / near, 0, 1);
        if(p.over) curiosity = Math.min(1, curiosity + 0.18);   // glance toward a hovered control
        this.t.cur = curiosity;
      }else{
        this.t.ex = this.t.ey = this.t.hx = this.t.bx = this.t.by = 0;
        this.t.hy = sleeping ? 0.25 : 0;
        this.t.cur = 0;
      }

      const k = low ? 0.6 : 1;
      this.c.ex = lerp(this.c.ex, this.t.ex, 0.20);
      this.c.ey = lerp(this.c.ey, this.t.ey, 0.20);
      this.c.hx = lerp(this.c.hx, this.t.hx, 0.10);
      this.c.hy = lerp(this.c.hy, this.t.hy, 0.10);
      this.c.bx = lerp(this.c.bx, this.t.bx, 0.055);
      this.c.by = lerp(this.c.by, this.t.by, 0.055);
      this.c.cur = lerp(this.c.cur, this.t.cur, 0.07);

      /* ---- blink ---- */
      if(!sleeping && now > this.nextBlink){
        this.blinkUntil = now + 120 + Math.random() * 60;
        this.nextBlink = now + 3000 + Math.random() * 4000;
        if(Math.random() < 0.25) setTimeout(() => { this.blinkUntil = performance.now() + 110; }, 260);
      }
      const blinking = now < this.blinkUntil;
      this.blink = lerp(this.blink, blinking ? 0.06 : 1, blinking ? 0.55 : 0.28);

      /* ---- state modifiers ---- */
      const st = this.state;
      this.react = Math.max(0, this.react - 0.022);
      this.spin  = Math.max(0, this.spin - 0.012);
      const rp = 1 - this.react;
      const wob = Math.cos(rp * Math.PI * 3);

      let floatAmp = 7, floatSpd = 0.9, breathAmp = 0.012, bounce = 0, headTilt = 0, earLift = 0;
      if(st === "happy"){ floatAmp = 12; floatSpd = 3.2; breathAmp = 0.03; earLift = -6; }
      else if(st === "playing"){ floatAmp = 16; floatSpd = 4.4; bounce = Math.abs(Math.sin(t * 7)) * 10; earLift = -9; }
      else if(st === "eating"){ floatAmp = 4; breathAmp = 0.022; headTilt = Math.sin(t * 9) * 3; }
      else if(st === "petting"){ floatAmp = 5; headTilt = Math.sin(t * 4) * 5; earLift = -4; }
      else if(st === "hungry"){ floatAmp = 4; floatSpd = 0.6; earLift = 9; }
      else if(st === "sleeping"){ floatAmp = 5; floatSpd = 0.42; breathAmp = 0.026; earLift = 11; }
      else if(st === "levelup"){ floatAmp = 18; floatSpd = 3.6; }

      const float = off ? 0 : Math.sin(t * floatSpd) * floatAmp * k - bounce;
      const sway  = off ? 0 : Math.sin(t * 0.63) * 4 * k;
      const breath = off ? 1 : 1 + Math.sin(t * (st === "sleeping" ? 0.9 : 1.5)) * breathAmp;

      const squashY = 1 - wob * 0.15 * this.react;
      const squashX = 1 + wob * 0.11 * this.react;
      const hop = -Math.sin(rp * Math.PI * 3) * 22 * this.react;

      /* ---- write transforms ---- */
      const curious = this.c.cur;
      const bx = (off || this.mini ? 0 : this.c.bx * 22 * k) + sway;
      const by = (off || this.mini ? 0 : this.c.by * 12 * k) + float + hop;
      this.el.bodyLayer.style.transform = `translate(${bx.toFixed(2)}px,${by.toFixed(2)}px)` +
        (this.spin > 0 ? ` rotate(${(this.spin * 360).toFixed(1)}deg)` : "");
      if(this.spin > 0) this.el.bodyLayer.style.transformOrigin = "270px 430px";
      this.el.breathe.style.transform = `scale(${breath.toFixed(4)},${(2 - breath).toFixed(4)})`;
      this.el.squash.style.transform  = `scale(${squashX.toFixed(4)},${squashY.toFixed(4)})`;

      const rot = off ? 0 : this.c.hx * 9 * k + headTilt;
      const hx  = off ? 0 : this.c.hx * (10 + curious * 5) * k;
      const hy  = off ? 0 : this.c.hy * (8 + curious * 6) * k - curious * 4;
      this.el.head.style.transform = `translate(${hx.toFixed(2)}px,${hy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;

      const idleEar = off ? 0 : Math.sin(t * 0.8) * 1.6;
      const lift = -this.c.hy * 5 - curious * 5 + earLift;
      const eb = this.react > 0 ? Math.sin(rp * Math.PI * 4) * 10 * this.react : 0;
      const lRot = this.c.hx * -7 + lift + idleEar - eb;
      const rRot = this.c.hx *  7 - lift - idleEar + eb;
      this.el.earL.style.transform = `rotate(${lRot.toFixed(2)}deg)`;
      this.el.earR.style.transform = `rotate(${(-rRot).toFixed(2)}deg)`;

      const px = this.c.ex * 13, py = this.c.ey * 11;
      const focus = 1 + curious * 0.08;
      this.el.pupilL.style.transform = `translate(${px.toFixed(2)}px,${py.toFixed(2)}px) scale(${focus.toFixed(3)})`;
      this.el.pupilR.style.transform = `translate(${(px * 0.9).toFixed(2)}px,${(py * 1.06).toFixed(2)}px) scale(${focus.toFixed(3)})`;

      const openness = this.blink * (1 + curious * 0.07 + this.react * 0.12) * (st === "hungry" ? 0.86 : 1);
      this.el.blinkL.style.transform = `scale(1,${openness.toFixed(3)})`;
      this.el.blinkR.style.transform = `scale(1,${(openness * 0.985).toFixed(3)})`;

      this.el.ground.style.transform = `scale(${(1 - by * 0.0035).toFixed(3)},1)`;
      this.el.ground.style.transformOrigin = "270px 566px";
      this.el.ground.style.opacity = (0.15 - by * 0.0006).toFixed(3);
    }

    destroy(){
      this._destroyed = true;
      if(this._stop) this._stop();
      removeEventListener("resize", this._measure);
      removeEventListener("scroll", this._measure);
      if(this.svg && this._click){
        this.svg.removeEventListener("click", this._click);
        this.svg.removeEventListener("keydown", this._key);
      }
      if(this.root) this.root.remove();
    }
  }

  return AnimalView;
})();
