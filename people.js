"use strict";
// Appearance and motion are derived at render time; no new save state or movement rules.
const People = (globalThis.People = {
  atlas:new Image(), walk:new Image(), loaded:false, walkLoaded:false,
  cache:new Map(), motions:new Map(),
  regions:[[119,0,239,484],[452,0,270,486],[832,0,220,489],[1191,0,230,489],
    [139,492,209,522],[448,490,256,524],[844,494,248,520],[1184,490,278,524],[693,0,168,334],[368,0,239,337]],
  split:[.89,.78,.77,.89,.63,.65,.90,.79,.65,.67],
  hash(id){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;},
  look(id,base){const seed=this.hash(id);return {id,base,hue:(seed%31)-15,height:67+(seed%9),width:.93+((seed>>>8)%15)/100};},
  motion(id,x,y){
    let m=this.motions.get(id);
    if(!m){m={x,y,time:t,phase:0,amount:0,flip:false};this.motions.set(id,m);}
    const dt=t-m.time,dx=x-m.x,dy=y-m.y,distance=Math.hypot(dx,dy);
    if(dt<0||distance>80){m.phase=0;m.amount=0;}
    else if(dt>0){
      const moving=distance>.015;
      if(moving){m.phase+=distance/72*Math.PI*2;if(Math.abs(dx)>.015)m.flip=dx<0;}
      const target=moving?Math.min(1,distance/dt/90):0;
      m.amount+=(target-m.amount)*(1-Math.exp(-18*dt));
      if(m.amount<.015)m.amount=0;
    }
    m.x=x;m.y=y;m.time=t;
    // Bound transient state while traveling indefinitely through generated towns.
    if(this.motions.size>160)this.motions.delete(this.motions.keys().next().value);
    return m;
  },
  texture(look){
    if(this.cache.has(look.id))return this.cache.get(look.id);
    const [sx,sy,sw,sh]=this.regions[look.base],c=document.createElement('canvas');
    c.width=sw;c.height=sh;const g=c.getContext('2d'),source=look.base>=8?Realistic.sprites:this.atlas;
    // A subtle whole-sprite grade avoids hard tint boundaries across sleeves or cloth.
    g.clearRect(0,0,sw,sh);g.filter=`hue-rotate(${look.hue}deg) saturate(${.85+(this.hash(look.id)%35)/100})`;
    g.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
    this.cache.set(look.id,c);if(this.cache.size>128)this.cache.delete(this.cache.keys().next().value);return c;
  },
  person(id,base,x,y){
    const look=this.look(id,base),img=this.texture(look),m=this.motion(id,x,y),h=look.height,w=h*img.width/img.height*look.width;
    const stride=Math.sin(m.phase)*m.amount,split=this.split[base],cut=Math.floor(img.height*split);
    Art.shadow(x,y+21,21);
    ctx.save();ctx.translate(x,y+23);if(m.flip)ctx.scale(-1,1);
    // Upper body stays steady while the lower legs alternate about their joints.
    const breath=Math.sin(t*2+this.hash(id)%20)*.3*(1-m.amount),rise=Math.abs(Math.sin(m.phase))*m.amount*.6;
    ctx.translate(0,breath-rise);
    ctx.drawImage(img,0,0,img.width,cut+2,-w/2,-h,w,(cut+2)/img.height*h);
    for(let side=0;side<2;side++){
      const half=img.width/2,sign=side?1:-1,pivot=sign*w*.22;
      ctx.save();ctx.translate(pivot,-h+h*split);ctx.rotate(stride*sign*(split>.85?.07:.13));
      ctx.drawImage(img,side*half,cut,half,img.height-cut,-w/2+side*w/2-pivot,0,w/2,h*(1-split));ctx.restore();
    }
    ctx.restore();
  },
  hero(){
    const m=this.motion('player',p.x,p.y);Art.shadow(p.x,p.y+22,23);
    // Four actual poses alternate foot placement, driven by distance, not held keys.
    const frame=m.amount>.05?Math.floor(m.phase/(Math.PI*2)*4)%4:3;
    const cell=this.walk.naturalWidth/4,h=78,w=h*cell/this.walk.naturalHeight;
    ctx.save();ctx.translate(p.x,p.y+24);if(Math.cos(p.face)<-.1)ctx.scale(-1,1);
    ctx.drawImage(this.walk,frame*cell,0,cell,this.walk.naturalHeight,-w/2,-h,w,h);ctx.restore();
  },
});
People.ready=Promise.all([
 new Promise(resolve=>{People.atlas.onload=()=>{People.loaded=true;resolve(true)};People.atlas.onerror=()=>resolve(false);People.atlas.src='assets/people.png';}),
 new Promise(resolve=>{People.walk.onload=()=>{People.walkLoaded=true;resolve(true)};People.walk.onerror=()=>resolve(false);People.walk.src='assets/knight-walk.png';}),
]).then(r=>r.every(Boolean));
const individualHuman=Art.human.bind(Art);
Art.human=function(x,y,color,armored,face){if(armored&&People.walkLoaded&&Realistic.loaded&&x===p.x&&y===p.y)return People.hero();return individualHuman(x,y,color,armored,face);};
const individualPerson=World.person.bind(World);
World.person=function(n){
 if(!People.loaded||!Realistic.loaded)return individualPerson(n);
 if(n.kind==='ruler'&&World.location==='greenvale')return individualPerson(n);
 const ruler={frostmarch:7,sunreach:6,ashenreach:5};
 const base=n.kind==='ruler'?ruler[World.location]:({inn:0,smith:1,map:2,shop:3,keeper: n.variant??2,villager:n.variant??3}[n.kind]??2);
 const id=n.kind==='ruler'?'ruler:'+World.location:n.id||'town:'+n.kind;
 People.person(id,base??7,n.x,n.y);
 if(n.kind==='ruler')text(World.record().claimed?'✦':World.record().accepted?'?':'!',n.x,n.y-56,16,'#ffe3a0');
};
const individualFriend=Journeys.friendSprite.bind(Journeys);
Journeys.friendSprite=function(f,x,y){
 if(!People.loaded||f.role==='dragon'||f.role==='slime')return individualFriend(f,x,y);
 People.person('friend:'+(f.id||f.name||f.role),{ranger:4,guard:5,healer:6,mage:7}[f.role]??4,x,y);
};
