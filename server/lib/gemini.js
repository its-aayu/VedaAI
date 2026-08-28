import { GoogleGenAI, Type } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(ai, request, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (err) {
      const retryable = err.status === 503 || err.status === 429;
      if (!retryable || attempt === retries) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}

function pagesToParts(pages) {
  const parts = [];
  pages.forEach((page, index) => {
    parts.push({ text: `Page ${index + 1}:` });
    parts.push({
      inlineData: {
        mimeType: page.contentType,
        data: page.buffer.toString('base64'),
      },
    });
  });
  return parts;
}

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: {
            type: Type.STRING,
            description:
              'Question number/label as printed, WITHOUT any trailing punctuation (no trailing "." or ")"), e.g. "1", "11(a)", "3.ii"',
          },
          text: {
            type: Type.STRING,
            description: 'Full question text, excluding the leading number/label',
          },
          maxMarks: {
            type: Type.NUMBER,
            nullable: true,
            description: 'Marks allotted to this question if shown on the paper, else omit',
          },
        },
        required: ['number', 'text'],
      },
    },
  },
  required: ['questions'],
};

const QUESTION_PROMPT = `You are given page images of a printed question paper, in order.
Extract every question in the exact order they are printed.
Rules:
- Preserve the original numbering/labels exactly as printed (e.g. "1", "2", "11(a)", "11(b)").
- Treat labelled sub-parts of a question as SEPARATE entries, each with its own combined label (e.g. a question "11" with parts (a) and (b) becomes two entries: "11(a)" and "11(b)").
- Do not merge, skip, renumber, or invent questions.
- "text" must be the question text only, without the leading number/label.
- If marks are printed for a question (e.g. "[5]" or "(5 marks)"), put the number in maxMarks, otherwise omit it.
Return only the structured data.`;

export async function extractQuestions(questionPages) {
  const ai = getClient();
  const response = await generateWithRetry(ai, {
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: QUESTION_PROMPT }, ...pagesToParts(questionPages)],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: QUESTION_SCHEMA,
    },
  });
  const parsed = JSON.parse(response.text);
  return parsed.questions.map((q, i) => {
    const number = q.number.trim().replace(/\.$/, '');
    return {
      id: `q-${i}-${number}`,
      number,
      text: q.text,
      maxMarks: q.maxMarks ?? null,
    };
  });
}

const MAPPING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answerBlocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          page: {
            type: Type.INTEGER,
            description: '1-based page number (within the answer sheet pages provided) this block appears on',
          },
          questionNumber: {
            type: Type.STRING,
            description:
              'Exactly one of the provided valid question numbers that this handwritten block answers, or "" (empty string) if it does not correspond to any listed question',
          },
          text: {
            type: Type.STRING,
            description: 'Best-effort transcription of the handwritten content in this block',
          },
          bbox: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.INTEGER },
              xmin: { type: Type.INTEGER },
              ymax: { type: Type.INTEGER },
              xmax: { type: Type.INTEGER },
            },
            required: ['ymin', 'xmin', 'ymax', 'xmax'],
            description: 'Tight bounding box around just this block, normalized 0-1000 against the full page image',
          },
          continuesFromPreviousPage: {
            type: Type.BOOLEAN,
            description: 'True if this block is a continuation of the same question answered on an earlier page',
          },
        },
        required: ['page', 'questionNumber', 'text', 'bbox', 'continuesFromPreviousPage'],
      },
    },
    grades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.STRING },
          score: { type: Type.NUMBER },
          maxScore: { type: Type.NUMBER },
          correctness: {
            type: Type.STRING,
            enum: ['correct', 'partial', 'incorrect'],
          },
          feedback: {
            type: Type.STRING,
            description: 'Short (1-2 sentence) feedback on this answer',
          },
        },
        required: ['questionNumber', 'score', 'maxScore', 'correctness', 'feedback'],
      },
    },
  },
  required: ['answerBlocks', 'grades'],
};

function buildMappingPrompt(questions) {
  const list = questions.map((q) => `- "${q.number}": ${q.text}`).join('\n');
  return `You are given page images of a student's handwritten answer sheet, in order, and the list of valid questions below.

Valid questions:
${list}

Task:
1. Find every distinct handwritten answer block on every page (a contiguous handwritten response; a gap and resumption elsewhere counts as separate blocks, possibly continuing the same question).
2. For each block, pick the questionNumber it answers by matching handwritten labels (e.g. "Q1", "2)", "11 a") or content to EXACTLY one of the valid question numbers listed above (copy the label string exactly as given), or set questionNumber to "" if the block clearly does not correspond to any listed question.
3. Answers may appear out of printed order - match by label/content, not by position.
4. If an answer to the same question continues on a later page, use the same questionNumber on each block and set continuesFromPreviousPage to true on the later one(s).
5. Give a tight bbox (ints 0-1000, normalized against that page's full image) around just each block.
6. Transcribe each block's handwriting as accurately as you can into "text".
7. There is no answer key provided. For every question number that has at least one matched, non-empty answer block, produce one entry in "grades": judge the answer's correctness/completeness on your own subject knowledge, give a score out of a maxScore you choose to fit the question's apparent complexity (use small whole numbers, e.g. out of 2-10), a correctness label, and brief feedback. Do not include a grade for a question with no matched answer block.

Return only the structured data.`;
}

export async function mapAnswers(questions, answerPages) {
  const ai = getClient();
  const response = await generateWithRetry(ai, {
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: buildMappingPrompt(questions) }, ...pagesToParts(answerPages)],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: MAPPING_SCHEMA,
    },
  });
  return JSON.parse(response.text);
}
