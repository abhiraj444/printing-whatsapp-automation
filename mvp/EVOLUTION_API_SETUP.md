# 🚀 Evolution API Setup Guide

## What Is Evolution API?

Evolution API is a Docker-based REST API wrapper for WhatsApp that provides stable message sending and receiving via HTTP endpoints.

**Architecture:**
```
Your Bot (Node.js)
    ↓ HTTP REST API calls (port 8080)
Evolution API (Docker container)
    ↓ WhatsApp connection
WhatsApp servers
```

---

## 📋 Prerequisites

- Docker Desktop installed and running ✅
- Node.js installed ✅
- Port 8080 and 3000 available

---

## 🔧 Quick Setup

### Step 1: Start Evolution API Container

```bash
docker run -d --name evolution-api -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=my-print-bot-key \
  atendai/evolution-api:latest
```

### Step 2: Verify Container is Running

```bash
docker ps
```

Should show:
```
CONTAINER ID   IMAGE                        STATUS   PORTS
abc123         atendai/evolution-api:latest Up       0.0.0.0:8080->8080/tcp
```

### Step 3: Open Evolution API Manager

Open in browser: **http://localhost:8080/manager**

### Step 4: Create Instance

In the manager UI:
1. Click "Create Instance"
2. Name: `printbot`
3. Type: WhatsApp Baileys
4. Click Create

### Step 5: Scan QR Code

1. Click on `printbot` instance
2. Click "Generate QR Code"
3. Scan with your WhatsApp

### Step 6: Start the Bot

```bash
npm run dev
```

---

## 🔑 Environment Variables

If needed, set these before running:

```bash
# PowerShell
$env:EVOLUTION_API_URL = "http://localhost:8080"
$env:EVOLUTION_API_KEY = "my-print-bot-key"

# Then run
npm run dev
```

---

## 📡 How Messages Work

### Sending Messages (Bot → WhatsApp)

```
Bot calls: POST http://localhost:8080/message/sendText/printbot
Evolution API sends to WhatsApp
```

### Receiving Messages (WhatsApp → Bot)

```
WhatsApp message arrives
Evolution API receives it
Evolution API calls: POST http://localhost:3000/webhook
Bot processes the message
```

---

## 🧪 Testing the API

### Test if Evolution API is Running

```bash
curl http://localhost:8080
```

Should return: `{"status":"ok"}`

### Create Instance via API

```bash
curl -X POST http://localhost:8080/instance/create ^
  -H "Content-Type: application/json" ^
  -H "apikey: my-print-bot-key" ^
  -d "{\"instanceName\": \"printbot\", \"qrcode\": true}"
```

### Send Test Message

```bash
curl -X POST http://localhost:8080/message/sendText/printbot ^
  -H "Content-Type: application/json" ^
  -H "apikey: my-print-bot-key" ^
  -d "{\"number\": \"918340230105\", \"text\": \"Hello from Evolution API!\"}"
```

---

## 🔍 Troubleshooting

### Container Not Running

```bash
docker logs evolution-api
docker restart evolution-api
```

### Port Already in Use

```bash
docker stop evolution-api
docker rm evolution-api
# Then restart with different port
docker run -d --name evolution-api -p 8081:8080 ...
```

### Can't Connect to WhatsApp

1. Delete instance in manager
2. Create new instance
3. Scan QR code again

### Bot Not Receiving Messages

1. Check webhook is set: http://localhost:8080/manager
2. Ensure both ports (8080 and 3000) are accessible

---

## 📊 Useful Docker Commands

```bash
# View logs
docker logs evolution-api

# Stop container
docker stop evolution-api

# Start container
docker start evolution-api

# Restart container
docker restart evolution-api

# Remove container (to recreate)
docker rm evolution-api
```

---

## 🔗 API Reference

**Base URL**: `http://localhost:8080`

**Header**: `apikey: my-print-bot-key`

### Create Instance
`POST /instance/create`

### Connect (Get QR)
`GET /instance/connect/{instanceName}`

### Get Status
`GET /instance/connectionState/{instanceName}`

### Send Text Message
`POST /message/sendText/{instanceName}`
```json
{
  "number": "919876543210",
  "text": "Hello!"
}
```

### Set Webhook
`POST /webhook/set/{instanceName}`
```json
{
  "url": "http://localhost:3000/webhook",
  "events": ["MESSAGES_UPSERT"]
}
```

---

## ✅ Ready!

Once everything is set up:
1. Evolution API container running on port 8080
2. Bot running on port 3000 (webhook server)
3. WhatsApp connected via QR scan

The bot will now receive messages via webhook and send replies via REST API!
