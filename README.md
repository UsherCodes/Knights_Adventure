# Knight’s Adventure: Ember & the Four Kingdoms

A small knight, an oversized sword, and a baby dragon worth fighting for. Reed’s first game now includes the original Hollow Crown adventure and four connected kingdoms with towns, quests, shops, and guardians.

## Play

**Download `Knights_Adventure_Endless_Wilderness.html` and open it in a modern browser.** Choose **Enter Willowbrook** to begin in the new town, or use the secondary button for the original story / saved adventure. `play.html` contains the same build. The whole game is inside that file and works offline. Click **Map** to take a caravan to your first town, Willowbrook. You can return to the original adventure at any time from a safe location.

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

## Dragon Roads: beyond the bosses

After a guardian falls, keep walking **east (right)** past its arena. The path now continues into a new town. The original Hollow Guardian's road leads to Willowbrook. Each kingdom guardian opens an additional settlement and monster valley:

| Kingdom    | New town       | Hostile valley   | Recruitable friends                                              |
| ---------- | -------------- | ---------------- | ---------------------------------------------------------------- |
| Greenvale  | Brookhaven     | Mossfang Valley  | Wren the ranger, Moss the friendly slime, Skywing the dragon     |
| Frostmarch | Snowbell       | Frostfang Pass   | Lyra the healer, Pebble the friendly slime, Snowglow the dragon  |
| Sunreach   | Oasis Crossing | The Glass Dunes  | Tariq the guard, Bramble the friendly slime, Sunspark the dragon |
| Ashenreach | Dragonrest     | Cinderfang Gorge | Flint the mage, Cinder the friendly slime, Moonfire the dragon   |

Talk to the people and friendly monsters to invite them along. Clear the twelve hostile creatures and defeat the returning Hollow Guardian before befriending the dragon at the eastern nest. Enemies include lunging Fang Wolves, charging ogres that deal two hearts of damage, and Fire Drakes that breathe three flames at a time. Hostile creatures have red eyes, labeled names, and attack warnings. Friendly creatures are labeled FRIENDLY and cannot be hurt by your sword.

Use **Bag → Traveling friends** to choose up to **two companions**, in addition to Ember. Friends follow you automatically and help with arrows, sword strikes, magic, stunning bounces, healing, or dragon fire. No new combat controls are needed. Friends who rest remain recruited and can rejoin from the party menu.

Walk west out of a new settlement to return through its guardian's pass. Completed guardian roads also appear in the travel menu. Each new road saves its encounters independently from its original kingdom. Recruited friends, the active party, and cleared valleys survive reloads and travel. Return to the original royal hall to claim your kingdom seal; opening the onward road does not replace that quest reward.

`node tests/journeys.browser.cjs` verifies onward paths, recruitable people and monsters, the dragon unlock condition, party limits and swapping, automatic combat/healing, hostile flame attacks, independent scene saves, return routes, and travel to the original story. Use the same Playwright setup as the other browser tests. The build also updates the older download filenames so they contain the current game.

## Endless wilderness: the pattern repeats

The onward adventure now repeats **town → large wilderness → Hollow Guardian → next town**. Each road is 4,800 world units across, with a town at the west end, twelve hostile encounters spread through a much larger wilderness, and the original two-phase Hollow Guardian at the eastern arena. Defeat it and keep walking right to reach the next town. The routes continue generating; they no longer end at the first dragon nest. Guardian health increases gently with later roads and is capped.

Every original kingdom town now has a recruitable person and friendly monster:

| Town         | Person | Friendly monster |
| ------------ | ------ | ---------------- |
| Willowbrook  | Nell   | Sprout           |
| Hearthwick   | Oren   | Snowpea          |
| Saffron Port | Zara   | Dunelet          |
| Cinderhaven  | Rook   | Spark            |

Every subsequent town has its own person and friendly monster too, plus a dragon waiting beyond its guardian. Look for green FRIENDLY labels in the square and garden. Companions remain limited to two alongside Ember; choose them in Bag → Traveling friends.

Later roads use kingdom-themed settlement names, such as Brookhaven, Pinewatch, Alderford, and Mossgate. Each road saves separately. Walk west to return to the previous road, or select the latest visited road from Map. Reloading or dying places you safely in the current town; it does not discard earlier towns or friends. Original kingdoms retain their original map sizes and royal quests. Older one-off valley saves are upgraded to the larger wilderness, preserving recruited friends, opened chests, and defeated legacy enemies while adding the returning guardian and new encounters.

Run `node tests/frontier.browser.cjs` with the same Playwright setup to verify original-town friends, uninterrupted royal dialogue, large-map bounds, three successive guardian-to-town transitions, boss-gated progression, backward/forward revisits, reloads, and death recovery. Combat completion is simulated in progression tests.

## Town stories, friends, and discoveries

