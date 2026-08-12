<div align="center">
  <img src="apps/frontend/public/Screenshot (265).png" alt="Predix Banner" width="100%" />
</div>

<h1 align="center">🎯 Predix</h1>

<p align="center">
  <strong>The smartest prediction betting platform with top odds and instant payouts.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## 🚀 Overview

**Predix** is a cutting-edge  betting platform where users can predict outcomes and win instantly. Designed with a modern UI/UX, Predix allows users to participate in trade-based betting with ease and speed.

---

## 🧩 Features

- 🎲 Real-time prediction-based betting system
- ⚡ Instant order execution with live trading interface
- 💸 Token-based balance tracking
- 🔒 Google OAuth-based authentication
- 📊 Event-based prediction market
- 🔔 Real-time updates using WebSockets
- 🌐 Responsive and elegant UI built with TailwindCSS

---

## 🛠 Tech Stack

### Frontend:

- **Next.js 14 (App Router)**
- **TypeScript**
- **TailwindCSS**
- **Shadcn UI**
- **Socket.io** (WebSocket support)
- **Axios**

### Backend:

- **Node.js + Express (WS Server)**
- **Redis** (for real-time market data pub/sub)
- **Prisma** (PostgreSQL ORM)

---

## 📸 Preview

![Predix Landing Screenshot](<./Screenshot%20(265).png>)

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js (>=18.x)
- Redis
- PostgreSQL
- pnpm / yarn / npm

### Clone & Install

```bash
git clone https://github.com/Manav2209/Predix.git
cd Predix
pnpm install
```

### Configure Environment

Create a `.env` file based on `.env.example` and provide:

```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Run the App

```bash
pnpm dev
```

Backend (WebSocket server):

```bash
cd apps/ws
pnpm dev
```

---

## 📁 Project Structure

```bash
.
├── apps/
│   ├── next/          # Frontend App (Next.js)
│   └── ws/            # Backend WebSocket Server
├── packages/
│   ├── config/        # Shared config
│   └── ui/            # Shared UI components
├── prisma/            # DB schema and migrations
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repo and submit a pull request.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgments

Thanks to all open-source libraries and tools used in this project. Special thanks to the betting community and contributors for feature inspiration.

---
