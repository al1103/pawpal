/* Items + economy + level curve. */
window.PP = window.PP || {}; PP.data = PP.data || {};

PP.data.food = [
  {id:"apple",  name:"Apple",  category:"food", icon:"🍎", price:12, rarity:"common",
   hunger:14, joy:3,  energy:4,  description:"Crisp and easy. A reliable top-up between meals."},
  {id:"fish",   name:"Fish",   category:"food", icon:"🐟", price:26, rarity:"common",
   hunger:30, joy:8,  energy:6,  description:"A proper meal. Cats and dogs lose their minds for it."},
  {id:"milk",   name:"Milk",   category:"food", icon:"🥛", price:18, rarity:"common",
   hunger:16, joy:6,  energy:-4, description:"Comforting and a little sleepy. Good before a nap."},
  {id:"cookie", name:"Cookie", category:"food", icon:"🍪", price:22, rarity:"rare",
   hunger:12, joy:16, energy:10, description:"Not nutritious. Extremely motivating."},
  {id:"berry",  name:"Berry",  category:"food", icon:"🫐", price:16, rarity:"common",
   hunger:11, joy:9,  energy:7,  description:"Sweet little burst of energy."}
];

PP.data.toys = [
  {id:"ball",    name:"Ball",    category:"toys", icon:"⚽", price:40, rarity:"common", joy:10, game:"catch",
   description:"Throw, chase, repeat. The classic for a reason."},
  {id:"yarn",    name:"Yarn",    category:"toys", icon:"🧶", price:35, rarity:"common", joy:9,  game:"catch",
   description:"Endlessly batted around the floor."},
  {id:"frisbee", name:"Frisbee", category:"toys", icon:"🥏", price:60, rarity:"rare",   joy:14, game:"catch",
   description:"Big outdoor energy. Burns energy fast."},
  {id:"star",    name:"Star toy",category:"toys", icon:"⭐", price:80, rarity:"epic",   joy:18, game:"stars",
   description:"Glows, floats, gets chased. Unlocks extra sparkle in Catch the Star."}
];

PP.data.accessories = [
  {id:"bow",   name:"Bow",       category:"accessories", icon:"🎀", price:70,  rarity:"common", slot:"accessory",
   joy:4, description:"A small bow just behind the ear."},
  {id:"hat",   name:"Tiny hat",  category:"accessories", icon:"🎩", price:110, rarity:"rare",   slot:"accessory",
   joy:6, description:"Ridiculous. Perfect."},
  {id:"scarf", name:"Scarf",     category:"accessories", icon:"🧣", price:95,  rarity:"common", slot:"accessory",
   joy:5, description:"Soft knitted scarf for cold mornings."},
  {id:"crown", name:"Crown",     category:"accessories", icon:"👑", price:220, rarity:"epic",   slot:"accessory",
   joy:10, description:"For a companion with standards."}
];

PP.data.backgrounds = [
  {id:"blush",  name:"Blush",   category:"backgrounds", icon:"🌸", price:0,   rarity:"common", slot:"background",
   accent:"#E8A79B", soft:"#F8DDD6", description:"The default warm pink room."},
  {id:"mint",   name:"Mint",    category:"backgrounds", icon:"🌿", price:90,  rarity:"common", slot:"background",
   accent:"#8FBF9F", soft:"#E1F0E8", description:"Cool and calm, good for sleepers."},
  {id:"lilac",  name:"Lilac",   category:"backgrounds", icon:"🔮", price:120, rarity:"rare",   slot:"background",
   accent:"#B79BD4", soft:"#EADFF3", description:"Dusk light, all day long."},
  {id:"sunset", name:"Sunset",  category:"backgrounds", icon:"🌇", price:180, rarity:"epic",   slot:"background",
   accent:"#E8926C", soft:"#FBE2D3", description:"Golden hour that never ends."}
];

PP.data.items = {};
[].concat(PP.data.food, PP.data.toys, PP.data.accessories, PP.data.backgrounds)
  .forEach(i => { PP.data.items[i.id] = i; });
PP.data.getItem = id => PP.data.items[id] || null;
PP.data.itemsByCategory = cat => Object.values(PP.data.items).filter(i => i.category === cat);

/* ---- level curve: 0, 100, 250, 450, 700, 1000 ... ---- */
PP.data.xpForLevel = function(level){
  if(level <= 1) return 0;
  let total = 0, step = 100;
  for(let l = 2; l <= level; l++){ total += step; step += 50; }
  return total;
};
PP.data.levelFromXp = function(xp){
  let l = 1;
  while(l < 60 && xp >= PP.data.xpForLevel(l + 1)) l++;
  return l;
};
PP.data.levelProgress = function(xp){
  const l = PP.data.levelFromXp(xp);
  const cur = PP.data.xpForLevel(l), next = PP.data.xpForLevel(l + 1);
  return {level:l, into:xp - cur, need:next - cur, pct:Math.round(((xp - cur) / (next - cur)) * 100), nextAt:next};
};

/* ---- daily reward ladder ---- */
PP.data.dailyRewards = [
  {day:1, type:"coins", amount:50,  label:"50 coins",  icon:"🪙"},
  {day:2, type:"coins", amount:75,  label:"75 coins",  icon:"🪙"},
  {day:3, type:"item",  item:"fish", amount:2, label:"2× Fish", icon:"🐟"},
  {day:4, type:"coins", amount:100, label:"100 coins", icon:"🪙"},
  {day:5, type:"item",  item:"bow",  amount:1, label:"Bow accessory", icon:"🎀"},
  {day:6, type:"coins", amount:150, label:"150 coins", icon:"🪙"},
  {day:7, type:"item",  item:"crown",amount:1, label:"Crown (rare!)", icon:"👑"}
];
