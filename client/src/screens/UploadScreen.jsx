import { useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import Dropzone from '../components/Dropzone.jsx';
import { useSessionStore } from '../store/useSessionStore.js';
import { uploadSession, extractSession } from '../api.js';

export default function UploadScreen() {
  const questionPaperFile = useSessionStore((s) => s.questionPaperFile);
  const answerSheetFile = useSessionStore((s) => s.answerSheetFile);
  const setQuestionPaperFile = useSessionStore((s) => s.setQuestionPaperFile);
  const setAnswerSheetFile = useSessionStore((s) => s.setAnswerSheetFile);
  const setUploadResult = useSessionStore((s) => s.setUploadResult);
  const setExtractResult = useSessionStore((s) => s.setExtractResult);
  const setScreen = useSessionStore((s) => s.setScreen);
  const setError = useSessionStore((s) => s.setError);
  const [submitting, setSubmitting] = useState(false);

  const canStart = questionPaperFile && answerSheetFile && !submitting;

  async function handleStart() {
    setSubmitting(true);
    setScreen('loading');
    try {
      const uploadRes = await uploadSession(questionPaperFile, answerSheetFile);
      setUploadResult(uploadRes);
      const extractRes = await extractSession(uploadRes.sessionId);
      setExtractResult(extractRes);
    } catch (err) {
      setError(err.message || 'Something went wrong while processing your files.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">
        Upload{' '}
        <span className="rounded-md bg-orange-100 px-2 py-0.5 text-accent">
          Question Paper &amp; Answer Sheets
        </span>
      </h1>
      <p className="mt-2 text-sm text-gray-500">Upload both files to get started</p>

      <div className="mx-auto my-8 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 ring-4 ring-orange-50/60">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <GraduationCap size={26} className="text-accent" />
        </div>
      </div>

      <div className="flex gap-4 text-left">
        <Dropzone
          label="Max 10MB, PDF or images"
          labelAccent="Question Paper"
          file={questionPaperFile}
          onSelect={setQuestionPaperFile}
          onRemove={() => setQuestionPaperFile(null)}
        />
        <Dropzone
          label="Max 10MB, PDF or images"
          labelAccent="Answer Sheet"
          file={answerSheetFile}
          onSelect={setAnswerSheetFile}
          onRemove={() => setAnswerSheetFile(null)}
        />
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={handleStart}
        className="mx-auto mt-10 flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start Mapping <ArrowRight size={16} />
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">
        Once both files are uploaded, you&apos;ll be able to map answers with questions.
      </p>
    </div>
  );
}
