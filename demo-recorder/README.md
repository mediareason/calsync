# CalSync Demo Recorder

Automated Playwright recording of Claude.ai demo session.

## Quick Start

```bash
cd demo-recorder

# 1. Install dependencies
npm install
npm run install-browser

# 2. Login to Claude.ai (one time)
npm run setup
# → Browser opens, log in, select your Decibel MCP project
# → Press Enter in terminal when ready

# 3. Record the demo
npm run record
# → Automated typing + recording
# → Video saved to ./recordings/
```

## What It Does

1. Opens Claude.ai with your saved session
2. Types these prompts naturally (with realistic delays):
   - "What's the roadmap for CalSync?"
   - "Users are complaining..." (the magic prompt)
   - "Let's go with Twilio..."
   - "Show me what we created"
3. Saves video to `./recordings/calsync-{timestamp}/`

## Prerequisites

- Node.js 18+
- CalSync cloned and registered with Decibel MCP
- Claude.ai project with MCP tools enabled

## Output

Videos are saved as `.webm` files. Convert to MP4 if needed:

```bash
ffmpeg -i recording.webm -c:v libx264 recording.mp4
```

## Customizing

Edit `demo.ts` to change:
- `PROMPTS` array - the demo script
- `wait` times - how long to wait for each response
- Recording resolution (default: 1920x1080)
