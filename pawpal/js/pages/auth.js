(function(){
const esc = PP.util.esc;

function field(name, label, type, extra){
  return `<div class="field">
    <label for="f-${name}">${esc(label)}</label>
    <div class="input" data-wrap="${name}">
      <input id="f-${name}" name="${name}" type="${type}" autocomplete="${extra && extra.auto || "off"}"
             ${extra && extra.placeholder ? `placeholder="${esc(extra.placeholder)}"` : ""}
             aria-describedby="e-${name}">
      ${type === "password" ? `<button type="button" class="linky" data-toggle="${name}"
             aria-label="Show password" style="font-size:12px">Show</button>` : ""}
    </div>
    <span class="err" id="e-${name}" role="alert"></span>
  </div>`;
}

function wire(root, onSubmit){
  PP.util.on(root, "[data-toggle]", "click", (e, b) => {
    const input = root.querySelector("#f-" + b.dataset.toggle);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    b.textContent = show ? "Hide" : "Show";
    b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
  root.querySelector("form").addEventListener("submit", e => { e.preventDefault(); onSubmit(); });
}
function showErrors(root, errors){
  PP.util.$$(".err", root).forEach(el => { el.textContent = ""; });
  PP.util.$$(".input", root).forEach(el => el.classList.remove("bad"));
  Object.keys(errors).forEach(k => {
    const err = root.querySelector("#e-" + k), wrap = root.querySelector('[data-wrap="' + k + '"]');
    if(err) err.textContent = errors[k];
    if(wrap) wrap.classList.add("bad");
  });
  const first = root.querySelector(".input.bad input");
  if(first) first.focus();
  if(Object.keys(errors).length) PP.sound.play("error");
}
function values(root){
  const o = {};
  PP.util.$$("input", root).forEach(i => { o[i.name] = i.type === "checkbox" ? i.checked : i.value; });
  return o;
}
function art(root, characterId){
  const host = root.querySelector("[data-art]");
  if(!host) return null;
  const v = new PP.Animal({character:characterId, interactive:true});
  v.mount(host);
  return v;
}

PP.pages.login = {
  title:"Log in — Pawpal",
  render(root){
    const next = PP.router.query().next || "#/pet";
    root.innerHTML = `
    <div class="page auth-wrap">
      <div class="auth-art" data-art></div>
      <div>
        <h1 style="font-size:clamp(30px,4vw,44px);margin:0 0 6px">Welcome back</h1>
        <p class="lede" style="margin-top:0">Your companion has been waiting. Sign in to pick up where you left off.</p>
        <form class="form" style="margin:26px 0 0" novalidate>
          ${field("email", "Email", "email", {auto:"email", placeholder:"you@example.com"})}
          ${field("password", "Password", "password", {auto:"current-password"})}
          <div class="spread">
            <label class="check"><input type="checkbox" name="remember"> Remember me</label>
            <button type="button" class="linky" data-forgot style="font-size:13px">Forgot password?</button>
          </div>
          <button class="btn primary lg block" type="submit">Log in</button>
          <p class="hint center">New here? <a class="linky" href="#/register">Create an account</a></p>
        </form>
      </div>
    </div>`;

    const v = art(root, "luna");
    wire(root, async () => {
      const vals = values(root);
      const btn = root.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Signing in…";
      const res = await PP.auth.login(vals);
      btn.disabled = false; btn.textContent = "Log in";
      if(!res.ok){ showErrors(root, res.errors); return; }
      showErrors(root, {});
      PP.sound.play("click");
      PP.ui.toast("Welcome back, " + res.user.username + "!", {icon:"👋"});
      location.hash = PP.store.state.pet ? next : "#/adopt";
    });
    PP.util.on(root, "[data-forgot]", "click", () => {
      PP.ui.modal({
        title:"Password reset",
        subtitle:"This demo runs entirely on your device, so there is no email to send.",
        html:`<p class="hint">Accounts here are stored locally in this browser. If you cannot get back in,
              create a new account — your existing pet stays attached to the old one.</p>
              <div class="row" style="margin-top:18px"><a class="btn primary" href="#/register" data-close>Create an account</a>
              <button class="btn ghost" data-close>Close</button></div>`
      });
    });
    return () => v && v.destroy();
  }
};

PP.pages.register = {
  title:"Create account — Pawpal",
  render(root){
    root.innerHTML = `
    <div class="page auth-wrap">
      <div>
        <h1 style="font-size:clamp(30px,4vw,44px);margin:0 0 6px">Create your account</h1>
        <p class="lede" style="margin-top:0">One account keeps your pet, coins and achievements safe on this device.</p>
        <form class="form" style="margin:26px 0 0" novalidate>
          ${field("username", "Username", "text", {auto:"nickname", placeholder:"3–20 characters"})}
          ${field("email", "Email", "email", {auto:"email", placeholder:"you@example.com"})}
          ${field("password", "Password", "password", {auto:"new-password", placeholder:"At least 8 characters"})}
          ${field("confirm", "Confirm password", "password", {auto:"new-password"})}
          <label class="check"><input type="checkbox" name="remember" checked> Keep me signed in for 30 days</label>
          <button class="btn primary lg block" type="submit">Create account</button>
          <p class="hint center">Already have one? <a class="linky" href="#/login">Log in</a></p>
          <p class="hint center" style="opacity:.8">Demo accounts are stored in this browser only. Passwords are hashed, never saved in plain text.</p>
        </form>
      </div>
      <div class="auth-art" data-art></div>
    </div>`;

    const v = art(root, "pochi");
    wire(root, async () => {
      const vals = values(root);
      const btn = root.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Creating…";
      const res = await PP.auth.register(vals);
      btn.disabled = false; btn.textContent = "Create account";
      if(!res.ok){ showErrors(root, res.errors); return; }
      showErrors(root, {});
      PP.ui.confetti();
      PP.sound.play("levelup");
      PP.ui.toast("Account created. Let's find your companion!", {icon:"🎉"});
      location.hash = "#/adopt";
    });
    return () => v && v.destroy();
  }
};
})();
