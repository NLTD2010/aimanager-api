# AImgr API
## What's this?
This is a fun API i made for [RaspAPI](https://raspapi.hackclub.com) that allows you to basicly chat with an AI model from [HackClub AI](https://ai.hackclub.com)

You can create your own account and start to chat with the AI

## Wondering how to use it? 
### 1. Get API key

Go to [HackClub AI](https://ai.hackclub.com), create an account and grab your own API key.

---

### 2. Setup your environment

Rename the `.env.example` file to `.env`

It will look like this:
```bash
# .env
PORT=3000
MODEL_CACHE_TTL_MS=300000
JWT_EXPIRES_IN_SECONDS=3600

DATABASE_PATH=./data/app.sqlite
AI_BASE_URL=https://ai.hackclub.com/proxy/v1

JWT_SECRET=<YOUR_SECRET_PASSPHRASE>
AI_API_KEY=<YOUR_HACKCLUB_AI_APIKEY>
```
Replace `<YOUR_SECRET_PASSPHRASE>` with a random string of your choice, and `<YOUR_HACKCLUB_AI_APIKEY>` with the API key you got from HackClub AI.

> Note: There must be a database file `app.sqlite` (it can be empty) at DATABASE_PATH.

---

### 3. Install dependencies and start server

First, run `bun install` to install dependencies

Then,  run `bun run start` to start the server.

---

### 4. Use it 

Check out the [API documentation](https://api-aimgr.nltd2010.me/docs) for more information about my API and how to request it.

---

## Disclaimer
I create this API for HackClub YSWS,and it is not intended for production use.

Also, please do not abuse it (😭 my HackClub AI credit is not inf) or use it on sth important like your graduation project.

