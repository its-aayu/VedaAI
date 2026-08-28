import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { fileToPages } from '../lib/pdfToImages.js';
import { extractQuestions, mapAnswers } from '../lib/gemini.js';
import { createSession, getSession, updateSession } from '../lib/sessionStore.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post(
  '/',
  upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const questionFile = req.files?.questionPaper?.[0];
      const answerFile = req.files?.answerSheet?.[0];
      if (!questionFile || !answerFile) {
        return res.status(400).json({ error: 'Both questionPaper and answerSheet files are required' });
      }

      const [questionPages, answerPages] = await Promise.all([
        fileToPages(questionFile),
        fileToPages(answerFile),
      ]);

      const id = uuid();
      createSession(id, { questionPages, answerPages, result: null });

      res.json({
        sessionId: id,
        questionPageCount: questionPages.length,
        answerPageCount: answerPages.length,
      });
    } catch (err) {
      console.error('Upload failed', err);
      res.status(500).json({ error: 'Failed to process uploaded files' });
    }
  }
);

function servePage(pages, index, res) {
  const page = pages?.[index];
  if (!page) return res.status(404).end();
  res.set('Content-Type', page.contentType);
  res.set('Cache-Control', 'private, max-age=3600');
  res.send(page.buffer);
}

router.get('/:id/question-page/:n', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found or expired' });
  servePage(session.questionPages, Number(req.params.n) - 1, res);
});

router.get('/:id/answer-page/:n', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found or expired' });
  servePage(session.answerPages, Number(req.params.n) - 1, res);
});

function buildResult(questions, mapping) {
  const blocksByQuestion = new Map();
  const unmatchedAnswers = [];

  for (const block of mapping.answerBlocks) {
    const key = (block.questionNumber || '').trim();
    if (!key) {
      unmatchedAnswers.push({
        page: block.page,
        bbox: block.bbox,
        text: block.text,
      });
      continue;
    }
    if (!blocksByQuestion.has(key)) blocksByQuestion.set(key, []);
    blocksByQuestion.get(key).push({
      page: block.page,
      bbox: block.bbox,
      text: block.text,
      continuesFromPreviousPage: !!block.continuesFromPreviousPage,
    });
  }

  const gradesByQuestion = new Map(mapping.grades.map((g) => [g.questionNumber.trim(), g]));

  const resultQuestions = questions.map((q) => {
    const regions = (blocksByQuestion.get(q.number.trim()) || []).sort((a, b) => a.page - b.page);
    const grade = gradesByQuestion.get(q.number.trim()) || null;
    return {
      ...q,
      status: regions.length > 0 ? 'answered' : 'unanswered',
      answerRegions: regions,
      grade: grade
        ? {
            score: grade.score,
            maxScore: grade.maxScore,
            correctness: grade.correctness,
            feedback: grade.feedback,
          }
        : null,
    };
  });

  return { questions: resultQuestions, unmatchedAnswers };
}

router.post('/:id/extract', async (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found or expired' });

  try {
    const questions = await extractQuestions(session.questionPages);
    const mapping = await mapAnswers(questions, session.answerPages);
    const result = buildResult(questions, mapping);

    updateSession(req.params.id, { result });

    res.json({
      questionPageCount: session.questionPages.length,
      answerPageCount: session.answerPages.length,
      ...result,
    });
  } catch (err) {
    console.error('Extraction failed', err);
    res.status(500).json({ error: 'Extraction failed', detail: err.message });
  }
});

export default router;
