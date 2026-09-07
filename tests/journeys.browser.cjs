const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? [
          "--no-sandbox",
          "--no-zygote",
          "--single-process",
          "--use-gl=angle",
          "--use-angle=swiftshader",
        ]
      : [],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      pathToFileURL(
        path.join(__dirname, "../Knights_Adventure_Dragon_Roads.html"),
      ).href,
    );
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click("#start");
    const results = await page.evaluate(() => {
      const checks = [];
      const ok = (v, m) => {
        if (!v) throw Error(m);
        checks.push(m);
      };
      state = "playing";
      ok(
        !World.journey && !Journeys.enter(),
        "living guardian blocks onward road",
      );
      boss.active = true;
      damage(boss, 500, true);
      p.x = 2830;
      p.y = 320;
      update(0);
      ok(
        World.journey && World.current().town === "Brookhaven",
        "walking east beyond defeated boss reaches new town",
      );
      ok(
        enemies.length === 12 && enemies.some((e) => e.species === "drake"),
        "new road contains hostile monsters and fire drakes",
      );
      const realm = World.location;
      Journeys.meet(realm + "-human");
      document.querySelector(".dialog-actions button").click();
      Journeys.meet(realm + "-monster");
      document.querySelector(".dialog-actions button").click();
      ok(
        Journeys.data().activeFriends.length === 2,
        "human and friendly monster recruited",
      );
      ok(
        !enemies.some((e) => e.id === realm + "-monster"),
        "friendly creatures are separate from enemies",
      );
      Journeys.update(0.01);
      p.x = 1300;
      p.y = 300;
      const e = enemies[0];
      e.x = 1290;
      e.y = 310;
      e.hp = 10;
      e.max = 10;
      for (const a of Object.values(Journeys.actors)) {
        a.x = p.x - 20;
        a.y = p.y;
        a.cd = 0;
      }
      Journeys.update(0.1);
      ok(e.hp < 10, "traveling friends attack automatically");
      Journeys.meet(realm + "-dragon");
      ok(
        document.querySelector(".dialog-actions button").disabled,
        "friendly dragon waits for road to be cleared",
      );
      World.close();
      for (const foe of enemies) damage(foe, 100, true);
      damage(boss, 1000, true);
      Journeys.meet(realm + "-dragon");
      document.querySelector(".dialog-actions button").click();
      ok(
        Journeys.data().friends.length === 3 &&
          Journeys.data().activeFriends.length === 2,
        "dragon friendship persists without exceeding party cap",
      );
      Journeys.party();
      const b = [...document.querySelectorAll(".dialog-actions button")];
      b.find((b) => b.textContent.includes("Wren")).click();
      [...document.querySelectorAll(".dialog-actions button")]
        .find((b) => b.textContent === "Bring along: Skywing")
        .click();
      World.close();
      ok(
        Journeys.data().activeFriends.includes("greenvale-dragon"),
        "party can swap a person for a dragon",
      );
      World.persist();
      const before = JSON.parse(JSON.stringify(World.snapshots.greenvale));
      reset();
      load();
      state = "playing";
      ok(
        World.journey &&
          World.current().town === "Brookhaven" &&
          Journeys.data().friends.length === 3,
        "save restores new town and recruited friends",
      );
      ok(
        enemies.every((e) => e.hp === 0),
        "cleared hostile road stays cleared after reload",
      );
      Journeys.leave();
      ok(
        !World.journey &&
          boss.dead &&
          JSON.stringify(World.snapshots.greenvale.enemies) ===
            JSON.stringify(before.enemies),
        "return pass preserves original guardian region",
      );
      Journeys.enter();
      ok(
        enemies.every((e) => e.hp === 0),
        "onward and return encounters use independent saves",
      );
      // Check the other three continuations and all recruit roles.
      p.companion = true;
      for (const r of World.realms) World.record(r.id).claimed = true;
      for (const id of ["frostmarch", "sunreach", "ashenreach"]) {
        World.travel(id);
        boss.active = true;
        damage(boss, 500, true);
        p.x = 2830;
        p.y = 320;
        update(0);
        ok(
          World.journey && World.current().town === Journeys.places[id].town,
          id + " onward town reachable",
        );
        Journeys.meet(id + "-human");
        document.querySelector(".dialog-actions button").click();
      }
      ok(
        Journeys.data().friends.some((id) => id === "frostmarch-human"),
        "healer can be recruited",
      );
      Journeys.data().activeFriends = ["frostmarch-human"];
      p.hp = 3;
      Journeys.reset();
      Journeys.update(0.01);
      Journeys.actors["frostmarch-human"].cd = 0;
      Journeys.update(0.01);
      ok(p.hp === 4, "healer restores hearts automatically");
      const drake = enemies.find((e) => e.species === "drake");
      shots = [];
      shoot(drake, 0);
      ok(
        shots.length === 3 && shots.every((s) => s.fire),
        "hostile fire drake breathes a spread of flames",
      );
      World.travel("hollow");
      ok(
        !World.journey && Journeys.data().friends.length >= 6,
        "friends travel back to original adventure",
      );
      boss.dead = true;
      p.x = 2830;
      p.y = 320;
      update(0);
      ok(
        World.location === "greenvale" && !World.journey,
        "road beyond original Hollow Guardian leads to Willowbrook",
      );
      World.travel("greenvale");
      Journeys.enter();
      p.x = 500;
      p.y = 330;
      Journeys.data().activeFriends = ["greenvale-human", "greenvale-monster"];
      Journeys.reset();
      update(0.01);
      save();
      return checks;
    });
    console.log(results.join("\n"));
    await page.screenshot({
      path: path.join(
        process.env.SCREENSHOT_DIR || "/tmp",
        "dragon-roads-town.png",
      ),
    });
    await page.evaluate(() => {
      p.x = 1660;
      p.y = 330;
      cam = 1200;
      enemies = [
        Journeys.foe("wolf", 1770, 260),
        Journeys.foe("ogre", 1810, 380),
        Journeys.foe("drake", 2020, 220),
      ];
      state = "paused";
    });
    await page.screenshot({
      path: path.join(
        process.env.SCREENSHOT_DIR || "/tmp",
        "dragon-roads-monsters.png",
      ),
    });
    assert.deepEqual(errors, []);
    console.log(
      "New roads, friends, hostile monsters, party abilities, persistence: PASS",
    );
  } finally {
    await browser.close();
  }
})();
