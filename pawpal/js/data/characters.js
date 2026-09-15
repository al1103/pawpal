/* Character data. UI never hard-codes character facts — it reads from here. */
window.PP = window.PP || {};
PP.data = PP.data || {};

/* Ear silhouettes per species (left side only; the right ear is mirrored). */
PP.data.ears = {
  cat:   {out:"M136 176c-8-78 8-128 36-130 30-2 66 54 82 96-44-4-90 8-118 34Z",
          in :"M158 158c-6-58 4-84 18-84 16 0 38 44 48 68-26-4-50 2-66 16Z", pivot:"180px 174px"},
  fox:   {out:"M126 186c-12-86 6-152 34-152 32 0 80 76 96 112-50-8-98 6-130 40Z",
          in :"M148 168c-8-64 4-108 18-108 20 0 50 56 62 84-30-6-62 4-80 24Z", pivot:"180px 174px"},
  bunny: {out:"M152 182c-38-72-44-160-8-170 34-10 52 74 48 152-14 6-30 12-40 18Z",
          in :"M160 164c-26-60-30-124-8-130 22-6 34 62 30 122-8 4-16 6-22 8Z", pivot:"168px 178px"},
  bear:  {out:"M124 112a52 52 0 1 1 104 0 52 52 0 1 1-104 0Z",
          in :"M148 112a28 28 0 1 1 56 0 28 28 0 1 1-56 0Z", pivot:"176px 140px"},
  dog:   {out:"M142 130c-30 8-44 78-30 132 12 44 56 44 72 6 14-34 6-78-8-104-10-20-22-36-34-34Z",
          in :"M152 152c-16 10-22 62-12 98 8 28 32 28 40 4 8-24 2-52-8-72-6-14-14-32-20-30Z", pivot:"176px 132px"}
};

PP.data.speciesLabel = {cat:"Cat", fox:"Fox", bunny:"Bunny", bear:"Bear", dog:"Dog"};

/* palette id -> colours usable for any character (customisation) */
PP.data.palettes = [
  {id:"gray",   name:"Warm gray", fur:"#CFC7C6", furDark:"#B4A9A8", belly:"#F7F1EE", inner:"#F0C9C6", accent:"#E8A79B", soft:"#F8DDD6"},
  {id:"snow",   name:"Snow",      fur:"#E7E9EE", furDark:"#CBD0DA", belly:"#FBFCFE", inner:"#D7E1EC", accent:"#A9BBD1", soft:"#E4ECF4"},
  {id:"rose",   name:"Rose",      fur:"#E5B8B8", furDark:"#CE9C9E", belly:"#FBEDEC", inner:"#F6D2CE", accent:"#D98F92", soft:"#F7DFDF"},
  {id:"lilac",  name:"Lilac",     fur:"#C7BFD2", furDark:"#A99FBA", belly:"#F3EFF8", inner:"#DCC6E6", accent:"#B79BD4", soft:"#EADFF3"},
  {id:"cream",  name:"Cream",     fur:"#F0DFD2", furDark:"#D9C2B2", belly:"#FDF6F1", inner:"#F3C4C0", accent:"#DDA9A2", soft:"#F7E7E0"},
  {id:"ginger", name:"Ginger",    fur:"#EFA987", furDark:"#D98C6A", belly:"#FDF0E6", inner:"#F6CDB6", accent:"#E8926C", soft:"#FBE2D3"},
  {id:"cocoa",  name:"Cocoa",     fur:"#B99A8C", furDark:"#9C7E70", belly:"#F2E7E0", inner:"#E0BDAE", accent:"#B4866F", soft:"#EBDCD2"},
  {id:"mint",   name:"Mint",      fur:"#C2D9CE", furDark:"#A6C2B5", belly:"#F0F7F3", inner:"#CFE7DA", accent:"#8FBF9F", soft:"#E1F0E8"}
];
PP.data.getPalette = id => PP.data.palettes.find(p => p.id === id) || PP.data.palettes[0];

