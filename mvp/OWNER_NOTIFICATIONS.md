# 🔔 Shop Owner Notifications - Feature Guide

## Overview

The bot now sends you (shop owner) WhatsApp notifications for:
1. **File Downloads** - When a customer sends PDFs
2. **Print Completions** - When files are sent to printer mailbox

This helps you track activity without constantly checking folders or terminal logs.

---

## Setup

### Step 1: Update Your Phone Number

Open `src/config.ts` and update:

```typescript
OWNER_PHONE: '919876543210',    // ⚠️ Your WhatsApp number
NOTIFY_OWNER: true,              // Set to false to disable
```

**IMPORTANT**: 
- Use your phone number **without the `+` sign**
- Format: `919876543210` ✅ (not `+919876543210` ❌)
- This must be a different number from customers
- Can be your personal WhatsApp number

### Step 2: Link Your Phone

The bot will send messages to both:
- Customer's number (their own phone)
- Your number (OWNER_PHONE)

Both will receive messages from the same WhatsApp bot account.

---

## Notification Examples

### 1. File Download Notification

**When**: Customer sends a PDF  
**After**: File successfully downloaded and saved to disk

**You receive**:
```
📥 *New File Downloaded*

👤 From: 919876543210
📄 File: invoice.pdf
📊 Size: 2.45 MB
📁 Folder: downloads/919876543210/
```

**Multiple files**:
```
📥 *New File Downloaded*

👤 From: 919876543210
📄 File: report.pdf
📊 Size: 5.12 MB
📁 Folder: downloads/919876543210/
```

(Each file = separate notification)

---

### 2. Print Job Notification

**When**: Customer confirms print (says "YES")  
**After**: Files sent to printer mailbox

**You receive**:
```
🖨️ *Print Job Sent to Mailbox*

👤 Customer: 919876543210
📄 Files: 3
  • invoice.pdf (5 pages)
  • report.pdf (12 pages)
  • contract.pdf (8 pages)

📊 Total Pages: 25
💰 Amount: ₹12.50
📁 Mailbox: Files start with 919876543210_*
```

---

## Full Conversation Flow

**Customer**: [Sends invoice.pdf]

**You (Owner) Receive**:
```
📥 *New File Downloaded*
👤 From: 919876543XXX
📄 File: invoice.pdf
📊 Size: 1.23 MB
```

**Customer**: [Sends report.pdf]

**You (Owner) Receive**:
```
📥 *New File Downloaded*
👤 From: 919876543XXX
📄 File: report.pdf
📊 Size: 3.45 MB
```

**Customer**: "ready"

**Customer Receives**:
```
📄 You have 2 PDFs ready to print:
1️⃣ invoice.pdf (5 pages)
2️⃣ report.pdf (12 pages)
... (file list)
```

**Customer**: "YES"

**You (Owner) Receive**:
```
🖨️ *Print Job Sent to Mailbox*
👤 Customer: 919876543XXX
📄 Files: 2
  • invoice.pdf (5 pages)
  • report.pdf (12 pages)
📊 Total Pages: 17
💰 Amount: ₹8.50
📁 Mailbox: Files start with 919876543XXX_*
```

---

## Benefits

### For Download Notifications:
✅ Know immediately when files arrive  
✅ See file size (detect large files)  
✅ Track which customer sent what  
✅ No need to check folders constantly  

### For Print Notifications:
✅ Know when to check printer mailbox  
✅ See customer phone number for identification  
✅ Preview files and pages before printing  
✅ Know total amount to collect  

---

## Disable/Enable Notifications

### Disable All Notifications

Edit `src/config.ts`:
```typescript
NOTIFY_OWNER: false,  // Notifications OFF
```

Rebuild:
```bash
npm run build
```

### Enable Again

```typescript
NOTIFY_OWNER: true,   // Notifications ON
```

---

## Advanced Configuration

### Change Notification Number (Use Different Phone)

```typescript
OWNER_PHONE: '918765432109',  // Different number
```

### Notification to Multiple People

Currently supports one owner. To notify multiple people, you would need to:
1. Add another config: `OWNER_PHONE_2`
2. Modify bot.ts to send to both numbers

(Not implemented in MVP, can be added later)

---

## Testing

### Test Download Notification

1. Update OWNER_PHONE in config
2. Run bot: `npm run dev`
3. From ANOTHER phone, send a test PDF to bot
4. Check YOUR phone (OWNER_PHONE) for notification

### Test Print Notification

1. Send PDF from another phone
2. Send "test" message (triggers file list)
3. Reply "YES"
4. Check YOUR phone for print notification

---

## Troubleshooting

### Not receiving notifications?

**Check 1**: Is NOTIFY_OWNER = true?
```bash
# In src/config.ts
NOTIFY_OWNER: true,  ← Must be true
```

**Check 2**: Is OWNER_PHONE correct?
```bash
OWNER_PHONE: '919876543210',  ← No spaces, no +
```

**Check 3**: Did you rebuild?
```bash
npm run build
```

**Check 4**: Is the owner phone blocked/spam-filtered?
- Check if bot's number is saved in contacts
- Check WhatsApp spam folder

---

### Receiving customer notifications instead?

If you're receiving the customer's messages (like "Received: file.pdf"), you entered the customer's number as OWNER_PHONE by mistake.

**Fix**:
- Use YOUR personal number
- Different from customer numbers

---

### Getting too many notifications?

**Option 1**: Disable download notifications, keep print notifications
(Requires code modification - ask for help)

**Option 2**: Disable all
```typescript
NOTIFY_OWNER: false,
```

---

## Privacy Note

- Owner receives customer phone numbers in notifications
- Keep these confidential
- WhatsApp messages are end-to-end encrypted

---

## Summary

✅ **Two notification types**: Downloads + Prints  
✅ **Simple setup**: One phone number in config  
✅ **Real-time alerts**: Know activity instantly  
✅ **Easy toggle**: ON/OFF in config  
✅ **No delays**: Notifications only after successful operations  

Stay informed without manual checking! 🎉
