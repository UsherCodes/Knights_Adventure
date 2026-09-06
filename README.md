# Knight’s Adventure: Ember & the Four Kingdoms

A small knight, an oversized sword, and a baby dragon worth fighting for. Reed’s first game now includes the original Hollow Crown adventure and four connected kingdoms with towns, quests, shops, and guardians.

## Play

**Download `play.html` and open it in a modern browser.** The whole game is inside that file and works offline. Click **Map** to take a caravan to your first town, Willowbrook. You can return to the original adventure at any time from a safe location.

For development, keep `knight_adventure_v2.html`, `game.js`, `world.js`, and `style.css` together. Open the HTML directly, or run `python3 -m http.server 8080` and visit `http://localhost:8080/knight_adventure_v2.html`.

## Simple controls

| Action                    | Control                           |
| ------------------------- | --------------------------------- |
| Move                      | WASD or arrow keys                |
| Sword, talk, open, gather | **Space** — context decides       |
| Dodge                     | **Shift**                         |
| Shield                    | **Automatic when standing still** |
| Travel                    | Map button or M                   |
| View quests / use potions | Quests / Bag buttons              |
| Pause                     | Escape or pause button            |

Phones and tablets have a directional pad and just two action buttons: **Action** and **Dodge**. The Action button attacks when an enemy is close; otherwise it interacts with nearby people, chests, and quest objects. Hold Action to keep swinging. Menus have clickable choices and keyboard focus support.

The knight turns toward nearby threats and raises a shield while standing still. Frontal melee attacks can be parried, and arrows are deflected. Guardian ground slams must be dodged. Old J/K/L/E keys remain available as aliases for sword, roll, shield, and interaction.

Sound starts off; enable it with the Sound button. Losing focus pauses the game. Reduced-motion preferences disable screen shake.

## The Four Kingdoms

| Realm      | Town         | Kingdom / ruler                  | Guardian       |
| ---------- | ------------ | -------------------------------- | -------------- |
| Greenvale  | Willowbrook  | The Verdant Court / Queen Elowen | Thorn Regent   |
| Frostmarch | Hearthwick   | Winterhold / King Aldric         | Frost Warden   |
| Sunreach   | Saffron Port | Dawnspire / Queen Samira         | Dune Colossus  |
| Ashenreach | Cinderhaven  | Emberfall / Prince Rowan         | Crownless King |

Each kingdom has its own landscape, town architecture, royal quest, collectible resource, and guardian. Towns contain:

- A royal hall where you accept quests and claim kingdom seals.
- The Lantern Inn, offering free healing and local rumors.
- Pip’s Trading Post, selling healing potions for 8 gold.
- Bram’s Forge, crafting Firebrand, Mirror Shield, and Ghoststep.
- A wishing well that restores health and energy.
- An optional bounty to clear all six frontier enemies for 25 gold and two potions.
- Wandering villagers, gardens or harbor scenery, and a cartographer.

Speak to each ruler, gather three realm resources, and defeat five frontier creatures to open the guardian’s sanctuary. Defeat the guardian and return to the royal hall to earn a seal and 60 gold. Each seal unlocks the next kingdom. Ashenreach also requires **Ember’s rescue** in the original adventure. Earn all four seals to reunite the kingdoms, then continue exploring.

You can open the quest journal or bag at any time during play. Travel is blocked during a guardian fight or when a living enemy is nearby. Towns are safe places to rest and prepare.

## The original Hollow Crown adventure

- **Whispering Wood:** fight leaping slimes, find the sun key, and unlock the eastern gate. Search the southern clearing for Firebrand.
- **Fallen Courtyard:** flank or parry skeletons and reflect archers’ arrows. Find Mirror Shield, Ghoststep, and the overgrown passage. Light the beacon to enter the keep.
- **Hollow Keep:** dodge the guardian’s glowing slam circle, then attack while its armor is exposed. Its attacks accelerate below half health.
- **Ember:** free the dragon after the guardian falls. Ember follows you into the kingdoms, reveals nearby chests, and attacks ordinary enemies with fire.

Firebrand ignites enemies; Mirror Shield adds ricochets to reflected arrows; Ghoststep lets rolls pass through enemies. Relics found in the original adventure or bought at a forge work everywhere.

## Saves

The game automatically saves quests, gathered resources, encounters, kingdom seals, inventory, and the original adventure in browser local storage when available. Travel preserves each destination independently. Your knight’s gold, relics, potions, and companion are shared across the world.

After death or reloading, kingdom adventures resume safely in town with full health. Unfinished guardian fights reset; defeated guardians and completed quests stay complete. Original-adventure progress is retained when traveling to and from the kingdoms. The first version’s existing saves remain readable.

Saves belong to the browser and file/web origin. Moving the downloaded file or changing browsers may give it a separate save. The game remains playable when storage is disabled. **Start a new adventure** resets both the original story and kingdom progress.

## Build and verify

There are no runtime dependencies or remote assets. Pixel art uses Canvas; audio uses Web Audio.

- `node tools/build.cjs` regenerates the portable `play.html`. Commit it with matching source changes.
- `node tests/game.test.cjs` runs the dependency-free original gameplay simulation checks.
- `node tests/world.browser.cjs` checks the expansion in Chromium. Install Playwright and Chromium first (`npm install --no-save playwright`, `npx playwright install chromium`). Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only when using an existing Chromium binary; optionally set `SCREENSHOT_DIR` to choose where test screenshots are written (defaults to `/tmp`).

Browser tests cover Action/Dodge/automatic shielding, the realm unlock sequence, quest resources, sanctuary gates, guardian completion, one-time rewards, shop purchases, potion use, relic sharing, return visits, original-adventure preservation, Ember’s final-realm gate, the four-seal ending, saved-game restoration, death/retry, new-game reset, and desktop/mobile interfaces. Guardian defeats in progression tests are simulated; these checks are not a substitute for human difficulty balancing.
