const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const dotenv = require('dotenv');
const { scrape } = require('./scraper');
const { summarizeWithLLM } = require('./llm');

dotenv.config();

async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <url> [options]')
    .demandCommand(1, 'A target URL is required')
    .option('selector', {
      alias: 's',
      type: 'string',
      description: 'CSS selector to extract (defaults to whole body text)'
    })
    .option('out', {
      alias: 'o',
      type: 'string',
      description: 'Output filename (JSON)',
      default: ''
    })
    .option('summarize', {
      alias: 'm',
      type: 'boolean',
      description: 'Run optional LLM summarization (requires OPENAI_API_KEY)',
      default: false
    })
    .help().argv;

  const url = argv._[0];
  const selector = argv.selector || null;
  const outFile = argv.out || null;
  const shouldSummarize = argv.summarize;

  console.log(`Scraping: ${url}`);
  try {
    const result = await scrape(url, { selector });
    let summary = null;
    if (shouldSummarize) {
      console.log('Summarizing content with LLM (if API key provided)...');
      try {
        summary = await summarizeWithLLM(result.extractedText || result.html || '');
      } catch (err) {
        console.warn('LLM summarization failed or not configured:', err.message);
      }
    }

    const payload = {
      url,
      timestamp: new Date().toISOString(),
      selector,
      data: result,
      summary
    };

    const outputDir = process.env.OUTPUT_DIR || './data';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = outFile
      ? path.join(outputDir, outFile)
      : path.join(outputDir, `${sanitizeFilename(url)}-${Date.now()}.json`);

    fs.writeFileSync(filename, JSON.stringify(payload, null, 2), 'utf8');
    console.log('Saved result to', filename);
  } catch (err) {
    console.error('Scraping failed:', err);
    process.exitCode = 1;
  }
}

function sanitizeFilename(url) {
  return url.replace(/[^a-z0-9.-]/gi, '_').slice(0, 200);
}

main();