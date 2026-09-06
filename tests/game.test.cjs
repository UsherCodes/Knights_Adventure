const vm = require("node:vm"),
  fs = require("node:fs");
const els = {};
const noop = () => {};
const ctx = new Proxy(
  { createLinearGradient: () => ({ addColorStop: noop }) },
  { get: (o, k) => o[k] || noop, set: (o, k, v) => ((o[k] = v), true) },
);
const element = () => ({
  style: {},
  classList: { add: noop, remove: noop },
  addEventListener: noop,
  focus: noop,
  setAttribute: noop,
  getContext: () => ctx,
  clientWidth: 960,
  clientHeight: 600,
  hidden: false,
});
const data = {};
const env = {
  console,
  Math,
  Set,
  JSON,
  Number,
  document: {
    querySelector: (s) => (els[s] ??= element()),
    querySelectorAll: () => [],
    addEventListener: noop,
  },
  window: { addEventListener: noop },
  localStorage: {
    setItem: (k, v) => (data[k] = v),
    getItem: (k) => data[k] || null,
  },
  matchMedia: () => ({ matches: false }),
  requestAnimationFrame: noop,
};
vm.createContext(env);
vm.runInContext(
  fs.readFileSync(require("node:path").join(__dirname, "../game.js"), "utf8"),
  env,
);
const scenarios = `
state='paused';const out=[];function check(name,fn){fn();out.push(name)}function ok(v,m){if(!v)throw Error(m)};
check('normalized diagonal movement',()=>{reset();state='playing';keys.add('d');keys.add('s');const x=p.x,y=p.y;update(.1);keys.clear();ok(Math.abs(Math.hypot(p.x-x,p.y-y)-17.5)<.1,'diagonal speed');});
check('locked gate and key progression',()=>{reset();p.x=885;p.y=300;moveBody(p,100,0);ok(p.x<930,'locked gate');p.x=690;p.y=155;interact();ok(p.key,'key');p.x=875;p.y=300;interact();ok(gates.wood&&checkpoint==='ruins','gate');moveBody(p,120,0);ok(p.x>930,'open gate');});
check('all three upgrades and secret passage',()=>{for(const kind of ['fire','bounce','phase']){const c=chests.find(c=>c.kind===kind);p.x=c.x;p.y=c.y;interact();ok(p[kind],kind);}p.x=1140;p.y=490;interact();ok(p.x===1570&&p.y===445,'secret passage');});
check('skeleton block and perfect parry',()=>{reset();const e=enemies.find(e=>e.type==='skeleton');p.x=e.x-35;p.y=e.y;p.face=0;e.face=Math.PI;const hp=e.hp;damage(e,1);ok(e.hp===hp,'shield block');p.shield=true;p.parry=.15;hurt(1,e);ok(e.hp<hp&&p.hp===6&&e.stun>0,'parry');});
check('roll invulnerability and ghoststep',()=>{reset();p.stamina=100;roll();hurt(2,enemies[0]);ok(p.hp===6&&p.stamina===73,'roll immunity/cost');p.rollCD=0;p.roll=0;p.phase=true;p.x=enemies[0].x-32;p.y=enemies[0].y;p.face=0;roll();update(.1);ok(p.x>enemies[0].x,'ghoststep');});
check('arrow deflection and ricochet',()=>{reset();p.x=1200;p.y=300;p.face=0;p.shield=true;p.bounce=true;keys.add('l');shots=[{x:p.x+15,y:p.y,vx:-230,vy:0,life:3,reflected:false,bounces:0}];update(.001);ok(shots[0]?.reflected,'reflection');const e=enemies[0];shots[0].x=e.x;shots[0].y=e.y;const hp=e.hp;update(.001);ok(e.hp<hp&&shots[0].bounces===1,'ricochet');keys.clear();});
check('beacon checkpoint, boss phases and rescue',()=>{reset();gates.wood=true;p.x=1850;p.y=300;interact();ok(gates.keep&&checkpoint==='keep','beacon');p.x=2300;update(.01);ok(boss.active,'boss activation');boss.wind=.01;boss.attackType='slam';boss.target={x:p.x,y:p.y};p.roll=0;p.inv=0;update(.02);ok(p.hp===4&&boss.stun>0,'telegraphed slam');boss.hp=17;boss.stun=0;update(.01);ok(boss.phase===2&&boss.armor===0,'phase 2');damage(boss,100,true);ok(boss.dead,'defeated');p.x=2745;p.y=300;interact();ok(p.companion&&state==='won','rescue');});
check('checkpoint reload and companion combat',()=>{reset();ok(load(),'load');ok(p.companion&&boss.dead&&gates.keep,'persistent rescue');state='playing';enemies=[enemy('slime',p.x-70,p.y)];dragon.x=p.x-35;dragon.y=p.y;dragon.cd=0;update(.01);ok(enemies[0].hp<3,'dragon combat');});
state='paused';
`;
console.log(
  vm
    .runInContext("(function(){" + scenarios + "return out;})()", env)
    .map((name) => "PASS: " + name)
    .join("\n"),
);
