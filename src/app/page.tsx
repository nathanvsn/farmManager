'use client';

import dynamic from 'next/dynamic';

const GameMap = dynamic(() => import('@/components/Map/GameMap'), {
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100">Loading Map...</div>,
  ssr: false
});

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <GameMap />
      </div>
    </main>
  );
}
