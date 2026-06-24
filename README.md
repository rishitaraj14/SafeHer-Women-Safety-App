# 🌸 SafeHer – Women Safety Platform

A full-stack women's safety web application built with Node.js + Express backend and a 3D animated frontend.

Live demo: https://sparkling-praline-3660e7.netlify.app/

## Features
- 🆘 **SOS Emergency Alert** – one-tap alert with live GPS location sent to trusted contacts
- 👥 **Trusted Contacts** – manage your safety network
- 📞 **24/7 Indian Helplines** – all official numbers (1091, 100, 108, 181, 1930…)
- 📋 **Anonymous Incident Reporting** – report harassment, stalking, domestic violence
- 📱 **Fake Call Feature** – escape dangerous situations with a simulated incoming call
- 🛡️ **Safety Resources** – legal rights, self-defence tips, digital safety
- ✨ **3D Animated UI** – floating orbs, particle background, glassmorphism cards, tilt effects

## Setup & Run

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open: **http://localhost:3000**

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/sos | Trigger SOS alert |
| GET | /api/contacts | Get trusted contacts |
| POST | /api/contacts | Add contact |
| DELETE | /api/contacts/:id | Remove contact |
| POST | /api/incidents | Submit incident report |
| GET | /api/incidents | View public incidents |
| GET | /api/helplines | Get all helplines |
| GET | /api/stats | Platform statistics |

## Tech Stack
- **Backend**: Node.js, Express, helmet, cors, express-rate-limit, uuid
- **Frontend**: Vanilla JavaScript, CSS3 (glassmorphism, 3D transforms, animations)
- **Notifications**: Twilio SMS + Nodemailer (add your keys to enable)

## For Production
- Add MongoDB/PostgreSQL for persistent storage
- Add Twilio credentials for real SMS alerts
- Add Nodemailer SMTP for email notifications
- Deploy to Vercel, Railway, or Render

Built for SDG 5 – Gender Equality 💜
