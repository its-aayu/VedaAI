import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  activeNav: 'Exams',
  setActiveNav: (activeNav) => set({ activeNav }),

  screen: 'upload', // 'upload' | 'loading' | 'mapping' | 'error'
  questionPaperFile: null,
  answerSheetFile: null,
  sessionId: null,
  questionPageCount: 0,
  answerPageCount: 0,
  questions: [],
  unmatchedAnswers: [],
  selectedQuestionId: null,
  activeSheet: 'answer', // 'question' | 'answer'
  currentQuestionPage: 1,
  currentAnswerPage: 1,
  errorMessage: null,

  setQuestionPaperFile: (file) => set({ questionPaperFile: file }),
  setAnswerSheetFile: (file) => set({ answerSheetFile: file }),

  setUploadResult: ({ sessionId, questionPageCount, answerPageCount }) =>
    set({ sessionId, questionPageCount, answerPageCount }),

  setScreen: (screen) => set({ screen }),
  setError: (message) => set({ screen: 'error', errorMessage: message }),

  setExtractResult: ({ questions, unmatchedAnswers }) =>
    set({
      screen: 'mapping',
      questions,
      unmatchedAnswers,
      selectedQuestionId: questions.find((q) => q.status === 'answered')?.id ?? questions[0]?.id ?? null,
      activeSheet: 'answer',
      currentAnswerPage: questions.find((q) => q.status === 'answered')?.answerRegions?.[0]?.page ?? 1,
    }),

  selectQuestion: (id, questions) =>
    set((state) => {
      const question = (questions || state.questions).find((q) => q.id === id);
      const firstRegion = question?.answerRegions?.[0];
      return {
        selectedQuestionId: id,
        activeSheet: 'answer',
        currentAnswerPage: firstRegion ? firstRegion.page : state.currentAnswerPage,
      };
    }),

  setActiveSheet: (sheet) => set({ activeSheet: sheet }),
  setCurrentQuestionPage: (n) => set({ currentQuestionPage: n }),
  setCurrentAnswerPage: (n) => set({ currentAnswerPage: n }),

  reset: () =>
    set({
      screen: 'upload',
      questionPaperFile: null,
      answerSheetFile: null,
      sessionId: null,
      questionPageCount: 0,
      answerPageCount: 0,
      questions: [],
      unmatchedAnswers: [],
      selectedQuestionId: null,
      activeSheet: 'answer',
      currentQuestionPage: 1,
      currentAnswerPage: 1,
      errorMessage: null,
    }),
}));
