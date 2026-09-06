# Knight’s Adventure: Ember & the Hollow Crown

A small knight, an oversized sword, and a baby dragon worth fighting for. An original, dependency-free browser adventure built for Reed’s first game.

## Play

**Quickest option:** download `play.html` and open it in your browser. It contains the entire game and works offline.

Open `knight_adventure_v2.html` in a modern browser with `style.css` and `game.js` beside it. No install or build is required. For a local web server:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080/knight_adventure_v2.html`.

| Action                           | Keyboard                     |
| -------------------------------- | ---------------------------- |
| Move                             | WASD or arrow keys           |
| Sword                            | J (hold for repeated swings) |
| Dodge roll                       | K or Space                   |
| Shield / deflect arrows          | Hold L                       |
| Open chest / use gate / interact | E                            |
| Pause                            | Escape or the pause button   |

Touch devices have directional and action buttons. Sound is optional: enable it with the Sound button. Losing window focus pauses the adventure automatically.

## The adventure

- **The Whispering Wood:** fight leaping slimes, find the sun key, and unlock the eastern gate. Search the southern clearing for Firebrand.
- **The Fallen Courtyard:** flank or parry shielded skeletons and reflect archers’ arrows. Discover Mirror Shield, Ghoststep, and an overgrown passage connecting two clearings. Light the eastern beacon to enter the keep.
- **The Hollow Keep:** defeat the armored guardian. Leave the glowing slam circle, then attack while the guardian is exposed. Its armor breaks and attacks accelerate below half health.
- **Ember:** free the baby dragon after the guardian falls. Continue exploring with a companion that reveals nearby unopened chests and attacks surviving enemies with fire.

Relics change combat: Firebrand adds damage and burning; Mirror Shield makes reflected arrows ricochet to other enemies; Ghoststep lets rolls pass through enemies. A shield raised just before a frontal melee hit performs a perfect parry and stuns the attacker.

Gates, opened chests, relics, and the rescue are saved in browser local storage when available. Death returns to the latest checkpoint with full health. Ordinary enemies beyond the checkpoint respawn, and an unfinished guardian fight restarts. Saves belong to the current browser/origin; a new adventure becomes the saved adventure at its first save. The game remains playable when browser storage is disabled.

## Implementation

`game.js` owns simulation, input, procedural pixel artwork, Web Audio effects, and checkpoint persistence. `style.css` provides the responsive game frame, HUD, menus, and touch controls. There are no remote assets, telemetry, or runtime dependencies. Reduced-motion preferences disable screen shake. The game is a complete first adventure across three connected regions, not twelve placeholder levels.

## Verify gameplay

Run `node tests/game.test.cjs`. The dependency-free simulation checks movement normalization, locked gates, relic and secret-passage interactions, skeleton blocking and parries, dodge invulnerability, arrow reflection and ricochets, boss progression, rescue persistence, and companion combat. Browser rendering and touch interaction also need a real-browser check after UI changes.

To regenerate the portable `play.html` after editing the source, run `node tools/build.cjs`. Commit it with the matching source changes.
