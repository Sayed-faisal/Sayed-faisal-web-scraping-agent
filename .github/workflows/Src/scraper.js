const { chromium } = require('playwright');
const cheerio = require('cheerio');

const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_MS || '1000', 10);
const USER_AGENT = process.env.SCRAPER_USER_AGENT || 'web-scraping-agent/1.0';

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Scrape a single URL.
 * options:
 *   - selector: optional CSS selector to extract (returns array of HTML snippets and text)
 */
async function scrape(url, options = {}) {
  // Simple rate-limiting between calls in the same process
  if (scrape._lastCall) {
    const since = Date.now() - scrape._lastCall;
    if (since < RATE_LIMIT_MS) {
      await delay(RATE_LIMIT_MS - since);
    }
  }
  scrape._lastCall = Date.now();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    // Add other context options here (locale, viewport, proxy, etc.)
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Optionally wait for network to be idle for JS-heavy apps
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (e) {
      // networkidle may timeout sometimes; ignore
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    if (options.selector) {
      const nodes = $(options.selector);
      const extracted = [];
      nodes.each((i, el) => {
        extracted.push({
          html: $(el).html(),
          text: $(el).text().trim()
        });
      });
      await browser.close();
      return { html, extracted, extractedText: extracted.map(e => e.text).join('\n\n') };
    } else {
      // Default: return page title and body text
      const title = $('title').text().trim();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      await browser.close();
      return { html, title, extractedText: bodyText };
    }
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = { scrape };