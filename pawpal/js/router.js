window.PP = window.PP || {};
PP.router = (function(){
  const ROUTES = [
    {path:"/",                    page:() => PP.pages.landing},
    {path:"/characters",          page:() => PP.pages.characters},
    {path:"/character/:id",       page:() => PP.pages.characterDetail},
    {path:"/adopt",               page:() => PP.pages.adopt},
    {path:"/pet",                 page:() => PP.pages.pet},
    {path:"/pet/customize",       page:() => PP.pages.customize},
    {path:"/pet/inventory",       page:() => PP.pages.inventory},
    {path:"/pet/achievements",    page:() => PP.pages.achievements},
    {path:"/profile",             page:() => PP.pages.profile},
    {path:"/settings",            page:() => PP.pages.settings},
    {path:"/login",               page:() => PP.pages.login},
    {path:"/register",            page:() => PP.pages.register},
    {path:"/404",                 page:() => PP.pages.notFound}
  ];

  let cleanup = null, currentPath = null;

  function parse(){
    const raw = (location.hash || "#/").slice(1);
    const qIndex = raw.indexOf("?");
    const path = (qIndex >= 0 ? raw.slice(0, qIndex) : raw) || "/";
    const search = qIndex >= 0 ? raw.slice(qIndex + 1) : "";
    const query = {};
    search.split("&").filter(Boolean).forEach(pair => {
      const [k, v] = pair.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return {path:path.replace(/\/+$/, "") || "/", query};
  }
  function query(){ return parse().query; }

  function match(path){
    for(const r of ROUTES){
      const rp = r.path.split("/"), pp = path.split("/");
      if(rp.length !== pp.length) continue;
      const params = {};
      let ok = true;
      for(let i = 0; i < rp.length; i++){
        if(rp[i].startsWith(":")) params[rp[i].slice(1)] = decodeURIComponent(pp[i]);
        else if(rp[i] !== pp[i]){ ok = false; break; }
      }
      if(ok) return {route:r, params};
    }
    return null;
  }

  function render(){
    /* in-page anchors (e.g. the skip link) are not routes */
    const raw = (location.hash || "#/").slice(1);
    if(raw && raw[0] !== "/"){
      const target = document.getElementById(raw);
      if(target && target.focus) target.focus();
      return;
    }
    const {path, query} = parse();
    const found = match(path);
    const main = document.getElementById("main");

    if(cleanup){ try{ cleanup(); }catch(e){ console.warn(e); } cleanup = null; }

    let page = found ? found.route.page() : PP.pages.notFound;
    let params = found ? found.params : {};

    /* guards */
    if(page.auth && !PP.auth.isLoggedIn()){
      PP.ui.toast("Sign in first — it only takes a moment.", {icon:"🔒"});
      location.hash = "#/login?next=" + encodeURIComponent("#" + path);
      return;
    }
    if(page.needsPet && !PP.store.state.pet){
      PP.ui.toast("Adopt a companion to open this page.", {icon:"🐾"});
      location.hash = "#/adopt";
      return;
    }

    document.title = page.title || "Pawpal";
    /* a fresh host per route: any delegated listener a page attaches dies with it */
    main.innerHTML = "";
    const host = document.createElement("div");
    main.appendChild(host);
    try{
      cleanup = page.render(host, params, query) || null;
    }catch(err){
      console.error(err);
      main.innerHTML = '<div class="page">' + PP.ui.empty("😿", "Something went wrong",
        "That page could not be opened. Try again, or go back home.",
        '<a class="btn primary" href="#/">Back home</a>') + "</div>";
    }

    PP.nav.render();
    if(currentPath !== path) window.scrollTo({top:0, behavior:"auto"});
    currentPath = path;
    PP.nav.closePanel();
  }

  function reload(){ render(); }
  function go(hash){ location.hash = hash; }

  addEventListener("hashchange", render);

  return {render, reload, go, query, parse, ROUTES};
})();
