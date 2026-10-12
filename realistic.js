"use strict";
// Rendered art is optional: the illustrated renderer remains the loading/error fallback.
// No simulation, collisions, controls or save fields are changed here.
const Realistic = (globalThis.Realistic = {
  loaded: false,
  sprites: new Image(),
  ground: new Image(),
  tiles: new Map(),
  // Hand-trimmed source bounds, rather than assuming the generated atlas is a uniform grid.
  regions: {
    knight:[40,0,257,337], ranger:[368,0,239,337], villager:[693,0,168,334], queen:[963,0,272,336],
    wolf:[0,347,321,270], dragon:[320,335,387,292], guardian:[710,336,187,294], slime:[949,391,305,226],
    oak:[0,626,359,320], pine:[376,632,225,313], palm:[641,629,299,319], rock:[950,634,304,309],
    cottage:[6,945,315,299], hall:[334,944,333,300], well:[685,946,238,297], arch:[941,948,313,296],
  },
  sprite(name,x,feet,height,flip=false,width) {
    const b=this.regions[name],w=width||height*b[2]/b[3];
    ctx.save();ctx.translate(x,feet);if(flip)ctx.scale(-1,1);
    ctx.drawImage(this.sprites,...b,-w/2,-height,w,height);ctx.restore();
  },
  tile(kind) {
    if(this.tiles.has(kind))return this.tiles.get(kind);
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    const q={wood:[0,0],road:[627,0],snow:[0,627],sand:[627,627],ash:[627,627]}[kind]||[0,0];
    // Mirrored quadrants meet at identical edges, removing hard seams in repeated terrain.
    if(kind==='ash')g.filter='grayscale(.9) brightness(.48)';
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
      g.save();g.translate(col?512:0,row?512:0);g.scale(col?-1:1,row?-1:1);
      g.drawImage(this.ground,q[0],q[1],627,627,0,0,256,256);g.restore();
    }
    const pattern=ctx.createPattern(c,'repeat');this.tiles.set(kind,pattern);return pattern;
  },
  terrain(r) {
    ctx.save();ctx.fillStyle=this.tile(r.biome);ctx.fillRect(cam,0,view,600);
    ctx.fillStyle=r.biome==='snow'?'#152a381a':'#18251b30';ctx.fillRect(cam,0,view,600);
    ctx.beginPath();ctx.rect(0,285,W,84);ctx.rect(185,220,624,200);ctx.rect(360,365,165,58);ctx.clip();
    ctx.fillStyle=this.tile('road');ctx.fillRect(cam,0,view,600);
    ctx.fillStyle=r.biome==='sand'?'#bc954336':r.biome==='snow'?'#eefaff40':'#41362118';ctx.fillRect(cam,0,view,600);ctx.restore();
    // Soft edge shading gives the road depth without hiding the walkable route.
    const edge=ctx.createLinearGradient(0,278,0,379);edge.addColorStop(0,'#09130f00');edge.addColorStop(.12,'#09130f32');edge.addColorStop(.22,'#09130f00');edge.addColorStop(.82,'#09130f00');edge.addColorStop(.9,'#09130f32');edge.addColorStop(1,'#09130f00');
    ctx.fillStyle=edge;ctx.fillRect(Math.max(810,cam),278,view,101);
  },
  decor(d,r) {
    if(!this.loaded)return false;
    if((d.y<100||d.y>545)&&d.k===0){
      const name={wood:'oak',snow:'pine',sand:'palm',ash:'rock'}[r.biome];
      const h=(r.biome==='ash'?80:132)*(0.8+d.s*.5);
      Art.shadow(d.x,d.y+25,h*.28);this.sprite(name,d.x,d.y+30,h);
    }
    return true;
  },
  ruin(x,feet,height) {
    if(!this.loaded)return false;
    Art.shadow(x,feet-4,height*.3);this.sprite("arch",x,feet,height);return true;
  },
  camp(x,y) {
    if(!this.loaded)return false;
    const glow=ctx.createRadialGradient(x,y,1,x,y,35);glow.addColorStop(0,"#ffbd7444");glow.addColorStop(1,"#ffbd7400");Art.ellipse(x,y,35,26,glow);
    for(let n=0;n<9;n++){const a=n*Math.PI*2/9;Art.ellipse(x+Math.cos(a)*15,y+Math.sin(a)*7,5,3,Art.metal(x-5,y-3,10,6,"#9b998c","#514e46"));}
    ctx.strokeStyle="#68503a";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-10,y+4);ctx.lineTo(x+9,y-4);ctx.moveTo(x-9,y-4);ctx.lineTo(x+10,y+4);ctx.stroke();
    for(let n=0;n<5;n++){const h=12+Math.sin(t*7+n)*4;Art.poly([[x-7+n*3,y],[x-5+n*3+Math.sin(t*9+n)*2,y-h],[x-2+n*3,y]],n%2?"#ffe3a0":"#ed964f");}return true;
  },
  well() {
    if(!this.loaded)return false;
    Art.shadow(435,411,38);this.sprite('well',435,413,94);return true;
  },
});
Realistic.ready=Promise.all([
  new Promise(resolve=>{Realistic.sprites.onload=()=>resolve(true);Realistic.sprites.onerror=()=>resolve(false);Realistic.sprites.src='assets/realistic-sprites.png';}),
  new Promise(resolve=>{Realistic.ground.onload=()=>resolve(true);Realistic.ground.onerror=()=>resolve(false);Realistic.ground.src='assets/realistic-terrain.png';}),
]).then(results=>(Realistic.loaded=results.every(Boolean)));
const paintedTerrain=Art.terrain.bind(Art);
Art.terrain=r=>Realistic.loaded?Realistic.terrain(r):paintedTerrain(r);
const paintedTree=tree;
tree=function(x,y,s=1){if(!Realistic.loaded)return paintedTree(x,y,s);const biome=World.location?World.current().biome:'wood';Art.shadow(x,y+27*s,35*s);Realistic.sprite({wood:'oak',snow:'pine',sand:'palm',ash:'rock'}[biome]||'oak',x,y+32*s,135*s);};
const paintedHuman=Art.human.bind(Art);
Art.human=function(x,y,color,armored=false,face=0){
  if(!Realistic.loaded)return paintedHuman(x,y,color,armored,face);
  Art.shadow(x,y+21,23);Realistic.sprite(armored?'knight':'villager',x,y+23+(armored&&keys.size?Math.sin(t*11)*1.2:0),armored?76:65,armored&&Math.cos(face)<0);
};
const paintedPerson=World.person.bind(World);
World.person=function(n){
  if(!Realistic.loaded)return paintedPerson(n);
  Art.shadow(n.x,n.y+20,20);Realistic.sprite(n.kind==='ruler'?'queen':'villager',n.x,n.y+23,67);
  if(n.kind==='ruler')text(this.record().claimed?'✦':this.record().accepted?'?':'!',n.x,n.y-53,16,'#ffe3a0');
};
const paintedHouse=World.house.bind(World);
World.house=function(h,r){
  if(!Realistic.loaded)return paintedHouse(h,r);
  Art.shadow(h.x+h.w/2,h.y+h.h,Math.max(h.w*.65,60));
  Realistic.sprite(h.kind==='hall'?'hall':'cottage',h.x+h.w/2,h.y+h.h+4,h.h+53,false,h.w+24);
  if(h.kind==='smith')torch(h.x+12,h.y+h.h-16);
  if(h.name)text(h.name,h.x+h.w/2,h.y+h.h+19,9,'#f2e1be');
};
const paintedSlime=Art.slime.bind(Art),paintedDragon=Art.dragon.bind(Art);
Art.slime=function(x,y,color,friendly){if(!Realistic.loaded)return paintedSlime(x,y,color,friendly);Art.shadow(x,y+15,22);Realistic.sprite('slime',x,y+17,38+Math.sin(t*4)*1.5);};
Art.dragon=function(x,y,color,friendly,scale=1){if(!Realistic.loaded)return paintedDragon(x,y,color,friendly,scale);Art.shadow(x,y+20,30*scale);Realistic.sprite('dragon',x,y+23+Math.sin(t*4)*1.5,76*scale);};
const paintedFriend=Journeys.friendSprite.bind(Journeys);
Journeys.friendSprite=function(f,x,y){
  if(!Realistic.loaded||f.role==='dragon'||f.role==='slime')return paintedFriend(f,x,y);
  Art.shadow(x,y+20,21);Realistic.sprite(f.role==='guard'?'knight':'ranger',x,y+23,69);
};
const paintedKnight=knight;
knight=function(){
  if(!Realistic.loaded)return paintedKnight();
  ctx.save();if(p.inv>0&&Math.sin(t*35)>0)ctx.globalAlpha=.5;
  // Lean while dodging; keep the body readable rather than spinning the whole image.
  ctx.translate(p.x,p.y);if(p.roll>0)ctx.rotate(Math.cos(p.face)*.3);ctx.translate(-p.x,-p.y);
  Art.human(p.x,p.y,'',true,p.face);ctx.restore();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.face);
  if(p.attack>0){ctx.strokeStyle=p.fire?'#ffcf86':'#f0f5f5dd';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,52,-1.1,1.1);ctx.stroke();}
  if(p.shield){ctx.strokeStyle=p.parry>0?'#fff0b7':'#afd6d7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,28,-1.1,1.1);ctx.stroke();}
  ctx.restore();
};
const paintedSpecies=Journeys.drawEnemy.bind(Journeys);
Journeys.drawEnemy=function(e){
  if(!Realistic.loaded||e.species!=='wolf')return paintedSpecies(e);
  if(e.hp<=0)return;Art.shadow(e.x,e.y+18,25);
  Realistic.sprite('wolf',e.x,e.y+23,61,p.x<e.x);
  if(e.wind>0){ctx.strokeStyle='#ffc087';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,34,0,Math.PI*2);ctx.stroke();}
  text('HOSTILE · FANG WOLF',e.x,e.y-47,9,'#ffbe9c');
  if(e.hp<e.max){rect(e.x-18,e.y-34,36,3,'#463e3c');rect(e.x-18,e.y-34,36*e.hp/e.max,3,'#e99872');}
};
const paintedGuardian=drawBoss;
drawBoss=function(){
  if(!Realistic.loaded)return paintedGuardian();
  const e=boss,m=e.adventureMove;
  if(e.dead){ctx.save();ctx.translate(e.x,e.y+20);ctx.rotate(Math.PI/2);ctx.globalAlpha=.65;Realistic.sprite('guardian',0,30,70);ctx.restore();return;}
  // Keep complete attack indicators visible, including beneath the guardian.
  if(m&&e.active){ctx.save();ctx.fillStyle='#ffb16d55';ctx.strokeStyle='#ffe6a9';ctx.lineWidth=3;
    if(m.kind==='cross'){rect(m.x-30,100,60,440,'#ffb16d55');rect(e.arenaStart,m.y-30,e.arenaEnd-e.arenaStart,60,'#ffb16d55');text('MOVE DIAGONALLY',m.x,m.y-48,13,'#fff2cb');}
    else {ctx.beginPath();ctx.arc(m.x,m.y,175,0,Math.PI*2);ctx.arc(m.x,m.y,75,0,Math.PI*2,true);ctx.fill();ctx.stroke();text('SAFE INSIDE OR OUTSIDE',m.x,m.y-30,12,'#fff2cb');}ctx.restore();
  }
  if(e.wind>0&&e.attackType==='slam'){circle(e.target.x,e.target.y,104,'#f2a35b25');ctx.strokeStyle='#f4b878';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.target.x,e.target.y,104,0,Math.PI*2);ctx.stroke();circle(e.target.x,e.target.y,104*(1-e.wind/1.1),'#eeb57818');}
  Art.shadow(e.x,e.y+37,44);Realistic.sprite('guardian',e.x,e.y+46,143);
  if(e.phase===2){ctx.strokeStyle='#ffc07c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y+38,34,9,0,0,Math.PI*2);ctx.stroke();}
  if(e.stun>0)text('EXPOSED',e.x,e.y-103,11,'#ffe5a0');
};
