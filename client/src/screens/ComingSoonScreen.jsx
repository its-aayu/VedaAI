import { Hourglass } from 'lucide-react';

export default function ComingSoonScreen({ label }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 ring-8 ring-orange-50/50">
        <Hourglass size={30} className="animate-[spin_2.5s_ease-in-out_infinite] text-accent" />
      </div>
      <p className="text-lg font-semibold text-ink">{label} is coming soon</p>
      <p className="mt-1 max-w-xs text-sm text-gray-400">
        We&apos;re still building this part of VedaAI. Head back to Exams to try question &amp; answer mapping.
      </p>
    </div>
  );
}
