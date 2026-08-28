import { useSessionStore } from './store/useSessionStore.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import UploadScreen from './screens/UploadScreen.jsx';
import LoadingScreen from './screens/LoadingScreen.jsx';
import MappingScreen from './screens/MappingScreen.jsx';
import ComingSoonScreen from './screens/ComingSoonScreen.jsx';

export default function App() {
  const activeNav = useSessionStore((s) => s.activeNav);
  const screen = useSessionStore((s) => s.screen);
  const errorMessage = useSessionStore((s) => s.errorMessage);
  const reset = useSessionStore((s) => s.reset);

  return (
    <div className="flex h-screen bg-[#f6f6f8]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-auto">
          {activeNav !== 'Exams' && <ComingSoonScreen label={activeNav} />}
          {activeNav === 'Exams' && screen === 'upload' && <UploadScreen />}
          {activeNav === 'Exams' && screen === 'loading' && <LoadingScreen />}
          {activeNav === 'Exams' && screen === 'mapping' && <MappingScreen />}
          {activeNav === 'Exams' && screen === 'error' && (
            <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
              <p className="mb-2 text-lg font-medium text-ink">Something went wrong</p>
              <p className="mb-6 text-sm text-gray-500">{errorMessage}</p>
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white"
              >
                Try again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
