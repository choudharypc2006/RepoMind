# RepoMind — AI-Powered GitHub Code Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)]()
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-emerald.svg)]()
[![AI](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%203.8%20%26%203.5-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-purple.svg)]()

RepoMind is a high-craft developer tool and repository intelligence dashboard designed for deep codebase comprehension, architectural mapping, and AI-powered code auditing. It pairs a dark charcoal VS Code-inspired frontend with a hardened Express backend that integrates directly with the **GitHub Git Trees API**, **Google Gemini GenAI SDK**, and **MongoDB Atlas**.

---

## 📸 Screenshots

| Dashboard & Repository Ingestion | 3-Panel Code Workspace |
|:---:|:---:|
| ![Dashboard Screenshot](https://placehold.co/800x450/0f172a/38bdf8?text=RepoMind+Dashboard+Overview) | ![Workspace Screenshot](https://placehold.co/800x450/0f172a/38bdf8?text=Three-Panel+Code+Analysis+Workspace) |

| Gemini AI Code Intelligence & Audit | MongoDB Persistent History |
|:---:|:---:|
| ![Gemini AI Panel](https://placehold.co/800x450/0f172a/38bdf8?text=Gemini+Code+Intelligence+%26+Audit) | ![History Tab](https://placehold.co/800x450/0f172a/38bdf8?text=Persistent+MongoDB+Analysis+History) |

---

## 🚀 Key Features

### 1. Three-Panel Workspace Architecture
- **Interactive File Explorer**: Full recursive folder tree with search filtering, file size badges, language-specific icons, and collapse/expand controls.
- **Code Viewer**: Multi-tab code editor with line numbering, word wrap toggle, font size adjusters, language selector, copy-to-clipboard feedback, and animated skeleton loaders.
- **Gemini Code Intelligence**:
  - **Executive Summary**: 2-3 sentence overview of file responsibility.
  - **Architectural Breakdown**: Formatted markdown analysis with code snippets, copy buttons, and design patterns.
  - **Function & Component Documentation**: Purpose, parameters, and return types.
  - **Code Audit & Edge Cases**: Highlights potential bugs, race conditions, and performance bottlenecks without hallucinations.
  - **Interactive Chat**: Context-aware chat with Gemini grounded strictly in the active file.

### 2. High-Token Gemini AI Integration
- Active support for **Gemini 3.8 Flash** and **Gemini 3.5 Flash Lite** (1 Million token context window).
- **Automatic Fallback Engine**: If a model encounters 503 high demand or 429 rate limits, RepoMind automatically fails over to alternative high-token models without user disruption.

### 3. Reliability & Security Hardening
- **Strict Input Validation**: Validates all GitHub URLs, branch names, file paths (guards against directory traversal `..`), and payload sizes.
- **Payload & Memory Protection**: File size cap (500 KB) and request body limit (10 MB) to prevent denial-of-service from oversized files.
- **Rate Limiting**: Sliding-window rate limiter protecting Gemini AI endpoints (15 req/min) and authentication routes (30 req/15min).
- **HTTP-Only Cookie Authentication**: Secure JWT cookies with `SameSite: None` + `Secure` support for cross-domain deployments (e.g. Vercel frontend + Render backend).
- **Zero Secret Leakage**: Centralized Express error handler that prevents stack traces, internal URIs, or tokens from leaking in production logs.

### 4. Cross-Session MongoDB Persistence
- User accounts and authentication state securely hashed with bcrypt (salt rounds: 10).
- Automatic persistence and restoration of full structured Gemini analyses (`functions`, `metrics`, `keyInsights`, `audit issues`) per file across login sessions.
- Direct "Open in Workspace" action from the MongoDB History tab.

---

## 🏗️ Application Architecture

```
[ User Browser / Client ]
        │
        ├── (SPA Routes, Zustand/Context State, Tailwind Dark Theme)
        │
        ▼
[ RepoMind Frontend (Vite + React) ]
        │
        │ HTTP /api (withCredentials: include)
        ▼
[ RepoMind Backend (Express.js) ]
   ├── Rate Limiting Middleware (IP / User Window)
   ├── JWT Auth & Cookie Validator
   ├── Centralized Error Handler
   │
   ├───► GitHub REST & Git Trees API  ─── (Repository Metadata & Recursive Trees)
   ├───► Google Gemini API            ─── (High-token Code Analysis & Interactive Chat)
   └───► MongoDB Atlas Database       ─── (Users, Saved Repositories, File Analyses)
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide React, React Router 6.
- **Backend**: Node.js, Express 4, Axios, Cookie-Parser, CORS.
- **AI / LLM**: Google GenAI SDK (`@google/genai`) with Gemini 3.8 Flash & Gemini 3.5 Flash Lite.
- **Database & Auth**: MongoDB Atlas, Mongoose 8, JSON Web Tokens (JWT), BcryptJS.
- **Deployment**: Vercel (Frontend SPA), Render / Railway (Backend API).

---

## 📁 Folder Structure

```
RepoMind/
├── backend/
│   ├── render.yaml             # Render Blueprint configuration
│   ├── package.json
│   ├── .env.example            # Environment template
│   ├── src/
│   │   ├── server.js           # Express setup, CORS, rate limiting, error middleware
│   │   ├── config/
│   │   │   └── db.js           # Mongoose MongoDB connection & event monitoring
│   │   ├── controllers/
│   │   │   ├── aiController.js         # Gemini analysis & interactive chat dispatch
│   │   │   ├── analysisController.js   # Per-file analysis storage & retrieval
│   │   │   ├── authController.js       # Register, login, logout, me
│   │   │   ├── githubController.js     # GitHub repo, tree, file endpoints
│   │   │   └── repoHistoryController.js# User repository history endpoints
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT cookie verification
│   │   │   ├── errorHandler.js         # Centralized error handler
│   │   │   └── rateLimiter.js          # In-memory sliding-window limiter
│   │   ├── models/
│   │   │   ├── Analysis.js     # File-level AI analysis schema & compound indexes
│   │   │   ├── Repository.js   # User analyzed repositories schema
│   │   │   └── User.js         # User credentials schema
│   │   ├── routes/             # Express API route modules
│   │   ├── services/
│   │   │   ├── geminiService.js# Google GenAI client with auto-switch engine
│   │   │   └── githubService.js# GitHub Trees & Content API client
│   │   └── utils/
│   │       ├── token.js        # JWT generation & secure cookie management
│   │       └── urlParser.js    # Strict GitHub URL parser & sanitizer
│   └── tests/
│       └── api.test.js         # Automated test suite (26 passing tests)
├── frontend/
│   ├── index.html              # Single page app entry HTML
│   ├── package.json
│   ├── vite.config.js          # Vite build & plugin settings
│   ├── tailwind.config.js      # Custom charcoal dark theme config
│   ├── vercel.json             # Vercel SPA routing rewrites
│   ├── .env.example
│   └── src/
│       ├── components/
│       │   ├── analysis/       # AIAnalysisPanel, CodeViewer, FileTree
│       │   ├── common/         # Button, Badge, Skeleton, MarkdownRenderer
│       │   └── layout/         # AppLayout, Navbar, Sidebar
│       ├── context/
│       │   ├── AuthContext.jsx # User authentication state
│       │   └── RepoContext.jsx # Repository selection & analysis synchronization
│       ├── pages/              # Dashboard, RepositoryAnalysis, History, Settings, Login, Signup
│       ├── services/
│       │   └── githubApi.js    # Frontend HTTP service communicating with Express
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── package.json                # Root convenience workspace scripts
```

---

## ⚙️ Environment Variables Setup

### Backend Environment (`backend/.env`)

Copy the template from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Description |
|:---|:---:|:---:|:---|
| `PORT` | Optional | `3000` | Port for the Express server to listen on. |
| `FRONTEND_URL` | Required | `http://localhost:5173` | Allowed CORS origin for frontend client. |
| `ALLOWED_ORIGINS` | Optional | - | Comma-separated list of origins for production. |
| `GITHUB_TOKEN` | Optional | - | GitHub Personal Access Token (boosts rate limit from 60 to 5,000 req/hr). |
| `GEMINI_API_KEY` | Required | - | Google Gemini AI Studio API key. |
| `MONGODB_URI` | Required | - | MongoDB connection string (Atlas or local). |
| `JWT_SECRET` | Required | - | Cryptographic secret for signing auth tokens. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiration period. |
| `COOKIE_SAMESITE`| Optional | `lax` (dev), `none` (prod)| Cookie SameSite attribute (`lax`, `strict`, `none`). |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`). |

### Frontend Environment (`.env`)

For local development, defaults work out-of-the-box (`http://localhost:3000`). For production:

```bash
VITE_BACKEND_URL=https://your-backend-api.onrender.com
```

---

## 💻 Installation & Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/RepoMind.git
cd RepoMind
```

### 2. Setup and run Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, MONGODB_URI, and JWT_SECRET

# Start backend server
npm run dev
```

*The backend starts at `http://localhost:3000`.*

### 3. Setup and run Frontend

Open a new terminal tab in the project root:

```bash
cd frontend
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

*The frontend starts at `http://localhost:5173`.*

*(Or run `npm run dev:frontend` directly from the project root)*

---

## 🧪 Testing

RepoMind includes an automated test suite verifying edge cases, rate limits, URL validation, and error handlers:

```bash
# Run backend test suite
npm test --prefix backend
```

**Test Coverage Highlights:**
- Invalid & malformed GitHub URLs (missing owner/repo, non-GitHub domains, invalid traversal paths).
- Valid protocol-less and `.git` URLs.
- Rejection of binary / media files (`.png`, `.svg`, `.zip`, `.exe`, `.sqlite`) with HTTP 422.
- In-memory rate limiting enforcement and HTTP 429 response formatting.
- Centralized error handler mappings (`CastError` -> 400, `Mongo 11000 Duplicate Key` -> 409, `TokenExpiredError` -> 401).

---

## 🌐 Production Deployment Guide

### Deploying Frontend to Vercel
1. Push your repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add Environment Variable:
   - `VITE_BACKEND_URL`: `https://your-backend-api.onrender.com`
8. Deploy! The included `frontend/vercel.json` ensures all SPA routes (`/analysis/:id`, `/history`, `/settings`) redirect cleanly to `/index.html`.

### Deploying Backend to Render
1. Create a **Web Service** on [Render](https://render.com) pointing to your repository.
2. Root Directory: `backend`
3. Environment: `Node`
4. Build Command: `npm install`
5. Start Command: `node src/server.js`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-app.vercel.app`
   - `ALLOWED_ORIGINS`: `https://your-app.vercel.app`
   - `COOKIE_SAMESITE`: `none`
   - `MONGODB_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: `your_random_secret_key`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `GITHUB_TOKEN`: `your_personal_access_token`

---

## 🔮 Future Improvements

- [ ] Support for private repositories via GitHub OAuth App integration.
- [ ] Export analysis reports to PDF and markdown deliverables.
- [ ] Visual dependency and component graph visualization with interactive node dragging.
- [ ] Multi-file cross-reference analysis using semantic vector search embeddings.

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
