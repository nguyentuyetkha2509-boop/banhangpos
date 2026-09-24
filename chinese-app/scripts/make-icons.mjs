import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { createRequire } from 'node:module'

// Tao icon PNG don gian (hinh vuong bo, nen do thuong hieu, chu "中" mau vang o giua)
// bang cach ve tay tung pixel - khong can thu vien ngoai.

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// Mau chu "中" ve tho bang luoi 16x16 (1 = to mau, 0 = nen)
const GLYPH = [
  '0000000000000000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0001111111111000',
  '0001111111111000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000011111100000',
  '0000000000000000'
]

function makeIcon(size) {
  const bg = [0xb9, 0x1c, 0x1c] // brand-700
  const fg = [0xfb, 0xbf, 0x24] // gold-400
  const glyphSize = GLYPH.length
  const scale = Math.floor((size * 0.6) / glyphSize)
  const glyphPixelSize = scale * glyphSize
  const offset = Math.floor((size - glyphPixelSize) / 2)

  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      let r = bg[0]
      let g = bg[1]
      let b = bg[2]
      const gx = x - offset
      const gy = y - offset
      if (gx >= 0 && gy >= 0 && gx < glyphPixelSize && gy < glyphPixelSize) {
        const cellX = Math.floor(gx / scale)
        const cellY = Math.floor(gy / scale)
        if (GLYPH[cellY][cellX] === '1') {
          r = fg[0]
          g = fg[1]
          b = fg[2]
        }
      }
      const px = rowStart + 1 + x * 4
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
      raw[px + 3] = 255
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const idat = deflateSync(raw)
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
  return png
}

writeFileSync(new URL('../public/icon-192.png', import.meta.url), makeIcon(192))
writeFileSync(new URL('../public/icon-512.png', import.meta.url), makeIcon(512))
console.log('Da tao icon-192.png va icon-512.png')
