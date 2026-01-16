# 🖥️ Deployment Guide - Setup on Printer-Connected Laptop

## Prerequisites

The laptop where the printer is connected needs:
- **Windows OS** (since we're using Windows print commands)
- **Node.js** installed (v18 or higher)
- **Canon iR 7105** printer connected and working
- **Stable internet** for WhatsApp connection

---

## Step 1: Copy Project Files

### Option A: Using Git (Recommended)
```bash
# On the new laptop
git clone <your-repository-url>
cd WhatsappAutomationForPrinting/mvp
```

### Option B: Manual Copy
1. Copy the entire `mvp` folder to the new laptop
2. Place it in a convenient location (e.g., `C:\WhatsappPrintBot\mvp`)

---

## Step 2: Install Node.js

If Node.js is not installed:

1. Download from: https://nodejs.org/
2. Install LTS version (v18 or higher)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

---

## Step 3: Install Dependencies

Open Command Prompt or PowerShell in the `mvp` folder:

```bash
cd path\to\mvp
npm install
```

This will install all required packages.

---

## Step 4: Configure for Local Printer

Open `src/config.ts` and update:

```typescript
export const CONFIG = {
  // Update paths for new laptop
  DOWNLOAD_PATH: 'C:/WhatsappPrintBot/mvp/downloads',
  PROCESSED_PATH: 'C:/WhatsappPrintBot/mvp/processed',
  AUTH_PATH: 'C:/WhatsappPrintBot/mvp/auth',
  
  JOB_RETENTION_HOURS: 24,
  PRICE_PER_PAGE: 0.50,
  
  // IMPORTANT: Update with your exact printer name
  PRINTER_NAME: 'Canon iR 7105',  // ← Check Windows printer name
  MAILBOX_NAME: 'YourMailbox',
};
```

### Finding Your Printer Name

**Method 1: Windows Settings**
1. Open **Settings** → **Devices** → **Printers & scanners**
2. Find your Canon printer
3. Copy the exact name as shown

**Method 2: PowerShell**
```powershell
Get-Printer | Select-Object Name
```

**Method 3: Control Panel**
1. Open **Control Panel** → **Devices and Printers**
2. Right-click your printer → **Printer properties**
3. Copy the name from the title bar

---

## Step 5: Build the Project

```bash
npm run build
```

You should see: `✔ Compiled successfully`

---

## Step 6: First Run

```bash
npm run dev
```

You'll see:
```
🚀 Starting WhatsApp Print Bot MVP...
🔗 Scan this QR code with WhatsApp:
```

**IMPORTANT**: 
- The QR code is unique to this laptop
- You need to scan it to link WhatsApp to this device
- If you were using WhatsApp Web on this laptop before, it will be logged out

---

## Step 7: Link WhatsApp

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code from terminal

Wait for: `✅ WhatsApp connected!`

---

## Step 8: Test Print

Send a test PDF from another phone to verify:
1. PDF downloads ✅
2. Page counting works ✅
3. Print job goes to printer ✅

---

## 🔄 Moving from Development Laptop to Printer Laptop

If you were testing on a different laptop first:

### What Transfers:
- ✅ Source code (`src/` folder)
- ✅ Configuration (`package.json`, `tsconfig.json`)
- ✅ Scripts and docs

### What DOESN'T Transfer:
- ❌ `auth/` folder (WhatsApp session - must re-authenticate)
- ❌ `downloads/` (old PDFs - not needed)
- ❌ `processed/` (old processed files)
- ❌ `node_modules/` (reinstall with `npm install`)

### Migration Steps:
1. Copy only the `src/` folder and config files to new laptop
2. Run `npm install` on new laptop
3. Update paths in `config.ts` for new laptop
4. Scan QR code to link WhatsApp on new laptop
5. Test with a sample PDF

---

## 🚀 Running in Production

### Option 1: Keep Terminal Open (Simple)
```bash
npm run dev
```
Keep the terminal window open. Bot runs as long as terminal is open.

### Option 2: Run as Background Service (Recommended)

**Install PM2:**
```bash
npm install -g pm2
```

**Start bot:**
```bash
npm run build
pm2 start dist/index.js --name whatsapp-print-bot
```

**Useful PM2 commands:**
```bash
pm2 list                    # See running processes
pm2 logs whatsapp-print-bot # View logs
pm2 stop whatsapp-print-bot # Stop bot
pm2 restart whatsapp-print-bot # Restart bot
pm2 startup                 # Auto-start on system boot
```

### Option 3: Windows Task Scheduler (Auto-start on boot)

1. Open **Task Scheduler**
2. Create Basic Task
3. Name: "WhatsApp Print Bot"
4. Trigger: "When computer starts"
5. Action: "Start a program"
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\WhatsappPrintBot\mvp\dist\index.js`
8. Start in: `C:\WhatsappPrintBot\mvp`

---

## 🔧 Troubleshooting

### "Printer not found"
- Verify printer is turned on and connected
- Test manual print from any application
- Update `PRINTER_NAME` in `config.ts` to exact name
- Use PowerShell command: `Get-Printer | Select-Object Name`

### WhatsApp keeps disconnecting
- Check internet connection
- Phone and laptop must be on internet
- WhatsApp can be linked to up to 4 devices

### Files not printing
- Check Windows Print Spooler service is running:
  ```powershell
  Get-Service -Name Spooler
  ```
- If stopped, start it:
  ```powershell
  Start-Service -Name Spooler
  ```

---

## 📂 Folder Structure on New Laptop

```
C:\WhatsappPrintBot\
└── mvp\
    ├── src\              # Source code
    ├── dist\             # Compiled JavaScript
    ├── downloads\        # User PDFs (auto-created)
    ├── processed\        # Processed PDFs (auto-created)
    ├── auth\             # WhatsApp session (auto-created)
    ├── node_modules\     # Dependencies
    ├── package.json
    └── tsconfig.json
```

---

## 🔐 Security Notes

- **WhatsApp session** is stored in `auth/` folder
- Keep this folder secure (contains authentication keys)
- Don't share `auth/` folder with others
- If compromised, delete `auth/` and re-scan QR code

---

## ✅ Checklist

Before going live:
- [ ] Node.js installed
- [ ] Project copied and `npm install` done
- [ ] Printer name verified in `config.ts`
- [ ] Paths updated in `config.ts`
- [ ] Project built successfully (`npm run build`)
- [ ] WhatsApp linked (QR scanned)
- [ ] Test PDF sent and received
- [ ] Test print job successful
- [ ] Bot set to auto-start (PM2 or Task Scheduler)

---

## 📞 Daily Operations

### Starting the bot
```bash
npm run dev
# or if using PM2:
pm2 start whatsapp-print-bot
```

### Viewing logs
```bash
# Terminal shows live logs
# or with PM2:
pm2 logs whatsapp-print-bot
```

### Stopping the bot
```bash
# Ctrl+C in terminal
# or with PM2:
pm2 stop whatsapp-print-bot
```

---

You're ready to deploy! 🎉
