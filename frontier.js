"use strict";
// Repeatable town -> wide wilderness -> Hollow Guardian -> next town routes.
const Frontier = (globalThis.Frontier = {
  names: {
    greenvale: ["Brookhaven", "Pinewatch", "Alderford", "Mossgate"],
    frostmarch: ["Snowbell", "Frosthaven", "Pinefrost", "Winterbrook"],
    sunreach: ["Oasis Crossing", "Sundrift", "Palmwatch", "Amber Wells"],
    ashenreach: ["Dragonrest", "Cinderwatch", "Ashgrove", "Emberhaven"],
  },
  townFriends: {
    greenvale: ["Nell", "Sprout"],
    frostmarch: ["Oren", "Snowpea"],
    sunreach: ["Zara", "Dunelet"],
    ashenreach: ["Rook", "Spark"],
  },
  town(id = World.location, n = World.route || 1) {
    const names = this.names[id];
    return (
      names[(n - 1) % names.length] +
      (n > names.length ? " " + (Math.floor((n - 1) / names.length) + 1) : "")
    );
  },
  id(kind) {
    return (
      World.location +
      (World.journey
        ? (World.route || 1) === 1
          ? ""
          : "-road" + World.route
        : "-town") +
      "-" +
      kind
    );
  },
  npcs() {
    if (!World.location) return [];
    return [
      { id: this.id("human"), x: 340, y: 360 },
      { id: this.id("monster"), x: 565, y: 500 },
      ...(World.journey ? [{ id: this.id("dragon"), x: W - 180, y: 290 }] : []),
    ];
  },
  prepare() {
    if (World.journey) {
      World.route = Math.max(1, World.route || 1);
      Journeys.data().roadDepth ??= {};
      Journeys.data().roadDepth[World.location] = Math.max(
        World.route,
        Journeys.data().roadDepth[World.location] || 1,
      );
      if (!boss.frontier) {
        const oldEnemies = enemies,
          oldChests = chests;
        Journeys.populate();
        oldEnemies.forEach((e, i) => {
          if (e.hp <= 0 && enemies[i]) enemies[i].hp = 0;
        });
        oldChests.forEach((c, i) => {
          if (chests[i]) chests[i].open = c.open;
        });
      }
    }
    // Fresh deterministic scenery spans the full map, including the larger eastward fields.
    decor = [];
    let seed = 9103 + (World.route || 0) * 137;
    for (let i = 0; i < (World.journey ? 1800 : 900); i++) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * W;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 600;
      decor.push({ x, y, s: (i % 13) / 13, k: i % 5 });
    }
  },
  transition(route) {
    World.persist();
    World.journey = route > 0;
    World.route = route;
    World.populate(World.location, true);
    state = "playing";
    keys.clear();
    p.roll = 0;
    p.attack = 0;
    p.inv = 1;
    Journeys.reset();
    update(0);
    save();
  },
  advance() {
    if (!World.journey || !boss.dead) return false;
    const next = (World.route || 1) + 1;
    this.transition(next);
    notify(
      "Welcome to " +
        this.town() +
        ". New friends, a wide wilderness, and another guardian await.",
    );
    return true;
  },
});
const basicRoster = Journeys.roster.bind(Journeys);
Journeys.roster = function () {
  const list = basicRoster();
  const d = this.data();
  for (const [realm, r] of Object.entries(this.places)) {
    list.push(
      {
        id: realm + "-town-human",
        realm,
        name: Frontier.townFriends[realm][0],
        role: r.role,
        color: r.color,
      },
      {
        id: realm + "-town-monster",
        realm,
        name: Frontier.townFriends[realm][1],
        role: "slime",
        color: r.color,
      },
    );
    for (
      let n = 2;
      n <=
      Math.max(
        d.roadDepth?.[realm] || 1,
        World.location === realm && World.journey ? World.route || 1 : 1,
      );
      n++
    )
      for (const [kind, name, role] of [
        ["human", r.human, r.role],
        ["monster", r.monster, "slime"],
        ["dragon", r.dragon, "dragon"],
      ])
        list.push({
          id: realm + "-road" + n + "-" + kind,
          realm,
          name: name + " " + n,
          role,
          color: r.color,
        });
  }
  return list;
};
Journeys.place = function () {
  const r = this.places[World.location];
  return r
    ? {
        ...r,
        town: Frontier.town(),
        valley: r.valley + " · Road " + (World.route || 1),
      }
    : null;
};
World.current = function () {
  const r = this.realms.find((r) => r.id === this.location);
  return this.journey && r
    ? {
        ...r,
        town: Frontier.town(),
        guardian: "THE HOLLOW GUARDIAN · ROAD " + (this.route || 1),
      }
    : r;
};
Journeys.populate = function () {
  W = 4800;
  enemies = [];
  const kinds = [
    "wolf",
    "wolf",
    "ogre",
    "drake",
    "wolf",
    "ogre",
    "wolf",
    "drake",
    "ogre",
    "wolf",
    "drake",
    "wolf",
  ];
  for (let i = 0; i < 12; i++) {
    const x = 1100 + i * 255,
      y = [230, 410, 320, 175, 470, 270][i % 6];
    enemies.push(this.foe(kinds[i], x, y));
  }
  const hp = 36 + Math.min(24, ((World.route || 1) - 1) * 2);
  boss = {
    type: "boss",
    frontier: true,
    x: 4380,
    y: 300,
    r: 35,
    hp,
    max: hp,
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
    arenaStart: 4160,
    arenaEnd: 4680,
  };
  gates = { wood: true, keep: true };
  checkpoint = "keep";
  chests = [
    { x: 1510, y: 490, kind: "treasure", open: false },
    { x: 2680, y: 150, kind: "treasure", open: false },
    { x: 3700, y: 465, kind: "treasure", open: false },
  ];
};
Journeys.enter = function () {
  if (!World.location || World.journey || !boss.dead) return false;
  this.data().roads[World.location] = true;
  Frontier.transition(1);
  notify(
    "Welcome to " +
      Frontier.town() +
      ". Meet your friends, then explore the wilderness to the east.",
  );
  return true;
};
Journeys.leave = function () {
  if (!World.journey) return;
  const previous = (World.route || 1) - 1;
  Frontier.transition(previous);
  p.x = W - 200;
  p.y = 320;
  cam = clamp(p.x - view * 0.45, 0, W - view);
  update(0);
  save();
  notify(
    previous
      ? "Back to " + Frontier.town() + " · Your previous road is saved."
      : "Back through the guardian’s pass. The royal hall lies west.",
  );
};
Journeys.nearby = function () {
  if (!World.location) return null;
  for (const f of Frontier.npcs())
    if (!this.data().activeFriends.includes(f.id) && dist(p, f) < 65)
      return {
        label:
          "Space · Talk to " +
          this.roster().find((r) => r.id === f.id).name +
          " · FRIENDLY",
        action: () => this.meet(f.id),
      };
  if (World.journey && p.x < 100)
    return {
      label: "Space · Return to the previous road",
      action: () => this.leave(),
    };
  if (!World.journey && boss.dead && p.x > 2740)
    return {
      label: "Space · Continue to " + Frontier.town(World.location, 1),
      action: () => this.enter(),
    };
  if (World.journey && boss.dead && p.x > W - 140)
    return {
      label:
        "Space · Continue to " +
        Frontier.town(World.location, (World.route || 1) + 1),
      action: () => Frontier.advance(),
    };
  return null;
};
const previousMeet = Journeys.meet.bind(Journeys);
Journeys.meet = function (id) {
  const f = this.roster().find((f) => f.id === id);
  if (f?.role === "dragon" && !boss.dead && !this.data().friends.includes(id)) {
    World.open(
      f.name + " · Friendly dragon",
      "<p>The old Hollow Guardian blocks the road. Defeat it and clear the hostile creatures from this wilderness, then I can safely fly with you.</p>",
      [{ label: "Defeat the guardian first", disabled: true }],
    );
    return;
  }
  previousMeet(id);
};
const previousUpdate = Journeys.update.bind(Journeys);
Journeys.update = function (dt) {
  if (World.journey && boss.dead && p.x > W - 70) {
    Frontier.advance();
    return;
  }
  previousUpdate(dt);
  if (World.journey) {
    $("#objective").textContent =
      p.x < 900
        ? Frontier.town()
        : boss.dead
          ? "East → " + Frontier.town(World.location, (World.route || 1) + 1)
          : p.x < 4080
            ? "Explore the wilderness · " +
              enemies.filter((e) => e.hp <= 0).length +
              "/" +
              enemies.length +
              " foes"
            : "Defeat the Hollow Guardian";
    $("#footer-text").textContent =
      Frontier.town() +
      " · Road " +
      World.route +
      " · Town → wilderness → guardian → next town";
  }
};
Journeys.townTalk = function () {
  World.open(
    "The road keeps going",
    "<p>Every town has traveling friends. Look for their green FRIENDLY labels in the square and garden.</p><p>Beyond " +
      Frontier.town() +
      ", a large wilderness stretches east. The old Hollow Guardian waits at the far end. Defeat it, then keep walking right to reach " +
      Frontier.town(World.location, (World.route || 1) + 1) +
      ". The pattern repeats.</p><p>Walk west to revisit earlier roads. Their progress and your friends are saved separately.</p>",
    [
      { label: "Choose traveling friends", run: () => this.party() },
      {
        label: "Visit the original royal hall",
        run: () => {
          World.travel(World.location);
          p.x = 488;
          p.y = 330;
          cam = 0;
          World.close();
          World.talk("ruler");
        },
      },
    ],
  );
};
Journeys.drawWorld = function () {
  if (!World.location) {
    if (boss.dead) text("EAST → WILLOWBROOK", 2750, 195, 13, "#f2dba0");
    this.drawFollowers();
    return;
  }
  const r = this.place();
  if (World.journey) {
    for (let x = 1150; x < 4000; x += 510) {
      circle(x, 440, 65, r.color + "08");
      for (let k = 0; k < 8; k++) {
        rect(x + k * 16, 130 + (k % 3) * 12, 3, 11, r.color + "88");
        rect(x + k * 16 - 3, 130 + (k % 3) * 12, 9, 3, r.color + "77");
      }
      text(
        [
          "THE OLD GROVES",
          "THE OPEN WILDS",
          "THE WANDERING FIELDS",
          "THE DEEP WILDS",
          "GUARDIAN’S APPROACH",
          "THE LONG ROAD",
        ][Math.floor((x - 1150) / 510)],
        x + 70,
        105,
        11,
        r.color,
      );
    }
    text("THE HOLLOW GUARDIAN", 4380, 105, 14, r.color);
    circle(W - 180, 300, 42, "#c8b07933");
    text("FRIENDLY DRAGON", W - 180, 195, 10, r.color);
    text("← PREVIOUS ROAD", 120, 220, 10, r.color);
  }
  for (const n of Frontier.npcs()) {
    const f = this.roster().find((f) => f.id === n.id);
    if (!f || this.data().activeFriends.includes(f.id)) continue;
    this.friendSprite(f, n.x, n.y);
    text(f.name + " · FRIENDLY", n.x, n.y - 40, 10, "#bde9ba");
  }
  if (boss.dead) {
    const label = World.journey
      ? Frontier.town(World.location, (World.route || 1) + 1)
      : Frontier.town(World.location, 1);
    rect(W - 97, 270, 6, 58, "#a38a60");
    rect(W - 175, 254, 158, 23, "#d3bb81");
    text(label + " →", W - 96, 270, 12, "#304e3d");
  }
  this.drawFollowers();
};
// The older kingdom journal always refers to its own region, never an onward road.
const priorMapRoutes = Journeys.mapRoutes.bind(Journeys);
Journeys.mapRoutes = function () {
  priorMapRoutes();
  for (const [id, n] of Object.entries(this.data().roadDepth || {})) {
    if (n < 2) continue;
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = "Latest road: " + Frontier.town(id, n);
    b.onclick = () => {
      World.travel(id);
      Frontier.transition(n);
      World.close();
    };
    $("#world-panel .dialog-actions").append(b);
  }
};
if (state === "title") {
  $(".intro .chapter").textContent =
    "ENDLESS WILDERNESS · FRIENDS IN EVERY TOWN";
  $(".intro-note").textContent =
    "Town → wilderness → Hollow Guardian → next town";
}
