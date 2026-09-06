// npm install --no-save playwright; npx playwright install chromium
// Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium
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
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, "../play.html")).href);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click("#story-start");
    await page.evaluate(() => {
      p.x = 690;
      p.y = 155;
    });
    await page.keyboard.press("Space");
    assert(await page.evaluate(() => p.key), "Action opens original chest");
    await page.evaluate(() => {
      p.x = 200;
      p.y = 300;
      p.attack = 0;
      p.attackCD = 0;
      keys.clear();
      update(0.016);
    });
    assert(await page.evaluate(() => p.shield), "automatic shield");
    await page.keyboard.press("Space");
    assert(await page.evaluate(() => p.attack > 0), "Space attacks");
    await page.keyboard.press("Shift");
    assert(await page.evaluate(() => p.roll > 0), "Shift dodges");
    await page.evaluate(() => {
      p.x = 100;
      p.y = 300;
    });
    await page.click("#world-location");
    assert.equal(await page.locator(".realm-card:disabled").count(), 3);
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? path.join(process.env.SCREENSHOT_DIR, "kingdom-map.png")
        : path.join("/tmp", "kingdom-map.png"),
    });
    await page.click('[data-realm="greenvale"]');
    assert.equal(await page.evaluate(() => World.location), "greenvale");
    await page.evaluate(() => {
      toastTime = 0;
    });
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? path.join(process.env.SCREENSHOT_DIR, "willowbrook.png")
        : path.join("/tmp", "willowbrook.png"),
    });
    await page.evaluate(() => {
      p.x = 488;
      p.y = 300;
    });
    await page.keyboard.press("Space");
    assert.equal(await page.evaluate(() => state), "worldmenu");
    await page
      .getByRole("button", { name: "Accept the kingdom quest", exact: true })
      .click();
    assert(await page.evaluate(() => World.record().accepted));
    const outcomes = await page.evaluate(() => {
      state = "paused";
      const out = [];
      const ok = (v, m) => {
        if (!v) throw Error(m);
        out.push(m);
      };
      p.x = 2110;
      p.y = 300;
      World.moveBody(p, 200, 0);
      ok(p.x < 2160, "sanctuary stays locked before quest objectives");
      state = "playing";
      for (const item of World.resources()) {
        p.x = item.x;
        p.y = item.y;
        World.nearby().action();
      }
      ok(World.record().items.length === 3, "three quest resources collected");
      for (const e of enemies.slice(0, 5)) damage(e, 50, true);
      ok(World.ready(), "frontier objectives unlock sanctuary");
      p.x = 2110;
      p.y = 300;
      World.moveBody(p, 150, 0);
      ok(p.x > 2160, "sanctuary crossing opens");
      update(0.016);
      ok(boss.active, "realm guardian awakens");
      damage(boss, 500, true);
      ok(boss.dead, "realm guardian defeat recorded");
      p.x = 488;
      p.y = 300;
      World.talk("ruler");
      document.querySelector(".dialog-actions button").click();
      ok(
        World.record().claimed && World.unlocked("frostmarch"),
        "seal claim unlocks next kingdom",
      );
      const gold = p.gold;
      World.talk("ruler");
      ok(
        document.querySelector(".dialog-actions button").textContent ===
          "Open quest journal" && p.gold === gold,
        "seal reward cannot be claimed twice",
      );
      World.close();
      World.talk("shop");
      let money = p.gold,
        flasks = World.extras.potions;
      document.querySelector(".dialog-actions button").click();
      ok(
        p.gold === money - 8 && World.extras.potions === flasks + 1,
        "merchant purchase charges exactly once",
      );
      World.close();
      p.hp = 2;
      World.bag();
      document.querySelector(".dialog-actions button").click();
      ok(
        p.hp === 5 && World.extras.potions === flasks,
        "potion restores hearts and is consumed",
      );
      World.talk("smith");
      money = p.gold;
      document.querySelector(".dialog-actions button").click();
      ok(p.fire && p.gold === money - 30, "smith upgrades shared inventory");
      World.close();
      p.hp = 1;
      World.talk("inn");
      document.querySelector(".dialog-actions button").click();
      ok(p.hp === 6, "inn restores health");
      World.travel("frostmarch");
      ok(
        World.location === "frostmarch" && p.fire,
        "relics travel between kingdoms",
      );
      World.travel("greenvale");
      ok(
        boss.dead &&
          World.record().claimed &&
          World.record().items.length === 3,
        "return visit preserves quest and encounter progress",
      );
      World.travel("hollow");
      ok(
        World.location === null && p.key && chests.length === 5,
        "original adventure and key survive realm travel",
      );
      for (const id of ["frostmarch", "sunreach"]) {
        World.travel(id);
        World.record().accepted = true;
        World.record().items = [0, 1, 2];
        for (const e of enemies) damage(e, 100, true);
        boss.active = true;
        damage(boss, 500, true);
        p.x = 488;
        p.y = 300;
        World.talk("ruler");
        document.querySelector(".dialog-actions button").click();
      }
      ok(!World.unlocked("ashenreach"), "last kingdom requires Ember");
      World.travel("hollow");
      p.companion = true;
      boss.dead = true;
      boss.hp = 0;
      checkpoint = "rescued";
      save();
      World.travel("ashenreach");
      ok(
        World.location === "ashenreach" && p.companion,
        "rescuing Ember opens final realm",
      );
      World.record().accepted = true;
      World.record().items = [0, 1, 2];
      for (const e of enemies) damage(e, 100, true);
      boss.active = true;
      damage(boss, 500, true);
      World.talk("ruler");
      document.querySelector(".dialog-actions button").click();
      ok(
        World.extras.united && state === "worldmenu",
        "four-seal ending reached",
      );
      World.close();
      save();
      reset();
      ok(
        load() &&
          World.location === "ashenreach" &&
          World.extras.united &&
          p.companion,
        "reload preserves kingdoms, victory, and Ember",
      );
      World.travel("frostmarch");
      p.hp = 1;
      p.inv = 0;
      p.roll = 0;
      p.shield = false;
      state = "playing";
      hurt(1, { x: p.x + 100, y: p.y });
      ok(state === "dead", "death opens retry");
      document.querySelector("#continue").click();
      ok(
        state === "playing" &&
          World.location === "frostmarch" &&
          p.hp === 6 &&
          p.x === 180,
        "realm death retries safely in town",
      );
      state = "paused";
      return out;
    });
    console.log(outcomes.join("\n"));
    await page.evaluate(() => {
      World.travel("greenvale");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click("#world-location");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      390,
    );
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? path.join(process.env.SCREENSHOT_DIR, "mobile-map.png")
        : path.join("/tmp", "mobile-map.png"),
    });
    await page.locator(".close-panel").click();
    await page.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? path.join(process.env.SCREENSHOT_DIR, "mobile-town.png")
        : path.join("/tmp", "mobile-town.png"),
    });
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on("pageerror", (e) => errors.push(e.message));
    await mobile.goto(pathToFileURL(path.join(__dirname, "../play.html")).href);
    await mobile.click("#start");
    await mobile.evaluate(() => {
      start(false);
      World.travel("greenvale");
      p.x = 550;
      p.y = 330;
      update(0);
    });
    assert.equal(await mobile.locator(".actions button:visible").count(), 2);
    await mobile.locator(".actions .attack").tap();
    assert(
      await mobile.evaluate(() => p.attack > 0 && !keys.has(" ")),
      "touch Action attacks and releases",
    );
    await mobile.locator('[data-key="shift"]').tap();
    assert(
      await mobile.evaluate(() => p.roll > 0 && !keys.has("shift")),
      "touch Dodge activates and releases",
    );
    await mobile.evaluate(() => {
      p.roll = 0;
      p.attack = 0;
      keys.clear();
      update(0);
    });
    await mobile.screenshot({
      path: process.env.SCREENSHOT_DIR
        ? path.join(process.env.SCREENSHOT_DIR, "mobile-town.png")
        : path.join("/tmp", "mobile-town.png"),
    });
    console.log(
      "Touch controls: exactly Action and Dodge, both activate and release correctly",
    );
    await page.evaluate(() => {
      start(false);
    });
    assert(
      await page.evaluate(
        () =>
          !World.location &&
          Object.keys(World.records).length === 0 &&
          !p.companion,
      ),
      "new adventure resets expansion",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Keyboard controls, map and dialogue buttons, desktop/mobile layout, new-game reset: PASS",
    );
  } finally {
    await browser.close();
  }
})();
