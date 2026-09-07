"use strict";
// Roads continue beyond each guardian into their own saved settlement and valley.
const Journeys = (globalThis.Journeys = {
  actors: {},
  places: {
    greenvale: {
      town: "Brookhaven",
      valley: "Mossfang Valley",
      human: "Wren",
      role: "ranger",
      monster: "Moss",
      dragon: "Skywing",
      color: "#9acb88",
    },
    frostmarch: {
      town: "Snowbell",
      valley: "Frostfang Pass",
      human: "Lyra",
      role: "healer",
      monster: "Pebble",
      dragon: "Snowglow",
      color: "#b8e6ed",
    },
    sunreach: {
      town: "Oasis Crossing",
      valley: "The Glass Dunes",
      human: "Tariq",
      role: "guard",
      monster: "Bramble",
      dragon: "Sunspark",
      color: "#f1d48b",
    },
    ashenreach: {
      town: "Dragonrest",
      valley: "Cinderfang Gorge",
      human: "Flint",
      role: "mage",
      monster: "Cinder",
      dragon: "Moonfire",
      color: "#eab397",
    },
  },
  data() {
    World.extras.friends ??= [];
    World.extras.activeFriends ??= [];
    World.extras.roads ??= {};
    return World.extras;
  },
  reset() {
    this.actors = {};
  },
  place() {
    return this.places[World.location];
  },
  roster() {
    return Object.entries(this.places).flatMap(([realm, r]) => [
      {
        id: realm + "-human",
        realm,
        name: r.human,
        role: r.role,
        color: r.color,
      },
      {
        id: realm + "-monster",
        realm,
        name: r.monster,
        role: "slime",
        color: r.color,
      },
      {
        id: realm + "-dragon",
        realm,
        name: r.dragon,
        role: "dragon",
        color: r.color,
      },
    ]);
  },
  populate() {
    enemies = [
      this.foe("wolf", 1100, 270),
      this.foe("wolf", 1320, 420),
      this.foe("ogre", 1560, 310),
      this.foe("wolf", 1900, 390),
      this.foe("drake", 2050, 185),
      this.foe("drake", 2380, 320),
    ];
    boss = {
      type: "boss",
      x: 2500,
      y: 300,
      r: 35,
      hp: 0,
      max: 1,
      dead: true,
      active: false,
      phase: 1,
    };
    gates = { wood: true, keep: true };
    checkpoint = "keep";
    chests = [
      { x: 1280, y: 490, kind: "treasure", open: false },
      { x: 1800, y: 150, kind: "treasure", open: false },
    ];
  },
  foe(species, x, y) {
    const e = enemy(species === "drake" ? "archer" : "slime", x, y);
    e.species = species;
    e.hp = e.max = species === "ogre" ? 12 : species === "drake" ? 8 : 4;
    e.r = species === "ogre" ? 24 : species === "drake" ? 21 : 16;
    return e;
  },
  enter() {
    if (!World.location || World.journey || !boss.dead) return false;
    World.persist();
    World.journey = true;
    this.data().roads[World.location] = true;
    World.populate(World.location, true);
    p.x = 150;
    p.y = 330;
    state = "playing";
    keys.clear();
    p.roll = 0;
    p.attack = 0;
    this.reset();
    update(0);
    save();
    notify(
      "The road continues! Welcome to " +
        this.place().town +
        ". Meet your new traveling friends.",
    );
    return true;
  },
  leave() {
    if (!World.journey) return;
    World.persist();
    World.journey = false;
    World.populate(World.location, true);
    p.x = 2670;
    p.y = 320;
    cam = clamp(p.x - view * 0.45, 0, W - view);
    state = "playing";
    keys.clear();
    p.roll = 0;
    p.attack = 0;
    this.reset();
    update(0);
    save();
    notify("Back through the guardian’s pass. The royal hall lies west.");
  },
  nearby() {
    if (!World.location) return null;
    if (!World.journey) {
      if (boss.dead && p.x > 2740)
        return {
          label: "Space · Continue to " + this.place().town,
          action: () => this.enter(),
        };
      return null;
    }
    if (p.x < 100)
      return {
        label: "Space · Return through the guardian’s pass",
        action: () => this.leave(),
      };
    const n = this.place();
    for (const friend of [
      { id: World.location + "-human", x: 535, y: 330 },
      { id: World.location + "-monster", x: 610, y: 465 },
      { id: World.location + "-dragon", x: 2680, y: 290 },
    ])
      if (
        !this.data().activeFriends.includes(friend.id) &&
        dist(p, friend) < 65
      )
        return {
          label:
            "Space · Talk to " +
            this.roster().find((x) => x.id === friend.id).name +
            " · FRIENDLY",
          action: () => this.meet(friend.id),
        };
    if (p.x > 2760)
      return {
        label: "Space · Rest at the dragon nest",
        action: () => {
          p.hp = 6;
          save();
          notify("The nest is safe. Head west to town, or open Map to travel.");
        },
      };
    return null;
  },
  meet(id) {
    const f = this.roster().find((x) => x.id === id),
      d = this.data(),
      known = d.friends.includes(id),
      danger = enemies.some((e) => e.hp > 0);
    let line = known
      ? "Good to see you, friend! Choose who travels with you from your traveling party."
      : f.role === "dragon"
        ? danger
          ? "Those red-eyed monsters have taken over the valley. Defeat them all and I’ll fly with you. " +
            enemies.filter((e) => e.hp <= 0).length +
            "/" +
            enemies.length +
            " defeated."
          : "You made the valley safe! May I come with you? I can breathe fire at the bad monsters."
        : f.role === "slime"
          ? "Don’t worry—I’m a friendly monster! I can bounce into bad monsters and stun them. Let’s go on an adventure."
          : {
              ranger:
                "I know these roads. My bow can keep the bad monsters away. Need a friend for the journey?",
              healer:
                "No one should walk these roads alone. I can restore your hearts while we travel.",
              guard:
                "I’ve guarded this town for years. Now I’d like to see the kingdoms with you. My sword is yours.",
              mage: "There are wonders beyond every mountain. Take me along and I’ll cast sparks at hostile monsters.",
            }[f.role];
    World.open(
      f.name + " · Friendly " + (f.role === "slime" ? "monster" : f.role),
      '<div class="speaker"><span class="portrait">' +
        (f.role === "dragon" ? "✦" : f.role === "slime" ? "●" : "♟") +
        "</span><div><span>A NEW FRIEND, NOT AN ENEMY</span><p>" +
        line +
        "</p></div></div>",
      known
        ? [{ label: "Choose traveling friends", run: () => this.party() }]
        : [
            {
              label:
                f.role === "dragon" && danger
                  ? "Clear the valley first"
                  : "Invite " + f.name + " to join",
              disabled: f.role === "dragon" && danger,
              primary: true,
              run: () => {
                if (f.role === "dragon" && enemies.some((e) => e.hp > 0))
                  return;
                if (!d.friends.includes(id)) d.friends.push(id);
                if (d.activeFriends.length < 2 && !d.activeFriends.includes(id))
                  d.activeFriends.push(id);
                save();
                World.close();
                notify(
                  f.name +
                    " is your friend! Bag → Traveling friends to choose your party.",
                );
              },
            },
          ],
    );
  },
  party() {
    const d = this.data();
    World.open(
      "Your traveling friends",
      '<p>Take up to <strong>two friends</strong> with you, plus Ember. Friends help automatically—no new controls. Everyone stays your friend when resting.</p><div class="friend-list">' +
        this.roster()
          .filter((f) => d.friends.includes(f.id))
          .map(
            (f) =>
              "<p><strong>" +
              f.name +
              "</strong> · " +
              f.role +
              " · " +
              (d.activeFriends.includes(f.id)
                ? "Traveling with you"
                : "Resting in town") +
              "</p>",
          )
          .join("") +
        "</div>" +
        (!d.friends.length
          ? "<p>Follow the eastern road after a guardian falls. New towns and friends are waiting there.</p>"
          : ""),
      this.roster()
        .filter((f) => d.friends.includes(f.id))
        .map((f) => ({
          label:
            (d.activeFriends.includes(f.id) ? "Let rest: " : "Bring along: ") +
            f.name,
          disabled:
            !d.activeFriends.includes(f.id) && d.activeFriends.length >= 2,
          run: () => {
            if (d.activeFriends.includes(f.id))
              d.activeFriends = d.activeFriends.filter((x) => x !== f.id);
            else if (d.activeFriends.length < 2) d.activeFriends.push(f.id);
            this.reset();
            save();
            this.party();
          },
        })),
    );
  },
  addPartyButton() {
    const b = document.createElement("button");
    b.className = "secondary";
    b.textContent = "Traveling friends";
    b.onclick = () => this.party();
    $("#world-panel .dialog-actions").append(b);
  },
  mapRoutes() {
    const d = this.data();
    for (const [id, r] of Object.entries(this.places)) {
      const cleared = (
        World.location === id && !World.journey
          ? boss
          : World.snapshots[id]?.boss
      )?.dead;
      if (!cleared) continue;
      const b = document.createElement("button");
      b.className = "secondary";
      b.textContent =
        "Road beyond " +
        World.realms.find((x) => x.id === id).name +
        " → " +
        r.town;
      b.onclick = () => {
        World.travel(id);
        this.enter();
      };
      $("#world-panel .dialog-actions").append(b);
    }
  },
  townTalk() {
    World.open(
      "Welcome to " + this.place().town,
      "<p>The guardian’s fall opened our road again. " +
        this.place().human +
        " is waiting in the square, and " +
        this.place().monster +
        " is the friendly creature by the garden.</p><p>Hostile wolves, charging ogres, and fire drakes roam the eastern valley. Clear the road to befriend " +
        this.place().dragon +
        " at the nest.</p><p>You can still return through the western pass to collect your kingdom seal.</p>",
      [
        { label: "Choose traveling friends", run: () => this.party() },
        {
          label: "Back to the royal hall",
          run: () => {
            this.leave();
            p.x = 488;
            p.y = 330;
            cam = 0;
            World.close();
            World.talk("ruler");
          },
        },
      ],
    );
  },
  update(dt) {
    const d = this.data();
    if (World.location && !World.journey && boss.dead && p.x > 2810) {
      this.enter();
      return;
    }
    if (World.journey && p.x < 55) {
      this.leave();
      return;
    }
    if (!World.location && boss.dead && p.x > 2820) {
      World.travel("greenvale");
      notify("Beyond the Hollow Keep, the road leads to Willowbrook!");
      return;
    }
    for (const [i, id] of d.activeFriends.entries()) {
      const f = this.roster().find((f) => f.id === id);
      if (!f) continue;
      const a = (this.actors[id] ??= { x: p.x - 30, y: p.y, cd: 1 });
      const tx = p.x - 40 - i * 30,
        ty = p.y + (i % 2 ? 25 : -26);
      if (dist(a, p) > 400) {
        a.x = tx;
        a.y = ty;
      }
      a.x += (tx - a.x) * Math.min(1, dt * 5);
      a.y += (ty - a.y) * Math.min(1, dt * 5);
      a.cd -= dt;
      if (a.cd > 0 || state !== "playing") continue;
      if (f.role === "healer") {
        if (p.hp < 6) {
          p.hp++;
          burst(p.x, p.y, "#b4efae", 12);
          a.cd = 8;
        }
        continue;
      }
      const target = [...enemies, ...(boss.active && !boss.dead ? [boss] : [])]
        .filter(
          (e) =>
            e.hp > 0 &&
            dist(a, e) < (f.role === "guard" || f.role === "slime" ? 120 : 320),
        )
        .sort((a1, b) => dist(a, a1) - dist(a, b))[0];
      if (!target) continue;
      damage(target, f.role === "dragon" ? 2 : 1, true);
      if (f.role === "slime") target.stun = Math.max(target.stun, 0.65);
      if (f.role === "dragon") target.burn = 1.5;
      a.cd = f.role === "ranger" ? 1.4 : 2;
      for (let k = 0; k < 8; k++)
        particles.push({
          x: a.x,
          y: a.y,
          vx: (target.x - a.x) * 2,
          vy: (target.y - a.y) * 2,
          life: 0.4,
          color: f.color,
        });
      tone(f.role === "mage" ? 620 : 300, 0.08, "triangle", 0.015);
    }
    if (World.journey) {
      $("#objective").textContent =
        p.x < 900
          ? this.place().town
          : enemies.some((e) => e.hp > 0)
            ? "Bad monsters · " +
              enemies.filter((e) => e.hp <= 0).length +
              "/6 cleared"
            : "Meet " + this.place().dragon + " at the nest";
    }
  },
  breath(e, a) {
    for (const offset of [-0.2, 0, 0.2])
      shots.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a + offset) * 210,
        vy: Math.sin(a + offset) * 210,
        life: 3,
        reflected: false,
        bounces: 0,
        fire: true,
      });
    burst(e.x, e.y, "#ef9569", 8);
  },
  dragonSprite(x, y, color, friendly, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    circle(0, 15, 22, "#11232355");
    const wing = Math.sin(t * 7) * 6;
    rect(-16, -6, 31, 22, color);
    rect(6, -23, 22, 21, color);
    rect(21, -14, 14, 11, color);
    rect(20, -19, 4, 4, friendly ? "#304a43" : "#ff5449");
    rect(7, -31, 5, 11, "#e4d0a2");
    rect(-24, -18 - wing, 18, 15, color);
    rect(-32, -15 - wing, 10, 7, color);
    rect(-28, 6, 17, 6, color);
    rect(-10, 13, 6, 10, color);
    rect(8, 13, 6, 10, color);
    ctx.restore();
  },
  drawEnemy(e) {
    if (e.hp <= 0) return;
    const x = e.x,
      y = e.y;
    circle(x, y + 15, e.r, "#18252677");
    if (e.wind > 0) {
      ctx.strokeStyle = "#ff785a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, e.species === "ogre" ? 48 : 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.species === "drake")
      this.dragonSprite(x, y, e.flash > 0 ? "#ffe7bc" : "#a66365", false, 1.2);
    if (e.species === "wolf") {
      rect(x - 22, y - 8, 36, 19, e.flash > 0 ? "#fff0c1" : "#8b919d");
      rect(x + 8, y - 20, 18, 20, "#a9abb2");
      rect(x + 11, y - 28, 6, 11, "#8b919d");
      rect(x + 23, y - 13, 12, 8, "#7c8791");
      rect(x + 18, y - 16, 4, 3, "#ff6c59");
      rect(x - 18, y + 9, 6, 13, "#657381");
      rect(x + 4, y + 9, 6, 13, "#657381");
      rect(x - 33, y - 9, 15, 5, "#9b9ea7");
    }
    if (e.species === "ogre") {
      rect(x - 22, y - 12, 44, 40, e.flash > 0 ? "#fff0c1" : "#8f9670");
      rect(x - 17, y - 37, 34, 29, "#b1ae80");
      rect(x - 11, y - 27, 5, 4, "#e9594f");
      rect(x + 6, y - 27, 5, 4, "#e9594f");
      rect(x - 12, y - 17, 6, 8, "#f0dbb0");
      rect(x + 8, y - 17, 6, 8, "#f0dbb0");
      rect(x - 20, y + 24, 12, 14, "#647558");
      rect(x + 8, y + 24, 12, 14, "#647558");
      rect(x + 29, y - 6, 9, 40, "#98744e");
      rect(x + 22, y - 15, 24, 20, "#706351");
    }
    text(
      "HOSTILE · " +
        { wolf: "FANG WOLF", ogre: "CHARGE OGRE", drake: "FIRE DRAKE" }[
          e.species
        ],
      x,
      y - (e.species === "ogre" ? 51 : 40),
      8,
      "#ffb29a",
    );
    if (e.hp < e.max) {
      rect(x - 18, y - 34, 36, 3, "#463e3c");
      rect(x - 18, y - 34, (36 * e.hp) / e.max, 3, "#e99872");
    }
  },
  friendSprite(f, x, y) {
    if (f.role === "dragon") {
      this.dragonSprite(x, y, f.color, true, 0.8);
      return;
    }
    if (f.role === "slime") {
      circle(x, y + 13, 17, "#15312755");
      rect(x - 15, y - 5 + Math.sin(t * 4) * 2, 30, 18, f.color);
      rect(x - 9, y - 12, 18, 10, f.color);
      rect(x - 8, y - 3, 3, 3, "#274b48");
      rect(x + 5, y - 3, 3, 3, "#274b48");
      rect(x - 4, y + 5, 8, 2, "#477868");
      return;
    }
    World.person({ x, y, color: f.color, kind: "friend" });
  },
  drawFollowers() {
    for (const id of this.data().activeFriends) {
      const f = this.roster().find((f) => f.id === id),
        a = this.actors[id];
      if (!f || !a) continue;
      this.friendSprite(f, a.x, a.y);
      text(f.name, a.x, a.y - 34, 9, "#c2efc2");
    }
  },
  drawWorld() {
    if (!World.location) {
      if (boss.dead) {
        text("EAST → WILLOWBROOK", 2750, 195, 13, "#f2dba0");
        rect(2830, 270, 8, 100, "#e5cb8766");
      }
      this.drawFollowers();
      return;
    }
    const r = this.place();
    if (!World.journey) {
      if (boss.dead) {
        rect(2780, 270, 6, 65, "#a38a60");
        rect(2720, 254, 133, 23, "#d3bb81");
        text(r.town + " →", 2785, 270, 13, "#304e3d");
        for (let x = 2795; x < 2880; x += 22) rect(x, 318, 10, 4, "#f9dfa288");
      }
      this.drawFollowers();
      return;
    }
    text(r.valley.toUpperCase(), 1510, 110, 17, r.color);
    text("FRIENDLY DRAGON NEST", 2670, 125, 14, r.color);
    circle(2680, 300, 48, "#c8b07955");
    for (let i = 0; i < 8; i++)
      rect(2640 + i * 10, 325 + (i % 2) * 5, 14, 4, "#cbb085");
    for (const [kind, x, y] of [
      ["human", 535, 330],
      ["monster", 610, 465],
      ["dragon", 2680, 290],
    ]) {
      const f = this.roster().find((f) => f.id === World.location + "-" + kind);
      if (this.data().activeFriends.includes(f.id)) continue;
      this.friendSprite(f, x, y);
      text(f.name + " · FRIENDLY", x, y - 40, 10, "#bde9ba");
    }
    text("← GUARDIAN’S PASS", 118, 220, 11, r.color);
    this.drawFollowers();
  },
});
const originalCurrent = World.current;
World.current = function () {
  const r = originalCurrent.call(this);
  return this.journey && r
    ? { ...r, town: Journeys.places[r.id].town, guardian: "THE DRAGON ROAD" }
    : r;
};
// The new edition still opens in Willowbrook; the sign tells players where roads continue.
if (state === "title") {
  $(".intro .chapter").textContent = "DRAGON ROADS · FRIENDS & MONSTERS";
  $(".intro-note").textContent =
    "Beyond every boss: new towns, companions, and dragon nests";
}
