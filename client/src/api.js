async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadSession(questionPaperFile, answerSheetFile) {
  const form = new FormData();
  form.append('questionPaper', questionPaperFile);
  form.append('answerSheet', answerSheetFile);
  const res = await fetch('/api/session', { method: 'POST', body: form });
  return handle(res);
}

export async function extractSession(sessionId) {
  const res = await fetch(`/api/session/${sessionId}/extract`, { method: 'POST' });
  return handle(res);
}

export function questionPageUrl(sessionId, n) {
  return `/api/session/${sessionId}/question-page/${n}`;
}

export function answerPageUrl(sessionId, n) {
  return `/api/session/${sessionId}/answer-page/${n}`;
}
