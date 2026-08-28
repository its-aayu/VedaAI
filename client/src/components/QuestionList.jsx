import { useState } from 'react';
import QuestionRow from './QuestionRow.jsx';
import { useSessionStore } from '../store/useSessionStore.js';

export default function QuestionList() {
  const questions = useSessionStore((s) => s.questions);
  const unmatchedAnswers = useSessionStore((s) => s.unmatchedAnswers);
  const selectedQuestionId = useSessionStore((s) => s.selectedQuestionId);
  const selectQuestion = useSessionStore((s) => s.selectQuestion);
  const [expandAll, setExpandAll] = useState(false);

  const answered = questions.filter((q) => q.status === 'answered').length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Extracted Questions <span className="font-normal text-gray-400">(from question paper)</span>
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-gray-400">
            {answered}/{questions.length} answered
          </span>
          <button
            type="button"
            onClick={() => setExpandAll((v) => !v)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {expandAll ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {questions.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            selected={q.id === selectedQuestionId}
            expanded={expandAll || q.id === selectedQuestionId}
            onSelect={(id) => selectQuestion(id, questions)}
          />
        ))}

        {unmatchedAnswers.length > 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500">
              Unmatched answers ({unmatchedAnswers.length})
            </p>
            <p className="mb-2 text-xs text-gray-400">
              Handwritten content found on the answer sheet that didn&apos;t match any extracted question.
            </p>
            <ul className="space-y-1.5">
              {unmatchedAnswers.map((a, i) => (
                <li key={i} className="rounded-md bg-gray-50 p-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Page {a.page}:</span> {a.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
