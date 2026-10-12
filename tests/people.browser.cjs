const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});try{
 const page=await b.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(__dirname,'../play.html')).href);assert(await page.evaluate(()=>People.ready));await page.evaluate(()=>Promise.all([Realistic.ready,Realistic.adaReady]));await page.click('#start');
 console.log(await page.evaluate(()=>{
  state='paused';const ok=(v,m)=>{if(!v)throw Error(m)};
  for(const [x,y,w,h] of People.regions)ok(x+w<=People.atlas.naturalWidth&&y+h<=People.atlas.naturalHeight,'valid crop');
  const ids=['town:inn','town:smith','town:map','town:shop'];ok(new Set(ids.map((id,i)=>People.texture(People.look(id,i)).toDataURL())).size===4,'distinct town people');
  let m=People.motion('check',0,0);t+=.1;m=People.motion('check',10,0);ok(m.phase>0&&m.amount>0,'movement drives gait');const phase=m.phase;
  for(let i=0;i<20;i++){t+=.1;m=People.motion('check',10,0);}ok(m.phase===phase&&m.amount===0,'stationary stops stepping');
  t+=.1;m=People.motion('check',5,0);ok(m.flip,'faces left');const frozen=m.phase;People.motion('check',5,0);ok(m.phase===frozen,'paused rendering does not animate');
  t+=.1;m=People.motion('check',500,0);ok(m.phase===0&&m.amount===0,'travel does not become a long stride');
  const f=Journeys.roster().find(f=>f.role==='ranger'),look=JSON.stringify(People.look(f.id,4));save();load();ok(JSON.stringify(People.look(f.id,4))===look,'appearance stable after reload');
  for(let i=0;i<220;i++){People.person('test:'+i,i%8,300,300);}ok(People.cache.size<=128&&People.motions.size<=160,'bounded appearance and motion caches');
  World.travel('greenvale');p.x=610;p.y=325;cam=0;state='paused';draw();
  return 'PASS: distinct appearances, valid crops, distance-driven gait, idle, turning, pause, travel, stable identity and bounded caches';
 }));
 await page.evaluate(()=>{state='playing';p.x=1100;p.y=330;p.inv=100;enemies.forEach(e=>e.hp=0);});
 await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');
 assert(await page.evaluate(()=>People.motions.get('player').phase>0),'real keyboard walking animates');
 await page.waitForTimeout(450);assert(await page.evaluate(()=>People.motions.get('player').amount<.05),'release settles to idle');
 await page.evaluate(()=>{World.travel('greenvale');p.x=610;p.y=325;p.inv=0;cam=0;update(0);state='paused';toastTime=0;document.querySelector('#toast').style.transition='none';document.querySelector('#toast').style.opacity=0;draw();});
 if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'Unique-People-In-Game.png')});
 assert.deepEqual(errors,[]);console.log('PASS: live keyboard walking, stopping and rendered town');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