The October 11 expansion adds five layers, with the same movement, Action, and Dodge controls:

1. **Town landmarks and local quests.** Greenvale has Ada's Singing Oak, Frostmarch has Bryn's Aurora Beacon, Sunreach has Suri's Moonwater Fountain, and Ashenreach has Ivo's Ember Bell. Meet the keeper at the southeast edge of town, find the marked item on the northern trail, and return to restore the landmark. Each road records its own restoration. Rewards are granted once.
2. **Companion stories.** Use the town campfire or Adventures → Talk with traveling friends. Each active friend's role has its own dialogue and lost keepsake. Search the southern campsite with that friend, then return the keepsake in conversation. Completed quests stay attached to the individual friend through travel and party changes. Friends also react to towns and nearby danger automatically.
3. **Optional wilderness routes.** The northern Echo Cave contains a walk-in three-rune puzzle (Moon → Leaf → Flame). The southern ruined watchtower has a separate cache. Both are optional and retain completed or partial progress after saving.
4. **Evolving Hollow Guardians.** Road one retains its original attacks. From road two onward, alternating special attacks add a cross-shaped strike on even roads and a ring strike on odd roads. Each gives a 1.5-second visual warning and a recovery window. Move diagonally clear of the cross; stay inside or outside the ring. These moves deal one heart and use the existing dodge mechanic.
5. **Dragon discoveries.** Bring Ember or an active recruited dragon to a sealed sky arch to reveal the realm's hidden refuge and receive its one-time supplies. The arch changes appearance after discovery. These are optional discovery encounters, not additional full-size maps.

**Adventures** tracks local optional tasks. Royal quests, three-resource/five-foe gates, two selected companions, and the town → wilderness → guardian loop remain intact. Existing browser saves acquire the new optional state without being reset. The source module is `adventures.js`, included in every portable HTML build.

Validation: `node tests/adventures.browser.cjs` checks all four town restorations, reachable pickups/runes, duplicate reward prevention, companion errands, partial/completed saves, old-save compatibility, dragon gating, boss warning/hit/escape behavior, and real Space/menu interactions. The original simulation, kingdom, journey, and frontier suites also pass. Automated guardian progression uses simulated victories; human difficulty and fun still need playtesting.

## Illustrated graphics, individual names, and trail guidance

The illustrated fallback renderer uses shaded armor and character silhouettes, rounded textured foliage, masonry and tiled roofs, ground materials, softer path edges, and redesigned dragons, wolves, ogres, and slimes. Canvas backing resolution adapts up to 2× for sharper rendering on MacBook displays. This procedural layer remains available if the realistic artwork cannot load.

Later-road companions receive individual names instead of numeric suffixes. Existing internal IDs remain unchanged, preserving recruitment, the active party, and personal quests. The first 49 generated roads have unique names across all realms and roles; later names use deterministic family-name combinations.

Sunblossoms now look like flowers and have explicit labels. A trail guide below the game points toward the next royal objective, including remaining resources, gate readiness, returning for a seal, and onward travel. Adventures offers Royal quest, Local adventures, or Hide guide; the preference is saved. Guidance never changes objective requirements or grants progress.

`node tests/presentation.browser.cjs` checks name uniqueness and saved companion identity, guide milestones and preference persistence, rendering in every realm, and creature/boss drawing. All gameplay regression suites should be run alongside it.

## Realistic rendered artwork

The current browser edition loads locally bundled, AI-generated realistic sprite and terrain atlases: detailed steel armor, villagers and queen, ranger companions, wolves, copper dragons, slimes, a stone guardian, oak/pine/palm vegetation, volcanic rocks, timber cottages, a royal hall, well and ruined arches. Forest floor, cobbles, snow and sand use photographic-style textures. The village decorative windmill is replaced by a ruined stone arch. Trees are thinned along the borders to keep routes visible. Campfire lighting, full guardian attack warnings, and readable interaction markers remain.

This remains a 2D game with sprite movement, subtle bobbing and existing combat effects. It is not a 3D engine or a fully animated realistic character system. Some older enemies, small props, quest objects and landmark details still use the illustrated/procedural layer. No gameplay, collision, control or save format is changed.

`realistic.js` loads `assets/realistic-sprites.png` and `assets/realistic-terrain.png`; `tools/build.cjs` embeds both directly into each portable HTML file, so downloads also work offline. The two original atlases total about 6.4 MB; each self-contained HTML copy is consequently larger. Failed image loads fall back to the illustrated renderer.

`node tests/realistic.browser.cjs` checks decoded artwork, source bounds, transparency, offline loading without network requests, four kingdoms, companions, guardian telegraphs, unchanged save state, mobile layout, and the failed-art fallback. Gameplay regression suites and presentation/save migration checks accompany it. Screenshots are reviewed visually; device-specific MacBook performance and human playtesting remain separate checks.
