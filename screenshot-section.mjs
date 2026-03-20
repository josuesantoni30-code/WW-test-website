import puppeteer from 'puppeteer';
import fs from 'fs';

const url = process.argv[2] || 'http://localhost:3000';
const scrollY = parseInt(process.argv[3] || '0');
const label = process.argv[4] || 'section';
const outDir = './temporary screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let n = 1;
while (fs.existsSync(`${outDir}/section-${n}-${label}.png`)) n++;
const filename = `${outDir}/section-${n}-${label}.png`;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
// Scroll to bottom to trigger all IntersectionObservers, then go to target
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(y => window.scrollTo(0, y), pageHeight);
await new Promise(r => setTimeout(r, 600));
await page.evaluate(y => window.scrollTo(0, y), scrollY);
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: filename, fullPage: false });
await browser.close();
console.log(`Saved: ${filename}`);
