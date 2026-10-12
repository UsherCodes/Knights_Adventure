"use strict";
// Optional adventures use the existing save envelope and Action control.
const Adventures = (globalThis.Adventures = {
  realms: {
    greenvale: { landmark: "The Singing Oak", keeper: "Ada the dragonborn gardener", problem: "The oak has lost its song. Bring back its wind chime from the northern trail.", item: "wind chime", thanks: "Listen—the whole town can hear the oak again!", color: "#a9df92", secret: "Canopy Sanctuary" },
    frostmarch: { landmark: "The Aurora Beacon", keeper: "Bryn the lamplighter", problem: "Travelers cannot see our beacon. Find its frost crystal on the northern trail.", item: "frost crystal", thanks: "The beacon shines again. No traveler need lose the road tonight.", color: "#9ee7ff", secret: "Aurora Roost" },
    sunreach: { landmark: "The Moonwater Fountain", keeper: "Suri the waterkeeper", problem: "Our fountain has run dry. Recover its brass valve from the northern trail.", item: "brass valve", thanks: "Water for everyone! You have brought our square back to life.", color: "#ffdb91", secret: "Skyglass Oasis" },
    ashenreach: { landmark: "The Ember Bell", keeper: "Ivo the bellkeeper", problem: "Our bell is silent. Find its ember clapper on the northern trail.", item: "ember clapper", thanks: "The bell rings for friends and dragons alike. Welcome home.", color: "#ffac8e", secret: "Starfire Nest" },
  },
  personalities: {
    ranger: { line: "Every trail tells a story. I would like to find my lost trail journal.", item: "trail journal", danger: "Tracks ahead. Stay close; I have your back." },
    healer: { line: "Even brave adventurers need looking after. Help me find my medicine satchel.", item: "medicine satchel", danger: "Take a breath. I will keep you standing." },
    guard: { line: "I promised to protect these roads. My old patrol badge is somewhere out there.", item: "patrol badge", danger: "Behind me, friend. We will get through together." },
    mage: { line: "The best magic begins with curiosity. Will you help find my fallen star chart?", item: "star chart", danger: "A little courage, a little magic. Here we go!" },
    slime: { line: "Bounce! My favorite shiny pebble rolled away. Can we find it?", item: "shiny pebble", danger: "Big monsters? Bigger bounce!" },
    dragon: { line: "The wind carries secrets. Find my lost scale and I will share a story of the sky.", item: "lost scale", danger: "Stay near my wings. We face this together." },
  },
  data() { return (World.extras.adventures ??= { places: {}, friends: {} }); },
  key() { return World.location + ":" + (World.journey ? World.route || 1 : 0); },
  record() { return (this.data().places[this.key()] ??= { accepted: false, found: false, restored: false, cave: [], caveDone: false, cache: false, secret: false }); },
  theme() { return this.realms[World.location]; },
  active() { return Journeys.roster().filter(f => Journeys.data().activeFriends.includes(f.id)); },
  friendRecord(id) { return (this.data().friends[id] ??= { accepted: false, found: false, complete: false }); },
  role(f) { return this.personalities[f.role] || this.personalities.guard; },
  sitePositions() {
    return { keeper: { x: 870, y: 500 }, token: { x: 1280, y: 125 }, keepsake: { x: 1660, y: 505 }, cave: { x: 1580, y: 135 }, cache: { x: 1920, y: 515 }, secret: { x: World.journey ? 3500 : 1920, y: World.journey ? 145 : 105 } };
  },
  reward(gold, potions = 0) { p.gold += gold; World.extras.potions += potions; save(); },
  townTalk() {
    const r = this.record(), theme = this.theme();
    World.open(theme.keeper, `${World.location === "greenvale" ? '<p>Ada is a female dragonborn gardener from Middle-earth. She tends the Singing Oak and welcomes travelers beneath its branches.</p>' : ""}<p><strong>${theme.landmark}</strong></p><p>${r.restored ? theme.thanks : r.found ? "You found it! Shall we restore our landmark?" : theme.problem}</p><p>Optional town adventure · Reward: 20 gold and a healing potion.</p>`, [
      r.restored ? { label: "Enjoy the restored landmark", run: () => World.close() } : r.found ? { label: "Restore " + theme.landmark, run: () => { if (!r.restored && r.found) { r.restored = true; this.reward(20, 1); } World.close(); notify(theme.thanks); } } : { label: r.accepted ? "Keep exploring the northern trail" : "I will help", run: () => { r.accepted = true; save(); World.close(); notify("Northern trail: look for the golden quest marker beyond town."); } },
    ]);
  },
  friends() {
    const list = this.active();
    World.open("Campfire conversations", "<p>Choose a traveling friend to hear their story. Personal errands are optional and use the same Action button.</p>", list.length ? list.map(f => ({ label: f.name + (this.friendRecord(f.id).complete ? " · Trusted friend" : " · Talk"), run: () => this.friendTalk(f.id) })) : [{ label: "Recruit a friend and select them in Bag → Traveling friends", disabled: true }]);
  },
  friendTalk(id) {
    const f = this.active().find(f => f.id === id); if (!f) return;
    const r = this.friendRecord(id), role = this.role(f);
    World.open(f.name, `<p>${r.complete ? "You remembered what mattered to me. Wherever the road goes, you have a friend." : r.found ? "You found my " + role.item + "! I knew we made a good team." : role.line}</p><p>${r.complete ? "Personal quest complete." : "Search the southern campsite beyond town while I am in your party. Reward: 15 gold and one potion."}</p>`, [{ label: r.complete ? "Back to our adventure" : r.found ? "Return the " + role.item : r.accepted ? "Keep searching together" : "Let's find it", run: () => { if (r.found && !r.complete) { r.complete = true; this.reward(15, 1); } else { r.accepted = true; save(); } World.close(); } }]);
  },
  journal() {
    const theme = this.theme(), r = this.record();
    const friends = this.active().map(f => { const q = this.friendRecord(f.id); return `<li>${f.name}: ${q.complete ? "trusted friend" : q.found ? "keepsake found—talk at camp" : q.accepted ? "search the southern campsite" : "talk at camp to learn their story"}</li>`; }).join("");
    World.open("Local adventures", `<p><strong>${World.current().town}</strong> · ${theme.landmark}</p><ul><li>Town: ${r.restored ? "restored" : r.found ? "return the item to " + theme.keeper : r.accepted ? "find the marked item on the northern trail" : "meet " + theme.keeper + " at the southeast edge of town"}</li><li>Echo Cave: ${r.caveDone ? "solved" : "optional northern cave; listen to its three runes"}</li><li>Southern trail cache: ${r.cache ? "collected" : "unopened"}</li><li>${theme.secret}: ${r.secret ? "discovered" : "a traveling dragon can reveal the hidden entrance"}</li>${friends}</ul><p>All activities are optional. The royal quest and guardian gate work as before.</p>`, [
      { label: "Guide: royal quest", run: () => this.setGuide("royal") },
      { label: "Guide: local adventures", run: () => this.setGuide("local") },
      { label: "Hide exploration guide", run: () => this.setGuide("off") },
      { label: "Talk with traveling friends", run: () => this.friends() },
    ]);
  },
  setGuide(mode) { this.data().guide = mode; save(); World.close(); this.updateGuide(); },
  target() {
    if (!World.location || this.data().guide === "off") return null;
    const point = (x, y, label) => ({ x, y, label });
    // Combat always takes precedence over an optional trail.
    if (boss.active && !boss.dead) return point(boss.x, boss.y, "Guardian fight · dodge glowing warnings, then strike");
    if (this.data().guide === "local") {
      const r = this.record(), s = this.sitePositions(), theme = this.theme();
      if (!r.restored) {
        if (!r.accepted) return { ...s.keeper, label: "Meet " + theme.keeper };
        if (!r.found) return { ...s.token, label: "Find the " + theme.item };
        return { ...s.keeper, label: "Return the " + theme.item + " to restore the landmark" };
      }
      const friend = this.active().find(f => !this.friendRecord(f.id).complete);
      if (friend) {
        const q = this.friendRecord(friend.id);
        if (!q.accepted || q.found) return point(800, 350, "Talk with " + friend.name + " at the campfire");
        return { ...s.keepsake, label: "Find " + friend.name + "’s " + this.role(friend).item };
      }
      if (!r.caveDone) return point(s.cave.x - 140, 230, "Explore Echo Cave · read the inscription");
      if (!r.cache) return { ...s.cache, label: "Search the ruined watchtower" };
      if (!r.secret && (p.companion || this.active().some(f => f.role === "dragon"))) return { ...s.secret, label: "Let your dragon reveal the hidden sky path" };
      return point(p.x, p.y, "Available trails complete · bring a dragon for secrets, or follow the royal quest");
    }
    const q = World.record(), realm = World.current();
    if (!World.journey) {
      if (!q.accepted) return point(488, 273, "Speak to " + realm.person + " and accept the royal quest");
      if (boss.dead && !q.claimed) return point(488, 273, "Return to " + realm.person + " for your kingdom seal");
      if (!boss.dead) {
        const items = World.resources().filter(item => !q.items.includes(item.id)).sort((a,b) => dist(p,a)-dist(p,b));
        if (items.length) return { ...items[0], label: "Gather " + realm.item + " · " + q.items.length + "/3" };
        if (World.kills() < 5) {
          const foe = enemies.filter(e => e.hp > 0).sort((a,b) => dist(p,a)-dist(p,b))[0];
          if (foe) return point(foe.x, foe.y, "Defeat wilderness foes · " + World.kills() + "/5");
        }
        return point(2180, 310, "Gate ready! Head east to the guardian");
      }
      return point(2800, 320, "Seal earned · head east for the next town, or use Map for another realm");
    }
    if (boss.dead) return point(W - 90, 320, "Guardian defeated! Continue east to the next town");
    return point(boss.arenaStart - 20, 310, "Explore the wilderness; the Hollow Guardian waits in the east");
  },
  direction(target) {
    if (!target) return "";
    if (dist(p, target) < 52) return "Here";
    const dx = target.x-p.x, dy = target.y-p.y;
    const vertical = Math.abs(dy) > 45 ? dy < 0 ? "north" : "south" : "";
    const horizontal = Math.abs(dx) > 45 ? dx < 0 ? "west" : "east" : "";
    return (vertical && horizontal ? vertical + horizontal : vertical || horizontal) || "Nearby";
  },
  updateGuide() {
    const panel = document.querySelector("#trail-guide"), target = this.target();
    panel.hidden = !target || state === "title";
    if (target) panel.textContent = this.direction(target) + " · " + target.label + " · Change guide in Adventures";
  },
  rune(index) {
    const r = this.record(); if (r.caveDone) return;
    const order = [1, 0, 2];
    if (index !== order[r.cave.length]) { r.cave = []; save(); notify("A soft echo: Moon → Leaf → Flame. Try again; nothing is lost."); return; }
    r.cave.push(index);
    if (r.cave.length === 3) { r.caveDone = true; this.reward(30, 1); notify("The cave opens its treasure! 30 gold and a potion."); }
    else { save(); notify("The rune sings · " + r.cave.length + "/3. Follow Moon → Leaf → Flame."); }
  },
  interactions() {
    const r = this.record(), s = this.sitePositions(), theme = this.theme();
    const result = [{ ...s.keeper, label: "Talk to " + theme.keeper, action: () => this.townTalk() },
      { x: 800, y: 350, label: "Rest at the campfire · Talk with friends", action: () => this.friends() }];
    if (r.accepted && !r.found && !r.restored) result.push({ ...s.token, label: "Collect " + theme.item, action: () => { r.found = true; save(); notify("Found " + theme.item + "! Return to " + theme.keeper + "."); } });
    const searching = this.active().filter(f => { const q = this.friendRecord(f.id); return q.accepted && !q.found && !q.complete; });
    if (searching.length) result.push({ ...s.keepsake, label: "Search the old campsite for your friends", action: () => { searching.forEach(f => { this.friendRecord(f.id).found = true; }); save(); notify("Keepsakes found! Talk with your friends at the town campfire or Adventures menu."); } });
    result.push({ x: s.cave.x - 140, y: 230, label: "Read the cave inscription", action: () => notify("Echo Cave: wake Moon → Leaf → Flame. Walk north into the cave and use Action at each rune.") });
    if (!r.caveDone) ["Leaf", "Moon", "Flame"].forEach((name, i) => result.push({ x: s.cave.x - 95 + i * 95, y: 125, label: "Touch " + name + " rune", action: () => this.rune(i) }));
    if (!r.cache) result.push({ ...s.cache, label: "Open the southern trail cache", action: () => { if (!r.cache) { r.cache = true; this.reward(12); notify("An explorer's cache · 12 gold. The northern route holds a different secret."); } } });
    if (!r.secret) result.push({ ...s.secret, label: "Explore the sealed sky path", action: () => {
      if (!p.companion && !this.active().some(f => f.role === "dragon")) { notify("A dragon's flame can reveal this path. Return with Ember or a traveling dragon."); return; }
      r.secret = true; this.reward(35, 2); World.open(theme.secret, `<p>Your dragon warms the ancient seal. A hidden path opens to <strong>${theme.secret}</strong>.</p><p>You discover a peaceful dragon refuge and a supply chest: 35 gold and two healing potions. Its glowing arch remains as a reminder of your discovery.</p>`, [{ label: "Return to the trail", run: () => World.close() }]);
    } });
    return result;
  },
  chatterKey: "", chatterClock: 0,
  tick(dt) {
    this.updateGuide();
    if (!World.location) return;
    this.chatterClock -= dt;
    const r = this.record(), s = this.sitePositions();
    const key = this.key();
    if (key !== this.chatterKey) { this.chatterKey = key; this.chatterClock = 4; }
    if (this.chatterClock <= 0 && toastTime <= 0 && state === "playing") {
      const f = this.active()[0];
      if (f) {
        const danger = enemies.some(e => e.hp > 0 && dist(e, p) < 250) || boss.active && !boss.dead;
        notify(f.name + ": " + (danger ? this.role(f).danger : p.x < 900 ? "A warm fire, a new story. Let's talk before we leave." : "I wonder what lies beyond the road. Shall we explore?"));
      } else if ((p.companion || this.active().some(f => f.role === "dragon")) && !r.secret && dist(p, s.secret) < 300) notify("Ember circles a hidden sky path nearby. Look for the glowing arch!");
      this.chatterClock = 28;
    }
    const button = document.querySelector("#adventures-button"); if (button) button.disabled = state !== "playing";
  },
  draw() {
    if (!World.location) return;
    const theme = this.theme(), r = this.record(), s = this.sitePositions();
    ctx.save();
    // Unique silhouettes and repaired lighting make each town recognizable.
    const x = 850, y = 425;
    circle(x, y + 36, 56, "#09181b55");
    if (World.location === "greenvale" && globalThis.Art) { tree(x, y + 12, .8); for (let n = 0; n < 3; n++) rect(x - 19 + n * 19, y - 12, 3, 22, "#f4db91"); }
    else if (World.location === "greenvale") { rect(x - 8, y - 35, 16, 72, "#97714d"); circle(x, y - 40, 42, r.restored ? "#98dc89" : "#537b56"); for (let n = 0; n < 3; n++) rect(x - 19 + n * 19, y - 12, 3, 22, "#f4db91"); }
    if (World.location === "frostmarch") { rect(x - 15, y - 38, 30, 72, "#a5bbc6"); circle(x, y - 48, 22, r.restored ? "#bef7ff" : "#526876"); rect(x - 28, y + 25, 56, 12, "#d2e5e6"); }
    if (World.location === "sunreach") { circle(x, y + 8, 42, "#d6b989"); circle(x, y + 8, 31, r.restored ? "#76cfdf" : "#76674f"); rect(x - 6, y - 30, 12, 45, "#e7ce9d"); if (r.restored) circle(x, y - 28, 15, "#a1eaf2"); }
    if (World.location === "ashenreach") { rect(x - 30, y - 70, 8, 100, "#aa8060"); rect(x + 22, y - 70, 8, 100, "#aa8060"); rect(x - 30, y - 70, 60, 8, "#cca276"); circle(x, y - 28, 22, r.restored ? "#ffcd79" : "#9d785a"); rect(x - 26, y - 14, 52, 8, "#d8a573"); }
    text(theme.landmark, x, y + 64, 11, theme.color);
    text(r.restored ? "RESTORED" : "TOWN ADVENTURE", x, y - 89, 10, "#fff1b6");
    if (World.location === "greenvale" && globalThis.Realistic?.keeper(s.keeper.x,s.keeper.y)) {}
    else if (globalThis.Realistic?.loaded) World.person({kind:"villager",x:s.keeper.x,y:s.keeper.y,color:theme.color});
    else Journeys.friendSprite({role: "guard", color: theme.color}, s.keeper.x, s.keeper.y);
    text(theme.keeper, s.keeper.x, s.keeper.y + 38, 10, "#fff1b6");
    if (!globalThis.Realistic?.camp(800,353)) {circle(800, 353, 16, "#ef9566"); circle(800, 348, 9, "#ffe0a0");} text("CAMP · TALK", 800, 325, 10, "#ffe0a0");
    // Optional northern cave and southern route are off the main combat lane.
    rect(s.cave.x - 160, 98, 320, 91, "#233a43");
    rect(s.cave.x - 155, 98, 310, 12, "#74848e");
    for (let n = 0; n < 7; n++) rect(s.cave.x - 150 + n * 45, 108, 10, 15 + n % 3 * 5, "#71868a");
    text(r.caveDone ? "ECHO CAVE · TREASURE FOUND" : "ECHO CAVE · MOON → LEAF → FLAME", s.cave.x, 202, 10, "#d2e7e9");
    ["LEAF", "MOON", "FLAME"].forEach((name, i) => { const rx = s.cave.x - 95 + i * 95; circle(rx, 125, 13, r.caveDone || r.cave.includes(i) ? theme.color : "#64747d"); text(name, rx, 162, 9, "#ffffff"); });
    text("↑ CAVE / RUINS     ↓ OLD CAMPSITE", 1530, 300, 10, "#e4dab6");
    if (!globalThis.Realistic?.ruin(s.cache.x, s.cache.y + 22, 118)) {
    rect(s.cache.x - 56, s.cache.y - 92, 18, 114, "#6c7f7c");
    rect(s.cache.x + 38, s.cache.y - 65, 18, 87, "#6c7f7c");
    for (let n = 0; n < 4; n++) rect(s.cache.x - 57 + n * 28, s.cache.y + 13, 22, 9, "#87958b");
    }
    text("RUINED WATCHTOWER", s.cache.x, s.cache.y - 105, 10, "#dddfba");
    rect(s.cache.x - 13, s.cache.y - 10, 26, 19, r.cache ? "#746c55" : "#ddbe76"); text(r.cache ? "EMPTY CACHE" : "TRAIL CACHE", s.cache.x, s.cache.y + 29, 10, "#ead6a5");
    if (r.accepted && !r.found && !r.restored) { circle(s.token.x, s.token.y, 19, "#ffe59c66"); text("!", s.token.x, s.token.y + 6, 22, "#fff0a8"); text(theme.item, s.token.x, s.token.y + 36, 11, "#fff0a8"); }
    if (this.active().some(f => { const q = this.friendRecord(f.id); return q.accepted && !q.found; })) { circle(s.keepsake.x, s.keepsake.y, 15, "#d7bfff"); text("FRIEND'S KEEPSAKE", s.keepsake.x, s.keepsake.y + 30, 10, "#e3d1ff"); }
    const dragonHere = p.companion || this.active().some(f => f.role === "dragon");
    globalThis.Realistic?.ruin(s.secret.x, s.secret.y + 26, 85);
    ctx.strokeStyle = r.secret || dragonHere ? "#ffda86" : "#6d7b79"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(s.secret.x, s.secret.y + 18, 31, Math.PI, 0); ctx.stroke();
    text(r.secret ? theme.secret : dragonHere ? "DRAGON SECRET · ACTION" : "SEALED SKY PATH", s.secret.x, s.secret.y + 49, 10, r.secret || dragonHere ? "#ffe5a0" : "#a7b3a7");
    const target = this.target();
    if (target && target.x >= cam && target.x <= cam + view && !(boss.active && !boss.dead)) {
      ctx.strokeStyle = "#fff2ac"; ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(target.x, target.y, 28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  },
});
const trailGuide = document.createElement("div");
trailGuide.id = "trail-guide"; trailGuide.hidden = true;
document.querySelector("footer").before(trailGuide);
// 1. Towns. 2. Friends. 3. Exploration. Existing royal quests keep priority.
const adventureNearby = World.nearby.bind(World);
World.nearby = function () {
  const original = adventureNearby();
  if (original || !this.location || boss.active && !boss.dead) return original;
  const spot = Adventures.interactions().find(s => dist(p, s) < 48);
  return spot ? { label: "Space · " + spot.label, action: spot.action } : null;
};
const adventureDraw = Journeys.drawWorld.bind(Journeys);
Journeys.drawWorld = function () { Adventures.draw(); adventureDraw(); };
const adventureTick = World.afterUpdate.bind(World);
World.afterUpdate = function (dt) { adventureTick(dt); Adventures.tick(dt); };
const adventureButton = document.createElement("button");
adventureButton.id = "adventures-button"; adventureButton.textContent = "Adventures";
adventureButton.onclick = () => { if (World.location && state === "playing") Adventures.journal(); };
$(".world-buttons").append(adventureButton);
// 4. Later guardians alternate a readable new attack with the original moves.
const classicBossUpdate = updateBoss;
updateBoss = function (dt) {
  const e = boss;
  if (!e.frontier || (World.route || 1) < 2 || e.dead) return classicBossUpdate(dt);
  if (e.stun > 0) return;
  if (e.adventureMove) {
    e.adventureMove.time -= dt;
    if (e.adventureMove.time <= 0) {
      const m = e.adventureMove;
      const hit = m.kind === "cross" ? Math.abs(p.x - m.x) < 30 || Math.abs(p.y - m.y) < 30 : dist(p, m) > 75 && dist(p, m) < 175;
      if (hit) hurt(1, { type: "boss", attackType: "slam", x: m.x, y: m.y });
      burst(m.x, m.y, "#ffc787", 30); e.adventureMove = null; e.stun = 1.8; e.cd = 1.4; e.armor = Math.max(0, e.armor - 1);
    }
    return;
  }
  if (e.cd <= 0 && e.wind <= 0) {
    e.adventureTurn = (e.adventureTurn || 0) + 1;
    if (e.adventureTurn % 2 === 1) {
      const kind = World.route % 2 === 0 ? "cross" : "ring";
      e.adventureMove = { kind, x: p.x, y: p.y, time: 1.5 };
      notify(kind === "cross" ? "Cross strike! Move diagonally out of the glowing lanes." : "Ring strike! Step inside the circle or move beyond its edge.");
      return;
    }
  }
  classicBossUpdate(dt);
};
const classicBossDraw = drawBoss;
drawBoss = function () {
  const m = boss.adventureMove;
  if (m && boss.active && !boss.dead) {
    ctx.save(); ctx.fillStyle = "#ffb16d55"; ctx.strokeStyle = "#ffe6a9"; ctx.lineWidth = 3;
    if (m.kind === "cross") {
      rect(m.x - 30, 100, 60, 440, "#ffb16d55"); rect(boss.arenaStart, m.y - 30, boss.arenaEnd - boss.arenaStart, 60, "#ffb16d55");
      text("MOVE DIAGONALLY", m.x, m.y - 48, 13, "#fff2cb");
    } else {
      ctx.beginPath(); ctx.arc(m.x, m.y, 175, 0, Math.PI * 2); ctx.arc(m.x, m.y, 75, 0, Math.PI * 2, true); ctx.fill(); ctx.stroke(); text("SAFE INSIDE OR OUTSIDE", m.x, m.y - 30, 12, "#fff2cb");
    }
    ctx.restore();
  }
  classicBossDraw();
};
// Don't restore an old attack warning after a death, reload, or scene change.
const adventureApply = World.apply.bind(World);
World.apply = function (data) { adventureApply(data); boss.adventureMove = null; };
