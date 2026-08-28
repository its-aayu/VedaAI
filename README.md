# AI Assessment Extraction & Answer Mapping

A teacher uploads a question paper and a student's handwritten answer sheet
(PDF or images). The app extracts every question, extracts and transcribes
the student's answers, maps each answer to its question (even out of order),
highlights the **exact region** of the answer sheet where that answer
appears, and grades each answer with AI feedback — matching the flow in the
provided Figma design (Upload → Extracting → Question/Answer mapping).

## Features

- Upload a question paper + one student's answer sheet (PDF or PNG/JPG),
  with upload progress and processing state.
- Extracts every question in printed order, preserving original numbering.
- Splits labelled sub-parts into separate entries (e.g. `11(a)`, `11(b)`).
- Matches answers to questions **by label/content, not position** — so
  answers given out of order are still matched correctly.
- Flags questions with no matching answer as **Not Answered**.
- Flags handwritten content that doesn't match any question as an
  **unmatched answer**, shown separately.
- Draws a tight highlight box on the exact answer region for the selected
  question, on the correct page.
- Supports answers that span multiple pages (highlights each page's region
  and shows a "spans pages: …" hint).
- Per-question AI grading: score, correctness, and short feedback.

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
     matched question, using its own subject knowledge since no answer key
     is supplied.
   The server then groups blocks by question into `answerRegions`, marks
   questions with zero matched blocks as `unanswered`, and collects
   unmatched blocks into `unmatchedAnswers`.
3. **Render** — the frontend fetches the page images
   (`GET /api/session/:id/question-page/:n` and `/answer-page/:n`) and draws
   the highlight overlay by converting the normalized bbox to a percentage
   position over the displayed image, so it stays correct at any zoom/size.

## AI model/API used

**Google Gemini** (`gemini-3.1-flash-lite` by default, configurable via
`GEMINI_MODEL`), via the `@google/genai` SDK. Chosen over Groq because
Gemini does native multimodal handwriting OCR *and* native bounding-box
grounding — it returns a region's coordinates directly, which is exactly
what "highlight the exact answer region" requires. Get a free key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey).

The flash-lite variant is used instead of full `flash` because, at the time
of building this, the free tier's `gemini-3.5-flash` quota was capped at
just 20 requests/day/project — too low for a live demo that will be tested
repeatedly — while the lite variant's free quota is high enough for normal
use. Gemini calls are wrapped with retry/backoff for transient `429`/`503`
responses, which the free tier returns occasionally under load.

## Assumptions & limitations

- No answer key is uploaded, so grading reflects the model's own judgment of
  correctness/completeness, not a rubric the teacher provided.
- One question paper + one student's answer sheet per session; sessions live
  in memory and expire after 2 hours (nothing persists across a server
  restart, by design — no database per the assignment constraints).
- Handwriting legibility limits OCR/matching accuracy, as with any OCR
  system; very poor handwriting or heavy cross-outs may be transcribed
  incorrectly or left unmatched.
- Question matching relies on the student having labelled their answers
  (e.g. "Q1", "2)", "11 a"); a completely unlabelled answer may be classified
  as unmatched even if a human grader could infer its target from content.
- Free-tier Gemini rate limits mean extraction can occasionally take a
  couple of retries (handled automatically) or, in rare cases, fail if the
  daily quota is exhausted — see the model note above.

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
- A free Gemini API key (see below).

## Getting a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Sign in with a Google account and click **Create API key** (free tier,
   no billing required).
3. Copy the key — you'll paste it into `server/.env` below.

## Running locally

```bash
# 1. Clone/enter the project, then install everything (root + client + server)
npm install

# 2. Configure your API key
cp server/.env.example server/.env
# open server/.env and set:
#   GEMINI_API_KEY=your_key_here

# 3. Start the backend (http://localhost:3001)
npm run dev:server

# 4. In a second terminal, start the frontend (http://localhost:5173)
npm run dev:client
```

Open **http://localhost:5173** in your browser — the Vite dev server proxies
any `/api/*` request to the Express server on port 3001, so both must be
running. Upload a question paper and an answer sheet to try the full flow.

To stop either process, `Ctrl+C` in its terminal.

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
| `GEMINI_API_KEY` | Yes | — | From aistudio.google.com/apikey |
| `GEMINI_MODEL` | No | `gemini-3.1-flash-lite` | Any Gemini model your key can access |
| `PORT` | No | `3001` | Port the Express server listens on |

## Running the production build locally

This is the same thing a host like Render runs — useful to sanity-check
before deploying:

```bash
npm install
npm run build   # builds client/dist
npm start       # one process serves the built frontend + /api on $PORT
```

Then open **http://localhost:3001** (or your `$PORT`) — no separate frontend
dev server needed in this mode.

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
