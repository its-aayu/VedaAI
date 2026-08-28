import { RotateCcw } from 'lucide-react';
import QuestionList from '../components/QuestionList.jsx';
import PageViewer from '../components/PageViewer.jsx';
import { useSessionStore } from '../store/useSessionStore.js';

export default function MappingScreen() {
  const questions = useSessionStore((s) => s.questions);
  const selectedQuestionId = useSessionStore((s) => s.selectedQuestionId);
  const reset = useSessionStore((s) => s.reset);
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">
          <span className="text-accent">Question</span> - Answer mapping
        </h1>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
        >
          <RotateCcw size={13} /> New upload
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        <div className="min-h-0 rounded-xl border border-gray-200 bg-white p-4">
          <QuestionList />
        </div>
        <div className="min-h-0 rounded-xl border border-gray-200 bg-white p-4">
          <PageViewer selectedQuestion={selectedQuestion} />
        </div>
      </div>
    </div>
  );
}
