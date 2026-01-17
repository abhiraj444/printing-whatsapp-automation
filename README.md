# WhatsApp Bot with Baileys

A simple WhatsApp automation bot that can receive messages, download PDF files, and reply with the filename.

## Features

- ✅ Responds to text messages
- 📄 Downloads PDF files sent to the bot
- 💬 Replies with the PDF filename and file details
- 🔄 Auto-reconnects if connection is lost
- 📱 QR code authentication

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. If you're getting connection errors, clean the auth data first:
```bash
npm run clean
```

## Usage

1. Start the bot:
```bash
npm start
```

2. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed in your terminal

3. Once connected, the bot is ready to use!

## Testing

### Test 1: Send a text message
Send any text message to the bot. It will reply confirming it received your message.

### Test 2: Send a PDF file
1. Send a PDF file to the bot
2. The bot will:
   - Download the PDF to the `downloads/` folder
   - Reply with the filename, size, and saved location

## File Structure

```
.
├── whatsapp-bot.js          # Main bot script
├── package.json             # Dependencies
├── auth_info_baileys/       # Authentication data (created automatically)
└── downloads/               # Downloaded PDFs (created automatically)
```

## How It Works

1. **Authentication**: On first run, a QR code is displayed. Scan it with WhatsApp to authenticate.

2. **Message Handling**: The bot listens for incoming messages and processes them based on type:
   - Text messages: Sends acknowledgment
   - PDF documents: Downloads and replies with filename
   - Other media: Notifies user it only handles PDFs

3. **Persistence**: Authentication is saved in `auth_info_baileys/` folder, so you won't need to scan QR code every time.

## Notes

- The bot ignores messages sent by itself
- Downloaded PDFs are saved in the `downloads/` folder
- Connection automatically reconnects if lost (unless logged out)
- Authentication data is stored locally in `auth_info_baileys/`

## Troubleshooting

**Getting "Connection Failure" or 405 error?**
This usually means there's corrupted authentication data. Fix it by:
1. Stop the bot (Ctrl+C)
2. Run: `npm run clean`
3. Run: `npm start`
4. Scan the new QR code

**QR code not showing?**
- Make sure you've installed all dependencies: `npm install`
- Check your internet connection
- Ensure Node.js version is compatible (v16+)

**Bot not responding?**
- Check console for errors
- Verify WhatsApp Web is not logged in elsewhere
- Try restarting the bot

**Authentication issues?**
- Use `npm run clean` to remove old authentication data
- Re-scan the QR code

## Security

- Never commit `auth_info_baileys/` folder to version control
- Keep your authentication data secure
- Don't share QR codes or authentication files

## License

ISC
