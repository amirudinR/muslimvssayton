# Worklog — PENJAGA MASJID: Anak Sholeh vs Setan Jahil (3D Tower Defense)

Proyek: Game 3D Tower Defense ramah anak bertema islami-ceria dibangun di Next.js 16 (App Router) + Three.js.

---
Task ID: 1
Agent: main-agent (Z.ai Code)
Task: Setup awal — install dependensi game & inisialisasi worklog

Work Log:
- Cek struktur proyek Next.js 16 (App Router, Tailwind 4, shadcn/ui lengkap, Zustand tersedia).
- Pastikan dev server jalan di port 3000 (HTTP 200) dan baca dev.log (bersih).
- Install: three@0.185.1, gsap@3.15.0, @types/three@0.185.4 (dev).
- Rencana arsitektur:
  - src/lib/game/data.ts — definisi karakter (5 anak sholeh), musuh (6 setan lucu), 10 wave, lane jalur, slot tower, tips edukatif.
  - src/lib/game/store.ts — Zustand store untuk state UI (screen, pahala, HP masjid, wave, kamera, dsb).
  - src/lib/game/audio.ts — SFX & BGM ceria via Web Audio API sintetis (tanpa file audio eksternal).
  - src/lib/game/models.ts — model 3D prosedural (masjid kubah emas, karakter chibi, setan lucu, taman).
  - src/lib/game/particles.ts — VFX pooling (sparkle emas, poof ungu, confetti, bintang kliyengan).
  - src/lib/game/entities.ts — Enemy/Tower/Projectile + logika combat.
  - src/lib/game/camera.ts — 3 mode kamera (iso, ikuti karakter, foto) + transisi GSAP bouncy.
  - src/lib/game/engine.ts — GameEngine inti (scene, bloom, wave manager, placement, screenshot).
  - src/components/game/* — UI React ramah anak (menu, HUD, kartu karakter, layar akhir).
  - Catatan performa: multi-part chibi karakter tidak praktis pakai InstancedMesh; ganti dengan object pooling + shared geometry/material cache (setara tujuan performa).

Stage Summary:
- Dependensi game siap; worklog dibuat; arsitektur ditetapkan. Lanjut ke penulisan modul inti.

---
Task ID: 2-13
Agent: main-agent (Z.ai Code)
Task: Implementasi lengkap game 3D Tower Defense "PENJAGA MASJID" + QA via agent-browser

Work Log:
- Menulis seluruh modul game (frontend-first, tanpa server — game full client-side Three.js):
  - src/lib/game/data.ts — 5 karakter (Ali/Aisyah/Umar/Fatimah/Kakek), 6 setan lucu (pocong/kunti/genderuwo/tuyul/wewe/banaspati), 10 wave + boss, 3 lane jalur, 19 slot, tips edukatif.
  - src/lib/game/store.ts — Zustand store (screen, pahala, HP masjid, wave, kamera, toast, fun fact, unlock, stats).
  - src/lib/game/audio.ts — SFX & BGM ceria sintetis Web Audio (pop, tada, giggle, coin, adzan chime, cheer, fireworks, BGM pentatonik marimba + kicau burung).
  - src/lib/game/models.ts — model prosedural: masjid (kubah emas metalik + menara + lampu hias emissive + air mancur), chibi anak sholeh (kepala besar, wajah imut, aksesori unik per karakter), setan versi lucu, pohon/bunga(merged 1 draw call)/awan/burung/kupu-kupu, slot pad, proyektil.
  - src/lib/game/particles.ts — VFX pooling: 4 pool THREE.Points (glow/cloud/star/confetti) via custom shader (1 draw call/pool), ring FX pool, damage number sprite pool (canvas texture + font bulat).
  - src/lib/game/entities.ts — Enemy (animasi per tipe: pocong loncat, kunti melayang+buff ketawa, genderuwo waddle, tuyul zigzag+curi pahala, wewe kabur malu-malu, banaspati api+shockwave), Tower (serangan orb/bubble/coin/aura/adzan, upgrade visual), Projectile (homing/arc), EntityManager.
  - src/lib/game/camera.ts — 5 mode kamera (menu orbit, iso pan/zoom, follow bouncy, photo orbit bebas, boss intro) + transisi GSAP elastic/back.
  - src/lib/game/engine.ts — GameEngine: scene, lighting, PMREM environment, bloom+vignette+OutputPass, wave manager, placement drag&drop + raycast slot, upgrade/sell/follow, screenshot (mode foto), victory (kembang api + menari), game over lembut, quality Low/Med/High, ambient hidup (anak jalan-jalan, burung, kupu-kupu, awan, aura kubah).
- UI React ramah anak (src/components/game/*): MainMenu (judul besar, MULAI, kualitas, footer sticky), Hud (HP masjid, pahala, wave, boss bar, banner, countdown+MULAI GELOMBANG, kontrol kamera/speed/pause/sound), CharacterBar (kartu besar + drag&drop + ghost kursor + preview 3D mini CharPreview), TowerPanel (upgrade/ikuti/jual), EndScreens (victory/gameover lembut/pause/foto), toast & fun fact modal — semua framer-motion bouncy, font Fredoka (next/font), palet krem/hijau pastel/emas, tombol chunky "bisa ditekan".
- page.tsx: dynamic import ssr:false + loading screen lucu. layout.tsx: metadata + viewport + Fredoka. globals.css: kelas game (panel-cute, btn-cute*, card-char) + animasi (bounce-soft, spin-slow, wiggle) + scrollbar lucu.

QA & BUGFIX (via agent-browser + VLM screenshot):
1. [FIX] Object3D.clone() JSON round-trip merusak userData.parts → referensi mati. Solusi: beri .name pada tiap bagian, resolve ulang via traverse setelah clone (collectNamed/collectListed).
2. [FIX] Postprocessing tanpa OutputPass → bloom meledak putih (tone mapping/sRGB tidak diterapkan). Solusi: tambah OutputPass di akhir rantai.
3. [FIX] Over-lighting (rumput 253,253,253) → sun 2.4→1.5, hemi 0.85→0.45, fill 0.55→0.25, environmentIntensity 0.3, dome light 26→12, bloom threshold 1.05. Hasil: rumput hijau (186,211,160), kubah emas, exposure seimbang.
4. [FIX] MainMenu capture engine di render-time (null saat pertama) → klik MULAI tidak berfungsi. Solusi: getEngine() dipanggil di dalam handler (diterapkan ke semua komponen).
5. [FIX] Deprecated THREE.Clock → akumulator elapsed; PCFSoftShadowMap → PCFShadowMap.
6. [FIX] Rules of Hooks (useEffect setelah early return) di CharacterBar; setState-in-effect lint di Hud/CharacterBar.
7. [FIX] Tombol jeda kiri-bawah ditutup badge dev-tools Next.js → dihapus (jeda sudah ada di bar atas).
8. [FIX] Typo >> di TowerPanel.
- Refactor: loop → simTick(dt) + advance(seconds) publik untuk QA otomatis (simulasi tanpa render — penting karena screenshot headless tidak menangkap WebGL; gunakan probe window.__pmEngine/__pmStore/__THREE + snapshot canvas 2D overlay .pm-snap).
- Balance tuning ramah anak: startPahala 160→180, mosqueMaxHp 100→120, damage pocong 4→3.

VERIFIKASI GOLDEN PATH (semua via UI nyata + probe):
- ✓ Menu → klik MULAI BERMAIN → playing (pahala 180, HP 120, cam iso).
- ✓ Pilih kartu Ali → klik slot → tower terpasang (snap bounce, pahala berkurang).
- ✓ Wave 1: spawn pocong, tower menyerang, kill reward +8, wave complete +24, countdown wave 2.
- ✓ Leak → damage masjid + goyang lucu + toast; game over lembut "Yuk Coba Lagi!" + setan lari senang.
- ✓ Restart via tombol Coba Lagi.
- ✓ Unlock umar/fatimah/kakek sesuai wave + modal fun fact.
- ✓ Full run 10 wave (10 tower L3 + 2 kakek): HP 100/100, boss Banaspati kalah, VICTORY "ALHAMDULILLAH!" + kembang api + stats.
- ✓ Upgrade tower via UI (L1→L2), jual tower (refund, slot bebas), follow camera, photo mode (masuk/keluar/Jepret → toast), speed 1x/2x, pause/resume, rotate camera, quality, sound.
- ✓ Lint bersih, dev.log bersih, halaman 200, tanpa runtime error.

Stage Summary:
- Game lengkap & playable end-to-end (menu → 10 wave → boss → victory/try-again).
- Semua fitur spesifikasi terpenuhi: 5 karakter unik 3 level, 6 setan lucu khas cerita rakyat, kamera 3 mode + foto + screenshot, VFX ceria (poof ungu, confetti, bintang kliyengan, aura masjid), audio prosedural, tips edukatif + fun fact, speed 1x/2x, quality Low/Med/High, UI ikon-besar ramah anak, pesan positif saat kalah.
- Probe debug tersedia: window.__pmEngine (engine), window.__pmStore (store), window.__THREE, engine.advance(seconds) untuk majukan simulasi tanpa render.
- Catatan lingkungan QA: browser headless SwiftShader ~4fps & screenshot tidak menangkap canvas WebGL — verifikasi visual pakai trik salin frame ke canvas 2D (kelas .pm-snap).

Unresolved issues / risks & rekomendasi fase berikutnya:
- Balance perlu playtest nyata lebih lanjut (HP masjid, harga upgrade, HP scaling boss).
- Mobile touch: pointer events sudah dipakai, tapi perlu uji device asli (drag & drop di tablet).
- Ide pengembangan: mini-service leaderboard/HighScore (wajib route / tetap satu), simpan progres localStorage, karakter tambahan (Misbah si Muadzin?), setan baru (kuyang, palasik), power-up doa kolektif, mode tantangan harian, pilihan bahasa ID/EN.
- Bisa tambah pre-rendered audio file bila ingin kualitas musik lebih kaya (saat ini sintetis).
