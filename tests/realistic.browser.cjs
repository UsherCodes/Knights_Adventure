const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(pathToFileURL(path.join(__dirname,'../play.html')).href);
  assert(await page.evaluate(()=>Realistic.ready));
  assert(await page.evaluate(()=>Realistic.sprites.naturalWidth===1254&&Realistic.ground.naturalWidth===1254));
  assert(!requests.some(u=>/^https?:/.test(u)),'portable game loads all art offline');
  await page.click('#start');
  const out=await page.evaluate(()=>{
   state='paused';keys.clear();
   const checks=[],r=Realistic;
   for(const [name,[x,y,w,h]] of Object.entries(r.regions)){
    if(x<0||y<0||x+w>r.sprites.naturalWidth||y+h>r.sprites.naturalHeight)throw Error('crop outside atlas '+name);
   }
   const sample=document.createElement('canvas');sample.width=sample.height=2;
   const g=sample.getContext('2d');g.drawImage(r.sprites,0,0,2,2,0,0,2,2);
   if(g.getImageData(0,0,1,1).data[3]!==0)throw Error('sprite sheet lacks transparent background');
   checks.push('real transparent sprites, valid crops and embedded offline textures');
   for(const realm of ['greenvale','frostmarch','sunreach','ashenreach']){
    World.record(realm).claimed=true;World.travel(realm);state='paused';cam=0;p.x=600;p.y=330;draw();
    for(const f of Journeys.roster())Journeys.friendSprite(f,400,300);
    for(const species of ['wolf','ogre','drake'])Journeys.drawEnemy(Journeys.foe(species,700,300));
    boss.active=true;boss.dead=false;boss.x=700;boss.y=300;boss.arenaStart=200;boss.arenaEnd=1200;
    for(const kind of ['cross','ring']){boss.adventureMove={kind,x:600,y:300,time:1};drawBoss();}
    boss.adventureMove=null;boss.wind=.5;boss.attackType='slam';boss.target={x:600,y:300};drawBoss();boss.wind=0;
   }
   checks.push('four kingdoms, all companions and guardian warnings render with decoded artwork');
   World.travel('greenvale');state='paused';boss.active=false;boss.adventureMove=null;
   const before=JSON.stringify(World.persist());
   for(let i=0;i<10;i++){p.attack=.1;draw();}p.attack=0;
   if(JSON.stringify(World.persist())!==before)throw Error('renderer changed saved state');
   checks.push('rendering leaves saved world unchanged');
   cam=0;p.x=600;p.y=330;p.inv=0;toastTime=0;document.querySelector('#toast').style.opacity=0;draw();
   return checks;
  });
  console.log(out.join('\n'));
  if(process.env.SCREENSHOT_DIR){
   const preview=await browser.newPage({viewport:{width:1440,height:1100}});
   await preview.goto(pathToFileURL(path.join(__dirname,'../play.html')).href);await preview.evaluate(()=>Realistic.ready);await preview.click('#start');
   await preview.evaluate(()=>{p.x=600;p.y=330;cam=0;update(0);state='paused';toastTime=0;document.querySelector('#toast').style.opacity=0;draw();});
   await preview.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'Knights-Adventure-Realistic-Town.png')});await preview.close();
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{resize();draw();});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile layout fits viewport');
  // Simulate missing external art in the developer page: gameplay still renders using fallback.
  const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));
  await fallback.route('**/assets/*.png',r=>r.abort());
  await fallback.goto(pathToFileURL(path.join(__dirname,'../knight_adventure_v2.html')).href);
  assert.equal(await fallback.evaluate(()=>Realistic.ready),false);
  await fallback.click('#start');await fallback.evaluate(()=>{state='paused';draw();});
  assert.deepEqual(errors,[]);console.log('PASS: realistic assets, offline loading, saves, mobile and failed-art fallback');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
