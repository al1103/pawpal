window.PP = window.PP || {};
PP.reward = (function(){
  function key(){ return "daily:" + (PP.store.state.user ? PP.store.state.user.id : "guest"); }
  function read(){ return PP.storage.read(key(), {lastClaim:null, streak:0}); }

  function status(){
    const s = read();
    const today = PP.pet.dayKey(Date.now());
    const yesterday = PP.pet.dayKey(Date.now() - 86400000);
    const claimedToday = s.lastClaim === today;
    const keepsStreak = s.lastClaim === yesterday || s.lastClaim === today;
    const day = claimedToday ? s.streak : (keepsStreak ? Math.min(s.streak + 1, 7) : 1);
    return {
      claimedToday,
      day:Math.max(1, day),
      streak:s.streak,
      reward:PP.data.dailyRewards[Math.max(0, Math.min(6, (claimedToday ? s.streak : day) - 1))]
    };
  }

  function claim(){
    const st = status();
    if(st.claimedToday) return {ok:false, message:"Already claimed today — come back tomorrow."};
    const pet = PP.store.state.pet;
    if(!pet) return {ok:false, message:"Adopt a companion first."};
    const r = st.reward;
    if(r.type === "coins") PP.pet.addCoins(r.amount);
    else PP.inventory.add(r.item, r.amount);
    PP.pet.addXp(25);
    PP.storage.write(key(), {lastClaim:PP.pet.dayKey(Date.now()), streak:st.day});
    PP.sound.play("coin");
    PP.notifications.push("Daily reward claimed: " + r.label + " " + r.icon, {icon:r.icon, type:"reward"});
    return {ok:true, reward:r, day:st.day, message:"Day " + st.day + " reward: " + r.label};
  }

  return {status, claim};
})();
