const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'../play.html')).href);
  await page.click('#start');
  const results=await page.evaluate(()=>{
   const out=[]; const ok=(v,m)=>{if(!v)throw Error(m);out.push(m)};
   const choose=()=>document.querySelector('#world-panel .dialog-actions button').click();
   const actionAt=(point)=>{p.x=point.x;p.y=point.y;const n=World.nearby();ok(!!n,'interaction reachable at '+point.x+','+point.y);n.action();};
   for(const realm of Object.keys(Adventures.realms)) World.record(realm).claimed=true;
   for(const realm of Object.keys(Adventures.realms)) {
    World.travel(realm); enemies.forEach(e=>e.hp=0); boss.active=false;
    const s=Adventures.sitePositions(),r=Adventures.record();
    actionAt(s.keeper);choose();ok(r.accepted,realm+' town task accepted');
    actionAt(s.token);ok(r.found,realm+' town item collected');
    const gold=p.gold; actionAt(s.keeper);choose();ok(r.restored&&p.gold===gold+20,realm+' landmark restored and rewarded');
    actionAt(s.keeper);choose();ok(p.gold===gold+20,realm+' town reward cannot repeat');
    Adventures.rune(0);ok(r.cave.length===0,'wrong cave rune resets safely');
    for(const i of [1,0,2])actionAt({x:s.cave.x-95+i*95,y:125});
    ok(r.caveDone,realm+' cave solved via reachable interactions');
    const caveGold=p.gold;Adventures.rune(2);ok(p.gold===caveGold,'cave reward once');
    actionAt(s.cache);ok(r.cache,realm+' optional southern cache');
    p.companion=false;Journeys.data().activeFriends=[];actionAt(s.secret);ok(!r.secret,'dragon secret locked without dragon');
    p.companion=true;actionAt(s.secret);World.close();ok(r.secret,realm+' Ember unlocks dragon secret');
   }
   World.travel('greenvale'); enemies.forEach(e=>e.hp=0);boss.active=false;
   const f=Journeys.roster().find(f=>f.id==='greenvale-town-human');
   Journeys.data().friends.push(f.id);Journeys.data().activeFriends=[f.id];
   Adventures.friendTalk(f.id);choose();ok(Adventures.friendRecord(f.id).accepted,'companion errand accepted');
   actionAt(Adventures.sitePositions().keepsake);ok(Adventures.friendRecord(f.id).found,'active companion keepsake collected');
   const reward=p.gold;Adventures.friendTalk(f.id);choose();ok(Adventures.friendRecord(f.id).complete&&p.gold===reward+15,'companion quest completed');
   Adventures.friendTalk(f.id);choose();ok(p.gold===reward+15,'friend reward once');
   save();const keep=p.gold;reset();load();state='playing';
   ok(Adventures.record().restored&&Adventures.record().caveDone&&Adventures.record().secret,'completed adventures survive reload');
   ok(Adventures.friendRecord(f.id).complete&&p.gold===keep,'friend quest and reward survive reload');
   Frontier.transition(2);ok(!Adventures.record().restored,'later road has independent town quest');
   Adventures.townTalk();choose();actionAt(Adventures.sitePositions().token);Adventures.rune(1);save();reset();load();state='playing';
   ok(World.route===2&&Adventures.record().found&&Adventures.record().cave.length===1,'partial town and cave progress survive reload');
   p.x=4380;p.y=300;p.hp=6;p.inv=0;p.roll=0;boss.active=true;boss.stun=0;boss.cd=0;boss.wind=0;
   updateBoss(.01);ok(boss.adventureMove?.kind==='cross','road two telegraphs cross strike');
   const m=boss.adventureMove; p.x=m.x+80;p.y=m.y+80;updateBoss(1.6);ok(p.hp===6&&boss.stun>0,'diagonal escape avoids cross and creates attack window');
   boss.stun=0;boss.cd=0;boss.wind=0;boss.adventureTurn=0;p.inv=0;p.roll=0;updateBoss(.01);updateBoss(1.6);ok(p.hp===5,'remaining in warning lane causes one heart damage');
   Frontier.transition(3);boss.active=true;boss.cd=0;boss.stun=0;p.x=4380;p.y=300;p.hp=6;p.inv=0;
   updateBoss(.01);ok(boss.adventureMove?.kind==='ring','road three telegraphs ring');updateBoss(1.6);ok(p.hp===6,'inner circle is safe');
   boss.stun=0;boss.cd=0;boss.wind=0;boss.adventureTurn=0;updateBoss(.01);save();reset();load();state='playing';ok(!boss.adventureMove,'reload clears pending attack warning');
   Frontier.transition(1);boss.active=true;boss.cd=0;boss.stun=0;updateBoss(.01);ok(!boss.adventureMove,'first road retains original boss moves');
   // Compatibility: removing the optional extension data emulates an existing save.
   delete World.extras.adventures;save();reset();load();state='playing';ok(!Adventures.record().restored,'legacy save gets fresh optional quest state');
   World.travel('greenvale');p.x=800;p.y=360;cam=400;update(0);state='paused';draw();
   return out;
  });
  console.log(results.join('\n'));
  await page.screenshot({path:process.env.SCREENSHOT_DIR?path.join(process.env.SCREENSHOT_DIR,'town-adventures.png'):'/tmp/town-adventures.png'});
  await page.evaluate(()=>{World.travel('greenvale');p.x=870;p.y=500;enemies.forEach(e=>e.hp=0);state='playing';update(0);});
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#world-panel h2').innerText(),'Ada the gardener');
  await page.getByRole('button',{name:'I will help',exact:true}).click();
  await page.getByRole('button',{name:'Adventures',exact:true}).click();
  assert.equal(await page.locator('#world-panel h2').innerText(),'Local adventures');
  await page.screenshot({path:'/tmp/adventures-journal.png'});
  await page.evaluate(()=>{World.close();p.x=1580;p.y=205;cam=1100;state='paused';draw();});
  await page.screenshot({path:'/tmp/echo-cave.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: new adventures, rewards, save compatibility, dragon gating and boss mechanics');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
