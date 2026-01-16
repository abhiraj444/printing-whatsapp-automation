# WhatsApp Print Bot MVP

Automated WhatsApp bot for print shop with selective file printing.

## Features

- ✅ Auto-download PDFs from WhatsApp
- ✅ 24-hour file retention
- ✅ Numbered file list with page counts  
- ✅ Selective file printing (SKIP feature)
- ✅ Automatic pricing (₹0.50/page)
- ✅ Print to Canon mailbox
- ✅ Multiple concurrent users supported

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Printer

Edit `src/config.ts`:
- Update `PRINTER_NAME` with your actual Canon printer name  
- Update `MAILBOX_NAME` if using mailbox feature

### 3. Run the Bot

Development mode:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 4. First Time Setup

1. Run the bot
2. Scan QR code with WhatsApp
3. Send a test PDF

## Usage

### For Customers

1. Send one or more PDFs to the bot
2. Send any message when done
3. Bot shows numbered list of files
4. Reply:
   - `YES` - Print all files
   - `SKIP` - Remove some files first
5. If SKIP, reply with numbers: `1,3` or `2`
6. Confirm with `YES`

### Example Conversation

```
[User sends 3 PDFs]

User: "hi"

Bot: "📄 You have 3 PDFs ready to print:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ report.pdf (12 pages)
     3️⃣ contract.pdf (8 pages)
     
     📊 Total: 25 pages
     💰 Cost: ₹12.50
     
     Reply:
     • YES - Print all files
     • SKIP - Remove some files first"

User: "SKIP"

Bot: "Which files to skip? Reply with numbers (comma-separated)
     Example: 1,3 or just 2"

User: "2"

Bot: "✅ Removed:
      ❌ report.pdf
     
     📄 Printing these files:
     1️⃣ invoice.pdf (5 pages)
     2️⃣ contract.pdf (8 pages)
     
     📊 Total: 13 pages
     💰 Cost: ₹6.50
     
     Confirm? Reply YES"

User: "YES"

Bot: "✅ Print job sent to mailbox!
     📄 Files: 2
     📊 Total Pages: 13
     💰 Total Cost: ₹6.50
     🖨️ Files in mailbox: 919876543210"
```

## Folder Structure

```
mvp/
├── src/
│   ├── index.ts         # Entry point
│   ├── bot.ts           # WhatsApp connection
│   ├── workflow.ts      # User interaction logic
│   ├── job-manager.ts   # Job state management
│   ├── pdf-processor.ts # PDF operations
│   ├── printer.ts       # Printer integration
│   ├── messages.ts      # Message templates
│   ├── config.ts        # Configuration
│   ├── types.ts         # TypeScript types
│   └── logger.ts        # Logging
├── downloads/           # User PDFs
├── processed/           # Renamed PDFs for printer
├── auth/                # WhatsApp auth session
└── package.json
```

## Configuration

### Pricing

Edit in `src/config.ts`:
```typescript
PRICE_PER_PAGE: 0.50  // ₹0.50 per page
```

### File Retention

```typescript
JOB_RETENTION_HOURS: 24  // 24 hours
```

## Troubleshooting

### Bot not connecting
- Delete `auth/` folder and scan QR code again
- Check internet connection

### PDFs not downloading
- Check write permissions for `downloads/` folder
- Verify WhatsApp is connected

### Printer not working
- Verify printer name in `config.ts`
- Test manual print to ensure printer is accessible
- Check Windows print spooler service

## Next Steps

After MVP validation:
- Add payment verification (UPI)
- Add 2-on-1 and 4-on-1 layouts
- Add automatic mailbox printing
- Add admin dashboard

## License

ISC
