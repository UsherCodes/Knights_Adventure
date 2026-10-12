const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'../play.html')).href);await page.click('#start');
  assert(await page.evaluate(()=>Realistic.ready),'realistic artwork decoded');
  const results=await page.evaluate(()=>{
   const out=[],ok=(v,m)=>{if(!v)throw Error(m);out.push(m)};
   const names=[];for(const realm of Object.keys(Frontier.names))for(let n=2;n<=50;n++)for(const kind of ['human','monster','dragon'])names.push(Frontier.friendName(kind,realm,n));
   ok(names.every(n=>!/[0-9]/.test(n)),'generated friends never have numbered names');
   ok(new Set(names).size===names.length,'first 49 generated roads have distinct names across all realms and roles');
   const id='greenvale-road2-human';Journeys.data().roadDepth={greenvale:2};Journeys.data().friends=[id];Journeys.data().activeFriends=[id];
   Adventures.friendRecord(id).complete=true;save();reset();load();state='playing';
   ok(Journeys.roster().find(f=>f.id===id).name==='Hazel','old numbered friend ID now displays Hazel');
   ok(Journeys.data().activeFriends.includes(id)&&Adventures.friendRecord(id).complete,'renaming preserves party and personal quest progress');
   const q=World.record();q.accepted=true;q.items=[0,1];p.x=1500;p.y=300;
   let target=Adventures.target();ok(target.id===2&&target.label.includes('2/3'),'guide locates the remaining flower');
   q.items=[0,1,2];enemies.forEach((e,i)=>e.hp=i<5?0:e.max);target=Adventures.target();ok(target.label.includes('Gate ready'),'guide updates once gate objectives are complete');
   boss.dead=true;q.claimed=false;ok(Adventures.target().label.includes('kingdom seal'),'boss victory directs player back to ruler');
   Adventures.setGuide('local');ok(Adventures.target().label.includes('Ada'),'local guide points to town keeper');
   const r=Adventures.record();r.accepted=true;ok(Adventures.target().label.includes('wind chime'),'accepted quest points to its item');r.found=true;ok(Adventures.target().label.includes('restore'),'collected item directs player home');
   Adventures.setGuide('off');ok(!Adventures.target(),'guide can be hidden');save();reset();load();state='playing';ok(Adventures.data().guide==='off','guide preference survives reload');
   Adventures.setGuide('royal');World.close();
   for(const realm of Object.keys(Frontier.names)){World.record(realm).claimed=true;World.travel(realm);state='playing';update(0);draw();Frontier.transition(2);p.x=4380;p.y=300;boss.active=true;boss.cd=0;boss.stun=0;updateBoss(.01);cam=3900;draw();}
   ok(true,'all realms and evolved guardian warning render');
   // Original-story graphics and saved-world rendering remain available.
   World.travel('hollow');draw();World.travel('greenvale');
   for(const e of enemies){e.hp=e.max;drawEnemy(e);}
   for(const type of ['wolf','ogre','drake'])Journeys.drawEnemy(Journeys.foe(type,400,300));
   ok(true,'original creatures, hostile monsters and dragons render');
   p.x=740;p.y=330;p.inv=0;cam=340;update(0);toastTime=0;document.querySelector('#toast').style.opacity=0;state='paused';
   const start=performance.now();for(let n=0;n<30;n++)draw();out.push('Mean canvas submission time: '+((performance.now()-start)/30).toFixed(1)+'ms');
   return out;
  });
  console.log(results.join('\n'));
  await page.screenshot({path:process.env.SCREENSHOT_DIR?path.join(process.env.SCREENSHOT_DIR,'Knights-Adventure-Realistic-Graphics.png'):'/tmp/knights-new-graphics.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: names, save migration, guide milestones, graphics and render smoke test');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
