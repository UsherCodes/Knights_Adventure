"use strict";
// Procedural illustrated materials: offline, deterministic, and independent of game state.
const Art = (globalThis.Art = {
  cache: new Map(),
  ellipse(x,y,rx,ry,color) { ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill(); },
  poly(points,color,stroke) {ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}},
  metal(x,y,w,h,light="#d2dad8",dark="#435b65") {const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.35,"#8faaa9");g.addColorStop(.65,dark);g.addColorStop(1,light);return g;},
  shadow(x,y,r=19) {const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,"#07121780");g.addColorStop(1,"#07121700");this.ellipse(x,y,r,r*.4,g);},
  tile(biome) {
    if(this.cache.has(biome))return this.cache.get(biome);
    const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");
    let seed=8713;const random=()=>((seed=seed*16807%2147483647)/2147483647);
    const tones={wood:["#314933","#87966b","#142f26"],snow:["#b3c7c6","#e1eae5","#738e94"],sand:["#b49a6b","#dcc28b","#856e50"],ash:["#61514a","#a18468","#352f30"]}[biome]||["#314933","#87966b","#142f26"];
    g.fillStyle=tones[0];g.fillRect(0,0,256,256);
    for(let i=0;i<3500;i++){let x=random()*256,y=random()*256;g.globalAlpha=.08+random()*.22;g.fillStyle=tones[i%3];g.fillRect(x,y,1+random()*4,1+random()*2);}
    g.globalAlpha=.25;g.strokeStyle=tones[1];g.lineWidth=.7;
    for(let i=0;i<120;i++){let x=random()*256,y=random()*256;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-3,y-3,x-1,y-6);g.stroke();}
    this.cache.set(biome,c);return c;
  },
  terrain(r) {
    const start=Math.floor(cam/256)*256;ctx.save();ctx.globalAlpha=.46;
    const tile=this.tile(r.biome);
    for(let x=start;x<cam+view+256;x+=256)for(let y=0;y<600;y+=256)ctx.drawImage(tile,x,y);
    ctx.globalAlpha=1;
    const road=ctx.createLinearGradient(0,280,0,377);road.addColorStop(0,"#e4cf9900");road.addColorStop(.15,r.path);road.addColorStop(.75,r.path);road.addColorStop(1,"#2d302500");
    ctx.fillStyle=road;ctx.fillRect(cam,277,view,108);
    for(let x=Math.floor(cam/34)*34;x<cam+view;x+=34)for(let y=299;y<365;y+=22){this.ellipse(x+(y%3)*5,y,12,7,"#e4d8b61b");ctx.strokeStyle="#3c3e2926";ctx.beginPath();ctx.moveTo(x-9,y+5);ctx.lineTo(x+10,y+5);ctx.stroke();}
    ctx.restore();
  },
  human(x,y,color="#698578",armored=false,face=0) {
    this.shadow(x,y+21,25);ctx.save();ctx.translate(x,y);
    const step=armored&&keys.size?Math.sin(t*10)*2:Math.sin(t*2+x)*.35;
    this.poly([[-10,-1],[-16,18],[0,24],[13,17],[8,-2]],color,"#27373b");
    this.ellipse(-5,19+step,4,8,"#36414a");this.ellipse(5,19-step,4,8,"#28343e");
    this.ellipse(0,2,10,15,armored?this.metal(-10,-10,20,25):color);
    this.ellipse(-11,3,4,10,armored?"#879ca0":color);this.ellipse(11,3,4,10,armored?"#637b85":color);
    this.ellipse(-11,11,3,4,"#c49a77");this.ellipse(11,11,3,4,"#c49a77");
    rect(-9,10,18,3,"#70533b");rect(-2,10,4,3,"#d0ae6d");
    if(armored){
      this.ellipse(0,-19,11,13,this.metal(-11,-32,22,26));
      this.poly([[-10,-20],[10,-20],[8,-7],[0,-3],[-8,-7]],this.metal(-10,-20,20,17),"#435a62");
      rect(-8,-18,16,3,"#162c35");for(let i=-5;i<=5;i+=5)rect(i,-12,1,4,"#30464f");
      this.poly([[-2,-30],[1,-40],[10,-34],[4,-29]],"#aa5945");
      ctx.strokeStyle="#e1e4d0";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-1);ctx.lineTo(0,6);ctx.lineTo(7,-1);ctx.stroke();
    }else{
      this.ellipse(0,-18,7.5,10,"#d8b38c");this.ellipse(0,-25,8,5,"#584333");
      this.ellipse(-6,-20,2,6,"#584333");circle(-3,-18,1,"#28383b");circle(3,-18,1,"#28383b");
      ctx.strokeStyle="#8e624b";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2,-12);ctx.lineTo(2,-12);ctx.stroke();
    }
    ctx.restore();
  },
  slime(x,y,color,friendly) {
    this.shadow(x,y+14,24);const g=ctx.createRadialGradient(x-6,y-9,2,x,y,23);g.addColorStop(0,"#deedbf");g.addColorStop(.4,color);g.addColorStop(1,"#365951");
    this.ellipse(x,y,20,15+Math.sin(t*4)*1.5,g);this.ellipse(x-7,y-8,5,2,"#f3ffdc66");
    this.ellipse(x-7,y-1,2,3,friendly?"#263e37":"#e5694f");this.ellipse(x+7,y-1,2,3,friendly?"#263e37":"#e5694f");
    ctx.strokeStyle="#314a40";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y+3,5,0,Math.PI);ctx.stroke();
  },
  dragon(x,y,color,friendly,scale=1) {
    this.shadow(x,y+20,32*scale);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    const flap=Math.sin(t*5)*4;
    const membrane=ctx.createLinearGradient(-35,-35,0,5);membrane.addColorStop(0,"#e3c18a");membrane.addColorStop(1,color);
    this.poly([[-6,1],[-43,-31-flap],[-31,-29],[-21,-10],[-17,-24],[-7,-12],[3,7]],membrane,"#755b4b");
    this.poly([[3,2],[21,-38-flap],[35,-19],[20,-23],[19,-9],[10,-4]],membrane,"#755b4b");
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-8,9);ctx.bezierCurveTo(-39,21,-43,4,-49,6);ctx.stroke();
    this.ellipse(0,5,19,13,this.metal(-19,-8,38,26,"#e5cfa1",color));
    this.ellipse(10,-8,9,15,color);this.ellipse(18,-17,13,9,color);this.ellipse(29,-13,9,5,color);
    this.poly([[11,-23],[11,-35],[17,-24]],"#eadbb7","#756b55");this.poly([[23,-24],[28,-32],[27,-19]],"#eadbb7","#756b55");
    for(let i=0;i<5;i++)this.poly([[-15+i*6,-4],[-13+i*6,-12],[-9+i*6,-4]],"#c7b078");
    this.ellipse(-8,19,5,5,color);this.ellipse(10,19,5,5,color);circle(24,-19,2.5,friendly?"#91ddaf":"#ff8158");circle(25,-19,1,"#132626");
    for(let i=0;i<18;i++)this.ellipse(-12+i%6*5,1+Math.floor(i/6)*5,2,1,"#fff4cb22");
    ctx.restore();
  },
});
// Cached rounded foliage avoids hundreds of gradients on every frame.
tree = function(x,y,s=1) {
  const biome=World.location?World.current().biome:"wood", key="tree-"+biome;
  if(!Art.cache.has(key)){
    const c=document.createElement("canvas");c.width=110;c.height=140;const g=c.getContext("2d");
    g.fillStyle="#071b182e";g.beginPath();g.ellipse(61,118,42,14,0,0,Math.PI*2);g.fill();
    g.fillStyle="#665039";g.beginPath();g.moveTo(49,122);g.lineTo(52,47);g.lineTo(59,44);g.lineTo(65,121);g.closePath();g.fill();
    g.strokeStyle="#ac8c5b";g.lineWidth=2;g.beginPath();g.moveTo(55,119);g.lineTo(56,67);g.stroke();
    for(let i=0;i<35;i++){const px=55+Math.sin(i*2.39)*32,py=47+Math.cos(i*1.31)*26,rad=13+(i%5);const gr=g.createRadialGradient(px-4,py-5,2,px,py,rad);gr.addColorStop(0,biome==="snow"?"#d3e0d4":"#789455");gr.addColorStop(.45,biome==="snow"?"#8caea0":"#3f6843");gr.addColorStop(1,"#254c39");g.fillStyle=gr;g.beginPath();g.arc(px,py,rad,0,Math.PI*2);g.fill();}
    let seed = 1439;
    for(let i=0;i<560;i++){
      seed=seed*16807%2147483647; const lx=20+(seed/2147483647)*70;
      seed=seed*16807%2147483647; const ly=12+(seed/2147483647)*75;
      if(((lx-55)/38)**2+((ly-49)/35)**2>1)continue;
      g.fillStyle=biome==="snow"?(i%3?"#d8e3d14d":"#698e7944"):(i%3?"#bbbf793d":"#173e3066");
      g.beginPath();g.ellipse(lx,ly,2.5,1.2,(i%5)*.6,0,Math.PI*2);g.fill();
    }
    Art.cache.set(key,c);
  }
  ctx.drawImage(Art.cache.get(key),x-55*s,y-95*s,110*s,140*s);
};
World.person=function(n){Art.human(n.x,n.y,n.color);if(n.kind==="ruler"){Art.poly([[n.x-7,n.y-29],[n.x-8,n.y-37],[n.x-2,n.y-33],[n.x,n.y-39],[n.x+3,n.y-33],[n.x+8,n.y-37],[n.x+7,n.y-29]],"#e7c46c");text(this.record().claimed?"✦":this.record().accepted?"?":"!",n.x,n.y-44,16,"#ffe3a0");}};
World.house=function(h,r){
  Art.poly([[h.x+8,h.y+15],[h.x+h.w+25,h.y+25],[h.x+h.w+34,h.y+h.h+14],[h.x+20,h.y+h.h+15]],"#12221f40");
  const wall=ctx.createLinearGradient(h.x,h.y,h.x+h.w,h.y+h.h);wall.addColorStop(0,r.wall);wall.addColorStop(1,"#9a9178");ctx.fillStyle=wall;ctx.fillRect(h.x,h.y,h.w,h.h);
  ctx.strokeStyle="#695d4b33";ctx.lineWidth=.7;for(let y=h.y+8;y<h.y+h.h;y+=11){ctx.beginPath();ctx.moveTo(h.x,y);ctx.lineTo(h.x+h.w,y);ctx.stroke();for(let x=h.x+(Math.floor(y/11)%2)*15;x<h.x+h.w;x+=30){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+11);ctx.stroke();}}
  const roof=ctx.createLinearGradient(0,h.y-40,0,h.y+5);roof.addColorStop(0,r.roof);roof.addColorStop(1,"#5d5147");
  if(r.biome==="sand"){Art.ellipse(h.x+h.w/2,h.y,h.w*.51,33,roof);rect(h.x-5,h.y-3,h.w+10,7,r.roof);}else{Art.poly([[h.x-10,h.y+2],[h.x+h.w*.5,h.y-48],[h.x+h.w+10,h.y+2]],roof,"#403d36");ctx.save();ctx.beginPath();ctx.moveTo(h.x-10,h.y+2);ctx.lineTo(h.x+h.w*.5,h.y-48);ctx.lineTo(h.x+h.w+10,h.y+2);ctx.clip();for(let y=h.y-42;y<h.y+3;y+=7){rect(h.x-10,y,h.w+20,1,r.biome==="snow"?"#e1e9da":"#d8b49440");for(let x=h.x+(y%3)*9;x<h.x+h.w;x+=14)rect(x,y,1,7,"#403a3544");}ctx.restore();}
  for(const x of [h.x+16,h.x+h.w-30]){rect(x-3,h.y+23,20,25,"#514e42");const glow=ctx.createLinearGradient(x,h.y+24,x,h.y+47);glow.addColorStop(0,"#ffe5a0");glow.addColorStop(1,"#a77d48");ctx.fillStyle=glow;ctx.fillRect(x,h.y+25,14,20);rect(x+6,h.y+25,2,20,"#776044");rect(x,h.y+35,14,2,"#776044");}
  const door=h.x+h.w/2;rect(door-12,h.y+h.h-36,24,36,"#55483a");for(let x=door-10;x<door+12;x+=5)rect(x,h.y+h.h-35,1,34,"#b99b6944");circle(door+7,h.y+h.h-17,2,"#d5b978");rect(h.x,h.y+h.h-4,h.w,5,"#7c7966");
  if(h.kind==="hall"){for(const x of [h.x+8,h.x+h.w-17]){Art.poly([[x,h.y+9],[x+10,h.y+9],[x+10,h.y+40],[x+5,h.y+35],[x,h.y+40]],r.roof);}text("✦",door,h.y+24,17,"#e7bc6c");}
  if(h.kind==="smith"){rect(h.x+h.w-22,h.y-35,17,38,"#79776c");torch(h.x+15,h.y+h.h-17);}
  if(h.name)text(h.name,h.x+h.w/2,h.y+h.h+17,9,"#f2e1be");
};
knight=function(){
  ctx.save();if(p.inv>0&&Math.sin(t*35)>0)ctx.globalAlpha=.55;
  if(p.roll>0){ctx.translate(p.x,p.y);ctx.rotate(t*23);ctx.translate(-p.x,-p.y);}
  Art.human(p.x,p.y,"#885347",true,p.face);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.face);
  if(p.attack>0){ctx.strokeStyle=p.fire?"#ffd394":"#dcecedaa";ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,52,-1.1,1.1);ctx.stroke();}
  Art.poly([[15,-2],[48,-3],[55,0],[48,3],[15,2]],Art.metal(15,-3,40,6),"#ced9ce");rect(18,-8,3,16,"#cfac63");rect(9,-2,9,4,"#705340");
  if(p.shield){ctx.strokeStyle=p.parry>0?"#fff0b7":"#afd6d7";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,28,-1.1,1.1);ctx.stroke();}
  ctx.restore();Art.poly([[p.x-23,p.y-2],[p.x-11,p.y-4],[p.x-9,p.y+12],[p.x-16,p.y+21],[p.x-23,p.y+12]],Art.metal(p.x-23,p.y-4,14,25),"#c2ae77");ctx.restore();
};
Journeys.dragonSprite=(x,y,color,friendly,scale)=>Art.dragon(x,y,color,friendly,scale);
Journeys.friendSprite=function(f,x,y){if(f.role==="dragon")Art.dragon(x,y,f.color,true,.8);else if(f.role==="slime")Art.slime(x,y,f.color,true);else Art.human(x,y,f.color);};
drawDragon=function(x,y,caged){Art.dragon(x,y+Math.sin(t*4)*2,"#b28a55",true,.8);if(caged){for(let i=-28;i<=28;i+=14)rect(x+i,y-33,2,66,"#acb7aabb");rect(x-30,y-35,62,3,"#bac2b3");text("EMBER",x,y-46,11,"#f0d396");}};
const formerEnemy=drawEnemy;
drawEnemy=function(e){
  if(e.hp<=0)return;
  if(e.species)return Journeys.drawEnemy(e);
  if(e.type!=="slime")return formerEnemy(e);
  Art.slime(e.x,e.y,e.flash>0?"#fff0c0":"#8aa769",false);
  if(e.wind>0){ctx.strokeStyle="#ffba76";ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,29,0,Math.PI*2);ctx.stroke();}
  if(e.hp<e.max){rect(e.x-15,e.y-30,30,3,"#283f36");rect(e.x-15,e.y-30,30*e.hp/e.max,3,"#e6b07a");}
};
Journeys.drawEnemy=function(e){
  if(e.hp<=0)return;const x=e.x,y=e.y;Art.shadow(x,y+19,30);
  if(e.species==="drake")Art.dragon(x,y,e.flash>0?"#fff0c1":"#a56a5d",false,1.1);
  if(e.species==="wolf"){
    const fur=Art.metal(x-25,y-14,50,30,"#c8c6b4",e.flash>0?"#fff0c1":"#5c6b71");
    ctx.strokeStyle="#778184";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x-15,y);ctx.quadraticCurveTo(x-36,y-7,x-37,y-20);ctx.stroke();
    Art.ellipse(x-2,y,23,12,fur);for(const dx of [-15,8]){Art.poly([[x+dx-3,y+4],[x+dx+4,y+4],[x+dx+1,y+24],[x+dx-5,y+24]],"#536369");}
    Art.ellipse(x+17,y-12,12,13,fur);Art.poly([[x+8,y-19],[x+9,y-35],[x+19,y-22],[x+24,y-32],[x+27,y-14]],fur,"#55656a");Art.ellipse(x+29,y-9,12,5,"#8c9390");circle(x+39,y-10,3,"#273738");circle(x+22,y-17,2,"#ffac62");
  }
  if(e.species==="ogre"){ctx.save();ctx.translate(x,y);ctx.scale(1.65,1.65);Art.human(0,0,e.flash>0?"#fff0c1":"#838766");ctx.restore();Art.poly([[x-8,y-15],[x-5,y-24],[x-2,y-14]],"#e7d6b1");rect(x+29,y-6,7,38,"#77583e");Art.ellipse(x+33,y-8,14,11,"#82725b");}
  if(e.wind>0){ctx.strokeStyle="#ffc087";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,e.species==="ogre"?48:34,0,Math.PI*2);ctx.stroke();}
  text("HOSTILE · "+{wolf:"FANG WOLF",ogre:"CHARGE OGRE",drake:"FIRE DRAKE"}[e.species],x,y-(e.species==="ogre"?58:45),9,"#ffbe9c");
  if(e.hp<e.max){rect(x-18,y-34,36,3,"#463e3c");rect(x-18,y-34,36*e.hp/e.max,3,"#e99872");}
};
// Preserve the combat telegraphs, replacing only the guardian's block silhouette.
const illustratedBoss=drawBoss;
drawBoss=function(){
  // Render original warnings without its body by clipping to outside the figure.
  ctx.save();ctx.beginPath();ctx.rect(-10000,-10000,20000,20000);ctx.rect(boss.x-53,boss.y-94,120,150);ctx.clip("evenodd");illustratedBoss();ctx.restore();
  if(boss.dead){Art.ellipse(boss.x,boss.y+10,35,13,"#78817a");return;}
  ctx.save();ctx.translate(boss.x,boss.y);ctx.scale(2,2);Art.human(0,0,boss.phase===2?"#8d5357":"#4b6369",true);ctx.restore();
  Art.poly([[boss.x-15,boss.y-63],[boss.x-19,boss.y-83],[boss.x-5,boss.y-74],[boss.x,boss.y-88],[boss.x+6,boss.y-74],[boss.x+19,boss.y-83],[boss.x+15,boss.y-63]],"#c7ad71","#e5d09b");
  if(boss.stun>0)text("EXPOSED",boss.x,boss.y-96,11,"#ffe5a0");
};
canvas.style.imageRendering="auto";
