const sessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function createSession(id, data) {
  sessions.set(id, { ...data, createdAt: Date.now() });
}

export function getSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return null;
  }
  return session;
}

export function updateSession(id, patch) {
  const session = getSession(id);
  if (!session) return null;
  Object.assign(session, patch);
  return session;
}

function sweep() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

setInterval(sweep, 30 * 60 * 1000).unref();
