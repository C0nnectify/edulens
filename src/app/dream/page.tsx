import { Suspense } from 'react';
import DreamChatClient from './DreamChatClient';

export const metadata = {
  title: 'Dream — Edulens',
};

function DreamLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
      Loading…
    </div>
  );
}

export default function DreamPage() {
  return (
    <Suspense fallback={<DreamLoading />}>
      <DreamChatClient />
    </Suspense>
  );
}
