// Build a portable, offline copy. Source files remain easy to edit separately.
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const source = read("knight_adventure_v2.html");
const output = source
  .replace(
    '<link rel="stylesheet" href="style.css" />',
    () => "<style>\n" + read("style.css") + "\n</style>",
  )
  .replace(
    '<script src="game.js"></script>',
    () => "<script>\n" + read("game.js") + "\n</script>",
  );
const kingdoms = output.replace(
  '<script src="world.js"></script>',
  () => "<script>\n" + read("world.js") + "\n</script>",
);
const roads = kingdoms.replace(
  '<script src="journeys.js"></script>',
  () => "<script>\n" + read("journeys.js") + "\n</script>",
);
const frontier = roads.replace(
  '<script src="frontier.js"></script>',
  () => "<script>\n" + read("frontier.js") + "\n</script>",
);
const adventures = frontier.replace(
  '<script src="adventures.js"></script>',
  () => "<script>\n" + read("adventures.js") + "\n</script>",
);
const illustrated = adventures.replace('<script src="art.js"></script>', () => "<script>\n" + read("art.js") + "\n</script>");
let realistic = read("realistic.js");
for (const file of ["realistic-sprites.png", "realistic-terrain.png", "ada-dragonborn.png"]) {
  const asset = "assets/" + file;
  realistic = realistic.replace(asset, "data:image/png;base64," + fs.readFileSync(path.join(root, asset)).toString("base64"));
}
const rendered = illustrated.replace('<script src="realistic.js"></script>', () => "<script>\n" + realistic + "\n</script>");
let people = read("people.js");
for (const file of ["people.png", "knight-walk.png"]) {
  const asset = "assets/" + file;
  people = people.replace(asset, "data:image/png;base64," + fs.readFileSync(path.join(root, asset)).toString("base64"));
}
const bundled = rendered.replace('<script src="people.js"></script>', () => "<script>\n" + people + "\n</script>");
if (
  bundled.includes('src="people.js"') ||
  bundled.includes('src="realistic.js"') ||
  bundled.includes('src="art.js"') ||
  bundled.includes('src="adventures.js"') ||
  output === source ||
  output.includes('src="game.js"') ||
  bundled.includes('src="world.js"') ||
  bundled.includes('src="journeys.js"') ||
  bundled.includes('src="frontier.js"') ||
  output.includes('href="style.css"')
)
  throw new Error("Source tags changed: update the bundler.");
fs.writeFileSync(path.join(root, "play.html"), bundled);
fs.writeFileSync(
  path.join(root, "Knights_Adventure_Four_Kingdoms.html"),
  bundled,
);
console.log("Built play.html — open this file directly in your browser.");

fs.writeFileSync(
  path.join(root, "Knights_Adventure_Dragon_Roads.html"),
  bundled,
);

fs.writeFileSync(
  path.join(root, "Knights_Adventure_Endless_Wilderness.html"),
  bundled,
);
