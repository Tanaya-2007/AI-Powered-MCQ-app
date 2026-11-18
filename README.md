# 🎯 QuizMaster - AI-Powered Quiz Platform

**Production-ready full-stack quiz platform** with AI-powered MCQ generation, RAG-based document grounding, real-time multiplayer rooms, and persistent results.

[![CI](https://github.com/Tanaya-2007/AI-Powered-MCQ-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Tanaya-2007/AI-Powered-MCQ-app/actions/workflows/ci.yml)

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Socket.io Events](#-socketio-events)
- [AI Pipeline](#-ai-pipeline)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security)
- [Contact](#-contact)

---

## 🚀 About

**QuizMaster** is a complete full-stack quiz platform that lets teachers and students generate AI-powered MCQs from their own study material (text, PDF, images, voice), run live multiplayer quiz rooms, and track results.

### What Works

- ✅ AI-powered MCQ generation from text/PDF/image/voice uploads
- ✅ RAG pipeline: document chunking → embeddings → pgvector similarity search → grounded question generation
- ✅ Fail-loud AI generation: no template/placeholder questions — if the AI can't produce good questions you get a clear error, never fake ones
- ✅ Multi-provider LLM chain (Groq → OpenAI → Gemini) with multi-key Gemini rotation
- ✅ Scanned PDFs and photos handled via Gemini OCR; per-user study materials
- ✅ Solo quiz mode with timer, mark-for-review, keyboard shortcuts (A-D), explanations
- ✅ Collaborative multiplayer rooms with host controls, live leaderboards, voting distribution
- ✅ Real-time Socket.io rooms with Upstash Redis persistence (2-hour TTL, in-memory fallback)
- ✅ Google Forms export (direct API or Apps Script fallback)
- ✅ Supabase Auth (JWT-based, fail-closed on missing config)
- ✅ Rate limiting, Helmet, CORS allowlist, input validation
- ✅ Rate-limited contact form via backend Nodemailer
- ✅ Persistent quiz results stored in PostgreSQL
- ✅ Dockerfile + GitHub Actions CI pipeline (lint + build + test)
- ✅ 50 automated unit tests (Node's built-in test runner)
- ✅ Production-grade error handling (no raw error leaks)

---

## ✨ Features

### Solo Mode
- Upload study material via text paste, PDF, image (Gemini OCR), or voice transcription
- Topic focus validation (AI checks if material matches selected topic)
- Semantic vector search retrieves relevant textbook segments
- AI generates grounded 4-option MCQs with explanations and source references
- Timed quiz with mark-for-review, keyboard shortcuts (A-D), instant feedback
- Results page with accuracy ring, correct/wrong/skipped breakdown, confetti for high scores

### Collaborative Mode
- Host creates a room with a 6-character code; players join via code
- Real-time Socket.io gameplay with host-controlled question progression
- Live leaderboard sorted by score (tiebreak: total time taken)
- Per-question voting distribution with accuracy % and player avatars
- Host controls: Show Results, Mid-Quiz Leaderboard, Next Question, End Quiz
- Final podium with top 3, searchable player list, confetti celebration
- Room persistence via Upstash Redis (survives restarts, 2-hour TTL)

### Export & Sharing
- Export quiz directly to Google Forms (graded quiz, 1 point/question, AI explanations as feedback)
- Apps Script fallback if Google service account not configured
- Copy quiz as text, copy share link, native share API

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI library |
| React Router DOM | 7.12 | Client-side routing |
| Vite | 7.2 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling |
| @supabase/supabase-js | 2.110 | Auth client |
| socket.io-client | 4.8 | WebSocket client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | Runtime |
| Express | 4.21 | Web framework |
| Socket.io | 4.8 | Real-time WebSocket rooms |
| PostgreSQL + pgvector | 8.22 | Document chunks + quiz results |
| @google/generative-ai | 0.21 | Gemini LLM + embeddings + OCR |
| @supabase/supabase-js | 2.110 | JWT verification |
| @upstash/redis | 1.39 | Room persistence (REST API) |
| nodemailer | 9.0 | Contact form email |
| helmet | 8.0 | Security headers |
| express-rate-limit | 7.4 | API rate limiting |
| multer | 1.4 | File uploads |
| pdf-parse | 2.4 | PDF text extraction (v2 `PDFParse` API) |

### DevOps
- **GitHub Actions CI**: lint → build → test on every push
- **Dockerfile**: multi-stage build (build + runtime)
- **Render**: backend deployment target
- **Vercel**: frontend deployment target

---

## 🏗️ Architecture

```
[React 19 SPA (Vite)]
     │ fetch + Bearer JWT
     ▼
[Express :5001 /api/*] ── pgvector ─── [PostgreSQL + pgvector]
     │                                  │ study_materials
     │                                  │ document_chunks
     │                                  │ quiz_results
     │
     │ socket.io ─────────────── [Upstash Redis / In-Memory rooms]
     │                                  room state, scores, leaderboards
     │
     ├─ Gemini / Groq / OpenAI ─── [AI: embeddings + MCQ generation + OCR]
     │
     ├─ Google Forms API ─────── [Graded Google Quiz export]
     │
     └─ Nodemailer (Gmail) ───── [Contact form email]

[Supabase Auth] ─────────────── [JWT verification on every /api/* write route]
```

---

## 📁 Project Structure

```
mcq-app/
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite config (@vitejs/plugin-react)
├── tailwind.config.js          # Tailwind CSS config
├── eslint.config.js            # ESLint (frontend + backend configs)
├── package.json                # Frontend dependencies
├── Dockerfile                  # Multi-stage Docker build
├── .dockerignore               # Docker ignore rules
├── .github/workflows/ci.yml    # CI: lint → build → test
├── README.md                   # This file
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Router (10 routes, 9 behind AuthGuard)
│   ├── index.css               # Tailwind + custom animations
│   ├── services/
│   │   ├── supabaseClient.js   # Supabase client + auth mirror
│   │   ├── socket.js           # Socket.io singleton + JWT handshake
│   │   └── authFetch.js        # fetch wrapper with Bearer token
│   ├── pages/
│   │   ├── home.jsx            # Landing + contact form
│   │   ├── ModeSelection.jsx   # Solo vs Collaborative
│   │   ├── Features.jsx        # Feature showcase
│   │   ├── solo/
│   │   │   ├── SoloMode.jsx           # Ingest + generate + preview
│   │   │   ├── SoloQuizSession.jsx    # Timed quiz runner
│   │   │   └── SoloResults.jsx        # Accuracy + confetti
│   │   └── collaborative/
│   │       ├── CollabLanding.jsx      # Host vs Join cards
│   │       ├── CreateQuiz.jsx         # Host ingest + generate + edit
│   │       ├── QuizLobby.jsx          # Host waiting room + Socket create-room
│   │       ├── AttemptQuiz.jsx        # Player join by code + avatar
│   │       ├── CollabQuizSession.jsx  # Host/player gameplay orchestrator
│   │       ├── QuestionResultPage.jsx # Voting distribution + accuracy
│   │       ├── MidQuizLeaderboardPage.jsx # Dark-theme standings
│   │       └── FinalLeaderboardPage.jsx # Podium + searchable list
│   └── components/
│       ├── AuthGuard.jsx         # Route guard (Supabase session verified)
│       ├── AuthModal.jsx         # Sign up/in (Supabase + local fallback)
│       ├── Footer.jsx            # Contact form → /api/contact
│       ├── FeatureCard.jsx       # Neumorphic feature cards
│       └── collab/
│           ├── QuestionCard.jsx      # Presentational Q + timer + options
│           ├── LiveLeaderboardMini.jsx # Top-5 live rankings
│           └── PersonalRankCard.jsx  # Personal result card
│
├── server/
│   ├── index.js                # Express + Socket.io monolith (1000+ lines)
│   ├── middleware/
│   │   └── requireAuth.js      # Supabase JWT verification (fail-closed)
│   ├── db/
│   │   ├── db.js               # pg Pool + SSL + retry logic
│   │   ├── vectorStore.js      # Schema + pgvector + per-user materials, bulk chunk save, search
│   │   ├── roomStore.js        # Upstash Redis room store + in-memory fallback
│   │   ├── init.sql            # Stale Oracle DDL (not executed; schema is created by vectorStore.js)
│   │   └── test-rag.js         # Manual E2E RAG test script
│   ├── utils/
│   │   ├── quizGenerator.js    # generateQuiz: provider chain, prompts, validation, dedup (throws on failure)
│   │   ├── roomLock.js         # Per-room async mutex for socket handlers
│   │   ├── geminiKeys.js       # Multi-key Gemini rotation + model lists (env-configurable)
│   │   ├── gemini.js           # Embeddings (one provider, retried, fail-loud) + parallel batch
│   │   ├── parser.js           # extractTextFromFile (txt / pdf-parse v2 / Gemini OCR for images + scanned PDFs)
│   │   ├── textSplitter.js     # splitText (800/150 sliding window)
│   │   ├── groq.js             # generateGroqContent (cached model selection)
│   │   ├── openai.js           # generateOpenAIContent + generateOpenAIEmbedding
│   │   ├── googleForms.js      # createGoogleForm (service account)
│   │   ├── logger.js           # Pino structured logging
│   │   └── validation.js       # Sanitizers + clamps (unit-tested)
│   ├── uploads/                # Multer temp dir (10MB limit, deleted after ingest; falls back to OS tmp dir)
│   ├── package.json            # Backend dependencies
│   ├── .env.example            # Required environment variables (placeholders only)
│   └── test/
│       ├── validation.test.js  # Sanitizer unit tests
│       ├── splitter.test.js    # Text splitter unit tests
│       ├── roomStore.test.js   # Room store unit tests
│       ├── quizGenerator.test.js # Generator fail-loud + context capping
│       ├── parser.test.js      # PDF extraction (v2 API), scanned-PDF + OCR edge cases
│       ├── geminiKeys.test.js  # Key rotation + model config
│       ├── multiplayer.test.js # Answer dedupe + per-room lock
│       └── logger.test.js      # Logger tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** or **yarn**
- A **Supabase** project (for Auth + PostgreSQL)
- An **Upstash** Redis database (optional, for room persistence across restarts)
- At least one AI key: **Groq**, **Gemini** (Google AI Studio) and/or **OpenAI**. Gemini is also used for OCR and (by default) embeddings

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Tanaya-2007/AI-Powered-MCQ-app.git
cd AI-Powered-MCQ-app

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install
cd ..

# 4. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env with your actual values (see below)

# 5. Start frontend (dev)
npm run dev

# 6. Start backend (dev)
cd server
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5001`.

---

## ⚙️ Environment Variables

### Frontend (`.env` at root or passed at build time)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend URL for production | `https://your-app.onrender.com` |

### Backend (`server/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5001` |
| `NODE_ENV` | Yes | `production` or `development` | `production` |
| `GEMINI_API_KEY` | One AI key required | Google Gemini API key (also used for OCR + embeddings) | `AIza...` |
| `GEMINI_API_KEYS` | No | Comma-separated extra Gemini keys. Rotates automatically on quota/rate-limit errors. Use keys from **separate Google projects** (quota is per project) | `AIza..1,AIza..2` |
| `GROQ_API_KEY` | No | Groq (**groq.com**, not xAI Grok) — first in the generation chain | `gsk_...` |
| `GROQ_MODEL` | No | Pin a Groq model instead of auto-detecting | `llama-3.3-70b-versatile` |
| `OPENAI_API_KEY` | No | OpenAI generation (+ embeddings if selected) | `sk-...` |
| `GEMINI_MODELS` | No | Comma-separated Gemini model names for generation (override if a default isn't available to your key) | `gemini-2.5-flash,gemini-flash-latest` |
| `GEMINI_OCR_MODELS` | No | Comma-separated Gemini models for image / scanned-PDF OCR | `gemini-2.5-flash` |
| `EMBEDDING_PROVIDER` | No | `gemini` or `openai`. Default: Gemini if a key exists, else OpenAI. **Changing it requires re-uploading existing materials** | `gemini` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://...` |
| `PGSSLMODE` | No | SSL mode (`require`, `disable`) | `require` |
| `PGSSL_REJECT_UNAUTHORIZED` | No | SSL cert verification (`true`/`false`) | `true` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key | `eyJ...` |
| `FRONTEND_URL` | Yes | Comma-separated allowed CORS origins | `http://localhost:5173,https://app.vercel.app` |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token | `...` |
| `SMTP_USER` | No | Gmail address for contact form | `you@gmail.com` |
| `SMTP_PASS` | No | Gmail App Password | `...` |
| `SMTP_TO` | No | Destination inbox | `you@gmail.com` |

> At least one of `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GEMINI_API_KEYS` must be set, otherwise quiz generation returns `500` ("No AI provider is configured").

> ⚠️ **Backend fails closed**: If `SUPABASE_URL`/`SUPABASE_ANON_KEY` are missing, all write APIs return `500`. If `SMTP_*` are missing, contact form returns `503`.

---

## 📜 Available Scripts

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend (`server/`)
| Script | Description |
|--------|-------------|
| `npm start` | Start Express + Socket.io server (port 5001) |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run unit tests (Node built-in test runner) |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/status` | No | Health check + config flags |
| `GET` | `/api/db-check` | Yes | PostgreSQL connectivity test |
| `POST` | `/api/ingest` | Yes | Extract (PDF / OCR) → chunk → embed → store study material for the current user |
| `POST` | `/api/generate-quiz` | Yes | Semantic search → AI MCQ generation (returns real errors, never placeholder questions) |
| `POST` | `/api/export-quiz` | Yes | Export to Google Forms |
| `POST` | `/api/contact` | Yes | Contact form (rate-limited) |

#### `/api/generate-quiz` responses

| Status | Meaning |
|--------|---------|
| `200` | `{ success, questions, metadata: { detectedTopic, partial, requested, returned, grounded } }` — `partial: true` means fewer questions than requested passed the quality checks |
| `400` | Invalid/insufficient input, or no study material found |
| `401` | AI provider key invalid/expired (or session expired) |
| `403` | `materialId` belongs to another user |
| `422` | The AI couldn't produce good questions from this input — add more detail |
| `429` | AI provider quota / rate limit reached |
| `502` / `503` | AI providers failed / unreachable |
| `500` | No AI provider configured on the server |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | Client → Server | Host creates a room (auth required) |
| `join-room` | Client → Server | Player joins by room code |
| `start-quiz` | Client → Server | Host starts the quiz |
| `submit-answer` | Client → Server | Player submits answer (server validates correctness) |
| `next-question` | Client → Server | Host progresses to next question |
| `reveal-results` | Client → Server | Host reveals per-question results |
| `reveal-mid-leaderboard` | Client → Server | Host shows mid-quiz standings |
| `end-quiz` | Client → Server | Host ends quiz, persists results |
| `room-created` | Server → Client | Confirmation of room creation |
| `join-success` / `join-error` | Server → Client | Join result |
| `quiz-started` | Server → Client | All clients notified quiz began |
| `scores-updated` | Server → Client | Leaderboard updated after each answer |
| `player-answered` | Server → Client | Host notified a player answered |
| `show-question` | Server → Client | All clients told to display question N |
| `results-revealed` | Server → Client | Per-question answer breakdown shown |
| `mid-leaderboard-revealed` | Server → Client | Mid-quiz standings shown |
| `quiz-finished` | Server → Client | Final leaderboard + results persisted |
| `room-closed` | Server → Client | Host disconnected, room closed |

---

## 🤖 AI Pipeline

**Ingest (files):** upload → extract text (plain text; PDF via `pdf-parse`, with Gemini OCR fallback for scanned PDFs; images via Gemini OCR) → split into 800-char chunks (150 overlap) → embed (768-dim, bounded parallelism, retried) → save material + chunks in a single transaction (rolled back on failure). Materials are owned by the uploading user.

**Generate:** short typed input (< 400 chars, e.g. "Photosynthesis") is treated as a *topic* and the model writes from its own subject knowledge; pasted notes and uploaded files are *grounded* — every question must be answerable from the material. Uploads retrieve chunks from pgvector (topic search, or the document in order) and the prompt context is capped (~14k chars, sampled evenly across the document) to stay inside free-tier limits.

**Quality gates:** each question must have 4 distinct options, a valid answer index and an explanation; template-style/meta questions ("what is the foundational definition of X") are rejected; grounded questions must overlap with the source text; near-duplicates (Jaccard > 0.6) are dropped; options are shuffled server-side. Generation runs in rounds of ≤ 12 questions until the requested count is reached.

**Providers:** generation tries Groq → OpenAI → Gemini (2 attempts each; Gemini rotates across models and across `GEMINI_API_KEYS`). Embeddings use **one** provider chosen up front (never mixed — vectors from different providers aren't comparable). If everything fails the API returns an error; it never fabricates questions.

---

## 🩺 Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| "No AI provider is configured" | Set `GROQ_API_KEY`, `OPENAI_API_KEY` or `GEMINI_API_KEY` in the server environment |
| "AI API key is invalid or expired" (401) | Check the key; make sure `GROQ_API_KEY` came from groq.com, not xAI |
| Quota / rate-limit message (429) | Add more keys via `GEMINI_API_KEYS` (separate projects), or add billing |
| All Gemini calls fail / model not found | Set `GEMINI_MODELS` / `GEMINI_OCR_MODELS` to models your key can use |
| "No study material found" after deploying this version | Older uploads had no owner — re-upload them |
| Image/scanned-PDF text is empty | Needs a Gemini key (OCR); check the image is legible |
| Server logs show per-provider errors | Search logs for `⚠️ groq` / `⚠️ openai` / `⚠️ Gemini` to see which provider is failing |

---

## 🔒 Security

- **Authentication**: Supabase JWT verified on every write API via `requireAuth` middleware (fail-closed)
- **CORS**: Allowlist only (no wildcard)
- **Headers**: Helmet security headers
- **Rate limiting**: (`trust proxy` enabled so limits are per-client behind Render/Vercel) 3 tiers — write APIs (30/15min), contact (10/hour), db-check (20/15min)
- **Data isolation**: study materials are scoped to the uploading user (another user's `materialId` returns 403)
- **Input validation**: File type filtering, count clamping (1–50), difficulty allowlist, topic/sourceReference sanitization
- **Server-authoritative scoring**: Client sends `selectedOption`; server compares against stored `correctAnswer` — clients cannot forge scores, and each question can only be scored once per player (no point farming by re-submitting)
- **Room safety**: only the original host account can reclaim a room code; room events are serialised per room so simultaneous answers never overwrite each other
- **Known limitation**: the question list (including correct answers) is sent to every client when a quiz starts, because the results screens need it — a determined player could read answers from dev tools. Revealing answers per question is on the roadmap
- **Error handling**: Production errors return generic messages; raw `error.message` never leaked to client
- **RLS**: PostgreSQL Row Level Security enabled on all tables (deny-all for PostgREST; backend uses privileged pool role)
- **SSL**: `rejectUnauthorized: true` by default for PostgreSQL connections

---

## 📬 Contact

Built with ❤️ by **Tanaya Pawar**

- GitHub: [@Tanaya-2007](https://github.com/Tanaya-2007)
- LinkedIn: [Tanaya Pawar](https://www.linkedin.com/in/tanaya-pawar-2b04892b8)
- Instagram: [@tanayapawar02](https://www.instagram.com/tanayapawar02/)
- Email: pawartanaya02@gmail.com

---

## 📄 License

MIT License — feel free to fork and adapt for your own quiz platform.