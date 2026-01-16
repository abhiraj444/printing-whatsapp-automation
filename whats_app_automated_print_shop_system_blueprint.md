# WhatsApp Automated Print Shop – System Blueprint

## Vision
Build a fully automated print business platform where customers send PDFs on WhatsApp and receive printed pages without any manual handling from the shop owner.

From the owner’s perspective:
- No manual downloading
- No manual page counting
- No manual pricing
- No manual payment verification
- No mailbox handling
- No panel configuration
- No job prioritization decisions

The system becomes the brain. The printer becomes a fast, dumb output device.

---

## End-to-End Flow

```
Customer → WhatsApp Bot → Backend Server → Pricing Engine → UPI Payment → Verification → Print Pipeline → Canon iR 7105 → Output
```

1. Customer sends one or more PDFs on WhatsApp
2. Bot automatically downloads files
3. Files are grouped under a folder named by sender’s phone number
4. Backend:
   - Counts pages
   - Detects paper size & orientation
   - Applies pricing rules
5. Bot replies with:
   - Total pages
   - Total cost
   - UPI payment link
6. Backend waits for payment confirmation
7. On successful payment:
   - Bot replies “Payment received. Printing started.”
   - Print job is queued
8. Backend prepares pages and sends them to the printer
9. Canon prints without human intervention

---

## Core Subsystems

### 1. WhatsApp Intake Layer
- Built using an unofficial WhatsApp library (Baileys / whatsapp-web.js)
- Listens for incoming documents
- Extracts sender number
- Creates job folder:
  ```
  /jobs/+91XXXXXXXXXX/
  ```
- Saves all PDFs into that folder
- Uses inactivity timeout (e.g., 90 seconds) to mark job as “complete”

---

### 2. Document Analysis Engine
For each job:
- Read all PDFs
- Count total pages
- Detect:
  - Page sizes (A4/A3)
  - Orientation (portrait/landscape)
  - Complexity (simple text vs heavy graphics)

Output:
```
Files: 3
Pages: 28
A4: 26, A3: 2
```

---

### 3. Pricing & Customer Communication
Rules:
- ₹X per page (configurable)
- Optional different rate for A3

Bot message:
```
You sent 3 files (28 pages)
Total cost: ₹56
Pay here:
upi://pay?pa=shop@upi&am=56&tn=Print+Job
```

---

### 4. Payment Verification
- Backend verifies payment from trusted source:
  - Bank API / Aggregator API / SMS parser
- Match:
  - Amount
  - Sender
  - Time window

On success:
- Mark job as PAID
- Notify customer
- Push job into print queue

---

### 5. Intelligent Print Pipeline
The backend fully prepares pages before they reach the printer.

Capabilities:
- Scale to fit
- Shrink (e.g., 90–95%) to add margin
- Enlarge to fill page
- A4 ↔ A3 normalization
- N-up layouts:
  - 1-on-1
  - 2-on-1
  - 3-on-1
  - 4-on-1
- Duplex (double-sided)

All layout and orientation decisions are applied **in software**.

The printer never needs:
- Calendar mode
- Orientation switching
- Manual panel input

It receives only ready-to-print pages.

---

### 6. Transport Strategy
Three rendering modes:

| Mode | Speed | Size | Use Case |
|------|-------|------|----------|
| PCL6 (vector) | Fast | Small | Text-heavy PDFs |
| Optimized PDF | Fast | Small | Mixed content |
| Raster (image) | Fastest | Large | Complex graphics |

System selects best mode automatically.

---

### 7. Central Print Queue & Scheduler
The backend is the **only** entity that talks to the printer.

Features:
- All jobs enter a central queue
- Jobs are chunked (e.g., 50 pages at a time)
- Automatic priority rules:
  - ≤ 10 pages → HIGH
  - 11–100 pages → MEDIUM
  - > 100 pages → LOW

Behavior:
- Large jobs are printed in blocks
- Between blocks, the system checks for higher-priority jobs
- Small jobs jump ahead automatically
- Bulk jobs resume later

Owner never intervenes.

---

### 8. Printer Monitoring & Feedback
Using:
- SNMP (printer state & errors)
- OS spooler tracking
- Page counter comparison

System can detect:
- Job started
- Job finished
- Paper jam
- Out of paper
- Door open

On error:
- Pause queue
- Notify owner
- Inform affected customers

---

## What This System Achieves

- Zero manual file handling
- Zero manual counting
- Zero manual pricing
- Zero manual payment checking
- Zero mailbox interaction
- Zero printer panel configuration
- Zero job arbitration

You become:
> The operator of a self-running print service

Not a person who babysits a machine.

This is not just automation.
It is the digitization of your entire business logic.

