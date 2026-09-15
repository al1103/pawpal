/* Persistence adapter.
   Everything above this line talks to `PP.storage`, never to localStorage
   directly, so swapping in an HTTP backend is a single-file change. */
window.PP = window.PP || {};
PP.storage = (function(){
  const NS = "pawpal:";
  let available = true;
  try{ localStorage.setItem(NS + "__t", "1"); localStorage.removeItem(NS + "__t"); }
  catch(e){ available = false; }
  const memory = {};

  function read(key, fallback){
    try{
      const raw = available ? localStorage.getItem(NS + key) : memory[key];
      if(raw == null) return fallback === undefined ? null : fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback === undefined ? null : fallback; }
  }
  function write(key, value){
    const raw = JSON.stringify(value);
    try{
      if(available) localStorage.setItem(NS + key, raw); else memory[key] = raw;
      return true;
    }catch(e){
      memory[key] = raw;
      return false; // quota or private mode — caller may surface a soft warning
    }
  }
  function remove(key){
    try{ if(available) localStorage.removeItem(NS + key); }catch(e){}
    delete memory[key];
  }
  /* session-scoped (cleared when the tab closes) */
  function sessionRead(key, fallback){
    try{ const raw = sessionStorage.getItem(NS + key); return raw == null ? fallback : JSON.parse(raw); }
    catch(e){ return fallback; }
  }
  function sessionWrite(key, value){
    try{ sessionStorage.setItem(NS + key, JSON.stringify(value)); }catch(e){}
  }
  function sessionRemove(key){ try{ sessionStorage.removeItem(NS + key); }catch(e){} }

  return {read, write, remove, sessionRead, sessionWrite, sessionRemove, available};
})();
