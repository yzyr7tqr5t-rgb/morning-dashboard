import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'

// App icon SVG — rounded square with blue gradient + sun
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f8ef7"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <!-- Sun icon centered -->
  <g transform="translate(256,256)" stroke="white" stroke-width="22" stroke-linecap="round" fill="none">
    <circle cx="0" cy="0" r="72" fill="white" stroke="none"/>
    <line x1="0" y1="-118" x2="0" y2="-96"/>
    <line x1="0" y1="96" x2="0" y2="118"/>
    <line x1="-118" y1="0" x2="-96" y2="0"/>
    <line x1="96" y1="0" x2="118" y2="0"/>
    <line x1="-83" y1="-83" x2="-67" y2="-67"/>
    <line x1="67" y1="67" x2="83" y2="83"/>
    <line x1="83" y1="-83" x2="67" y2="-67"/>
    <line x1="-67" y1="67" x2="-83" y2="83"/>
  </g>
</svg>`

const buf = Buffer.from(svg)

mkdirSync('public/icons', { recursive: true })

const sizes = [
  { size: 192, name: 'pwa-192.png' },
  { size: 512, name: 'pwa-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

for (const { size, name } of sizes) {
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(`public/icons/${name}`)
  console.log(`✓ ${name}`)
}
