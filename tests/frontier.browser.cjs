const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  path = require("node:path");
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
        path.join(__dirname, "../Knights_Adventure_Endless_Wilderness.html"),
      ).href,
    );
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click("#start");
    const results = await page.evaluate(() => {
      const out = [],
        ok = (v, m) => {
          if (!v) throw Error(m);
          out.push(m);
        };
      for (const id of Object.keys(Journeys.places)) {
        World.record(id).claimed = true;
      }
      p.companion = true;
      for (const id of Object.keys(Journeys.places)) {
        World.travel(id);
        const residents = Frontier.npcs();
        ok(
          residents.length === 2 &&
            residents.every((n) =>
              Journeys.roster().some((r) => r.id === n.id),
            ),
          id + " original town has a person and friendly monster",
        );
        p.x = residents[0].x;
        p.y = residents[0].y;
        interact();
        document.querySelector(".dialog-actions button").click();
        ok(
          Journeys.data().friends.includes(id + "-town-human"),
          id + " town friend recruitable",
        );
      }
      World.travel("greenvale");
      p.x = 488;
      p.y = 300;
      interact();
      ok(
        document.querySelector("#world-panel h2").textContent ===
          "Queen Elowen",
        "town friends do not intercept royal dialogue",
      );
      World.close();
      boss.active = true;
      damage(boss, 1000, true);
      p.x = 2830;
      p.y = 320;
      update(0);
      ok(
        World.journey && World.route === 1 && W === 4800,
        "first road expands to 4800 pixels",
      );
      ok(
        boss.frontier && !boss.dead && boss.max === 36,
        "old Hollow Guardian waits at end of wilderness",
      );
      ok(
        enemies.length === 12 && Math.max(...enemies.map((e) => e.x)) > 3800,
        "hostile encounters span large wilderness",
      );
      ok(
        !Frontier.advance() && World.route === 1,
        "living guardian blocks next town",
      );
      for (let n = 1; n <= 3; n++) {
        ok(
          Frontier.npcs().length === 3,
          "road " + n + " town has recruitable people, monsters, and a dragon",
        );
        p.x = 4170;
        p.y = 300;
        update(0.01);
        ok(boss.active, "road " + n + " guardian activates at distant arena");
        const x = p.x;
        World.moveBody(p, -300, 0);
        ok(p.x > 4080, "guardian arena locks retreat");
        boss.active = true;
        damage(boss, 1000, true);
        p.x = W - 40;
        p.y = 330;
        update(0);
        ok(
          World.route === n + 1 && !boss.dead && p.x === 180,
          "guardian defeat opens road " +
            (n + 1) +
            " with a fresh town and boss",
        );
      }
      const latestTown = Frontier.town();
      Journeys.leave();
      ok(
        World.route === 3 && boss.dead && W === 4800,
        "westward travel returns to completed previous road",
      );
      Frontier.advance();
      ok(
        World.route === 4 && Frontier.town() === latestTown && !boss.dead,
        "forward revisit restores existing next road",
      );
      save();
      reset();
      load();
      state = "playing";
      ok(
        World.route === 4 && W === 4800 && Frontier.town() === latestTown,
        "reload restores current repeating road and wide bounds",
      );
      ok(
        Journeys.data().friends.includes("greenvale-town-human"),
        "recruited original-town friends survive reload",
      );
      p.x = 4170;
      p.y = 300;
      update(0.01);
      p.hp = 1;
      p.inv = 0;
      p.roll = 0;
      p.shield = false;
      hurt(2, { x: p.x + 40, y: p.y, type: "boss", attackType: "slam" });
      document.querySelector("#continue").click();
      ok(
        World.route === 4 && p.hp === 6 && p.x === 180 && !boss.active,
        "death restarts safely in the current town",
      );
      World.travel("hollow");
      ok(
        W === 2880 && !World.journey,
        "original adventure retains original bounds",
      );
      World.travel("greenvale");
      ok(
        W === 2880 && Frontier.npcs().length === 2,
        "kingdom town retains original bounds and friends",
      );
      Frontier.transition(4);
      p.x = 2300;
      p.y = 330;
      cam = 1850;
      state = "paused";
      return out;
    });
    console.log(results.join("\n"));
    await page.screenshot({
      path: path.join(
        process.env.SCREENSHOT_DIR || "/tmp",
        "wide-wilderness.png",
      ),
    });
    await page.evaluate(() => {
      p.x = 4280;
      cam = 3840;
      state = "playing";
      update(0.01);
      state = "paused";
    });
    await page.screenshot({
      path: path.join(
        process.env.SCREENSHOT_DIR || "/tmp",
        "returning-guardian.png",
      ),
    });
    assert.deepEqual(errors, []);
    console.log(
      "Repeating roads, all-town recruitment, guardian gates, revisits, reload and death: PASS",
    );
  } finally {
    await browser.close();
  }
})();
