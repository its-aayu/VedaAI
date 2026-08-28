import { ChevronDown } from 'lucide-react';

const correctnessStyles = {
  correct: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  partial: 'bg-amber-50 text-amber-600 border-amber-200',
  incorrect: 'bg-red-50 text-red-500 border-red-200',
};

function ScoreChip({ question }) {
  if (question.status === 'unanswered' || !question.grade) {
    return (
      <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-400">
        Not Answered
      </span>
    );
  }
  const { score, maxScore, correctness } = question.grade;
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
        correctnessStyles[correctness] || correctnessStyles.partial
      }`}
    >
      {score}/{maxScore}
    </span>
  );
}

// e.g. "11(a)" -> { base: "11", sub: "a" }; "3" -> { base: "3", sub: null }
export function parseQuestionNumber(number) {
  const match = /^(\d+)\s*\(?([a-zA-Z]+)\)?$/.exec(number.trim());
  if (!match) return { base: number, sub: null };
  return { base: match[1], sub: match[2] };
}

export default function QuestionRow({ question, selected, expanded, onSelect }) {
  const { base, sub } = parseQuestionNumber(question.number);

  return (
    <div
      onClick={() => onSelect(question.id)}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${sub ? 'ml-4' : ''} ${
        selected ? 'border-highlight bg-highlight-soft' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
            {sub || base}
          </span>
          <p className="text-sm text-gray-700">
            {sub && <span className="mr-1 text-xs font-medium text-gray-400">Q{base}</span>}
            {question.text}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScoreChip question={question} />
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {expanded && question.grade && (
        <div className="mt-3 rounded-md bg-orange-50 p-3">
          <p className="mb-1 text-xs font-semibold text-accent-dark">AI Feedback</p>
          <p className="text-xs text-gray-600">{question.grade.feedback}</p>
        </div>
      )}

      {expanded && question.status === 'unanswered' && (
        <p className="mt-3 text-xs text-gray-400">No matching answer was found for this question.</p>
      )}
    </div>
  );
}
