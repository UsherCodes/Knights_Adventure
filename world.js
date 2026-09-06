"use strict";
// Realm progression lives alongside the original adventure. Both share the same
// knight and combat engine, while each destination preserves its own encounters.
const World = (globalThis.World = {
  location: null,
  records: {},
  snapshots: {},
  campaign: null,
  extras: { potions: 1, united: false },
  menuReturn: "playing",
  clock: 0,
  realms: [
    {
      id: "greenvale",
      name: "Greenvale",
      town: "Willowbrook",
      kingdom: "The Verdant Court",
      ruler: "Queen Elowen",
      person: "Elowen",
      role: "Keeper of the Verdant Court",
      biome: "wood",
      color: "#97b979",
      ground: "#294b3b",
      path: "#a39a68",
      roof: "#ac6854",
      wall: "#d0bd8d",
      sky: "#1c3934",
      item: "sunblossoms",
      guardian: "THE THORN REGENT",
      quest: "A promise to the wood",
      description:
        "Orchards, old oaks, and a village built around the last wishing well.",
      request:
        "The Thorn Regent has silenced our forest. Gather three sunblossoms along the eastern road and defeat five of its creatures. Then cross the seal to its sanctuary. Return to me when the Regent falls.",
      rumor:
        "The road turns east beyond the windmill. Sunblossoms glow gold beside the trail.",
      hp: 30,
    },
    {
      id: "frostmarch",
      name: "Frostmarch",
      town: "Hearthwick",
      kingdom: "The Kingdom of Winterhold",
      ruler: "King Aldric",
      person: "Aldric",
      role: "King of Winterhold",
      biome: "snow",
      color: "#afd7e3",
      ground: "#779ba3",
      path: "#bdcaca",
      roof: "#526d94",
      wall: "#d6ded2",
      sky: "#455c75",
      item: "frost crystals",
      guardian: "THE FROST WARDEN",
      quest: "The thawing of Winterhold",
      description:
        "Blue mountains, snowbound rooftops, and warm windows in the long winter.",
      request:
        "The Frost Warden keeps our spring imprisoned. Recover three frost crystals and defeat five of its sentries. The crystals will open the frozen sanctuary. Bring peace to Hearthwick and earn our seal.",
      rumor:
        "Blue crystals mark the old pilgrim road. A full flask helps on a cold journey.",
      hp: 36,
    },
    {
      id: "sunreach",
      name: "Sunreach",
      town: "Saffron Port",
      kingdom: "The Kingdom of Dawnspire",
      ruler: "Queen Samira",
      person: "Samira",
      role: "Queen of Dawnspire",
      biome: "sand",
      color: "#eacb89",
      ground: "#a88656",
      path: "#d5b880",
      roof: "#508e89",
      wall: "#e1c28a",
      sky: "#7c6954",
      item: "sun shards",
      guardian: "THE DUNE COLOSSUS",
      quest: "The stolen sunrise",
      description:
        "Saffron markets, turquoise domes, and caravans crossing a sea of gold.",
      request:
        "Our caravan routes belong to the Dune Colossus now. Recover three sun shards and defeat five raiders along the dunes. Enter its sanctuary, end its reign, and return for the Dawnspire seal.",
      rumor:
        "Look for gold shards on both sides of the caravan trail. Our smith knows the old mirror craft.",
      hp: 42,
    },
    {
      id: "ashenreach",
      name: "Ashenreach",
      town: "Cinderhaven",
      kingdom: "The Kingdom of Emberfall",
      ruler: "Prince Rowan",
      person: "Rowan",
      role: "Last heir of Emberfall",
      biome: "ash",
      color: "#efa47b",
      ground: "#4f4548",
      path: "#7f6560",
      roof: "#864e5d",
      wall: "#af8b77",
      sky: "#342f3e",
      item: "emberstones",
      guardian: "THE CROWNLESS KING",
      quest: "A kingdom rekindled",
      description:
        "Ash-dark battlements, rivers of fire, and a kingdom waiting to be reborn.",
      request:
        "You carry the trust of three kingdoms, and Ember carries the ancient fire. Find three emberstones, defeat five ashbound soldiers, and break the Crownless King. Together we can light the four beacons again.",
      rumor:
        "Ember is the key to this kingdom. Keep your little friend close and strike when the King is exposed.",
      hp: 50,
    },
  ],
  current() {
    return this.realms.find((r) => r.id === this.location);
  },
  record(id = this.location) {
    return (this.records[id] ??= {
      accepted: false,
      items: [],
      claimed: false,
      bounty: false,
      bountyPaid: false,
      visited: false,
    });
  },
  resetRuntime() {
    this.location = null;
    this.records = {};
    this.snapshots = {};
    this.campaign = null;
    this.extras = { potions: 1, united: false };
    this.clock = 0;
  },
  newGame() {
    this.resetRuntime();
    try {
      localStorage.removeItem("knights-kingdoms-v2");
    } catch {}
  },
  onStart() {
    if (this.location)
      notify(
        "Welcome back to " + this.current().town + ". Your journey is saved.",
      );
    save();
  },
  capture() {
    return JSON.parse(
      JSON.stringify({
        enemies,
        boss,
        chests,
        gates,
        checkpoint,
        x: p.x,
        y: p.y,
      }),
    );
  },
  apply(data) {
    enemies = data.enemies;
    boss = data.boss;
    chests = data.chests;
    gates = data.gates;
    checkpoint = data.checkpoint;
    shots = [];
    coins = [];
    particles = [];
  },
  playerData() {
    return {
      key: p.key,
      fire: p.fire,
      bounce: p.bounce,
      phase: p.phase,
      gold: p.gold,
      companion: p.companion,
    };
  },
  persist() {
    if (this.location) this.snapshots[this.location] = this.capture();
    else this.campaign = this.capture();
    try {
      localStorage.setItem(
        "knights-kingdoms-v2",
        JSON.stringify({
          v: 2,
          location: this.location,
          records: this.records,
          snapshots: this.snapshots,
          campaign: this.campaign,
          extras: this.extras,
          player: this.playerData(),
          stats,
        }),
      );
      saveAvailable = true;
    } catch {
      /* Offline/private browsing can deny storage. */
    }
  },
  restore() {
    try {
      const d = JSON.parse(localStorage.getItem("knights-kingdoms-v2"));
      if (!d || d.v !== 2 || !d.records || !d.snapshots || !d.campaign?.boss)
        return;
      this.records = d.records;
      this.snapshots = d.snapshots;
      this.campaign = d.campaign;
      this.extras = { potions: 1, united: false, ...d.extras };
      Object.assign(p, d.player);
      if (d.stats) stats = d.stats;
      if (d.location && this.realms.some((r) => r.id === d.location)) {
        this.location = d.location;
        this.populate(d.location, true);
      } else {
        this.location = null;
        this.apply(this.campaign);
        p.x = this.campaign.x;
        p.y = this.campaign.y;
      }
      // A save restores at a safe location. An unfinished guardian recovers too.
      p.hp = 6;
      p.stamina = 100;
      p.inv = 1;
      p.roll = 0;
      p.attack = 0;
      p.shield = false;
      if (!boss.dead) {
        boss.hp = boss.max;
        boss.active = false;
        boss.wind = 0;
        boss.stun = 0;
        boss.phase = 1;
        boss.armor = 3;
      }
      if (!this.location && p.x > 2210 && !boss.dead) p.x = 2210;
      cam = clamp(p.x - view * 0.45, 0, W - view);
      dragon.x = p.x - 35;
      dragon.y = p.y;
    } catch {
      /* Keep the valid original adventure if the expansion save is unreadable. */
    }
  },
  unlocked(id) {
    const i = this.realms.findIndex((r) => r.id === id);
    return (
      i === 0 ||
      (i > 0 &&
        this.record(this.realms[i - 1].id).claimed &&
        (i !== 3 || p.companion))
    );
  },
  populate(id, restoring = false) {
    const r = this.realms.find((r) => r.id === id);
    this.location = id;
    this.record().visited = true;
    if (this.snapshots[id])
      this.apply(JSON.parse(JSON.stringify(this.snapshots[id])));
    else {
      enemies = [
        enemy("slime", 1120, 290),
        enemy("slime", 1350, 430),
        enemy("archer", 1460, 190),
        enemy("skeleton", 1670, 330),
        enemy("archer", 2020, 210),
        enemy("skeleton", 2050, 430),
      ];
      const tier = this.realms.indexOf(r);
      for (const e of enemies) {
        e.hp += tier;
        e.max = e.hp;
      }
      boss = {
        type: "boss",
        x: 2510,
        y: 300,
        r: 35,
        hp: r.hp,
        max: r.hp,
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
      gates = { wood: true, keep: true };
      chests = [
        { x: 1280, y: 490, kind: "treasure", open: false },
        { x: 1800, y: 135, kind: "treasure", open: false },
        { x: 2740, y: 460, kind: "treasure", open: false },
      ];
      checkpoint = "keep";
    }
    p.x = 180;
    p.y = 330;
    p.inv = 1;
    shots = [];
    particles = [];
    coins = [];
    cam = 0;
    dragon.x = p.x - 35;
    dragon.y = p.y;
    if (!restoring) {
      notify(
        "Welcome to " + r.town + " · Speak to " + r.person + " in the square.",
      );
      this.persist();
    }
  },
  canTravel() {
    return !(
      (boss.active && !boss.dead) ||
      enemies.some((e) => e.hp > 0 && dist(e, p) < 260)
    );
  },
  travel(id) {
    if (id !== "hollow" && !this.unlocked(id)) return;
    this.persist();
    if (id === "hollow") {
      this.location = null;
      if (this.campaign) {
        this.apply(JSON.parse(JSON.stringify(this.campaign)));
        p.x = this.campaign.x;
        p.y = this.campaign.y;
      }
      cam = clamp(p.x - view * 0.45, 0, W - view);
      dragon.x = p.x - 35;
      dragon.y = p.y;
      notify("The Hollow Crown · Your original adventure awaits.");
    } else this.populate(id);
    this.close();
    state = "playing";
    $("#overlay").hidden = true;
    $(".game-wrap").classList.add("playing");
    keys.clear();
    p.roll = 0;
    p.attack = 0;
    p.rollCD = 0;
    p.attackCD = 0;
    p.shield = false;
    update(0);
    save();
  },
  kills() {
    return enemies.filter((e) => e.hp <= 0).length;
  },
  ready() {
    const q = this.record();
    return q.accepted && q.items.length === 3 && this.kills() >= 5;
  },
  guardianDefeated() {
    notify(
      this.current().guardian +
        " defeated! Return to " +
        this.current().person +
        " for the kingdom seal.",
    );
    this.persist();
  },
  buildings: [
    { x: 220, y: 132, w: 110, h: 88, kind: "inn", name: "THE LANTERN INN" },
    { x: 440, y: 114, w: 148, h: 105, kind: "hall", name: "ROYAL HALL" },
    { x: 660, y: 137, w: 108, h: 83, kind: "market", name: "TRADING POST" },
    { x: 680, y: 413, w: 110, h: 85, kind: "smith", name: "THE FORGE" },
    { x: 240, y: 425, w: 98, h: 75, kind: "home", name: "" },
  ],
  npcs: [
    { x: 488, y: 273, kind: "ruler", name: "Royal envoy", color: "#c7a467" },
    { x: 275, y: 265, kind: "inn", name: "Mira · Innkeeper", color: "#9daf9b" },
    { x: 714, y: 268, kind: "shop", name: "Pip · Merchant", color: "#e2b582" },
    { x: 728, y: 382, kind: "smith", name: "Bram · Smith", color: "#b69589" },
    {
      x: 136,
      y: 310,
      kind: "map",
      name: "Orin · Cartographer",
      color: "#99c3be",
    },
    {
      x: 590,
      y: 402,
      kind: "board",
      name: "Town noticeboard",
      color: "#aeb08a",
    },
  ],
  resources() {
    return [
      { id: 0, x: 1200, y: 165 },
      { id: 1, x: 1570, y: 480 },
      { id: 2, x: 1990, y: 335 },
    ];
  },
  nearby() {
    const r = this.current();
    for (const n of this.npcs)
      if (dist(p, n) < 65)
        return {
          label:
            "Space · " + (n.kind === "ruler" ? "Talk to " + r.person : n.name),
          action: () => this.talk(n.kind),
        };
    if (dist(p, { x: 435, y: 390 }) < 58)
      return {
        label: "Space · Drink from the wishing well",
        action: () => {
          p.hp = 6;
          p.stamina = 100;
          tone(440, 0.25, "sine");
          notify("Health and energy restored. Safe travels, little knight.");
          save();
        },
      };
    if (dist(p, { x: 865, y: 320 }) < 62)
      return {
        label: "Space · Read the road sign",
        action: () =>
          notify(
            "EAST → " +
              r.guardian.replace("THE ", "") +
              " · Gather 3 " +
              r.item +
              " and defeat 5 foes. WEST → " +
              r.town,
          ),
      };
    for (const item of this.resources())
      if (!this.record().items.includes(item.id) && dist(p, item) < 52)
        return {
          label: "Space · Gather " + r.item,
          action: () => {
            this.record().items.push(item.id);
            burst(item.x, item.y, r.color, 22);
            tone(720, 0.16, "triangle");
            notify(
              r.item + " collected · " + this.record().items.length + "/3",
            );
            save();
          },
        };
    for (const c of chests)
      if (!c.open && dist(p, c) < 55)
        return {
          label: "Space · Open traveling chest",
          action: () => {
            c.open = true;
            p.gold += 15;
            this.extras.potions++;
            notify("15 gold + a healing potion! Use your Bag to drink it.");
            burst(c.x, c.y, "#f4d282", 25);
            save();
          },
        };
    if (p.x > 2070 && p.x < 2220 && !this.ready() && !boss.dead)
      return {
        label: "Space · Inspect the sanctuary seal",
        action: () =>
          notify(
            this.record().accepted
              ? "Seal requires 3 " + r.item + " and 5 defeated foes."
              : "Speak to " + r.person + " in the town square first.",
          ),
      };
    if (boss.dead && p.x > 2220)
      return {
        label: "Space · Return to the royal hall",
        action: () => {
          p.x = 488;
          p.y = 330;
          cam = 0;
          dragon.x = p.x - 35;
          this.talk("ruler");
        },
      };
    return null;
  },
  moveBody(b, dx, dy) {
    let nx = clamp(b.x + dx, 30, W - 30),
      ny = clamp(b.y + dy, 100, 540);
    if (b !== p) nx = Math.max(960, nx);
    for (const h of this.buildings) {
      const overlap = (x, y) =>
        x > h.x - b.r &&
        x < h.x + h.w + b.r &&
        y > h.y - b.r &&
        y < h.y + h.h + b.r;
      if (overlap(nx, b.y)) nx = b.x;
      if (overlap(nx, ny)) ny = b.y;
    }
    const closed = (!this.ready() && !boss.dead) || (boss.active && !boss.dead);
    const wall = 2160;
    if (
      closed &&
      (Math.abs(nx - wall) < 28 + b.r ||
        (b.x < wall && nx > wall) ||
        (b.x > wall && nx < wall))
    )
      nx = b.x < wall ? wall - 28 - b.r : wall + 28 + b.r;
    b.x = nx;
    b.y = ny;
  },
  beforeUpdate(dt) {
    if (!this.location) return;
    this.clock += dt;
  },
  afterUpdate() {
    if (!this.location) {
      $("#world-location").textContent = "Map";
      return;
    }
    const r = this.current(),
      q = this.record();
    $("#area").textContent = r.kingdom.toUpperCase();
    $("#objective").textContent =
      p.x < 900
        ? r.town
        : boss.dead
          ? "Return to " + r.person
          : this.ready()
            ? "Defeat the realm guardian"
            : q.accepted
              ? q.items.length +
                "/3 " +
                r.item +
                " · " +
                Math.min(this.kills(), 5) +
                "/5 foes"
              : "Speak to " + r.person;
    $("#world-location").textContent = "Map";
    $("#bossbar > span").textContent = r.guardian;
    $("#footer-text").textContent =
      (p.x < 900 ? "Safe town · " : "Wild frontier · ") +
      r.name +
      " · " +
      Object.values(this.records).filter((x) => x.claimed).length +
      "/4 kingdom seals";
    $("#relics").textContent =
      [
        p.fire ? "Firebrand" : "",
        p.bounce ? "Mirror" : "",
        p.phase ? "Ghoststep" : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Stand still to shield";
  },
  open(title, body, actions = [], wide = false) {
    if (state !== "worldmenu")
      this.menuReturn = state === "paused" ? "paused" : "playing";
    state = "worldmenu";
    keys.clear();
    p.shield = false;
    $("#world-panel").innerHTML =
      '<div class="panel-top"><div><span class="chapter">THE CHRONICLES OF EMBER</span><h2>' +
      title +
      '</h2></div><button class="close-panel" aria-label="Close menu">×</button></div>' +
      body +
      '<div class="dialog-actions"></div>';
    $("#world-panel").classList.toggle("wide", wide);
    $("#world-modal").hidden = false;
    $(".game-wrap").classList.remove("playing");
    $("#world-panel .close-panel").onclick = () => this.close();
    for (const a of actions) {
      const b = document.createElement("button");
      b.textContent = a.label;
      b.disabled = !!a.disabled;
      b.className = a.primary ? "primary" : "secondary";
      b.onclick = a.run;
      $("#world-panel .dialog-actions").append(b);
    }
    $("#world-panel .close-panel").focus();
  },
  close() {
    if ($("#world-modal").hidden) return;
    $("#world-modal").hidden = true;
    state = this.menuReturn;
    keys.clear();
    if (state === "playing") {
      $(".game-wrap").classList.add("playing");
      canvas.focus();
    }
  },
  openMap() {
    if (!["playing", "paused", "worldmenu"].includes(state)) return;
    if (!this.canTravel()) {
      notify("Find a safe place before opening the travel map.");
      return;
    }
    const seals = Object.values(this.records).filter((q) => q.claimed).length;
    const cards = this.realms
      .map((r, i) => {
        const q = this.record(r.id),
          open = this.unlocked(r.id);
        return (
          '<button class="realm-card ' +
          r.biome +
          (open ? "" : " locked") +
          '" data-realm="' +
          r.id +
          '" ' +
          (!open ? "disabled" : "") +
          '><span class="realm-number">0' +
          (i + 1) +
          " / " +
          (q.claimed
            ? "SEAL EARNED"
            : this.location === r.id
              ? "YOU ARE HERE"
              : open
                ? "CARAVAN READY"
                : "LOCKED") +
          '</span><div class="realm-art"><i></i><b>✦</b></div><h3>' +
          r.name +
          '</h3><span class="town-name">' +
          r.town +
          " · " +
          r.kingdom +
          "</span><p>" +
          r.description +
          "</p><strong>" +
          (q.claimed
            ? "Revisit kingdom →"
            : open
              ? "Travel to " + r.town + " →"
              : i === 3 && !p.companion
                ? "Earn 3 seals & rescue Ember"
                : "Earn the " + this.realms[i - 1]?.name + " seal") +
          "</strong></button>"
        );
      })
      .join("");
    this.open(
      "The Four Kingdoms",
      '<p class="map-intro">Beyond the old forest, a world is waking. Visit towns, meet their rulers, and restore the four kingdom seals.</p><div class="world-road"><span>THE HOLLOW CROWN</span><i></i><span>' +
        seals +
        " OF 4 SEALS</span><i></i><span>" +
        (p.companion ? "EMBER IS WITH YOU" : "RESCUE EMBER") +
        '</span></div><div class="realm-grid">' +
        cards +
        "</div>",
      [
        {
          label: "Return to the Hollow Crown",
          run: () => this.travel("hollow"),
        },
        { label: "Quest journal", run: () => this.journal() },
      ],
      true,
    );
    for (const b of document.querySelectorAll("[data-realm]"))
      b.onclick = () => this.travel(b.dataset.realm);
  },
  journal() {
    if (!["playing", "paused", "worldmenu"].includes(state)) return;
    const rows = this.realms
      .map((r) => {
        const q = this.record(r.id),
          snap =
            this.location === r.id ? { enemies, boss } : this.snapshots[r.id];
        const killed = snap?.enemies.filter((e) => e.hp <= 0).length || 0;
        return (
          '<article class="quest-entry"><span class="quest-status">' +
          (q.claimed
            ? "COMPLETE"
            : q.accepted
              ? "IN PROGRESS"
              : this.unlocked(r.id)
                ? "AVAILABLE"
                : "UNDISCOVERED") +
          "</span><h3>" +
          r.quest +
          "</h3><p>" +
          r.kingdom +
          " · " +
          r.ruler +
          "</p><ul><li>Speak to " +
          r.person +
          (q.accepted ? " ✓" : "") +
          "</li><li>Gather " +
          r.item +
          " · " +
          q.items.length +
          "/3</li><li>Defeat frontier foes · " +
          Math.min(killed, 5) +
          "/5</li><li>Defeat " +
          r.guardian.toLowerCase() +
          (snap?.boss.dead ? " ✓" : "") +
          "</li><li>Return to the royal hall" +
          (q.claimed ? " ✓" : "") +
          "</li></ul></article>"
        );
      })
      .join("");
    this.open(
      "A knight’s journal",
      '<div class="journal-lead"><span>YOUR GREATER QUEST</span><p>Rescue Ember in the Hollow Keep. Earn Greenvale, Winterhold, and Dawnspire’s seals, then cross into Ashenreach together.</p></div><div class="journal-grid">' +
        rows +
        "</div>",
      [{ label: "World map", run: () => this.openMap() }],
      true,
    );
  },
  bag() {
    if (!["playing", "paused", "worldmenu"].includes(state)) return;
    this.open(
      "Your traveling bag",
      "<p><strong>" +
        p.gold +
        " gold</strong> · " +
        this.extras.potions +
        " healing potion" +
        (this.extras.potions === 1 ? "" : "s") +
        '</p><p>Potions restore three hearts. Your relics and Ember travel with you between kingdoms.</p><div class="bag-relics">' +
        ["Firebrand", "Mirror Shield", "Ghoststep"]
          .map(
            (name, i) =>
              "<span>" +
              ([p.fire, p.bounce, p.phase][i] ? "✦ " : "◇ ") +
              name +
              "</span>",
          )
          .join("") +
        "</div>",
      [
        {
          label: "Drink potion (+3 hearts)",
          disabled: this.extras.potions < 1 || p.hp >= 6,
          primary: true,
          run: () => {
            if (this.extras.potions < 1 || p.hp >= 6) return;
            this.extras.potions--;
            p.hp = Math.min(6, p.hp + 3);
            save();
            this.close();
            notify("Three hearts restored. Back to the adventure!");
          },
        },
      ],
    );
  },
  talk(kind) {
    const r = this.current(),
      q = this.record();
    if (kind === "map") {
      this.openMap();
      return;
    }
    if (kind === "ruler") {
      const complete = boss.dead && q.accepted;
      let line = q.claimed
        ? "Your courage is remembered here. The road is open, and our kingdom stands beside you."
        : complete
          ? "You did it! Our people can walk the old roads again. Accept our kingdom seal and 60 gold for the journey ahead."
          : q.accepted
            ? "Our hopes travel with you. " +
              q.items.length +
              "/3 " +
              r.item +
              " gathered; " +
              Math.min(this.kills(), 5) +
              "/5 foes defeated. Return when the guardian falls."
            : r.request;
      this.open(
        r.ruler,
        '<div class="speaker"><span class="portrait">♛</span><div><span>' +
          r.role +
          "</span><p>" +
          line +
          "</p></div></div>",
        !q.accepted
          ? [
              {
                label: "Accept the kingdom quest",
                primary: true,
                run: () => {
                  q.accepted = true;
                  save();
                  this.close();
                  notify(
                    "Quest accepted · " +
                      r.quest +
                      ". Follow the eastern road.",
                  );
                },
              },
            ]
          : complete && !q.claimed
            ? [
                {
                  label: "Accept the kingdom seal",
                  primary: true,
                  run: () => {
                    if (q.claimed) return;
                    q.claimed = true;
                    p.gold += 60;
                    p.hp = 6;
                    if (r.id === "ashenreach") this.extras.united = true;
                    save();
                    this.close();
                    if (this.extras.united) this.ending();
                    else
                      notify(
                        r.name +
                          " seal earned! A new kingdom awaits on your map.",
                      );
                  },
                },
              ]
            : [{ label: "Open quest journal", run: () => this.journal() }],
      );
      return;
    }
    if (kind === "inn") {
      this.open(
        "The Lantern Inn",
        '<div class="speaker"><span class="portrait">☕</span><div><span>MIRA · INNKEEPER</span><p>A warm fire and a bowl of stew. Heroes stay free here. ' +
          r.rumor +
          "</p></div></div>",
        [
          {
            label: "Rest · Restore all hearts",
            primary: true,
            run: () => {
              p.hp = 6;
              p.stamina = 100;
              save();
              this.close();
              notify("Rested and ready. Your progress is saved.");
            },
          },
          {
            label: "Hear a local rumor",
            run: () => {
              this.close();
              notify(r.rumor);
            },
          },
        ],
      );
      return;
    }
    if (kind === "shop") {
      this.open(
        "Pip’s Trading Post",
        '<div class="speaker"><span class="portrait">◆</span><div><span>PIP · TRAVELING MERCHANT</span><p>One healing potion, eight gold. Just the thing for a brave knight heading into trouble.</p><p>You have ' +
          p.gold +
          " gold and " +
          this.extras.potions +
          " potions.</p></div></div>",
        [
          {
            label: "Buy potion · 8 gold",
            disabled: p.gold < 8,
            primary: true,
            run: () => {
              if (p.gold < 8) return;
              p.gold -= 8;
              this.extras.potions++;
              save();
              this.talk("shop");
            },
          },
          { label: "Open bag", run: () => this.bag() },
        ],
      );
      return;
    }
    if (kind === "smith") {
      this.open(
        "Bram’s Forge",
        '<div class="speaker"><span class="portrait">⚒</span><div><span>BRAM · BLACKSMITH</span><p>Good steel deserves a little magic. Find relics in the old adventure, or let me craft them here. You have ' +
          p.gold +
          " gold.</p></div></div>",
        [
          { key: "fire", name: "Firebrand", price: 30 },
          { key: "bounce", name: "Mirror Shield", price: 25 },
          { key: "phase", name: "Ghoststep", price: 25 },
        ].map((item) => ({
          label:
            item.name +
            (p[item.key] ? " · Owned" : " · " + item.price + " gold"),
          disabled: p[item.key] || p.gold < item.price,
          run: () => {
            if (p[item.key] || p.gold < item.price) return;
            p.gold -= item.price;
            p[item.key] = true;
            save();
            this.talk("smith");
          },
        })),
      );
      return;
    }
    if (kind === "board") {
      const done = this.kills() === 6;
      this.open(
        "The town noticeboard",
        '<span class="chapter">OPTIONAL · ROADKEEPER’S BOUNTY</span><p>Clear all six frontier creatures to reopen the trade road. Reward: 25 gold and two healing potions.</p><p>' +
          this.kills() +
          "/6 foes defeated · " +
          (q.bountyPaid
            ? "Reward collected"
            : q.bounty
              ? "Bounty accepted"
              : "Available") +
          "</p>",
        q.bountyPaid
          ? []
          : [
              {
                label: !q.bounty
                  ? "Accept bounty"
                  : done
                    ? "Collect bounty reward"
                    : "Come back after clearing the road",
                primary: true,
                disabled: q.bounty && !done,
                run: () => {
                  if (!q.bounty) q.bounty = true;
                  else if (done && !q.bountyPaid) {
                    q.bountyPaid = true;
                    p.gold += 25;
                    this.extras.potions += 2;
                  }
                  save();
                  this.talk("board");
                },
              },
            ],
      );
    }
  },
  ending() {
    this.open(
      "The kingdoms wake.",
      '<div class="ending-star">✦</div><p class="ending-copy">Greenvale blooms. Winterhold thaws. Dawnspire shines.<br>And at last, Emberfall burns bright again.</p><p>You and Ember reunited all four kingdoms. Their towns are yours to revisit, their roads yours to wander.</p>',
      [
        {
          label: "Keep exploring with Ember",
          primary: true,
          run: () => this.close(),
        },
        { label: "See the restored kingdoms", run: () => this.openMap() },
      ],
    );
  },
  person(n) {
    const bob = Math.sin(t * 2 + n.x) * 1.2;
    circle(n.x, n.y + 16, 12, "#102a2855");
    rect(n.x - 7, n.y - 3 + bob, 14, 20, n.color);
    rect(n.x - 6, n.y - 17 + bob, 12, 14, "#e2ba88");
    rect(
      n.x - 8,
      n.y - 20 + bob,
      16,
      5,
      n.kind === "ruler" ? "#f6d48b" : "#755b47",
    );
    rect(n.x - 3, n.y - 12 + bob, 2, 2, "#273a38");
    rect(n.x + 3, n.y - 12 + bob, 2, 2, "#273a38");
    rect(n.x - 6, n.y + 16, 4, 7, "#354443");
    rect(n.x + 3, n.y + 16, 4, 7, "#354443");
    if (n.kind === "ruler")
      text(
        this.record().claimed ? "✦" : this.record().accepted ? "?" : "!",
        n.x,
        n.y - 33,
        19,
        "#ffe3a0",
      );
  },
  house(h, r) {
    rect(h.x + 7, h.y + 12, h.w, h.h, "#14282e35");
    rect(h.x, h.y, h.w, h.h, r.wall);
    rect(h.x + 4, h.y + 4, h.w - 8, 6, "#f1deb544");
    rect(h.x, h.y + h.h - 8, h.w, 8, "#776d58");
    if (r.biome === "sand") {
      rect(h.x - 5, h.y - 6, h.w + 10, 12, r.roof);
      circle(h.x + h.w / 2, h.y - 6, h.w * 0.34, r.roof);
      rect(h.x - 7, h.y - 4, h.w + 14, 10, r.roof);
    } else {
      for (let i = 0; i < 5; i++)
        rect(h.x - 9 + i * 6, h.y - 4 - i * 7, h.w + 18 - i * 12, 8, r.roof);
      if (r.biome === "snow")
        for (let i = 0; i < 4; i++)
          rect(
            h.x - 9 + i * 6,
            h.y - 5 - i * 7,
            h.w + 18 - i * 12,
            3,
            "#e2ece5",
          );
    }
    for (const x of [h.x + 15, h.x + h.w - 30]) {
      rect(x, h.y + 25, 15, 21, "#647c73");
      rect(x + 2, h.y + 27, 11, 16, "#f1ca7b");
      rect(x + 6, h.y + 26, 2, 19, "#867451");
      rect(x, h.y + 34, 15, 2, "#867451");
    }
    rect(h.x + h.w / 2 - 10, h.y + h.h - 35, 20, 35, "#645c4a");
    rect(h.x + h.w / 2 + 5, h.y + h.h - 18, 2, 2, "#efd18e");
    if (h.kind === "hall") {
      rect(h.x + 10, h.y + 10, 12, 35, r.roof);
      rect(h.x + h.w - 22, h.y + 10, 12, 35, r.roof);
      text("✦", h.x + h.w / 2, h.y + 24, 18, "#d19b4b");
    }
    if (h.kind === "smith") {
      rect(h.x + h.w - 17, h.y - 34, 15, 39, "#686764");
      circle(
        h.x + h.w - 9 + Math.sin(t) * 3,
        h.y - 50 - ((t * 12) % 25),
        8,
        "#bec5b533",
      );
      torch(h.x + 20, h.y + h.h - 15);
    }
    if (h.name) text(h.name, h.x + h.w / 2, h.y + h.h + 17, 8, "#eedcaf");
  },
  draw() {
    const r = this.current();
    rect(0, 0, view, 600, r.sky);
    ctx.save();
    ctx.translate(
      -Math.round(cam) + (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake,
    );
    rect(0, 0, W, 600, r.ground);
    // Paths, central square, farm plots, and the sanctuary are all walkable space.
    rect(0, 287, W, 79, r.path);
    rect(185, 220, 624, 200, r.path);
    rect(360, 365, 165, 58, r.path);
    for (let x = 196; x < 805; x += 32)
      for (let y = 225; y < 420; y += 26) rect(x, y, 28, 22, "#fff0c218");
    for (const d of decor) {
      if (d.x < cam - 50 || d.x > cam + view + 50) continue;
      if (d.y < 100 || d.y > 545) {
        if (r.biome === "wood") tree(d.x, d.y, 0.8 + d.s * 0.6);
        else if (r.biome === "snow") {
          tree(d.x, d.y, 0.8 + d.s * 0.6);
          rect(d.x - 17, d.y - 45, 33, 6, "#dce7da");
        } else if (r.biome === "sand") {
          if (d.k === 0) {
            rect(d.x, d.y - 25, 7, 50, "#638065");
            rect(d.x - 10, d.y - 10, 22, 6, "#638065");
            rect(d.x - 12, d.y - 24, 5, 18, "#638065");
          }
        } else {
          rect(d.x, d.y, 20 + d.s * 30, 16, "#79625e");
          if (d.k === 0) rect(d.x, d.y + 8, 15, 3, "#e5a16d66");
        }
      } else if ((d.x > 900 && d.y < 275) || (d.x > 900 && d.y > 380)) {
        rect(d.x, d.y, 2 + d.s * 4, 3, r.color + "55");
        if (d.k === 1 && r.biome === "wood") {
          rect(d.x, d.y - 5, 2, 9, "#8eaa70");
          rect(d.x - 3, d.y - 6, 8, 3, "#e7c392");
        }
      }
    }
    // Village gardens and windmill, harbor water, or snowy mountain silhouettes.
    if (r.biome === "sand") {
      rect(35, 415, 155, 160, "#467d7b");
      for (let i = 0; i < 10; i++)
        rect(40 + ((i * 13) % 135), 430 + i * 12, 30, 2, "#b6d3b855");
      rect(65, 428, 90, 12, "#ae8b5a");
      rect(80, 430, 5, 55, "#ae8b5a");
    } else {
      for (let x = 52; x < 180; x += 25) {
        rect(x, 435, 18, 65, "#584e34");
        for (let y = 440; y < 495; y += 12)
          rect(x + 5, y, 7, 6, r.biome === "snow" ? "#b8cabb" : "#a8b578");
      }
    }
    rect(865, 147, 34, 85, r.wall);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(882, 150);
      ctx.rotate(t * 0.6 + (i * Math.PI) / 2);
      rect(0, -4, 43, 7, r.roof);
      ctx.restore();
    }
    for (const h of this.buildings) this.house(h, r);
    circle(435, 390, 25, "#879789");
    circle(435, 390, 18, "#3b727c");
    circle(435, 390, 10, "#79b2b4");
    rect(404, 382, 5, 29, "#b9a783");
    rect(460, 382, 5, 29, "#b9a783");
    text("WISHING WELL", 435, 435, 8, "#e3d1a5");
    for (const n of this.npcs) {
      if (n.kind === "board") {
        rect(n.x - 15, n.y - 26, 32, 26, "#ab8b5b");
        rect(n.x - 10, n.y - 22, 21, 17, "#e9d6a7");
        rect(n.x - 12, n.y, 4, 12, "#8b6e48");
        rect(n.x + 10, n.y, 4, 12, "#8b6e48");
        text("BOUNTIES", n.x, n.y - 35, 8, "#e7cd96");
      } else this.person(n);
    }
    for (let i = 0; i < 3; i++) {
      const n = {
        x: 340 + i * 110 + Math.sin(t * 0.3 + i) * 35,
        y: 338 + Math.cos(t * 0.5 + i) * 20,
        color: ["#aabc8b", "#b08a76", "#9eb6c0"][i],
        kind: "villager",
      };
      this.person(n);
    }
    rect(856, 295, 4, 41, "#8a7256");
    rect(839, 286, 45, 19, "#c1a77b");
    text("EAST →", 862, 300, 9, "#3b493d");
    text(r.town.toUpperCase(), 465, 83, 20, r.color);
    text(r.kingdom, 465, 105, 11, "#e1d7b6");
    text("THE WILD FRONTIER", 1530, 100, 16, r.color);
    for (const item of this.resources()) {
      if (this.record().items.includes(item.id)) continue;
      const bob = Math.sin(t * 3 + item.id) * 3;
      circle(item.x, item.y, 23, r.color + "18");
      ctx.save();
      ctx.translate(item.x, item.y + bob);
      ctx.rotate(Math.PI / 4);
      rect(-6, -6, 12, 12, r.color);
      rect(-2, -2, 4, 4, "#fff1c7");
      ctx.restore();
      text(this.record().items.length + "/3", item.x, item.y - 23, 9, r.color);
    }
    for (const c of chests) {
      rect(c.x - 15, c.y - 9, 30, 21, c.open ? "#77644d" : "#bf975d");
      rect(c.x - 16, c.y - 13, 32, 7, c.open ? "#5d4e3b" : "#e0b876");
      rect(c.x - 2, c.y - 7, 5, 10, "#f0d49a");
      if (p.companion && !c.open && dist(p, c) < 400) {
        ctx.strokeStyle = "#f2cb8266";
        ctx.setLineDash([3, 8]);
        ctx.beginPath();
        ctx.moveTo(dragon.x, dragon.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (const y of [130, 400]) {
      rect(2137, y, 45, 95, "#74837c");
      rect(2131, y - 8, 57, 14, r.color);
      torch(2120, y + 25);
      torch(2195, y + 25);
    }
    if (!this.ready() && !boss.dead) {
      rect(2153, 225, 14, 173, r.color + "88");
      text("KINGDOM SEAL", 2160, 110, 11, r.color);
    }
    circle(2510, 310, 125, "#16252525");
    ctx.strokeStyle = r.color + "66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2510, 310, 125, 0, Math.PI * 2);
    ctx.stroke();
    text(r.guardian, 2510, 100, 14, r.color);
    for (const e of enemies) {
      ctx.save();
      if (r.biome === "snow") ctx.filter = "hue-rotate(95deg)";
      if (r.biome === "ash") ctx.filter = "hue-rotate(280deg)";
      drawEnemy(e);
      ctx.restore();
    }
    drawBoss();
    if (p.companion) drawDragon(dragon.x, dragon.y, false);
    knight();
    for (const c of coins) {
      circle(c.x, c.y + Math.sin(t * 4) * 2, 4, "#f6cd7d");
    }
    for (const s of shots) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.atan2(s.vy, s.vx));
      rect(-8, -1, 17, 3, s.reflected ? "#c5f3e6" : "#f2d19b");
      ctx.restore();
    }
    for (const a of particles) rect(a.x, a.y, 3, 3, a.color);
    for (let i = 0; i < 40; i++) {
      const x = (i * 79 + t * (r.biome === "snow" ? 8 : 2)) % W,
        y = (i * 37 + t * (r.biome === "snow" ? 16 : -3) + 6000) % 600;
      rect(
        x,
        y,
        r.biome === "snow" ? 3 : 2,
        r.biome === "snow" ? 3 : 2,
        r.color + "66",
      );
    }
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 0, 600);
    shade.addColorStop(0, r.sky + "88");
    shade.addColorStop(0.2, "#0000");
    shade.addColorStop(0.8, "#0000");
    shade.addColorStop(1, r.sky + "55");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, view, 600);
  },
});
// Standard buttons keep world navigation equally usable by keyboard and touch.
const worldButtons = document.createElement("div");
worldButtons.className = "world-buttons";
worldButtons.innerHTML =
  '<button id="world-location" title="World map (M)">Map</button><button id="journal-button" title="Quest journal">Quests</button><button id="bag-button" title="Healing potions and relics">Bag</button>';
$(".header-right").prepend(worldButtons);
const modal = document.createElement("div");
modal.id = "world-modal";
modal.hidden = true;
modal.innerHTML =
  '<section id="world-panel" role="dialog" aria-modal="true" aria-label="Adventure menu" tabindex="-1"></section>';
document.body.append(modal);
$("#world-location").onclick = () => World.openMap();
$("#journal-button").onclick = () => World.journal();
$("#bag-button").onclick = () => World.bag();
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m" && !e.repeat) {
    e.preventDefault();
    if (state === "worldmenu") World.close();
    else World.openMap();
  }
  if (e.key === "Escape" && state === "worldmenu") World.close();
  if (e.key === "Tab" && state === "worldmenu") {
    const buttons = [
      ...$("#world-panel").querySelectorAll("button:not([disabled])"),
    ];
    const first = buttons[0],
      last = buttons.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Make the new towns visible immediately instead of hiding them behind the old opening.
if (state === "title") {
  $("#start").textContent = "Enter Willowbrook →";
  $("#start").onclick = () => {
    start(saveAvailable);
    World.travel("greenvale");
  };
  const storyStart = document.createElement("button");
  storyStart.id = "story-start";
  storyStart.className = "secondary";
  storyStart.style.cssText = "display:block;margin-top:18px;padding:12px 18px";
  storyStart.textContent = saveAvailable
    ? "Continue saved adventure"
    : "Play Ember’s rescue first";
  storyStart.onclick = () => start(saveAvailable);
  $("#start").after(storyStart);
  $(".intro .chapter").textContent = "KINGDOMS EDITION · TOWNS & WORLD TRAVEL";
  $(".intro-note").textContent =
    "Four realms · Town quests · Action + Dodge controls";
}
