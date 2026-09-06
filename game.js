"use strict";
// All artwork and sound are generated locally: no assets, libraries, or network required.
const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d");
const $ = (s) => document.querySelector(s),
  W = 2880,
  H = 600,
  keys = new Set();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
  dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let view = 960;
function resize() {
  view = Math.max(
    360,
    Math.round((canvas.clientWidth / canvas.clientHeight) * 600),
  );
  canvas.width = view;
  canvas.height = 600;
}
window.addEventListener("resize", resize);
resize();
let state = "title",
  t = 0,
  last = 0,
  cam = 0,
  shake = 0,
  toastTime = 0,
  saveAvailable = false;
let p,
  enemies,
  shots,
  particles,
  chests,
  coins,
  decor,
  boss,
  dragon,
  gates,
  checkpoint,
  stats;
let audio = null,
  sound = false,
  melodyClock = 0;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function tone(freq = 440, dur = 0.08, type = "square", vol = 0.04) {
  if (!sound || !audio) return;
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  o.connect(g);
  g.connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + dur);
}
function toggleSound() {
  sound = !sound;
  if (sound) {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
    } catch {
      sound = false;
    }
  }
  $("#sound").textContent = sound ? "Sound on" : "Sound off";
  $("#sound").setAttribute("aria-label", sound ? "Mute sound" : "Enable sound");
}
function notify(msg) {
  $("#toast").textContent = msg;
  toastTime = 4;
}
function burst(x, y, color, n = 12) {
  for (let i = 0; i < n; i++)
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 170,
      vy: (Math.random() - 0.5) * 170,
      life: 0.3 + Math.random() * 0.4,
      color,
    });
}
function enemy(type, x, y) {
  return {
    type,
    x,
    y,
    hp: type === "skeleton" ? 4 : 3,
    max: type === "skeleton" ? 4 : 3,
    r: 15,
    cd: 1 + Math.random(),
    wind: 0,
    stun: 0,
    face: Math.PI,
    flash: 0,
    burn: 0,
    leap: 0,
    dx: 0,
    dy: 0,
  };
}
function reset() {
  globalThis.World?.resetRuntime();
  toastTime = 0;
  $("#toast").style.opacity = 0;
  p = {
    x: 140,
    y: 330,
    r: 13,
    hp: 6,
    stamina: 100,
    face: 0,
    attack: 0,
    attackCD: 0,
    roll: 0,
    rollCD: 0,
    inv: 0,
    shield: false,
    parry: 0,
    key: false,
    fire: false,
    bounce: false,
    phase: false,
    gold: 0,
    companion: false,
  };
  enemies = [
    enemy("slime", 390, 270),
    enemy("slime", 540, 410),
    enemy("slime", 740, 300),
    enemy("skeleton", 1110, 290),
    enemy("archer", 1340, 180),
    enemy("slime", 1400, 410),
    enemy("skeleton", 1580, 350),
    enemy("archer", 1740, 220),
  ];
  boss = {
    type: "boss",
    x: 2480,
    y: 290,
    r: 35,
    hp: 36,
    max: 36,
    cd: 2,
    wind: 0,
    stun: 0,
    flash: 0,
    burn: 0,
    active: false,
    dead: false,
    phase: 1,
    attackType: "slam",
    target: null,
    armor: 3,
  };
  gates = { wood: false, keep: false };
  dragon = { x: 2745, y: 300, cd: 1 };
  shots = [];
  particles = [];
  coins = [];
  chests = [
    { x: 690, y: 155, kind: "key", open: false },
    { x: 490, y: 490, kind: "fire", open: false },
    { x: 1480, y: 105, kind: "bounce", open: false },
    { x: 1660, y: 490, kind: "phase", open: false },
    { x: 2630, y: 470, kind: "treasure", open: false },
  ];
  stats = { kills: 0, rolls: 0, parries: 0, time: 0 };
  checkpoint = "wood";
  decor = [];
  let seed = 4821;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 900; i++)
    decor.push({ x: rand() * W, y: rand() * H, s: rand(), k: i % 5 });
  cam = 0;
}
function save() {
  if (globalThis.World?.location) {
    World.persist();
    return;
  }
  try {
    localStorage.setItem(
      "knights-ember-v1",
      JSON.stringify({
        v: 1,
        p: {
          key: p.key,
          fire: p.fire,
          bounce: p.bounce,
          phase: p.phase,
          gold: p.gold,
          companion: p.companion,
        },
        checkpoint,
        gates,
        chests: chests.map((c) => c.open),
        bossDead: boss.dead,
        stats,
      }),
    );
    saveAvailable = true;
    globalThis.World?.persist();
  } catch {
    /* Storage can be unavailable for local/private files. */
  }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem("knights-ember-v1"));
    if (
      !d ||
      d.v !== 1 ||
      !["wood", "ruins", "keep", "rescued"].includes(d.checkpoint) ||
      !Array.isArray(d.chests) ||
      d.chests.length !== 5
    )
      return false;
    Object.assign(p, d.p);
    gates = d.gates;
    checkpoint = d.checkpoint;
    chests.forEach((c, i) => (c.open = !!d.chests[i]));
    stats = d.stats || stats;
    if (checkpoint !== "wood") {
      p.x = checkpoint === "ruins" ? 1040 : 2210;
      enemies = enemies.filter((e) => e.x > p.x);
    }
    boss.dead = !!d.bossDead;
    if (boss.dead) boss.hp = 0;
    if (p.companion) {
      p.x = 2740;
      dragon.x = p.x - 30;
    }
    cam = clamp(p.x - view * 0.45, 0, W - view);
    globalThis.World?.restore();
    return true;
  } catch {
    return false;
  }
}
function start(resume = false) {
  reset();
  if (resume) load();
  else globalThis.World?.newGame();
  state = "playing";
  $("#overlay").hidden = true;
  $(".game-wrap").classList.add("playing");
  keys.clear();
  canvas.focus();
  globalThis.World?.onStart();
  notify(
    p.companion
      ? "Ember is with you. Explore for any treasure you missed!"
      : "Space: sword or interact. Shift: dodge. M: world map.",
  );
}
function showOverlay(title, body, label, fn) {
  $("#overlay").innerHTML =
    '<div class="intro"><div class="chapter">KNIGHT’S ADVENTURE</div><h1>' +
    title +
    "</h1><p>" +
    body +
    '</p><button class="primary" id="continue">' +
    label +
    " <span>→</span></button></div>";
  $("#overlay").hidden = false;
  $(".game-wrap").classList.remove("playing");
  $("#continue").onclick = fn;
  $("#continue").focus();
}
function pause() {
  if (state === "playing") {
    state = "paused";
    keys.clear();
    showOverlay(
      "Take a<br><em>breather.</em>",
      "Ember can wait a moment. Your adventure stays right here.",
      "Keep adventuring",
      () => {
        state = "playing";
        $("#overlay").hidden = true;
        $(".game-wrap").classList.add("playing");
        canvas.focus();
      },
    );
  } else if (state === "paused") $("#continue").click();
}
function hurt(n, source) {
  if (p.inv > 0 || p.roll > 0) return;
  const a = Math.atan2(source.y - p.y, source.x - p.x),
    facing = Math.cos(a - p.face) > 0.1;
  if (
    p.shield &&
    facing &&
    p.stamina >= 8 &&
    !(source.type === "boss" && source.attackType === "slam")
  ) {
    p.stamina -= 8;
    burst(p.x, p.y, "#c0ecf5", 9);
    tone(760);
    if (p.parry > 0) {
      stats.parries++;
      if (source.hp !== undefined) {
        source.stun = 1.2;
        damage(source, 2, true);
      }
      notify("Perfect parry!");
    }
    return;
  }
  p.hp -= n;
  p.inv = 1.1;
  shake = reduced ? 0 : 7;
  burst(p.x, p.y, "#ee8979");
  tone(95, 0.2, "sawtooth");
  if (p.hp <= 0) {
    state = "dead";
    save();
    showOverlay(
      "A hero<br><em>gets back up.</em>",
      "Your treasures and progress are saved. Take a breath, then try again.",
      "Retry from checkpoint",
      () => start(true),
    );
  }
}
function damage(e, n, bypass = false) {
  if (e.hp <= 0) return;
  if (
    e.type === "skeleton" &&
    !bypass &&
    e.stun <= 0 &&
    e.wind <= 0 &&
    Math.cos(Math.atan2(p.y - e.y, p.x - e.x) - e.face) > 0.25
  ) {
    burst(e.x, e.y, "#b2d1db", 8);
    tone(620);
    notify("Shielded! Roll behind the skeleton or parry its swing.");
    return;
  }
  if (e.type === "boss" && e.armor > 0 && e.stun <= 0 && !bypass) n *= 0.45;
  e.hp -= n;
  e.flash = 0.14;
  if (e.type !== "boss") {
    e.stun = Math.max(e.stun, 0.18);
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    e.x = clamp(e.x + Math.cos(a) * 13, 35, W - 35);
    e.y = clamp(e.y + Math.sin(a) * 13, 105, 535);
  }
  burst(e.x, e.y, p.fire ? "#ffba66" : "#e9daa4");
  tone(180 + Math.random() * 140, 0.07);
  shake = reduced ? 0 : 3;
  if (p.fire && !bypass) e.burn = 2;
  if (e.hp <= 0) {
    e.hp = 0;
    stats.kills++;
    for (let i = 0; i < (e.type === "boss" ? 12 : 3); i++)
      coins.push({
        x: e.x + (Math.random() - 0.5) * 45,
        y: e.y + (Math.random() - 0.5) * 45,
      });
    if (e.type === "boss") {
      e.dead = true;
      if (globalThis.World?.location) {
        World.guardianDefeated();
        return;
      }
      checkpoint = "keep";
      notify("The crown is broken. Free Ember from the cage!");
      save();
    } else if (Math.random() < 0.25 && p.hp < 6) p.hp++;
  }
}
function attack() {
  if (state !== "playing" || p.attackCD > 0 || p.roll > 0) return;
  p.attack = 0.19;
  p.attackCD = 0.32;
  p.shield = false;
  tone(p.fire ? 300 : 220, 0.1, "sawtooth", 0.025);
  for (const e of [...enemies, boss])
    if (
      e.hp > 0 &&
      (e !== boss || boss.active) &&
      dist(p, e) < e.r + 64 &&
      Math.cos(Math.atan2(e.y - p.y, e.x - p.x) - p.face) > -0.2
    )
      damage(e, p.fire ? 2 : 1);
}
function roll() {
  if (state !== "playing" || p.rollCD > 0 || p.stamina < 27) return;
  p.roll = 0.23;
  p.rollCD = 0.65;
  p.stamina -= 27;
  stats.rolls++;
  tone(140, 0.12, "triangle");
}
function nearby() {
  if (globalThis.World?.location) return World.nearby();
  for (const x of [1140, 1570])
    if (dist(p, { x, y: 490 }) < 48)
      return {
        label: "Space · Enter the overgrown passage",
        action: () => {
          p.x = x === 1140 ? 1570 : 1140;
          p.y = 445;
          notify("A forgotten passage! Search the clearing for a relic.");
          burst(p.x, p.y, "#9bbd85", 20);
        },
      };
  if (dist(p, { x: 930, y: 300 }) < 85 && !gates.wood)
    return {
      label: p.key
        ? "Space · Unlock the sun gate"
        : "Find the sun key to open this gate",
      action: () => {
        if (p.key) {
          gates.wood = true;
          checkpoint = "ruins";
          p.hp = 6;
          save();
          notify("Sun gate opened · Checkpoint saved");
        } else notify("The sun key rests in a chest northeast of the trail.");
      },
    };
  if (dist(p, { x: 1900, y: 300 }) < 90 && !gates.keep)
    return {
      label: "Space · Light the keep beacon",
      action: () => {
        gates.keep = true;
        checkpoint = "keep";
        p.hp = 6;
        save();
        notify("Beacon lit · Health restored · Checkpoint saved");
      },
    };
  for (const c of chests)
    if (!c.open && dist(p, c) < 60)
      return {
        label:
          "Space · Open " + (c.kind === "key" ? "sun chest" : "hidden chest"),
        action: () => {
          c.open = true;
          const messages = {
            key: "Sun key found! The eastern gate awaits.",
            fire: "Firebrand acquired · Sword strikes ignite enemies!",
            bounce: "Mirror shield acquired · Reflected arrows ricochet!",
            phase: "Ghoststep acquired · Dodge straight through enemies!",
            treasure: "Royal treasure · 25 gold found!",
          };
          if (c.kind === "key") p.key = true;
          else if (c.kind === "treasure") p.gold += 25;
          else p[c.kind] = true;
          burst(c.x, c.y, "#ffe19a", 30);
          tone(660, 0.25, "triangle");
          notify(messages[c.kind]);
          save();
        },
      };
  if (dist(p, { x: 2745, y: 300 }) < 70 && !p.companion)
    return {
      label: boss.dead
        ? "Space · Set Ember free"
        : "The guardian holds Ember’s cage shut",
      action: () => {
        if (!boss.dead) {
          notify("Defeat the guardian to break the cage seal.");
          return;
        }
        p.companion = true;
        checkpoint = "rescued";
        save();
        state = "won";
        showOverlay(
          "A little fire.<br><em>A new friend.</em>",
          "You broke the Hollow Crown and rescued Ember!<br>" +
            stats.kills +
            " foes defeated · " +
            p.gold +
            " gold · " +
            chests.filter((c) => c.open).length +
            "/5 chests found.<br>Keep exploring: Ember reveals nearby treasure and breathes fire at foes.",
          "Explore with Ember",
          () => {
            state = "playing";
            $("#overlay").hidden = true;
            $(".game-wrap").classList.add("playing");
            notify(
              "Ember joined you! Follow the golden trail to hidden chests.",
            );
          },
        );
      },
    };
  return null;
}
function interact() {
  if (state === "playing") nearby()?.action();
}
function moveBody(b, dx, dy) {
  if (globalThis.World?.location) return World.moveBody(b, dx, dy);
  let nx = clamp(b.x + dx, 30, W - 30),
    ny = clamp(b.y + dy, 100, 540);
  for (const wall of [
    { x: 930, closed: !gates.wood },
    { x: 1900, closed: !gates.keep },
    { x: 2160, closed: boss.active && !boss.dead },
  ]) {
    if (
      wall.closed &&
      (Math.abs(nx - wall.x) < 28 + b.r ||
        (b.x < wall.x && nx > wall.x) ||
        (b.x > wall.x && nx < wall.x))
    )
      nx = b.x < wall.x ? wall.x - 28 - b.r : wall.x + 28 + b.r;
  }
  b.x = nx;
  b.y = ny;
}
function shoot(e, a, reflected = false) {
  shots.push({
    x: e.x,
    y: e.y,
    vx: Math.cos(a) * (reflected ? 410 : 230),
    vy: Math.sin(a) * (reflected ? 410 : 230),
    life: 4,
    reflected,
    bounces: 0,
  });
}
function update(dt) {
  globalThis.World?.beforeUpdate(dt);
  t += dt;
  stats.time += dt;
  toastTime = Math.max(0, toastTime - dt);
  $("#toast").style.opacity = toastTime > 0 ? 1 : 0;
  for (const k of ["attack", "attackCD", "roll", "rollCD", "inv", "parry"])
    p[k] = Math.max(0, p[k] - dt);
  p.stamina = Math.min(100, p.stamina + dt * (p.shield ? 5 : 24));
  let dx =
      Number(keys.has("arrowright") || keys.has("d")) -
      Number(keys.has("arrowleft") || keys.has("a")),
    dy =
      Number(keys.has("arrowdown") || keys.has("s")) -
      Number(keys.has("arrowup") || keys.has("w"));
  const len = Math.hypot(dx, dy);
  if (len) {
    dx /= len;
    dy /= len;
    if (p.roll <= 0) p.face = Math.atan2(dy, dx);
  }
  if (len === 0 && p.attack <= 0 && p.roll <= 0) {
    const threat =
      shots.find((s) => !s.reflected && dist(s, p) < 160) ||
      enemies.find((e) => e.hp > 0 && dist(e, p) < 100);
    if (threat) p.face = Math.atan2(threat.y - p.y, threat.x - p.x);
  }
  const shielding =
    (keys.has("l") || len === 0) &&
    p.stamina > 5 &&
    p.roll <= 0 &&
    p.attack <= 0;
  if (shielding && !p.shield) p.parry = 0.18;
  p.shield = shielding;
  if (p.roll > 0) {
    dx = Math.cos(p.face);
    dy = Math.sin(p.face);
    if (p.phase && Math.random() < 0.7) burst(p.x, p.y, "#b19df2", 1);
  }
  const speed = p.roll > 0 ? 470 : p.shield ? 85 : 175;
  const before = { x: p.x, y: p.y };
  moveBody(p, dx * speed * dt, dy * speed * dt);
  if (
    p.roll > 0 &&
    !p.phase &&
    [...enemies, boss].some(
      (e) =>
        e.hp > 0 && (e !== boss || boss.active) && dist(p, e) < p.r + e.r - 5,
    )
  ) {
    p.x = before.x;
    p.y = before.y;
    p.roll = 0;
  }
  if (keys.has("j") || keys.has(" ")) attack();
  for (const e of [...enemies, boss]) {
    if (e.hp <= 0) continue;
    for (const k of ["cd", "stun", "flash"]) e[k] = Math.max(0, e[k] - dt);
    if (e.burn > 0) {
      e.burn -= dt;
      e.hp -= dt * 0.7;
      if (e.hp <= 0) {
        e.hp = 0.01;
        damage(e, 1, true);
        continue;
      }
    }
    if (e === boss) {
      if (!e.active && p.x > 2210) {
        e.active = true;
        notify("The Hollow Guardian awakens. Dodge the glowing attack zones!");
      }
      if (!e.active) continue;
      updateBoss(dt);
      continue;
    }
    const d = dist(e, p);
    if (d > 400 || Math.floor(e.x / 960) !== Math.floor(p.x / 960)) continue;
    if (e.stun > 0) continue;
    e.face = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        if (e.type === "archer") shoot(e, e.face);
        else if (e.type === "slime") {
          e.leap = 0.36;
          e.dx = Math.cos(e.face);
          e.dy = Math.sin(e.face);
        } else if (d < 70) hurt(1, e);
        e.cd = e.type === "archer" ? 1.7 : 1.2;
      }
      continue;
    }
    if (e.leap > 0) {
      e.leap -= dt;
      moveBody(e, e.dx * 310 * dt, e.dy * 310 * dt);
      if (dist(e, p) < 30) hurt(1, e);
      continue;
    }
    const range = e.type === "archer" ? 290 : e.type === "slime" ? 135 : 55;
    if (d < range && e.cd <= 0) {
      e.wind = e.type === "slime" ? 0.55 : 0.65;
    } else if (d > range * 0.8) {
      moveBody(
        e,
        Math.cos(e.face) * (e.type === "slime" ? 48 : 65) * dt,
        Math.sin(e.face) * (e.type === "slime" ? 48 : 65) * dt,
      );
    }
  }
  for (const s of shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (!s.reflected && dist(s, p) < 23) {
      const a = Math.atan2(s.y - p.y, s.x - p.x);
      if (p.shield && Math.cos(a - p.face) > 0.1 && p.stamina >= 8) {
        p.stamina -= 8;
        s.reflected = true;
        const target =
          enemies
            .filter((e) => e.hp > 0)
            .sort((a, b) => dist(a, p) - dist(b, p))[0] ||
          (boss.active && !boss.dead ? boss : null);
        const angle = target
          ? Math.atan2(target.y - s.y, target.x - s.x)
          : p.face;
        s.vx = Math.cos(angle) * 410;
        s.vy = Math.sin(angle) * 410;
        s.life = 3;
        burst(p.x, p.y, "#c3edee");
        tone(880);
        stats.parries++;
      } else {
        hurt(1, s);
        s.life = 0;
      }
    } else if (s.reflected) {
      for (const e of [...enemies, boss])
        if (
          e.hp > 0 &&
          (e !== boss || boss.active) &&
          e !== s.last &&
          dist(s, e) < e.r + 8
        ) {
          damage(e, 3, true);
          if (p.bounce && s.bounces < 2) {
            s.last = e;
            s.bounces++;
            const target = [...enemies, boss]
              .filter((q) => q.hp > 0 && q !== e && (q !== boss || boss.active))
              .sort((a, b) => dist(a, e) - dist(b, e))[0];
            if (target) {
              const a = Math.atan2(target.y - s.y, target.x - s.x);
              s.vx = Math.cos(a) * 410;
              s.vy = Math.sin(a) * 410;
            } else s.life = 0;
          } else s.life = 0;
          break;
        }
    }
  }
  shots = shots.filter(
    (s) => s.life > 0 && s.x > 0 && s.x < W && s.y > 90 && s.y < 550,
  );
  for (const c of coins)
    if (dist(c, p) < 80) {
      const a = Math.atan2(p.y - c.y, p.x - c.x);
      c.x += Math.cos(a) * 230 * dt;
      c.y += Math.sin(a) * 230 * dt;
      if (dist(c, p) < 16) {
        c.collected = true;
        p.gold++;
        tone(800, 0.035, "sine", 0.012);
      }
    }
  coins = coins.filter((c) => !c.collected);
  for (const a of particles) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.life -= dt;
  }
  particles = particles.filter((a) => a.life > 0);
  if (p.companion) {
    dragon.x += (p.x - 38 - Math.cos(p.face) * 10 - dragon.x) * dt * 5;
    dragon.y += (p.y - 18 - dragon.y) * dt * 5;
    dragon.cd -= dt;
    const target = enemies.find((e) => e.hp > 0 && dist(e, dragon) < 250);
    if (target && dragon.cd <= 0) {
      damage(target, 2, true);
      target.burn = 2;
      dragon.cd = 1.5;
      for (let i = 0; i < 12; i++)
        particles.push({
          x: dragon.x,
          y: dragon.y,
          vx: (target.x - dragon.x) * 2 + (Math.random() - 0.5) * 35,
          vy: (target.y - dragon.y) * 2,
          life: 0.45,
          color: "#ffbd67",
        });
      tone(150, 0.2, "sawtooth", 0.02);
    }
  }
  const area = p.x < 960 ? 0 : p.x < 2000 ? 1 : 2;
  $("#area").textContent = [
    "I · THE WHISPERING WOOD",
    "II · THE FALLEN COURTYARD",
    "III · THE HOLLOW KEEP",
  ][area];
  $("#objective").textContent = p.companion
    ? "M · Explore the four kingdoms"
    : boss.dead
      ? "Free the baby dragon"
      : area === 2
        ? "Break the Hollow Crown"
        : area === 1
          ? "Light the keep beacon"
          : p.key
            ? "Unlock the eastern gate"
            : "Find the sun key";
  $("#hearts").textContent =
    "♥ ".repeat(Math.max(0, p.hp)) + "♡ ".repeat(6 - Math.max(0, p.hp));
  $("#stamina").style.width = p.stamina + "%";
  $("#coins").textContent = "◆ " + p.gold;
  $("#relics").textContent =
    [
      p.fire ? "Firebrand" : "",
      p.bounce ? "Mirror shield" : "",
      p.phase ? "Ghoststep" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Seek the hidden relics";
  const near = nearby();
  $("#prompt").style.display = near ? "block" : "none";
  $("#prompt").textContent = (near?.label || "").replace(
    "Space",
    matchMedia("(pointer: coarse)").matches ? "Action" : "Space",
  );
  $("#bossbar > span").textContent = "THE HOLLOW GUARDIAN";
  $("#bossbar").hidden = !boss.active || boss.dead;
  $("#bosshealth").style.width = (boss.hp / boss.max) * 100 + "%";
  $("#bossphase").textContent =
    boss.stun > 0
      ? "ARMOR EXPOSED · STRIKE NOW"
      : boss.phase === 2
        ? "THE CROWN IS SHATTERING"
        : "DODGSpace · PARRY · STRIKE";
  $("#footer-text").textContent = p.companion
    ? "Ember is right beside you"
    : checkpoint === "wood"
      ? "The Whispering Wood · Your journey begins"
      : "Checkpoint saved · " +
        (checkpoint === "ruins" ? "The Fallen Courtyard" : "The Hollow Keep");
  cam += (clamp(p.x - view * 0.45, 0, W - view) - cam) * Math.min(1, dt * 7);
  shake = Math.max(0, shake - dt * 30);
  melodyClock += dt;
  if (melodyClock > 1.6) {
    melodyClock = 0;
    tone(
      [130.81, 164.81, 196, 146.83][Math.floor(t / 1.6) % 4],
      1.3,
      "sine",
      0.012,
    );
  }
  globalThis.World?.afterUpdate(dt);
}
function updateBoss(dt) {
  const e = boss;
  if (e.hp < e.max * 0.5 && e.phase === 1) {
    e.phase = 2;
    e.armor = 0;
    burst(e.x, e.y, "#efbe71", 50);
    notify("The armor shatters! Watch for faster attacks.");
  }
  if (e.stun > 0) return;
  if (e.wind > 0) {
    e.wind -= dt;
    if (e.wind <= 0) {
      if (e.attackType === "slam") {
        burst(e.target.x, e.target.y, "#eac283", 45);
        shake = reduced ? 0 : 12;
        if (dist(p, e.target) < 104) hurt(2, e);
        e.armor = Math.max(0, e.armor - 1);
        e.stun = 1.7;
      } else {
        for (let i = -2; i <= 2; i++)
          shoot(e, Math.atan2(p.y - e.y, p.x - e.x) + i * 0.23);
        e.stun = 0.7;
      }
      e.cd = e.phase === 1 ? 1.3 : 0.8;
    }
    return;
  }
  if (e.cd <= 0) {
    e.attackType = Math.random() < 0.65 ? "slam" : "arrows";
    e.wind = e.phase === 1 ? 1.1 : 0.8;
    e.target = { x: p.x, y: p.y };
    tone(80, 0.25, "triangle");
  } else {
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    if (dist(e, p) > 105) {
      e.x = clamp(e.x + Math.cos(a) * 55 * dt, 2240, 2710);
      e.y = clamp(e.y + Math.sin(a) * 55 * dt, 150, 485);
    }
  }
}
function rect(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function circle(x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function text(str, x, y, size = 12, color = "#eadcb5") {
  ctx.fillStyle = color;
  ctx.font = size + "px Georgia";
  ctx.textAlign = "center";
  ctx.fillText(str, x, y);
}
function tree(x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(-5, -12, 11, 36, "#332f25");
  rect(-28, -35, 56, 26, "#163b35");
  rect(-22, -53, 44, 29, "#205047");
  rect(-13, -66, 28, 28, "#2a5e4b");
  rect(-17, -47, 9, 5, "#497351");
  rect(5, -30, 11, 4, "#365f43");
  ctx.restore();
}
function torch(x, y) {
  rect(x - 3, y, 6, 22, "#554432");
  circle(x, y - 3, 22, "#e7a94812");
  circle(x, y - 3, 13, "#ffc06b18");
  rect(x - 5, y - 9, 10, 12, "#c57e42");
  rect(x - 3, y - 13 - Math.sin(t * 9) * 2, 6, 11, "#ffd38a");
}
function knight() {
  const x = p.x,
    y = p.y,
    bob = Math.sin(t * 12) * (keys.size ? 1.5 : 0.4);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  if (p.inv > 0 && Math.sin(t * 35) > 0) ctx.globalAlpha = 0.5;
  if (p.roll > 0) ctx.rotate(t * 23);
  circle(0, 14, 17, "#071a1b66");
  rect(-10, -2, 20, 23, "#ba7854");
  rect(-13, 0, 8, 20, "#db9560");
  rect(-8, -3, 16, 19, "#819a9b");
  rect(-8, 15, 6, 8, "#303c46");
  rect(3, 15, 6, 8, "#303c46");
  rect(-10, -23, 20, 23, "#c2cebf");
  rect(-13, -18, 26, 13, "#93aaa8");
  rect(-9, -13, 19, 7, "#243d48");
  rect(-5, -12, 3, 3, "#e7c88e");
  rect(5, -12, 3, 3, "#e7c88e");
  rect(-4, -30, 8, 9, "#d9ae68");
  rect(-3, -34, 12, 6, "#d89261");
  rect(-12, -21, 8, 3, "#f0e9c9");
  ctx.save();
  ctx.rotate(p.face);
  if (p.attack > 0) {
    ctx.strokeStyle = p.fire ? "#ffca7f" : "#e3f3da";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 54, -1.2, 1.2);
    ctx.stroke();
    ctx.strokeStyle = "#faf0cf88";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.arc(0, 0, 49, -1.1, 1);
    ctx.stroke();
  }
  rect(14, -3, 38, 6, p.fire ? "#ffc47b" : "#cadbd1");
  rect(19, -8, 5, 16, "#d7b16b");
  rect(11, -2, 9, 4, "#76583d");
  ctx.restore();
  if (p.shield) {
    ctx.save();
    ctx.rotate(p.face);
    ctx.strokeStyle = p.parry > 0 ? "#f5edb5" : "#a3d2d3";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 27, -1.1, 1.1);
    ctx.stroke();
    ctx.restore();
  } else {
    rect(-20, 1, 10, 16, p.bounce ? "#c3ddce" : "#7a9290");
    rect(-17, 3, 3, 11, "#d5b878");
  }
  ctx.restore();
}
function drawEnemy(e) {
  if (e.hp <= 0) return;
  const x = Math.round(e.x),
    y = Math.round(e.y),
    flash = e.flash > 0;
  circle(x, y + 12, e.r, "#09171866");
  if (e.wind > 0) {
    ctx.strokeStyle = "#efa85e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, e.type === "slime" ? 29 : 40, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (e.type === "slime") {
    const b = e.leap > 0 ? -10 : Math.sin(t * 4) * 2;
    rect(x - 15, y - 8 + b, 30, 20, flash ? "#fff3c0" : "#8eb575");
    rect(x - 10, y - 15 + b, 20, 10, "#a9cb84");
    rect(x - 9, y - 6 + b, 4, 4, "#23433f");
    rect(x + 6, y - 6 + b, 4, 4, "#23433f");
    rect(x - 5, y + 3 + b, 10, 3, "#4c7256");
  } else {
    rect(x - 9, y - 22, 18, 17, flash ? "#fff9d5" : "#d7ceb0");
    rect(x - 6, y - 17, 4, 5, "#2b3940");
    rect(x + 3, y - 17, 4, 5, "#2b3940");
    rect(x - 9, y - 3, 18, 18, e.type === "archer" ? "#a07c65" : "#7c8b87");
    rect(x - 7, y + 14, 5, 10, "#c4bea7");
    rect(x + 3, y + 14, 5, 10, "#c4bea7");
    if (e.type === "archer") {
      ctx.strokeStyle = "#d8b27d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 15, y, 13, -1.4, 1.4);
      ctx.stroke();
      rect(x - 12, y - 25, 24, 6, "#607b67");
    } else {
      rect(x - 19, y - 5, 12, 23, "#697e82");
      rect(x - 15, y - 1, 4, 14, "#c0b182");
      rect(x + 14, y - 16, 4, 32, "#bec7b7");
    }
  }
  if (e.hp < e.max) {
    rect(x - 15, y - 34, 30, 3, "#263b36");
    rect(x - 15, y - 34, (30 * e.hp) / e.max, 3, "#d9946b");
  }
  if (e.burn > 0) rect(x + 12, y - 10, 4, 7, "#ffc070");
}
function drawBoss() {
  const e = boss;
  if (e.dead) {
    rect(e.x - 30, e.y, 60, 18, "#665f58");
    rect(e.x - 12, e.y - 7, 25, 8, "#c1a577");
    return;
  }
  if (e.wind > 0 && e.attackType === "slam") {
    circle(e.target.x, e.target.y, 104, "#f2a35b25");
    ctx.strokeStyle = "#f4b878";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.target.x, e.target.y, 104, 0, Math.PI * 2);
    ctx.stroke();
    circle(e.target.x, e.target.y, 104 * (1 - e.wind / 1.1), "#eeb57818");
  }
  const x = e.x,
    y = e.y;
  circle(x, y + 30, 44, "#08161b99");
  rect(
    x - 36,
    y - 22,
    72,
    48,
    e.flash > 0 ? "#fff0c4" : e.phase === 2 ? "#816b70" : "#64787e",
  );
  rect(x - 44, y - 27, 24, 28, "#8a9995");
  rect(x + 20, y - 27, 24, 28, "#8a9995");
  rect(x - 23, y + 25, 17, 27, "#46565e");
  rect(x + 8, y + 25, 17, 27, "#46565e");
  rect(x - 21, y - 64, 42, 39, "#a8b0a2");
  rect(x - 23, y - 70, 46, 9, "#d6b879");
  for (let i = 0; i < 3; i++) rect(x - 23 + i * 19, y - 82, 8, 15, "#d6b879");
  rect(x - 15, y - 48, 30, 9, "#243946");
  rect(x - 12, y - 47, 7, 5, "#f3b875");
  rect(x + 5, y - 47, 7, 5, "#f3b875");
  rect(x - 7, y - 20, 14, 30, e.phase === 2 ? "#f4b67b" : "#d4b786");
  rect(x + 48, y - 50, 9, 89, "#b7bdb2");
  rect(x + 36, y + 12, 34, 8, "#d7b877");
  if (e.stun > 0) text("EXPOSED", x, y - 92, 10, "#ffe5a0");
}
function drawDragon(x, y, caged) {
  const bob = Math.sin(t * 5) * 3;
  circle(x, y + 13, 19, "#071c1a55");
  rect(x - 13, y - 1 + bob, 23, 15, "#d6a565");
  rect(x + 4, y - 14 + bob, 19, 19, "#e9bc79");
  rect(x + 18, y - 9 + bob, 8, 10, "#e5ad6f");
  rect(x + 15, y - 11 + bob, 3, 4, "#253939");
  rect(x + 5, y - 21 + bob, 4, 9, "#f8dca0");
  rect(x - 15, y - 11 + bob - Math.sin(t * 9) * 4, 13, 12, "#b77758");
  rect(x - 21, y + 5 + bob, 12, 5, "#c18b5b");
  if (caged) {
    for (let i = -28; i <= 28; i += 14) rect(x + i, y - 33, 3, 68, "#8b9d9188");
    rect(x - 30, y - 35, 63, 4, "#98a391");
    rect(x - 30, y + 32, 63, 4, "#98a391");
    text("EMBER", x, y - 47, 10, "#efce89");
  }
}
function draw() {
  if (globalThis.World?.location) {
    World.draw();
    return;
  }
  rect(0, 0, view, 600, "#132c2b");
  ctx.save();
  ctx.translate(
    -Math.round(cam) + (Math.random() - 0.5) * shake,
    (Math.random() - 0.5) * shake,
  );
  for (let a = 0; a < 3; a++) {
    rect(a * 960, 0, 960, 600, ["#24443a", "#39463e", "#293b40"][a]);
    rect(a * 960, 240, 960, 120, ["#6b7050", "#7c7860", "#596463"][a]);
    rect(a * 960, 251, 960, 97, ["#777852", "#86816a", "#626c69"][a]);
  }
  for (const d of decor) {
    if (d.x < cam - 80 || d.x > cam + view + 80) continue;
    if (d.y < 90 || d.y > 550) {
      if (d.x < 1000) tree(d.x, d.y, 1 + d.s * 0.6);
      else {
        rect(d.x, d.y, 35 + d.s * 20, 22, "#52605a");
        rect(d.x + 3, d.y, 27, 3, "#6f7969");
      }
    } else if (d.y > 250 && d.y < 350) {
      rect(d.x, d.y, 9 + d.s * 10, 2, "#c6b58530");
    } else if (d.k === 0) {
      rect(d.x, d.y, 2, 8, "#87a070");
      rect(d.x - 3, d.y + 2, 8, 2, "#718b61");
    } else if (d.k === 1) {
      rect(d.x, d.y, 5, 3, d.x < 1000 ? "#e4bb8277" : "#a6b4a366");
    } else if (d.k === 2) rect(d.x, d.y, 12, 7, "#122c2628");
  }
  // Inlaid keep stones, a weathered royal seal, and forest wayfinding.
  for (let x = 2000; x < W; x += 48)
    for (let y = 245; y < 355; y += 32) {
      rect(x + (y % 2) * 12, y, 43, 27, "#bac1a014");
      rect(x + (y % 2) * 12, y, 43, 1, "#d2d2b01c");
    }
  ctx.strokeStyle = "#bbb38b35";
  ctx.lineWidth = 3;
  for (const r of [110, 125]) {
    ctx.beginPath();
    ctx.arc(2480, 300, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rect(
      2480 + Math.cos(a) * 117 - 3,
      300 + Math.sin(a) * 117 - 3,
      6,
      6,
      "#d1c39155",
    );
  }
  for (const x of [1150, 1600, 2280, 2700]) {
    rect(x, 175, 3, 49, "#998775");
    rect(x + 3, 179, 24, 32, "#855953");
    rect(x + 12, 184, 5, 18, "#d9b87a");
    rect(x + 7, 190, 15, 4, "#d9b87a");
  }
  rect(250, 203, 5, 30, "#826947");
  rect(233, 197, 40, 17, "#b09c68");
  text("EAST →", 253, 209, 8, "#293c32");
  // Storybook paths lead into small optional treasure clearings.
  for (const c of chests) {
    rect(c.x - 18, Math.min(c.y, 300), 36, Math.abs(c.y - 300), "#9f936031");
    circle(c.x, c.y, 36, "#b9a05a13");
    rect(c.x - 17, c.y - 10, 34, 23, c.open ? "#67553d" : "#b68c51");
    rect(c.x - 17, c.y - 13, 34, 8, c.open ? "#403f35" : "#d8b06c");
    rect(c.x - 14, c.y - 5, 4, 16, "#dab66e");
    rect(c.x + 10, c.y - 5, 4, 16, "#dab66e");
    rect(c.x - 3, c.y - 5, 6, 9, c.open ? "#443f30" : "#ffe0a2");
    if (!c.open) {
      circle(c.x, c.y - 20, 2 + Math.sin(t * 3), "#ffda89");
      if (c.kind === "key") text("SUN KEY", c.x, c.y - 35, 10, "#e7cf91");
    }
    if (p.companion && !c.open && dist(p, c) < 430) {
      ctx.setLineDash([3, 8]);
      ctx.strokeStyle = "#efbd6d88";
      ctx.beginPath();
      ctx.moveTo(dragon.x, dragon.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  for (const x of [930, 1900, 2160]) {
    for (const y of [90, 390]) {
      rect(x - 29, y, 58, 120, "#526462");
      for (let j = 0; j < 4; j++) {
        rect(x - 32, y + j * 27, 64, 4, "#819082");
        rect(x - 28 + (j % 2) * 25, y + j * 27, 3, 27, "#34484a");
      }
      rect(x - 36, y - 8, 72, 15, "#89917c");
      torch(x - 44, y + 35);
      torch(x + 44, y + 35);
    }
    const shut =
      x === 930
        ? !gates.wood
        : x === 1900
          ? !gates.keep
          : boss.active && !boss.dead;
    if (shut) {
      rect(x - 17, 204, 34, 193, "#203137");
      for (let y = 210; y < 395; y += 24) rect(x - 15, y, 30, 5, "#a7a381");
      rect(x - 4, 207, 8, 187, "#bea777");
      circle(x, 300, 12, x === 930 ? "#f1c56f" : "#c3d7bc");
    } else {
      rect(x - 21, 201, 42, 7, "#b7b391");
    }
  }
  for (const x of [1140, 1570]) {
    rect(x - 25, 470, 50, 65, "#596b5e");
    rect(x - 16, 480, 32, 55, "#162f2a");
    rect(x - 29, 465, 58, 12, "#839078");
    for (let i = 0; i < 5; i++)
      rect(x - 25 + i * 11, 471, 3, 15 + (i % 3) * 9, "#74905c");
  }
  text("THE WHISPERING WOOD", 470, 115, 13, "#b7c09a");
  text("THE FALLEN COURTYARD", 1400, 80, 13, "#c6c5a6");
  text("THE HOLLOW KEEP", 2480, 85, 13, "#c9c9b0");
  for (const x of [1120, 1300, 1570, 1740, 2310, 2650]) {
    rect(x, 120, 20, 48, "#62726a");
    rect(x - 5, 112, 30, 9, "#8f9780");
    torch(x + 10, 110);
  }
  for (const c of coins) {
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(t * 5) * 2);
    ctx.rotate(Math.PI / 4);
    rect(-3, -3, 6, 6, "#f3cb7e");
    ctx.restore();
  }
  for (const e of enemies) drawEnemy(e);
  drawBoss();
  drawDragon(dragon.x, dragon.y, !p.companion);
  knight();
  for (const s of shots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    rect(-10, -1, 20, 3, s.reflected ? "#b8edf0" : "#eed2a1");
    rect(6, -3, 5, 7, s.reflected ? "#dbfffb" : "#d2ded3");
    ctx.restore();
  }
  for (const a of particles) rect(a.x, a.y, 3, 3, a.color);
  for (let i = 0; i < 25; i++) {
    const x = (i * 137 + Math.sin(t * 0.4 + i) * 25) % W,
      y = 130 + ((i * 73) % 380);
    circle(
      x,
      y + Math.sin(t + i) * 12,
      1.5,
      "#e3d78b" + (Math.sin(t * 2 + i) > 0.1 ? "aa" : "33"),
    );
  }
  ctx.restore();
  const shade = ctx.createLinearGradient(0, 0, 0, 600);
  shade.addColorStop(0, "#071b245c");
  shade.addColorStop(0.25, "#0000");
  shade.addColorStop(0.75, "#0000");
  shade.addColorStop(1, "#081c2455");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, view, 600);
}
function frame(now) {
  let dt = Math.min((now - last) / 1000 || 0, 0.15);
  last = now;
  if (state === "playing") {
    while (dt > 0 && state === "playing") {
      const step = Math.min(dt, 1 / 60);
      update(step);
      dt -= step;
    }
  } else if (state === "title") t += dt;
  draw();
  requestAnimationFrame(frame);
}
function keydown(e) {
  const k = e.key.toLowerCase();
  if (state !== "playing" && k !== "escape") return;
  if (
    e.target?.tagName === "BUTTON" &&
    !e.target.dataset.key &&
    (k === " " || k === "enter")
  )
    return;
  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " ",
      "j",
      "k",
      "l",
      "e",
      "escape",
      "shift",
    ].includes(k)
  )
    e.preventDefault();
  if (k === "escape") {
    if (!e.repeat) pause();
    return;
  }
  if (state !== "playing") return;
  keys.add(k);
  if (!e.repeat) {
    if (k === "k" || k === "shift") roll();
    if (k === " ") {
      if (
        nearby() &&
        !enemies.some((e) => e.hp > 0 && dist(e, p) < 95) &&
        !(boss.active && !boss.dead)
      ) {
        keys.delete(" ");
        interact();
      } else attack();
    }
    if (k === "e") interact();
    if (k === "j") attack();
  }
}
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
  if (state === "playing") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") pause();
});
for (const b of document.querySelectorAll("[data-key]")) {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    keydown({ key: b.dataset.key, repeat: false, preventDefault() {} });
  });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(ev, () => keys.delete(b.dataset.key));
}
$("#pause").onclick = pause;
$("#sound").onclick = toggleSound;
$(".brand").onclick = (e) => {
  e.preventDefault();
  pause();
};
reset();
try {
  saveAvailable = !!localStorage.getItem("knights-ember-v1");
} catch {}
if (saveAvailable) {
  $("#start").textContent = "Continue adventure →";
  $("#resumeNote").innerHTML =
    '<button id="newgame" style="border:0;background:none;text-decoration:underline;padding:0">Start a new adventure</button>';
  $("#newgame").onclick = () => start(false);
}
$("#start").onclick = () => start(saveAvailable);
requestAnimationFrame(frame);
