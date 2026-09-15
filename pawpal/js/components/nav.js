window.PP = window.PP || {};
PP.nav = (function(){
  const esc = PP.util.esc;
  let openPanel = null;

  const LINKS = [
    {href:"#/", label:"Home"},
    {href:"#/characters", label:"Characters"},
    {href:"#/pet", label:"My pet"},
    {href:"#/pet/inventory", label:"Inventory"},
    {href:"#/pet/achievements", label:"Achievements"}
  ];
  const TABS = [
    {href:"#/", label:"Home", icon:"🏠"},
    {href:"#/pet", label:"Pet", icon:"🐾"},
    {href:"#/characters", label:"Characters", icon:"✨"},
    {href:"#/pet/inventory", label:"Items", icon:"🎒"},
    {href:"#/profile", label:"Profile", icon:"🙂"}
  ];

  function render(){
    const s = PP.store.state;
    const bar = document.getElementById("topbar");
    const route = location.hash || "#/";
    const unread = PP.notifications.unread();

    bar.innerHTML =
      '<nav class="nav" aria-label="Main">' +
        '<a class="brand" href="#/"><span class="mark">' + PP.ui.pawIcon(18) + "</span>Pawpal</a>" +
        '<div class="nav-links">' +
          LINKS.map(l => '<a href="' + l.href + '"' +
            (route === l.href || (l.href !== "#/" && route.indexOf(l.href) === 0) ? ' class="active" aria-current="page"' : "") +
            ">" + esc(l.label) + "</a>").join("") +
        "</div>" +
        '<div class="nav-right">' +
          (s.pet ? '<span class="coinpill" title="Coins">🪙 <span data-coins>' + s.pet.coins + "</span></span>" : "") +
          (s.user ?
            '<div class="navwrap">' +
              '<button class="iconbtn" data-panel="notif" aria-label="Notifications' + (unread ? ", " + unread + " unread" : "") + '" aria-expanded="false">🔔' +
              (unread ? '<span class="badge">' + unread + "</span>" : "") + "</button></div>" +
              '<div class="navwrap"><button class="iconbtn avatarbtn" data-panel="acct" aria-label="Account menu" aria-expanded="false">' +
              esc(s.user.avatar || "🐾") + "</button></div>"
            :
            '<a class="btn ghost sm" href="#/login">Log in</a><a class="btn primary sm" href="#/register">Sign up</a>') +
        "</div>" +
      "</nav>";

    const nav = document.getElementById("bottomnav");
    nav.innerHTML = TABS.map(t => '<a href="' + t.href + '"' +
      (route === t.href || (t.href !== "#/" && route.indexOf(t.href) === 0) ? ' class="active" aria-current="page"' : "") +
      '><span class="bi" aria-hidden="true">' + t.icon + "</span>" + esc(t.label) + "</a>").join("");

    PP.util.$$("[data-panel]", bar).forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        togglePanel(btn.dataset.panel, btn);
      });
    });
  }

  function closePanel(){
    if(openPanel){
      openPanel.node.remove();
      if(openPanel.btn) openPanel.btn.setAttribute("aria-expanded", "false");
      openPanel = null;
    }
  }
  document.addEventListener("click", closePanel);
  document.addEventListener("keydown", e => { if(e.key === "Escape") closePanel(); });

  function togglePanel(kind, btn){
    const wasOpen = openPanel && openPanel.kind === kind;
    closePanel();
    if(wasOpen) return;
    const node = kind === "notif" ? notifPanel() : acctPanel();
    btn.parentElement.appendChild(node);
    btn.setAttribute("aria-expanded", "true");
    node.addEventListener("click", e => e.stopPropagation());
    openPanel = {kind, node, btn};
  }

  function notifPanel(){
    const list = PP.notifications.list();
    const node = PP.util.el('<div class="pop"></div>');
    node.innerHTML =
      '<div class="spread" style="margin-bottom:8px"><h4>Notifications</h4>' +
      (list.length ? '<button class="linky" data-all style="font-size:12px">Mark all read</button>' : "") + "</div>" +
      (list.length
        ? list.map(n => '<a class="nitem' + (n.read ? "" : " unread") + '" href="' + esc(n.href || "#/pet") +
            '" data-id="' + n.id + '"><span aria-hidden="true">' + esc(n.icon) + "</span>" +
            "<span><p>" + esc(n.message) + "</p><time>" + PP.util.timeAgo(n.at) + "</time></span></a>").join("")
        : PP.ui.empty("🔕", "Nothing new", "Feed, play and level up — updates will show here."));
    PP.util.on(node, "[data-all]", "click", () => { PP.notifications.markAllRead(); closePanel(); });
    PP.util.on(node, ".nitem", "click", (e, t) => { PP.notifications.markRead(t.dataset.id); closePanel(); });
    return node;
  }

  function acctPanel(){
    const u = PP.store.state.user;
    const node = PP.util.el('<div class="pop"></div>');
    node.innerHTML =
      '<div class="row" style="padding:6px 6px 12px"><span class="avatarbtn" aria-hidden="true">' + esc(u.avatar || "🐾") + "</span>" +
      "<span><strong>" + esc(u.username) + '</strong><br><span class="qty">' + esc(u.email) + "</span></span></div>" +
      '<a class="nitem" href="#/profile"><span>🙂</span><span><p>Profile</p></span></a>' +
      '<a class="nitem" href="#/pet/inventory"><span>🎒</span><span><p>Inventory</p></span></a>' +
      '<a class="nitem" href="#/pet/achievements"><span>🏆</span><span><p>Achievements</p></span></a>' +
      '<a class="nitem" href="#/settings"><span>⚙️</span><span><p>Settings</p></span></a>' +
      '<button class="nitem" data-logout style="width:100%;text-align:left"><span>👋</span><span><p>Log out</p></span></button>';
    PP.util.on(node, "[data-logout]", "click", () => {
      PP.auth.logout();
      closePanel();
      PP.ui.toast("Signed out. See you soon!", {icon:"👋"});
      location.hash = "#/";
    });
    PP.util.on(node, ".nitem", "click", () => closePanel());
    return node;
  }

  function refreshCoins(){
    const el = document.querySelector("[data-coins]");
    const p = PP.store.state.pet;
    if(el && p) el.textContent = p.coins;
  }

  return {render, refreshCoins, closePanel};
})();
