/* Pet domain logic. UI components call these and render the result;
   none of them touch storage or compute stats themselves. */
window.PP = window.PP || {};
PP.pet = (function(){
  const clamp = PP.util.clamp;

  /* decay per hour while awake / asleep */
  const RATE = {
    awake:{hunger:-4.2, joy:-2.8, energy:-3.2},
    asleep:{hunger:-2.0, joy:-0.8, energy:+16}
  };
  const MAX_OFFLINE_HOURS = 30;   // never punish a long absence
  const COOLDOWN = {pet:8000, play:2000, feed:1200};
  const lastAction = {};

  function create(characterId, name){
    const ch = PP.data.getCharacter(characterId);
    const now = Date.now();
    const pet = {
      id:PP.util.uid("pet"),
      name:(name || ch.name).trim().slice(0, 20),
      characterId:ch.id,
      species:ch.species,
      palette:ch.palette,
      level:1, xp:0, coins:120,
      hunger:clamp(100 - ch.stats.hunger, 25, 95),
      energy:ch.stats.energy,
      joy:ch.stats.joy,
      health:100,
      inventory:Object.assign({}, ch.startingItems),
      equipped:{accessory:null, background:"blush"},
      achievements:[],
      asleep:false, sleepSince:null,
      counters:{feeds:0, plays:0, pets:0, games:0, interactions:0, days:1, bestGameScore:0, playMinutes:0},
      createdAt:now, lastUpdated:now, lastSeenDay:dayKey(now), lastInteraction:now
    };
    PP.store.setPet(pet);
    checkAchievements();
    return pet;
  }

  function dayKey(ts){ const d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate(); }
  function get(){ return PP.store.state.pet; }
  function character(){ const p = get(); return p ? PP.data.getCharacter(p.characterId) : null; }

  /* ---- time-based evolution, computed from timestamps ---- */
  function applyTime(){
    const p = get();
    if(!p) return null;
    const now = Date.now();
    const hours = Math.min((now - (p.lastUpdated || now)) / 3600000, MAX_OFFLINE_HOURS);
    if(hours > 0.002){
      const r = p.asleep ? RATE.asleep : RATE.awake;
      p.hunger = clamp(p.hunger + r.hunger * hours, 0, 100);
      p.joy    = clamp(p.joy    + r.joy    * hours, 0, 100);
      p.energy = clamp(p.energy + r.energy * hours, 0, 100);
      const target = (p.hunger + p.joy + p.energy) / 3;
      p.health = clamp(p.health + (target - p.health) * Math.min(hours / 12, 1), 12, 100);
      if(p.asleep && p.energy >= 100) wake({silent:true});
    }
    /* new calendar day → day counter + streak */
    const today = dayKey(now);
    let newDay = false;
    if(p.lastSeenDay !== today){
      p.counters.days += 1;
      p.lastSeenDay = today;
      newDay = true;
    }
    p.lastUpdated = now;
    PP.store.setPet(p);
    if(newDay) checkAchievements();
    return {newDay, hours};
  }

  function needsAttention(){
    const p = get();
    if(!p) return [];
    const out = [];
    if(p.hunger < 30) out.push({key:"hunger", message:p.name + " is getting hungry 🍎", icon:"🍎"});
    if(p.energy < 25 && !p.asleep) out.push({key:"energy", message:p.name + " is worn out — try a nap 😴", icon:"😴"});
    if(p.joy < 35) out.push({key:"joy", message:p.name + " would love some attention 💗", icon:"💗"});
    return out;
  }

  /* ---- xp / coins ---- */
  function addXp(amount){
    const p = get();
    const before = p.level;
    p.xp += amount;
    p.level = PP.data.levelFromXp(p.xp);
    PP.store.setPet(p);
    if(p.level > before){
      PP.notifications.push(p.name + " reached level " + p.level + "! 🎉", {icon:"🎉", type:"level"});
      checkAchievements();
      return {leveledUp:true, level:p.level};
    }
    return {leveledUp:false, level:p.level};
  }
  function addCoins(amount){
    const p = get(); p.coins = Math.max(0, p.coins + amount); PP.store.setPet(p); return p.coins;
  }

  function cooled(key){
    const wait = COOLDOWN[key] || 0;
    const t = lastAction[key] || 0;
    return Date.now() - t >= wait;
  }
  function cooldownLeft(key){
    return Math.max(0, (COOLDOWN[key] || 0) - (Date.now() - (lastAction[key] || 0)));
  }
  function stamp(key){ lastAction[key] = Date.now(); }

  /* ---- actions. Each returns {ok, state, fx, message, ...} ---- */
  function feed(itemId){
    const p = get(), item = PP.data.getItem(itemId);
    if(!p || !item || item.category !== "food") return {ok:false, message:"That is not food."};
    if(p.asleep) return {ok:false, message:p.name + " is asleep."};
    if((p.inventory[itemId] || 0) <= 0) return {ok:false, message:"You are out of " + item.name.toLowerCase() + "."};
    if(!cooled("feed")) return {ok:false, message:"One bite at a time."};
    stamp("feed");

    const ch = character();
    const loved = ch.favoriteFood === itemId;
    const mult = loved ? 1.35 : 1;
    p.inventory[itemId] -= 1;
    if(p.inventory[itemId] <= 0) delete p.inventory[itemId];
    p.hunger = clamp(p.hunger + item.hunger * mult, 0, 100);
    p.joy    = clamp(p.joy + (item.joy + (loved ? 6 : 0)), 0, 100);
    p.energy = clamp(p.energy + item.energy, 0, 100);
    p.health = clamp(p.health + 1.5, 0, 100);
    p.counters.feeds += 1; p.counters.interactions += 1;
    p.lastInteraction = Date.now();
    PP.store.setPet(p);
    const lvl = addXp(loved ? 18 : 12);
    const unlocked = checkAchievements();
    PP.sound.play("feed");
    return {ok:true, state:"eating", fx:item.icon, loved, level:lvl, unlocked,
            message:loved ? p.name + " loved the " + item.name.toLowerCase() + "! " + item.icon
                          : p.name + " ate the " + item.name.toLowerCase() + " " + item.icon};
  }

  function petIt(){
    const p = get();
    if(!p) return {ok:false};
    if(p.asleep) return {ok:false, message:p.name + " is fast asleep."};
    if(!cooled("pet")) return {ok:false, message:p.name + " needs a moment", wait:cooldownLeft("pet")};
    stamp("pet");
    p.joy = clamp(p.joy + 9, 0, 100);
    p.health = clamp(p.health + 1, 0, 100);
    p.counters.pets += 1; p.counters.interactions += 1;
    p.lastInteraction = Date.now();
    PP.store.setPet(p);
    const lvl = addXp(8);
    const unlocked = checkAchievements();
    PP.sound.play("pet");
    return {ok:true, state:"petting", fx:"💗", level:lvl, unlocked, message:p.name + " leans into it 💗"};
  }

  function finishGame({score, gameId}){
    const p = get();
    if(!p) return {ok:false};
    const coins = Math.round(score * 2.5);
    const xp = Math.round(score * 3);
    p.joy = clamp(p.joy + 14, 0, 100);
    p.energy = clamp(p.energy - 12, 0, 100);
    p.hunger = clamp(p.hunger - 5, 0, 100);
    p.counters.games += 1; p.counters.plays += 1; p.counters.interactions += 1;
    p.counters.bestGameScore = Math.max(p.counters.bestGameScore || 0, score);
    p.lastInteraction = Date.now();
    addCoins(coins);
    const lvl = addXp(xp);
    const unlocked = checkAchievements();
    PP.sound.play("play");
    return {ok:true, state:"playing", coins, xp, level:lvl, unlocked,
            message:"Nice! +" + coins + " coins and " + xp + " XP"};
  }

  function sleep(){
    const p = get();
    if(!p || p.asleep) return {ok:false};
    p.asleep = true; p.sleepSince = Date.now(); p.lastUpdated = Date.now();
    PP.store.setPet(p);
    PP.sound.play("sleep");
    return {ok:true, state:"sleeping", message:p.name + " curled up for a nap 😴"};
  }
  function wake(opts){
    const p = get();
    if(!p || !p.asleep) return {ok:false};
    applySleepGain(p);
    p.asleep = false; p.sleepSince = null; p.lastUpdated = Date.now();
    PP.store.setPet(p);
    if(!opts || !opts.silent) PP.sound.play("click");
    return {ok:true, state:"surprised", message:p.name + " is awake and stretching ✨"};
  }
  function applySleepGain(p){
    if(!p.sleepSince) return;
    const hours = Math.min((Date.now() - p.sleepSince) / 3600000, MAX_OFFLINE_HOURS);
    p.energy = clamp(p.energy + RATE.asleep.energy * hours, 0, 100);
  }

  function interact(){
    const p = get();
    if(!p) return {ok:false};
    if(p.asleep) return {ok:false, message:p.name + " is asleep."};
    p.counters.interactions += 1;
    p.joy = clamp(p.joy + 3, 0, 100);
    p.lastInteraction = Date.now();
    PP.store.setPet(p);
    const lvl = addXp(4);
    const unlocked = checkAchievements();
    const ch = character();
    return {ok:true, state:"happy", fx:"✨", level:lvl, unlocked, message:ch.hello};
  }

  function rename(name){
    const p = get();
    const n = String(name || "").trim();
    if(n.length < 1) return {ok:false, error:"Give your friend a name."};
    if(n.length > 20) return {ok:false, error:"20 characters maximum."};
    p.name = n; PP.store.setPet(p);
    return {ok:true, name:n};
  }
  function customize(patch){
    const p = get();
    Object.assign(p, patch);
    PP.store.setPet(p);
    return p;
  }
  function colors(){
    const p = get();
    if(!p) return PP.data.getPalette("gray");
    return PP.data.getPalette(p.palette);
  }

  /* ---- achievements ---- */
  function checkAchievements(){
    const p = get();
    if(!p) return [];
    const unlocked = [];
    PP.data.achievements.forEach(a => {
      if(p.achievements.indexOf(a.id) >= 0) return;
      let pass = false;
      try{ pass = a.test(p); }catch(e){ pass = false; }
      if(pass){
        p.achievements.push(a.id);
        p.coins += a.reward;
        unlocked.push(a);
        PP.notifications.push("Achievement unlocked — " + a.name + " " + a.icon, {icon:a.icon, type:"achievement", href:"#/pet/achievements"});
      }
    });
    if(unlocked.length){ PP.store.setPet(p); PP.sound.play("achievement"); }
    return unlocked;
  }

  function moodState(){
    const p = get();
    if(!p) return "idle";
    if(p.asleep) return "sleeping";
    if(p.hunger < 28) return "hungry";
    if(p.joy > 85 && p.energy > 55) return "happy";
    return "idle";
  }

  function reset(){ PP.store.clearPet(); }

  return {create, get, character, applyTime, needsAttention, feed, petIt, finishGame, sleep, wake,
          interact, rename, customize, colors, addXp, addCoins, checkAchievements, moodState,
          cooldownLeft, reset, dayKey};
})();
