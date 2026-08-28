import { useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { questionPageUrl, answerPageUrl } from '../api.js';
import { useSessionStore } from '../store/useSessionStore.js';
import HighlightOverlay from './HighlightOverlay.jsx';

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

export default function PageViewer({ selectedQuestion }) {
  const sessionId = useSessionStore((s) => s.sessionId);
  const questionPageCount = useSessionStore((s) => s.questionPageCount);
  const answerPageCount = useSessionStore((s) => s.answerPageCount);
  const activeSheet = useSessionStore((s) => s.activeSheet);
  const setActiveSheet = useSessionStore((s) => s.setActiveSheet);
  const currentQuestionPage = useSessionStore((s) => s.currentQuestionPage);
  const currentAnswerPage = useSessionStore((s) => s.currentAnswerPage);
  const setCurrentQuestionPage = useSessionStore((s) => s.setCurrentQuestionPage);
  const setCurrentAnswerPage = useSessionStore((s) => s.setCurrentAnswerPage);
  const [zoom, setZoom] = useState(100);

  const isAnswer = activeSheet === 'answer';
  const page = isAnswer ? currentAnswerPage : currentQuestionPage;
  const pageCount = isAnswer ? answerPageCount : questionPageCount;
  const setPage = isAnswer ? setCurrentAnswerPage : setCurrentQuestionPage;
  const imageUrl = isAnswer ? answerPageUrl(sessionId, page) : questionPageUrl(sessionId, page);

  const regionsOnPage =
    isAnswer && selectedQuestion
      ? (selectedQuestion.answerRegions || []).filter((r) => r.page === page)
      : [];

  const answerPagesForQuestion = new Set((selectedQuestion?.answerRegions || []).map((r) => r.page));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveSheet('question')}
            className={`rounded-full px-3 py-1 ${!isAnswer ? 'bg-white shadow-sm font-medium text-ink' : 'text-gray-500'}`}
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('answer')}
            className={`rounded-full px-3 py-1 ${isAnswer ? 'bg-white shadow-sm font-medium text-ink' : 'text-gray-500'}`}
          >
            Answer Sheet
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1 rounded-full border border-gray-200 px-1 py-0.5">
            <button
              type="button"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
              className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-30"
              aria-label="Zoom out"
            >
              <Minus size={13} />
            </button>
            <span className="w-9 text-center text-xs">{zoom}%</span>
            <button
              type="button"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
              className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-30"
              aria-label="Zoom in"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {pageCount || 1}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isAnswer && answerPagesForQuestion.size > 1 && (
        <p className="mb-2 text-xs text-highlight">
          This answer spans pages: {[...answerPagesForQuestion].sort((a, b) => a - b).join(', ')}
        </p>
      )}

      <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="relative mx-auto" style={{ width: `${(576 * zoom) / 100}px`, maxWidth: 'none' }}>
          {sessionId && pageCount > 0 && (
            <img src={imageUrl} alt={`${isAnswer ? 'Answer' : 'Question'} sheet page ${page}`} className="w-full rounded shadow-sm" />
          )}
          <HighlightOverlay regions={regionsOnPage} label={selectedQuestion?.number} />
        </div>
      </div>
    </div>
  );
}
