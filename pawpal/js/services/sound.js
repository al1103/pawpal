/* Sound service.
   Tones are synthesised, so there are no audio assets to ship or 404 on.
   Swap `play()` for buffer playback later without touching callers.
   Nothing plays until the user has interacted with the page. */
window.PP = window.PP || {};
PP.sound = (function(){
  let ctx = null, unlocked = false;

  const PATCHES = {
    click:       {notes:[[660, 0, .05]], type:"sine",     gain:.05},
    feed:        {notes:[[520, 0, .08], [780, .07, .12]], type:"triangle", gain:.07},
    pet:         {notes:[[440, 0, .1], [660, .09, .14]],  type:"sine",     gain:.06},
    play:        {notes:[[600, 0, .06], [900, .06, .08]], type:"square",   gain:.04},
    sleep:       {notes:[[300, 0, .2], [220, .18, .3]],   type:"sine",     gain:.05},
    levelup:     {notes:[[523, 0, .1], [659, .1, .1], [784, .2, .1], [1046, .3, .25]], type:"triangle", gain:.07},
    achievement: {notes:[[784, 0, .1], [1046, .12, .22]], type:"triangle", gain:.07},
    notification:{notes:[[880, 0, .07], [1175, .07, .1]], type:"sine",     gain:.05},
    coin:        {notes:[[1046, 0, .05], [1318, .05, .1]],type:"square",   gain:.035},
    error:       {notes:[[220, 0, .12]], type:"sawtooth", gain:.04}
  };

  function unlock(){
    if(unlocked) return;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      ctx = new AC();
      if(ctx.state === "suspended") ctx.resume();
      unlocked = true;
    }catch(e){ ctx = null; }
  }
  function enabled(){ return !!(PP.store.state.settings.sound); }

  function play(name){
    if(!enabled() || !unlocked || !ctx) return;
    const patch = PATCHES[name] || PATCHES.click;
    const now = ctx.currentTime;
    patch.notes.forEach(([freq, at, dur]) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = patch.type; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + at);
      g.gain.linearRampToValueAtTime(patch.gain, now + at + .012);
      g.gain.exponentialRampToValueAtTime(.0001, now + at + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now + at); osc.stop(now + at + dur + .02);
    });
  }
  function setMuted(muted){ PP.store.setSettings({sound:!muted}); }

  return {unlock, play, setMuted, enabled, get names(){ return Object.keys(PATCHES); }};
})();
