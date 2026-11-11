# RepoMind — AI-Powered GitHub Code Analysis Platform

RepoMind is a modern, premium developer-tool dashboard designed for deep repository comprehension, architectural mapping, and AI-powered code explanation.

Built with **React**, **Vite**, **Tailwind CSS**, and **Lucide React**, inspired by high-craft developer platforms like Linear, GitHub, and modern AI coding assistants.

---

## 🚀 Features

- **Dark Charcoal Developer Aesthetic**: Custom dark theme with low-contrast borders, refined typography, and subtle glowing accents.
- **Three-Panel Repository Analysis**:
  - **Left Panel (File Explorer)**: Interactive, collapsible folder tree with search filtering, file size badges, and file-type icons.
  - **Center Panel (Code Viewer)**: Multi-tab file viewer with line numbering, copy code feedback, font zoom controls, and a language selector.
  - **Right Panel (Gemini AI Intelligence)**: Precomputed architectural insights, security/complexity audits, and an interactive "Ask Gemini" prompt simulator.
- **Repository Dashboard**:
  - Hero URL input bar supporting sample repositories (`expressjs/express`, `shadcn/taxonomy`, `fastapi/fastapi`, `gorilla/mux`).
  - Realistic multi-step analysis progress simulation (AST parsing, dependency graph, Gemini AI synthesis).
  - Metric summary cards and recent repository cards.
- **Analysis History**:
  - Searchable list of past analyses with language filtering and re-analysis capabilities.
  - Interactive "Clear History" and "Restore Sample Data" actions to test empty and populated states.
- **Settings & Customization**:
  - Gemini AI model picker (`Gemini 1.5 Pro`, `Gemini 1.5 Flash`, `Gemini Ultra`).
  - Analysis depth modes (`Standard`, `Deep Architectural`, `Security Focus`).
  - Code viewer typography and layout preferences (font size slider, line numbers toggle, tab indentation).
  - Dark theme variations (`Dark Charcoal`, `Midnight OLED`, `Slate Minimal`).
  - Optional GitHub Personal Access Token field with privacy notes.

---

## 📁 Folder Structure

```
RepoMind/
├── backend/                    # Node.js + Express backend service
│   ├── .env                    # Backend environment config (PORT, GITHUB_TOKEN)
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js           # Express app setup, CORS, and error handling
│       ├── controllers/
│       │   └── githubController.js # Request parsing and response dispatching
│       ├── routes/
│       │   ├── githubRoutes.js # /api/github/repo, /tree, /file
│       │   └── healthRoutes.js # / (root service info) & /api/health
│       ├── services/
│       │   └── githubService.js # GitHub REST & Git Trees API client + tree builder
│       └── utils/
│           └── urlParser.js    # GitHub URL validation and (owner, repo) extractor
├── public/
├── src/                        # React + Vite frontend
│   ├── components/
│   │   ├── common/             # Reusable UI primitives (Button, Badge, CommandPalette)
│   │   ├── layout/             # Shell (AppLayout, Navbar, Sidebar)
│   │   └── analysis/           # FileTree, CodeViewer, AIAnalysisPanel
│   ├── context/
│   │   └── RepoContext.jsx     # Global repository state and live API integration
│   ├── data/
│   │   └── mockRepositories.js # Preloaded mock repositories
│   ├── services/
│   │   └── githubApi.js        # Frontend client for the Express backend API
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── RepositoryAnalysis.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🛠️ How to Run the Project

### 1. Start the Backend Server (Port 3000)
```bash
cd backend
npm install
npm run dev
```
The backend will run on **http://localhost:3000**.
- Health check: `http://localhost:3000/api/health`
- Repo metadata: `http://localhost:3000/api/github/repo?url=https://github.com/expressjs/express`
- File tree: `http://localhost:3000/api/github/tree?url=https://github.com/expressjs/express`

### 2. Start the Frontend Application (Port 5173)
From the root folder:
```bash
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | None | Root endpoint returning backend service status and endpoint catalog |
| `GET` | `/api/health` | None | Health check endpoint returning uptime and status |
| `GET` | `/api/github/repo` | `url` (required) | Validates GitHub URL, extracts `owner` & `repo`, and returns repository metadata |
| `GET` | `/api/github/tree` | `url` (required), `branch` (optional) | Fetches recursive git tree and converts it into a nested folder/file hierarchy |
| `GET` | `/api/github/file` | `url` (required), `path` (required), `branch` (optional) | Fetches raw file content and returns lines and size |


