/* Central store. Slices: user, pet, settings, notifications.
   Components subscribe; services mutate. No component writes storage itself. */
window.PP = window.PP || {};
PP.store = (function(){
  const DEFAULT_SETTINGS = {
    theme:"light", sound:true, motion:"full", reducedMotion:false,
    notifications:true, autosave:true, cursorTrail:true, language:"en"
  };

  const state = {
    user:null,            // {id, username, email, bio, avatar, createdAt}
    pet:null,             // see services/pet.js
    notifications:[],
    settings:Object.assign({}, DEFAULT_SETTINGS, PP.storage.read("settings", {}))
  };

  const subs = new Set();
  function subscribe(fn){ subs.add(fn); return () => subs.delete(fn); }
  function emit(reason){ subs.forEach(fn => { try{ fn(state, reason); }catch(e){ console.warn(e); } }); }

  function petKey(){ return state.user ? "pet:" + state.user.id : "pet:guest"; }
  function notifKey(){ return state.user ? "notifs:" + state.user.id : "notifs:guest"; }

  function setUser(u, opts){
    state.user = u;
    if(u){
      state.pet = PP.storage.read(petKey(), null);
      state.notifications = PP.storage.read(notifKey(), []);
    }else{
      state.pet = null; state.notifications = [];
    }
    if(!opts || !opts.silent) emit("user");
  }
  function setPet(p, opts){
    state.pet = p;
    if(state.settings.autosave !== false) PP.storage.write(petKey(), p);
    if(!opts || !opts.silent) emit("pet");
  }
  function savePet(){ if(state.pet) PP.storage.write(petKey(), state.pet); }
  function clearPet(){ state.pet = null; PP.storage.remove(petKey()); emit("pet"); }

  function setNotifications(list){
    state.notifications = list.slice(0, 40);
    PP.storage.write(notifKey(), state.notifications);
    emit("notifications");
  }
  function setSettings(patch){
    Object.assign(state.settings, patch);
    PP.storage.write("settings", state.settings);
    emit("settings");
  }
  function resetSettings(){ state.settings = Object.assign({}, DEFAULT_SETTINGS); PP.storage.write("settings", state.settings); emit("settings"); }

  return {state, subscribe, emit, setUser, setPet, savePet, clearPet,
          setNotifications, setSettings, resetSettings, DEFAULT_SETTINGS};
})();
