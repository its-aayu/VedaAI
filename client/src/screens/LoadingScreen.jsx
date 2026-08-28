import { Sparkles } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center">
      <Sparkles className="mb-4 text-accent" size={40} />
      <p className="text-lg font-medium text-ink">Extracting…</p>
      <p className="mt-1 text-sm text-gray-400">This may take a while</p>
    </div>
  );
}
