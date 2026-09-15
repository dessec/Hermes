import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (Truecolor / RGB)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data: height scanlines, each starting with filter byte 0
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.42;
  const innerR = width * 0.16;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background slate #0f172a
      let pr = 15, pg = 23, pb = 42;

      // Outer ring
      if (Math.abs(dist - outerR) < width * 0.03) {
        pr = 51; pg = 65; pb = 85;
      }
      // Inner circle cyan / emerald
      else if (dist < innerR) {
        pr = 16; pg = 185; pb = 129; // emerald #10b981
      }
      // Indicator claw arms
      else if (dist < outerR * 0.85 && (Math.abs(dx) < width * 0.08 || Math.abs(dy) < width * 0.08)) {
        pr = 56; pg = 189; pb = 248; // sky-400
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 15, 23, 42));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 15, 23, 42));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, 15, 23, 42));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 15, 23, 42));
console.log('Successfully generated PWA icon PNGs!');
