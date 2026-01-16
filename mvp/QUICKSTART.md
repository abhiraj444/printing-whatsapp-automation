# 🚀 Quick Start Guide - WhatsApp Print Bot MVP

## ⚡ First Time Setup (5 minutes)

### Step 1: Update Printer Configuration

Open `src/config.ts` and update these lines:

```typescript
PRINTER_NAME: 'Canon iR 7105', // ← Change to your actual printer name
MAILBOX_NAME: 'YourMailbox',    // ← Change to your mailbox name (if using)
```

**How to find your printer name:**
- Windows: Open Settings → Devices → Printers & Scanners
- Copy the exact printer name as shown

---

### Step 2: Start the Bot

```bash
npm run dev
```

You'll see:
```
🚀 Starting WhatsApp Print Bot MVP...
🔗 Scan this QR code with WhatsApp:
█▀▀▀▀▀█ ▀▀█  ▄ █▀▀▀▀▀█
  (QR code appears here)
```

---

### Step 3: Connect WhatsApp

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code from terminal

Wait for: `✅ WhatsApp connected!`

---

### Step 4: Test with Your Phone

Send a test PDF to the bot's WhatsApp number.

---

## 💬 Example Conversation

**Test Flow 1: Print All Files**

```
You: [Send invoice.pdf]
Bot: 📄 Received: invoice.pdf

You: [Send report.pdf] 
Bot: 📄 Received: report.pdf

You: "hi" (any message to trigger)

Bot: 📄 You have 2 PDFs ready to print:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ report.pdf (12 pages)
     
     📊 Total: 17 pages
     💰 Cost: ₹8.50
     
     Reply:
     • YES - Print all files
     • SKIP - Remove some files first

You: "YES"

Bot: 🖨️ Processing your print job... please wait.

Bot: ✅ Print job sent to mailbox!
     📄 Files: 2
     📊 Total Pages: 17
     💰 Total Cost: ₹8.50
     🖨️ Files in mailbox: 919876543210
     📍 Collect from shop & pay ₹8.50
     Thank you! 🙏
```

---

**Test Flow 2: Skip Files**

```
You: [Send 3 PDFs]
You: "ready"

Bot: [Shows list of 3 files]

You: "SKIP"

Bot: Which files to skip? Reply with numbers (comma-separated)
     Example: 1,3 or just 2

You: "2"

Bot: ✅ Removed:
      ❌ report.pdf
     
     📄 Printing these files:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ contract.pdf (8 pages)
     
     📊 Total: 13 pages
     💰 Cost: ₹6.50
     
     Confirm? Reply YES

You: "YES"

Bot: [Processes remaining files]
```

---

## 🔧 Where Files Are Saved

```
mvp/
├── downloads/919876543210/   ← Original PDFs from user
│   ├── invoice.pdf
│   └── report.pdf
│
└── processed/919876543210/   ← Renamed PDFs sent to printer
    ├── 919876543210_invoice.pdf
    └── 919876543210_report.pdf
```

---

## ✅ What to Check After First Test

1. **Files Downloaded?**
   - Check `mvp/downloads/{phone}/` folder

2. **Pages Counted Correctly?**
   - Bot should show correct page counts

3. **Printer Received Files?**
   - Check your Canon mailbox or print queue
   - Files should be named: `{phone}_{filename}.pdf`

4. **Price Calculated?**
   - Should be ₹0.50 × total pages

---

## 🐛 Troubleshooting

### QR Code Not Appearing
```bash
# Delete auth folder and restart
rm -rf auth
npm run dev
```

### "Printer not found" Error
- Update `PRINTER_NAME` in `src/config.ts` to exact printer name
- Test manual print first to ensure printer is accessible

### PDFs Not Downloading
- Check internet connection
- Ensure WhatsApp is connected (green checkmark in phone)

### Bot Not Responding to Messages
- Check terminal for errors
- Ensure you're messaging the connected WhatsApp number

---

## 📝 Configuration Options

### Change Pricing
Edit `src/config.ts`:
```typescript
PRICE_PER_PAGE: 1.00  // ₹1 per page instead of ₹0.50
```

### Change File Retention Period
```typescript
JOB_RETENTION_HOURS: 48  // Keep files for 48 hours instead of 24
```

---

## 🎯 Next Steps After MVP Validation

Once you've tested and confirmed the MVP works:

1. **Run for a few days** with real customers
2. **Gather feedback** on:
   - Is the conversation flow clear?
   - Do customers understand the SKIP feature?
   - Are page counts accurate?
   - Is pricing correct?

3. **Add enhancements**:
   - 2-on-1, 4-on-1 layouts
   - Payment verification
   - Auto-print from mailbox
   - Admin dashboard

Refer to `implementation_plan.md` for the full system roadmap.

---

## 🚨 Important Notes

- **No payment verification** in MVP - collect payment manually
- **Manual printing** from mailbox - you trigger final print
- **24-hour limit** - files auto-delete after 24 hours
- **One job per user** - users can't send new files while job processing

---

## 📞 Support

If you encounter issues:
1. Check terminal logs for error messages
2. Check `test_cases.md` for known scenarios  
3. Refer to `README.md` for detailed documentation

**Ready to go live!** 🎉
