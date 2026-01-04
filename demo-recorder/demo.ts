/**
 * CalSync Demo - Automated Claude.ai Recording
 * 
 * SETUP:
 *   npm install
 *   npx playwright install chromium
 *   npm run setup     # Login to Claude.ai once
 *   npm run record    # Run automated demo
 */

import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const AUTH_STATE = './auth-state.json';
const RECORDINGS = './recordings';

const PROMPTS = [
  {
    text: "What's the roadmap for CalSync?",
    wait: 12000,
    note: "Setup - loads roadmap context"
  },
  {
    text: "Users are complaining that they forget about their scheduled meetings. We should add some kind of reminder system.",
    wait: 25000,
    note: "THE MAGIC - should create epic + issues, notice SMS TBD"
  },
  {
    text: "Let's go with Twilio - the team already knows it.",
    wait: 15000,
    note: "Decision - records the choice"
  },
  {
    text: "Show me what we created today.",
    wait: 18000,
    note: "Payoff - summary of artifacts"
  }
];

async function prompt(msg: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(msg, () => { rl.close(); r(); }));
}

async function typeNaturally(page: Page, text: string) {
  const input = page.locator('[contenteditable="true"]').first();
  await input.click();
  for (const char of text) {
    await input.pressSequentially(char, { delay: 40 + Math.random() * 60 });
  }
}

async function waitForResponse(page: Page, timeout: number) {
  // Wait for Claude to start responding
  try {
    await page.waitForSelector('[aria-label="Stop Response"], [data-testid="stop-button"]', { timeout: 8000 });
  } catch {}
  
  // Wait for response to complete
  try {
    await page.waitForSelector('[aria-label="Stop Response"], [data-testid="stop-button"]', { state: 'hidden', timeout });
  } catch {}
  
  await page.waitForTimeout(2000);
}

// SETUP: Save login state
async function setup() {
  console.log('🔐 Setup: Log into Claude.ai\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://claude.ai');
  
  console.log('👉 Log into Claude.ai in the browser');
  console.log('👉 Select your project with Decibel MCP connected');
  console.log('👉 Make sure CalSync is registered\n');
  
  await prompt('Press Enter when ready...');
  
  await context.storageState({ path: AUTH_STATE });
  console.log(`\n✅ Auth saved to ${AUTH_STATE}`);
  
  await browser.close();
}

// RECORD: Run automated demo
async function record() {
  if (!fs.existsSync(AUTH_STATE)) {
    console.log('❌ Run "npm run setup" first');
    process.exit(1);
  }
  
  fs.mkdirSync(RECORDINGS, { recursive: true });
  const videoDir = path.join(RECORDINGS, `calsync-${Date.now()}`);
  
  console.log('🎬 Starting automated recording...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const context = await browser.newContext({
    storageState: AUTH_STATE,
    recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://claude.ai');
    await page.waitForTimeout(3000);
    
    // Start new chat if needed
    const newChat = page.locator('[aria-label="New chat"], [data-testid="new-chat"]').first();
    if (await newChat.isVisible().catch(() => false)) {
      await newChat.click();
      await page.waitForTimeout(2000);
    }
    
    console.log('📝 Running demo prompts...\n');
    
    for (let i = 0; i < PROMPTS.length; i++) {
      const p = PROMPTS[i];
      console.log(`[${i + 1}/${PROMPTS.length}] ${p.note}`);
      console.log(`    "${p.text.slice(0, 50)}..."\n`);
      
      await typeNaturally(page, p.text);
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      
      console.log('    ⏳ Waiting for response...');
      await waitForResponse(page, p.wait);
      
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      
      console.log('    ✅ Done\n');
    }
    
    console.log('🎉 Demo complete! Recording 5 more seconds...');
    await page.waitForTimeout(5000);
    
  } finally {
    await context.close();
    await browser.close();
    
    const files = fs.readdirSync(videoDir);
    const video = files.find(f => f.endsWith('.webm'));
    if (video) {
      console.log(`\n✅ Recording saved: ${path.join(videoDir, video)}`);
    }
  }
}

// Main
const cmd = process.argv[2];
if (cmd === 'setup') setup();
else if (cmd === 'record') record();
else {
  console.log('Usage:');
  console.log('  npx ts-node demo.ts setup   # Login first');
  console.log('  npx ts-node demo.ts record  # Run demo');
}