PP.data.characters = [
  {
    id:"tito", name:"Tito", species:"cat", palette:"gray", rarity:"common", popular:true,
    tagline:"the curious one",
    personality:["Curious","Sleepy","Playful"],
    description:"Tito investigates everything twice, naps through the afternoon, and will sit on whatever you are working on. He is the easiest first companion — forgiving about late meals, delighted by anything that moves.",
    stats:{joy:100, energy:70, hunger:40, curiosity:95},
    favoriteFood:"fish", favoriteActivity:"catch",
    startingItems:{fish:3, apple:2, ball:1},
    animations:["idle","happy","playing","sleeping"],
    hello:"Meow! ♥"
  },
  {
    id:"luna", name:"Luna", species:"bunny", palette:"lilac", rarity:"rare", popular:true,
    tagline:"the quiet dreamer",
    personality:["Gentle","Energetic","Affectionate"],
    description:"Luna listens before she moves. She likes slow mornings, long ear-scratches and one sudden sprint around the room per day, usually right when you have settled down.",
    stats:{joy:92, energy:58, hunger:45, curiosity:88},
    favoriteFood:"berry", favoriteActivity:"cuddle",
    startingItems:{berry:3, milk:1, yarn:1},
    animations:["idle","happy","petting","sleeping"],
    hello:"Mrrp…"
  },
  {
    id:"milo", name:"Milo", species:"fox", palette:"ginger", rarity:"epic", popular:true,
    tagline:"the show-off",
    personality:["Bold","Clever","Dramatic"],
    description:"Milo learned three tricks and performs all of them whether you asked or not. Highest energy in the roster, so he needs real play time — but he will make you laugh for it.",
    stats:{joy:97, energy:96, hunger:55, curiosity:74},
    favoriteFood:"cookie", favoriteActivity:"catch",
    startingItems:{cookie:2, fish:1, frisbee:1},
    animations:["idle","playing","happy","surprised"],
    hello:"Yip! 👋"
  },
  {
    id:"nubi", name:"Nubi", species:"bunny", palette:"cream", rarity:"common", popular:false,
    tagline:"the soft landing",
    personality:["Calm","Shy","Loyal"],
    description:"Nubi takes a while to warm up and then never leaves your side. Low maintenance, high attachment — the companion for people who want company rather than chaos.",
    stats:{joy:86, energy:71, hunger:38, curiosity:79},
    favoriteFood:"apple", favoriteActivity:"cuddle",
    startingItems:{apple:3, milk:2},
    animations:["idle","petting","sleeping"],
    hello:"Hop hop!"
  },
  {
    id:"momo", name:"Momo", species:"bear", palette:"rose", rarity:"rare", popular:false,
    tagline:"the snack finder",
    personality:["Hungry","Warm","Stubborn"],
    description:"Momo can hear a packet open from another room. Slow, soft, extremely huggable, and absolutely certain that it is snack time again.",
    stats:{joy:94, energy:62, hunger:70, curiosity:68},
    favoriteFood:"cookie", favoriteActivity:"snack",
    startingItems:{cookie:3, berry:2},
    animations:["idle","eating","happy"],
    hello:"Snack? 🍪"
  },
  {
    id:"yuki", name:"Yuki", species:"cat", palette:"snow", rarity:"epic", popular:false,
    tagline:"the frost watcher",
    personality:["Quiet","Observant","Elegant"],
    description:"Yuki watches from the highest shelf and comments on nothing. Earn her attention once and it is yours for good — the most curious character in the roster by a wide margin.",
    stats:{joy:78, energy:69, hunger:42, curiosity:99},
    favoriteFood:"milk", favoriteActivity:"memory",
    startingItems:{milk:3, fish:1},
    animations:["idle","surprised","sleeping"],
    hello:"…hello."
  },
  {
    id:"pochi", name:"Pochi", species:"dog", palette:"cocoa", rarity:"common", popular:true,
    tagline:"the whole-body greeter",
    personality:["Loyal","Excitable","Kind"],
    description:"Pochi greets you like you have been gone for a year, every single time. Needs the most play of anyone here and gives back twice as much joy for it.",
    stats:{joy:99, energy:88, hunger:60, curiosity:72},
    favoriteFood:"fish", favoriteActivity:"catch",
    startingItems:{fish:2, ball:1, frisbee:1},
    animations:["idle","playing","happy"],
    hello:"Woof! 🐾"
  }
];

PP.data.getCharacter = id => PP.data.characters.find(c => c.id === id) || PP.data.characters[0];
PP.data.rarityLabel = {common:"Common", rare:"Rare", epic:"Epic"};
