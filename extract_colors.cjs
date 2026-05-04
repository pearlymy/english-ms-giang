const vibrantMod = require('node-vibrant/node');
const Vibrant = vibrantMod.default || vibrantMod.Vibrant || vibrantMod;
const path = require('path');
const fs = require('fs');

const imageNames = ['244.png', '256.png', '147.png', '190.png', '166.png', '296.png', '309.png'];
const dir = path.join(__dirname, '00. Main', '01-design', 'ui-reference');

async function extract() {
  for (const name of imageNames) {
    const fullPath = path.join(dir, name);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    try {
      const palette = await Vibrant.from(fullPath).getPalette();
      console.log(`\n=== Colors for ${name} ===`);
      for (const [swatchName, swatch] of Object.entries(palette)) {
        if (swatch) {
          console.log(`${swatchName}: ${swatch.hex}`);
        }
      }
    } catch(e) {
      console.error(`Error on ${name}:`, e.message);
    }
  }
}

extract();
