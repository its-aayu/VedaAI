# VedaAI — AI-assisted assessment review

VedaAI is a prototype that helps teachers review handwritten assessments.
Upload a question paper and one student's answer sheet; the app uses AI to
extract the questions, transcribe and match answers (including answers written
out of order), and highlight where those answers appear on the original pages.
It also provides suggested marks and feedback for the teacher to review.

The goal is to reduce the time spent finding and organizing answers—not to
replace a teacher or make final grading decisions. AI can misread handwriting,
match an answer incorrectly, or suggest an inaccurate grade. Review all
transcriptions, matches, and marks before using them.

## Features

- Upload a question paper and one student's answer sheet (PDF or PNG/JPG),
  with upload progress and processing state.
- Extracts every question in printed order, preserving original numbering.
- Splits labelled sub-parts into separate entries (e.g. `11(a)`, `11(b)`).
- Matches answers to questions **by label/content, not position** — so
  answers given out of order are still matched correctly.
- Flags questions with no matching answer as **Not Answered**.
- Flags handwritten content that doesn't match any question as an
  **unmatched answer**, shown separately.
- Draws an AI-estimated highlight box around the answer region for the
  selected question, on the correct page.
- Supports answers that span multiple pages (highlights each page's region
  and shows a "spans pages: …" hint).
- Per-question AI grading suggestions: score, correctness, and short feedback.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), Tailwind CSS v4, Zustand, react-dropzone, lucide-react |
| Backend | Node.js, Express, Multer (in-memory uploads) |
| PDF/image rendering | `pdfjs-dist` + `@napi-rs/canvas` (PDF pages → PNG) |
| AI | Google Gemini (`@google/genai` SDK) |
| Storage | In-memory only — no database |

## How it works

1. **Upload** (`POST /api/session`) — both files are accepted as multipart
   form data. Each PDF is rendered page-by-page into PNG images
   (`pdfjs-dist` + `@napi-rs/canvas`); plain images are used as-is. Pages are
   kept in memory, keyed by a generated `sessionId` (sessions expire after 2
   hours).
2. **Extract** (`POST /api/session/:id/extract`) — runs two Gemini calls:
   - **Question extraction**: the question paper's page images are sent with
     a JSON schema requesting an ordered list of `{ number, text, maxMarks }`,
     splitting sub-parts into separate entries.
   - **Answer mapping + grading**: the answer sheet's page images, plus the
     question list from step 1, are sent in one request. Gemini returns
     every handwritten block it finds, each with the question number it
     matches (or none), a transcription, a normalized bounding box
     (`0–1000`) for highlighting, and a flag for answers continuing from a
     previous page — plus a grade (score/correctness/feedback) for every
     matched question. Since no answer key or rubric is supplied, these
     grades are suggestions based on the model's own judgment.
   The server then groups blocks by question into `answerRegions`, marks
   questions with zero matched blocks as `unanswered`, and collects
   unmatched blocks into `unmatchedAnswers`.
3. **Render** — the frontend fetches the page images
   (`GET /api/session/:id/question-page/:n` and `/answer-page/:n`) and draws
   the highlight overlay by converting the normalized bbox to a percentage
   position over the displayed image, so it stays correct at any zoom/size.

## AI model/API used

The backend uses Google Gemini through the `@google/genai` SDK. The default
model is `gemini-3.1-flash-lite`; set `GEMINI_MODEL` to use another model
available to your API key. Gemini receives the uploaded page images to
analyze their printed and handwritten content. See Google's current API
terms, pricing, and quotas before using the service with real student work.

## Assumptions & limitations

- No answer key or teacher-defined rubric is used. Suggested grades reflect
  the model's judgment of correctness and completeness and may be inaccurate.
- This prototype does not provide teacher accounts, class management,
  persistent assessment history, or a workflow for approving final grades.
- One question paper + one student's answer sheet per session; sessions live
  in server memory and expire after 2 hours. A server restart clears active
  sessions; there is no database or saved assessment history.
- Uploaded page images are sent to the configured Gemini API for analysis.
  Do not upload identifiable student work unless you have checked your
  organization's policies, applicable privacy requirements, and the AI
  provider's data-handling terms.
- Handwriting legibility limits OCR/matching accuracy, as with any OCR
  system; very poor handwriting or heavy cross-outs may be transcribed
  incorrectly or left unmatched.
- Question matching relies on the student having labelled their answers
  (e.g. "Q1", "2)", "11 a"); a completely unlabelled answer may be classified
  as unmatched even if a human grader could infer its target from content.
