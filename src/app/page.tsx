'use client'

import dynamic from 'next/dynamic'

const GameShell = dynamic(() => import('@/components/game/GameShell'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky-200 to-emerald-100">
      <div className="animate-bounce text-7xl">🕌</div>
      <p className="rounded-full bg-white/80 px-6 py-2 text-lg font-black text-emerald-700 shadow-md">
        Menyiapkan masjid... ⭐
      </p>
    </div>
  ),
})

export default function Home() {
  return <GameShell />
}
