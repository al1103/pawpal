/* Achievements. `test(pet)` is pure — it reads pet state only. */
window.PP = window.PP || {}; PP.data = PP.data || {};

PP.data.achievements = [
  {id:"first-friend", name:"First friend", icon:"🏡", reward:60,
   description:"Adopt your first companion.",
   progress:p => ({now: p ? 1 : 0, goal:1}),
   test:p => !!p},
  {id:"good-friend", name:"Good friend", icon:"💞", reward:80,
   description:"Interact with your pet 10 times.",
   progress:p => ({now:p.counters.interactions, goal:10}),
   test:p => p.counters.interactions >= 10},
  {id:"feeding-time", name:"Feeding time", icon:"🍽️", reward:80,
   description:"Feed your pet 10 times.",
   progress:p => ({now:p.counters.feeds, goal:10}),
   test:p => p.counters.feeds >= 10},
  {id:"play-time", name:"Play time", icon:"🎾", reward:100,
   description:"Finish 5 games together.",
   progress:p => ({now:p.counters.games, goal:5}),
   test:p => p.counters.games >= 5},
  {id:"level-up", name:"Level up", icon:"🎉", reward:150,
   description:"Reach level 5.",
   progress:p => ({now:p.level, goal:5}),
   test:p => p.level >= 5},
  {id:"best-friend", name:"Best friend", icon:"🌟", reward:250,
   description:"Spend 7 days together.",
   progress:p => ({now:p.counters.days, goal:7}),
   test:p => p.counters.days >= 7}
];

PP.data.getAchievement = id => PP.data.achievements.find(a => a.id === id);
