window.PP = window.PP || {};
PP.inventory = (function(){
  function pet(){ return PP.store.state.pet; }

  function list(category){
    const p = pet();
    if(!p) return [];
    return Object.keys(p.inventory)
      .map(id => ({item:PP.data.getItem(id), qty:p.inventory[id]}))
      .filter(r => r.item && r.qty > 0 && (!category || r.item.category === category));
  }
  function count(id){ const p = pet(); return (p && p.inventory[id]) || 0; }

  function add(id, qty){
    const p = pet(); if(!p) return false;
    p.inventory[id] = (p.inventory[id] || 0) + (qty || 1);
    PP.store.setPet(p);
    return true;
  }
  function remove(id, qty){
    const p = pet(); if(!p) return false;
    p.inventory[id] = (p.inventory[id] || 0) - (qty || 1);
    if(p.inventory[id] <= 0) delete p.inventory[id];
    PP.store.setPet(p);
    return true;
  }

  function buy(id){
    const p = pet(), item = PP.data.getItem(id);
    if(!p || !item) return {ok:false, message:"That item does not exist."};
    if(p.coins < item.price) return {ok:false, message:"Not enough coins — you need " + (item.price - p.coins) + " more."};
    p.coins -= item.price;
    p.inventory[id] = (p.inventory[id] || 0) + 1;
    PP.store.setPet(p);
    PP.sound.play("coin");
    return {ok:true, message:item.name + " added to your inventory " + item.icon};
  }

  function use(id){
    const item = PP.data.getItem(id);
    if(!item) return {ok:false, message:"Unknown item."};
    if(item.category === "food") return PP.pet.feed(id);
    if(item.category === "toys"){
      const p = pet();
      if(p.asleep) return {ok:false, message:p.name + " is asleep."};
      p.joy = PP.util.clamp(p.joy + item.joy, 0, 100);
      p.energy = PP.util.clamp(p.energy - 4, 0, 100);
      p.counters.plays += 1; p.counters.interactions += 1;
      PP.store.setPet(p);
      PP.pet.addXp(6);
      const unlocked = PP.pet.checkAchievements();
      PP.sound.play("play");
      return {ok:true, state:"playing", fx:item.icon, unlocked, message:p.name + " played with the " + item.name.toLowerCase() + " " + item.icon};
    }
    return equip(id);
  }

  function equip(id){
    const p = pet(), item = PP.data.getItem(id);
    if(!p || !item || !item.slot) return {ok:false, message:"That cannot be equipped."};
    if(item.category !== "backgrounds" && count(id) <= 0) return {ok:false, message:"You do not own that yet."};
    p.equipped[item.slot] = id;
    if(item.joy) p.joy = PP.util.clamp(p.joy + 2, 0, 100);
    PP.store.setPet(p);
    return {ok:true, state:"happy", message:item.name + " equipped " + item.icon};
  }
  function unequip(slot){
    const p = pet(); if(!p) return {ok:false};
    p.equipped[slot] = slot === "background" ? "blush" : null;
    PP.store.setPet(p);
    return {ok:true, message:"Removed."};
  }
  function owns(id){
    const p = pet(); if(!p) return false;
    const item = PP.data.getItem(id);
    if(item && item.category === "backgrounds" && item.price === 0) return true;
    return count(id) > 0;
  }

  function shop(category){
    return PP.data.itemsByCategory(category).filter(i => i.price > 0);
  }

  return {list, count, add, remove, buy, use, equip, unequip, owns, shop};
})();
