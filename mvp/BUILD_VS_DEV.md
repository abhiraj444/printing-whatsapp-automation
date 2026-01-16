# 📋 Build vs Dev - Quick Guide

## Two Ways to Run the Bot

### Option 1: Development Mode (Recommended for Testing)
```bash
npm run dev
```

**What it does:**
- Runs TypeScript directly using `ts-node`
- No build needed
- Instant code changes (restart to apply)
- **Use this for testing and development**

**Files used:**
- `src/*.ts` (TypeScript source files)

---

### Option 2: Production Mode
```bash
npm run build  # First, compile TypeScript
npm start      # Then, run compiled code
```

**What it does:**
- `npm run build` → Compiles TypeScript to JavaScript in `dist/` folder
- `npm start` → Runs the compiled JavaScript from `dist/`
- Faster startup
- **Use this for deployment on printer laptop**

**Files created:**
- `dist/index.js`
- `dist/bot.js`
- `dist/workflow.js`
- etc.

---

## Which Should You Use?

### During Development (Now):
```bash
npm run dev  ✅
```
- Quick testing
- See changes by restarting
- No build step needed

### On Printer Laptop (Later):
```bash
npm run build
npm start
```
OR use PM2:
```bash
pm2 start dist/index.js --name whatsapp-print-bot
```

---

## Do You Need Both?

**NO!** You only need ONE at a time:

- **Testing**: `npm run dev` (no build needed)
- **Production**: Build once, then `npm start`

---

## File Locations

### Development Mode:
```
src/
├── index.ts      ← Running from here
├── bot.ts
└── workflow.ts
```

### Production Mode:
```
dist/
├── index.js      ← Running from here (compiled)
├── bot.js
└── workflow.js
```

---

## Summary

✅ **Use `npm run dev`** for now (testing)  
✅ **Use `npm run build` + `npm start`** for deployment  
❌ **Don't run both** at the same time  
