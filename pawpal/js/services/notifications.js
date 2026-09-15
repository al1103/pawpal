window.PP = window.PP || {};
PP.notifications = (function(){
  function list(){ return PP.store.state.notifications; }
  function unread(){ return list().filter(n => !n.read).length; }

  function push(message, opts){
    opts = opts || {};
    if(PP.store.state.settings.notifications === false && !opts.force) return null;
    const n = {id:PP.util.uid("n"), message:String(message), icon:opts.icon || "🔔",
               type:opts.type || "info", at:Date.now(), read:false, href:opts.href || null};
    PP.store.setNotifications([n].concat(list()));
    if(opts.sound !== false) PP.sound.play("notification");
    return n;
  }
  function markRead(id){
    PP.store.setNotifications(list().map(n => n.id === id ? Object.assign({}, n, {read:true}) : n));
  }
  function markAllRead(){
    PP.store.setNotifications(list().map(n => Object.assign({}, n, {read:true})));
  }
  function clear(){ PP.store.setNotifications([]); }

  return {list, unread, push, markRead, markAllRead, clear};
})();
