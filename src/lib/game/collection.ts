/* ============================================================
 * PENJAGA MASJID — Helper layar KOLEKSI (P8)
 * Membuka/menutup overlay koleksi + memuat data localStorage
 * ke store secara sinkron (bebas setState-in-effect & bebas
 * impor melingkar: modul ini boleh diimpor komponen mana pun).
 * ============================================================ */

import { useGameStore } from './store'
import { getOwnedChars, getStarCurrency } from './achievements'
import { loadCustomChars } from './roster'

/** Buka layar koleksi: muat data + jeda game bila sedang bermain. */
export function openCollection() {
  const st = useGameStore.getState()
  const shouldPause = st.screen === 'playing' && !st.paused
  useGameStore.setState({
    collectionOpen: true,
    collOwned: ['hero-ali', 'hero-aisyah', ...getOwnedChars()],
    collCurrency: getStarCurrency(),
    collCustoms: loadCustomChars(),
    ...(shouldPause ? { paused: true, collPausedByUs: true } : { collPausedByUs: false }),
  })
}

/** Tutup layar koleksi: restore jeda bila dilayari dari gameplay. */
export function closeCollection() {
  const st = useGameStore.getState()
  useGameStore.setState({
    collectionOpen: false,
    ...(st.collPausedByUs ? { paused: false, collPausedByUs: false } : {}),
  })
}

/** Segarkan data koleksi (setelah beli / hapus custom). */
export function refreshCollData() {
  useGameStore.setState({
    collOwned: ['hero-ali', 'hero-aisyah', ...getOwnedChars()],
    collCurrency: getStarCurrency(),
    collCustoms: loadCustomChars(),
  })
}
