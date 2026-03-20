import puppeteer from 'puppeteer';
import fs from 'fs';

const url = process.argv[2] || 'http://localhost:3000';
const outDir = './temporary screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Trigger all IntersectionObservers by scrolling to bottom
const pageH = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(y => window.scrollTo(0, y), pageH);
await new Promise(r => setTimeout(r, 800));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));

// Get Y offsets for each section
const sections = await page.evaluate(() => {
  const ids = ['services','plans','commercial','faq','quote'];
  return ids.map(id => {
    const el = document.getElementById(id);
    return { id, y: el ? el.getBoundingClientRect().top + window.scrollY : -1 };
  });
});

console.log('Section positions:', sections);

// Screenshot each section
for (const { id, y } of sections) {
  if (y < 0) continue;
  const scrollTo = Math.max(0, y - 80); // 80px above section start
  await page.evaluate(s => window.scrollTo(0, s), scrollTo);
  await new Promise(r => setTimeout(r, 400));
  const filename = `${outDir}/v2-${id}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`Saved: ${filename}`);
}

// Hero — use instant jump, not smooth scroll
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: `${outDir}/v2-hero.png`, fullPage: false });
console.log('Saved: v2-hero.png');

await page.evaluate(y => window.scrollTo(0, y), pageH);
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${outDir}/v2-footer.png`, fullPage: false });
console.log('Saved: v2-footer.png');

await browser.close();
