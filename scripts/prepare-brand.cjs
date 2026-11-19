const fs = require("node:fs");
const path = require("node:path");
const runtimeModules = path.resolve(
  path.dirname(process.execPath),
  "../node_modules",
);
const sharp = require(
  require.resolve("sharp", { paths: [process.cwd(), runtimeModules] }),
);

(async () => {
  fs.mkdirSync("public/brand", { recursive: true });
  await sharp("maney logo novo.png")
    .png()
    .toFile("public/brand/maney-logo.png");
  await sharp("favicon.png")
    .trim()
    .resize(128, 128, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile("public/brand/maney-icon.png");
  for (const [size, file] of [
    [256, "src/app/icon.png"],
    [180, "src/app/apple-icon.png"],
  ]) {
    await sharp("favicon.png")
      .trim()
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(file);
  }
  const png = await sharp("favicon.png")
    .trim()
    .resize(32, 32, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 32;
  header[7] = 32;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, png]));
  fs.writeFileSync(
    "public/brand/provenance.json",
    JSON.stringify(
      {
        source: "User-supplied updated artwork in the project root",
        files: {
          "maney-logo.png":
            "../../maney logo novo.png; unchanged artwork, optimized PNG encoding",
          "maney-icon.png":
            "../../favicon.png; transparent outer padding trimmed and resized to128px",
          "../../src/app/icon.png":
            "favicon.png; transparent outer padding trimmed and resized to256px",
          "../../src/app/apple-icon.png":
            "favicon.png; transparent outer padding trimmed and resized to180px",
          "../../src/app/favicon.ico":
            "favicon.png; trimmed and resized to32px, RGBA PNG in ICO container",
        },
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Applied user-provided maney artwork and generated square application icons.",
  );
})();
