const sharp = require('sharp');
const cm2js = require('../../../cm2js.js');
const fetch = require('node-fetch');

const MAX_BLOCKS = 10000;
const blockSize = 1;

module.exports = async (req, res) => {
  const imageUrl = decodeURIComponent(req.url.split('/img/')[1] || '');

  if (!imageUrl || !imageUrl.startsWith('http')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid or missing image URL.');
    return;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Image fetch failed');
    const buffer = await response.buffer();

    const save = new cm2js.Save();
    let image = sharp(buffer);

    const metadata = await image.metadata();
    let { width, height } = metadata;

    let scale = 1;
    while ((width / scale) * (height / scale) > MAX_BLOCKS) {
      scale += 1;
    }

    const newWidth = Math.max(1, Math.floor(width / scale));
    const newHeight = Math.max(1, Math.floor(height / scale));
    image = image.resize(newWidth, newHeight);

    const { data: raw, info } = await image.raw().toBuffer({ resolveWithObject: true });

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = raw[idx];
        const g = raw[idx + 1];
        const b = raw[idx + 2];
        const a = raw[idx + 3];

        if (a === 0) continue;

        save.addBlock(new cm2js.Block(
          cm2js.BlockId.Tile,
          x * blockSize,
          (info.height - y) * blockSize - 1,
          0,
          false,
          [r, g, b, 2]
        ));
      }
    }

    const saveString = save.export();

    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    res.end(saveString);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Error: ${err.message}`);
  }
};