- Gemini API rate limits or quota availability can delay or prevent analysis.
  Transient `429` and `503` errors are retried automatically, but some failures
  may require trying again later or checking your API account's quota.

## Project structure

```
VedaAI/
├── render.yaml                 # Render deployment blueprint
├── package.json                # root workspace scripts (build/start/dev)
├── server/                     # Express API
│   ├── index.js                # app entry: serves client/dist + /api
│   ├── .env.example            # copy to .env and fill in your API key
│   ├── routes/
│   │   └── session.js          # upload, page-image, extract endpoints
│   └── lib/
│       ├── pdfToImages.js      # PDF/image -> page PNG buffers
│       ├── gemini.js           # Gemini client, prompts, schemas
│       └── sessionStore.js     # in-memory session map (TTL cleanup)
└── client/                     # React (Vite) frontend
    └── src/
        ├── App.jsx             # screen state machine
        ├── api.js              # fetch helpers
        ├── store/useSessionStore.js
        ├── screens/            # UploadScreen, LoadingScreen, MappingScreen
        └── components/         # Dropzone, QuestionList, QuestionRow,
                                 # PageViewer, HighlightOverlay
```

## Prerequisites

- Node.js 20+ (tested on Node 24) and npm.
- A Gemini API key (see below; check the provider's current pricing and
  account requirements).

## Get a Gemini API key

1. Visit [Google AI Studio API keys](https://aistudio.google.com/apikey).
2. Sign in and create or select an API key.
3. Keep the key private. Add it to `server/.env` as described below; do not
   commit that file or expose the key in frontend code.

## Run locally

From the project root, install the dependencies:

```sh
npm install
```

Create `server/.env` by copying `server/.env.example`, then edit it and set
your API key:

```dotenv
GEMINI_API_KEY=your_api_key_here
```

For PowerShell on Windows:

```powershell
Copy-Item server\.env.example server\.env
```

For macOS/Linux:

```sh
cp server/.env.example server/.env
```

Start the backend in one terminal:

```sh
npm run dev:server
```

Start the frontend in a second terminal:

```sh
npm run dev:client
```

Open **http://localhost:5173**. The Vite development server proxies API
requests to the backend at **http://localhost:3001**, so keep both processes
running. Upload a question paper and an answer sheet to try the workflow.

Stop each process with `Ctrl+C` in its terminal.

### Available scripts (run from the project root)

| Command | What it does |
|---|---|
| `npm install` | Installs dependencies for the root, `client`, and `server` workspaces |
| `npm run dev:server` | Starts the Express API with auto-restart on file changes (port 3001) |
| `npm run dev:client` | Starts the Vite dev server with HMR (port 5173, proxies `/api` to :3001) |
| `npm run build` | Builds the React app into `client/dist` |
| `npm start` | Runs the production server (serves `client/dist` + `/api` on `$PORT`, default 3001) |

### Environment variables (`server/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Any Gemini model your key can access |
| `PORT` | No | `3001` | Port the Express server listens on |

## Running the production build locally

This builds the frontend and serves it and the API from one Node.js process:

```bash
npm install
npm run build   # builds client/dist
npm start       # one process serves the built frontend + /api on $PORT
```

Then open **http://localhost:3001** (or the configured `PORT`). No separate
frontend development server is needed in this mode.

## Deploying

The app is a single Node service (it serves the built frontend itself), so
it deploys anywhere that can run `npm install && npm run build` then
`npm start` with `GEMINI_API_KEY` set as an environment variable. A
`render.yaml` blueprint is included for Render:

1. Push this repo to GitHub.
2. On [Render](https://render.com), **New → Blueprint**, point it at the
   repo — it will read `render.yaml` automatically.
3. When prompted, set `GEMINI_API_KEY` (marked `sync: false` in the
   blueprint so Render asks for it rather than storing it in git).
4. Deploy — Render runs the build/start commands above and gives you a live
   URL.

Any other Node host (Railway, Fly.io, a VPS, etc.) works the same way:
install → build → start, with `GEMINI_API_KEY` set in the environment.

## API reference

| Method & path | Purpose |
|---|---|
| `POST /api/session` | Multipart upload: `questionPaper` + `answerSheet` files. Returns `{ sessionId, questionPageCount, answerPageCount }` |
| `GET /api/session/:id/question-page/:n` | Streams page `n` (1-based) of the question paper as an image |
| `GET /api/session/:id/answer-page/:n` | Streams page `n` (1-based) of the answer sheet as an image |
| `POST /api/session/:id/extract` | Runs the Gemini pipeline; returns `{ questions[], unmatchedAnswers[] }` |
| `GET /api/health` | Liveness check |
