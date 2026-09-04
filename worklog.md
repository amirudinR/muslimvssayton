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

---
Task ID: 2-b s/d 9-b (main round)
Agent: main-agent (Z.ai Code)
Task: QA menyeluruh + perbaikan bug styling + fitur baru besar (Doa Bersama, Kuyang, lencana, rekor, leaderboard, star rating) + polish UI

Task ID: 7-a (delegated)
Agent: full-stack-developer (subagent)
Task: Backend leaderboard (Prisma ScoreEntry + API route /api/leaderboard GET/POST + pruning + validasi + seed 5 entri)
(Catatan: entri worklog subagent tidak tersimpan di file — hasilnya diverifikasi & dipakai langsung oleh main-agent; detail lihat Task 7-b di bawah.)

Work Log (main-agent):
QA FASE AWAL (agent-browser + VLM):
- Golden path lama tetap sehat: menu → main → place tower → wave → unlock → victory/gameover → restart; 0 console error; dev.log bersih.
- Temuan QA: (1) baris instruksi menu tertutup objek 3D gelap (alpha bg), (2) deskripsi menu kontras rendah, (3) banner wave kontras di atas kubah emas, (4) langit "washed out", (5) HP bar memakai max=100 padahal mosqueMaxHp=120 (bug tampilan: bar penuh di 100/120), (6) menu terlalu tinggi di viewport pendek (577px) — tombol bawah terpotong.

FITUR BARU:
- persist.ts (baru): localStorage "penjaga-masjid-save-v1" (playerName, bestStars, bestPahala, bestWave, gamesPlayed, wins, totalDefeated, totalStars, totalDuaUsed, achievements[]) + computeStars(hp/max: >=85% → 3, >=60% → 2, else 1).
- data.ts: EnemyId + 'kuyang' (Kuyang Melayang Lucu 🎈 hp24 speed2.15 dmg4 reward12 flying+slowImmune); flag flying/slowImmune di EnemyDef; wave 6-9 + boss wave ditambah grup kuyang; DUA_CONST (charge 100, perKill 7, perWave 12, durasi 12s, dmg ×1.6, rate ×0.65, enemySlow 0.55, heal 8).
- store.ts: state duaCharge/duaReady/duaActive + resultStars/duaUsedThisGame/scoreSubmitted/badgeToast + aksi (addDuaCharge dengan toast saat penuh, consumeDuaCharge, tickDuaActive, dst.) + reset di resetForNewGame.
- models.ts: model kuyang (kepala bulat imut + rambut + poni + pita kuning + sayap kecil kepak + helai rambut bergoyang + wajah pipi merona) — parts wingL/wingR/ribbon/strands di-resolve via collectNamed/collectListed.
- entities.ts: kuyang terbang (y ~1.15 + bob, sway lateral, kepakan sayap, goyang rambut/pita); slowImmune di takeDamage; ManagerCtx.duaActiveUntil + manager.activateDuaBlessing(duration)/duaBlessed; Tower damage ×1.6 & fireRate ×0.65 saat diberkati (semua tipe serangan: orb/bubble/coin/aura/adzan) + duaGlow ring emas berputar di kaki tiap tower.
- audio.ts: duaBlessing() — arpeggio harpa naik + bel + sorak.
- engine.ts: activateDua() (buff tower, slow semua setan kecuali kuyang, heal masjid +8, VFX ring besar dari kubah + adzanWave + sparkleRise ×10 + ring di tiap tower, overlay DOM .dua-glow-overlay, toast); countdown duaActive di simTick + auto clear overlay + toast selesai; charge per kill/wave via onEnemyKilled/onWaveComplete; bintang rating di onVictory (computeStars → resultStars); checkBadges di kill/wave/place/dua/victory/gameover; recordSessionEnd; clearDuaOverlay di startGame/dispose/victory/gameover; guard tryPlace hanya saat playing; langit 0xa9e2ff→0x8fd4ff.
- achievements.ts (baru): 12 lencana (first_tower, kills_10/50/150, wave_5, first_win, perfect_win, dua_1, dua_5, pahala_1000, squad_8, kuyang) + checkBadges(event) + toast lucu + persist; getRecords()/setPlayerName().
- UI: DuaButton.tsx (baru) — tombol bulat emas 🤲 kiri-tengah + meter vertikal + badge countdown + animasi glow saat siap; BadgeToastLayer. MenuModals.tsx (baru) — BadgesModal (grid 3×4, locked abu 🔒 ???) + LeaderboardModal (fetch /api/leaderboard, baris medali emas/perak/perunggu, muat ulang, error state ramah) + tombol menu. MainMenu.tsx — panel Rekor Kamu (bintang/menang/main/lencana), tombol Lencana Ku & Papan Rekor, toolbar bawah selalu terlihat (restrukturisasi: area tengah scroll + bottom fixed), how-to 2×2 grid, hiasan emoji melayang, kontras ditingkatkan. EndScreens.tsx — StarRating animasi stagger, form kirim skor (nama + POST), tombol Lihat Papan Rekor, stats kesehatan masjid. Hud.tsx — HP bar segmented + pulse merah saat low + jantung berdetak, wave progress dots, banner wave kelas .wave-banner kontras kuat. GameShell.tsx — pasang DuaButton + BadgeToastLayer; bg sama dengan langit.
- globals.css: .dua-glow-overlay, .btn-dua(+ready/active ring), .hp-segments/.hp-low-pulse, .star-big/.star-empty, .badge-card(+locked), .lb-row(1/2/3/n), .wave-banner, .record-pill.
- Prisma (oleh subagent 7-a): model ScoreEntry; route /api/leaderboard GET top10 (stars→defeated→pahala→createdAt) + POST (validasi name 2-16, clamp 16, stars 1-3, dll) + prune best 50; db:push non-destruktif (User/Post utuh); seed 5 entri; curl tests OK; API 200 di dev.log.

BUGFIX TAMBAHAN (ditemukan tsc):
- [FIX] Hud mosqueMaxHp tidak ada di store (bar HP salah skala 100 vs 120) → pakai GAME_CONST.mosqueMaxHp.
- [FIX] GameShell ro?.observe(parent) TS error → if (parent && ro).
- [FIX] particles.ts ParticleData init kurang 'opacity' → tambah opacity: 1.
- [FIX] stray save.duaUsedThisGame di achievements → dihapus.
- [FIX] tryPlace bisa dipanggil dari menu (QA probe) → guard screen playing.

VERIFIKASI (agent-browser + VLM + probe):
- ✓ Tipe & lint bersih (bun run lint, tsc --noEmit — hanya error lama di folder examples/ & skills/ yang tak terpakai).
- ✓ Doa Bersama: charge terisi (per kill/wave), tombol glow saat siap, aktivasi → duaActive 12s, buff tower aktif (manager.duaBlessed), masjid heal +8, overlay emas muncul lalu hilang otomatis + toast selesai; digunakan 6× dalam 1 run.
- ✓ Kuyang: spawn wave 6+, terbang y≈1.2, kepakan sayap, slow-immune (slowUntil tetap -1), damage tetap masuk; visual VLM: "kepala melayang lucu bersayap + pita pink, imut, tanpa glitch".
- ✓ Victory: star rating animasi (2⭐ terverifikasi visual; run lain 1⭐), stats HP masjid, submit skor "Ali Zahran" → muncul di Papan Rekor rank 5 dengan 2⭐ (POST+GET 200 di dev.log).
- ✓ Menu: Rekor Kamu tampil (2 main, 1 menang, 11/12 lencana), tombol Lencana Ku (modal grid OK: unlocked warna, locked abu 🔒) & Papan Rekor (top-10 + medali) OK; semua muat di viewport 577px (restrukturisasi toolbar bawah) & mobile 390×844 (tanpa overlap DuaButton vs kartu).
- ✓ Gameover lembut tetap bekerja; unlock modal (Kakek/Fatimah) tampil.
- ✓ Full-run simulasi final: 14 tower, wave 10 boss kalah, victory 1⭐ HP 63/120, 0 error.
- ✓ Mobile 390×844: HUD tidak terpotong, tombol DOA tidak menutupi gameplay, kartu scroll horizontal.

Stage Summary:
- 4 fitur besar baru: (1) Doa Bersama — kekuatan spesial aktif yang mengisi dari aksi menghalau setan (memberi anak "moment kejutan" positif), (2) musuh ke-7 Kuyang Melayang Lucu dengan mekanik terbang + kebal slow, (3) sistem rekor & 12 lencana tersimpan localStorage, (4) Papan Rekor global fullstack (Prisma + API + submit skor + bintang rating 1-3 di layar menang).
- Polish styling menyeluruh: HP bar segmented + pulse, wave progress dots, banner kontras kuat, langit lebih jenuh, menu responsif pendek/mobile, overlay berkah keemasan.
- Bug tampilan HP max tersembunyi diperbaiki (100→120).
- Backend leaderboard teruji (subagent + integrasi UI).

Unresolved issues / risks & rekomendasi fase berikutnya:
- Balance kuyang & wave 6-10 kini lebih menantang (run QA lemah kalah di wave 9) — run kuat masih menang nyaman; pertimbangkan playtest nyata, muali tweak startPahala/reward bila perlu.
- Escape tidak menutup modal menu (hanya klik X / klik luar) — kecil, bisa ditambah keydown handler.
- Ide lanjutan: karakter Misbah si Muadzin, setan palasik, mode tantangan harian, pilihan bahasa ID/EN, audio pre-rendered, animasi intro boss sinematik lebih kaya.
- Pengujian tablet fisik untuk drag & drop masih belum bisa dilakukan di sandbox.

---
Task ID: 1-c s/d 7-c
Agent: main-agent (Z.ai Code)
Task: QA rutin + perbaikan bug (Escape modal, popup nyangkut) + rebalancing gelombang + karakter baru MISBAH si Muadzin Muda (tower ekonomi) + 3 jenis banner wave + polish UI

Work Log:
QA AWAL (agent-browser + probe):
- Build sehat (halaman 200, 0 console error, API leaderboard jalan).
- Konfirmasi risiko balance dari ronde lalu: run lemah (4 tower tanpa upgrade) mati di wave 6 (sebelum kuyang ditambah: wave 9) — kuyang di wave 6 membuat kurva terlalu curam untuk anak.
- Bug ditemukan: (1) tombol Escape tidak menutup modal Lencana/Papan Rekor, (2) FunFactModal (unlock karakter) NYANGKUT terbuka saat kembali ke menu — backdrop z-50 memblokir semua klik menu (ditemukan via elementFromPoint).

FITUR BARU — MISBAH SI MUADZIN MUDA (karakter ke-6, tower ekonomi):
- data.ts: CharId + 'misbah', AttackKind + 'sedekah', CharDef.pahalaGen?: [jumlah, intervalDetik][] per level. Misbah: 💡 biru, cost 80, upgrade [70,120], unlockWave 4, gen L1 +5/6s, L2 +8/5s, L3 +12/4s (≈50/96/180 per menit). damage 0 (tidak menyerang — edukasi "investasi sedekah").
- models.ts: aksesori misbah — peci biru + KOTAK SEDEKAH kayu (tutup + celah koin emas + koin melayang bernama 'koinSedekah') + lampion kecil menyala di tangan kiri ('lampion') + tiang. ChibiParts + koinSedekah/lampion (opsional), getCharacterModel me-resolve via collectNamed.
- entities.ts: ManagerCtx + onPahalaTick(amount, pos, level); branch attack 'sedekah' di Tower.update (cooldown = fireRate; BERKAH DOA mempercepat interval ×0.65 — sinergi lucu "sedekah diberkahi"); animasi idle: koin melayang naik-turun + rotasi, lampion berdenyut emissive ±0.5.
- engine.ts: callback onPahalaTick → addPahala + showPahala VFX + ring emas + audio.coin (rate-limit 1.2s) + tracking misbahGenTotal + checkBadges('sedekahTick'); reset counter di startGame; Misbah ikut jadi wanderer halaman masjid di menu (5 anak).
- achievements.ts: lencana ke-13 'sedekah_300' (Jutawan Sedekah 💰 — kotak Misbah menghasilkan 300 pahala sekali main).
- CharacterBar.tsx: ACCENT misbah #6db3d9 + badge 💰 kecil di pojok kartu (penanda ekonomi).
- TowerPanel.tsx: panel stats khusus sedekah — 💰 Sedekah/tik (+5 → +8), ⏱️ Interval (6s → 5s), 📊 Estimasi/menit (~50 → ~96) dengan preview upgrade.

REBALANCING (ramah anak):
- Wave 6: kuyang DIHAPUS (dipindah ke wave 7+), pocong 8→6 (kembali lebih ringan dari game original).
- Wave 7/8/9: kuyang 3/3/4 (sebelumnya 3/4/5), reward 56/64/72/80 → 60/70/78/88 (lebih banyak uang untuk bangun tower).
- DUA_CONST: perKill 7→8, perWave 12→14 (ultimate terisi lebih cepat — lebih sering merasakan "momen seru").

FITUR BARU — 3 JENIS BANNER WAVE:
- Hud.tsx: banner state {text, kind: 'normal'|'boss'|'newEnemy', enemyEmoji}; deteksi FIRST_APPEARANCE (map enemyType→wave pertama muncul, dihitung dari WAVES) → wave 7 tampil "🎈 Setan Baru: Kuyang Melayang Lucu!" dengan emoji wiggle; wave 10 tampil boss banner.
- CSS: .boss-banner (gradasi oranye hangat + animasi boss-shake + label "🔥 BOSS GELOMBANG 🔥"), .new-enemy-banner (ungu ceria + sub-teks tips).

BUGFIX:
- [FIX] Escape tidak menutup modal menu → CuteModal (MenuModals.tsx) pasang window keydown listener capture + e.stopPropagation(); terverifikasi dengan dispatch manual DAN agent-browser press Escape asli.
- [FIX] FunFactModal nyangkut di menu → backToMenu() kini membersihkan funFact/toast/badgeToast/selectedTower/selectedCharId/dragging/paused/bossHp + clearDuaOverlay.
- [FIX] (tuning) Misbah test: 2 tick pertama tepat +10 pahala; L2 tepat 8/5s.

VERIFIKASI (semua via probe + VLM + DOM):
- ✓ Misbah: place → gen tepat (isolasi: 180-80+10 = 110 ✓), upgrade L2 = 8/5s ✓, berkah doa mempercepat tick ✓, badge sedekah_300 terbuka natural saat run ✓, model 3D terverifikasi VLM ("blue prayer cap, wooden charity box, glowing lantern") ✓, wanderer menu tampil ✓.
- ✓ TowerPanel Misbah: stats ekonomi + preview upgrade terverifikasi VLM ("+5 → +8, 6s → 5s, ~50 → ~96/menit, Upgrade ⭐70") ✓.
- ✓ Balance: run MEDIOKRE (6-8 tower + upgrade + dua + misbah) = VICTORY 2⭐ HP 95/120, 8 tower, duaUsed 8×, 0 error. Run kuat tanpa misbah juga menang 2⭐ (dua strategi viable). Run 4-tower murni tetap kalah (pembelajaran yang sehat).
- ✓ Banner: DOM observer menangkap "Setan Baru: Kuyang Melayang Lucu!" (wave 7) + "Gelombang N datang!" + boss banner live "🔥 BOSS GELOMBANG 🔥 BANASPATI NGAMBEK!" dengan class .boss-banner ✓.
- ✓ Escape modal: badges + leaderboard modal tertutup dengan keyboard asli ✓.
- ✓ backToMenu cleanup: tidak ada backdrop nyangkut, klik menu berfungsi ✓.
- ✓ Mobile 390×844: kartu Misbah (karakter ke-6) tampil di baris scroll, DOA button, HUD utuh ✓.
- ✓ lint bersih, tsc --noEmit bersih (kode game), dev.log bersih, API leaderboard 200.

Stage Summary:
- Karakter ke-6 MISBAH si Muadzin Muda: tower ekonomi pasif (kotak sedekah) — strategi baru "investasi dini", berempat dengan Doa Bersama (berkah mempercepat sedekah), lencana ke-13 Jutawan Sedekah.
- Balance wave 6-10 dikembalikan ramah anak (kuyang diperkenalkan bertahap mulai wave 7, reward naik, ultimate terisi lebih cepat); run wajar menang 2⭐ nyaman.
- 3 jenis banner wave dengan kepribadian berbeda (normal emas, setan-baru ungu + emoji wiggle, boss oranye + shake) — info musuh baru lebih jelas untuk anak.
- 2 bug UX diperbaiki (Escape modal, popup nyangkut di menu).

Unresolved issues / risks & rekomendasi fase berikutnya:
- Run 4-tower tanpa strategi tetap kalah di wave 6 — sesuai desain (pembelajaran), tapi bisa dipantau dari playtest nyata.
- Ide lanjutan: setan palasik, mode tantangan harian, pilihan bahasa ID/EN, tutorial interaktif pertama main (overlay langkah), saran strategi saat game over berulang, audio pre-rendered, karakter perempuan ke-2 (Sarah si Penjahit?).
- Screenshot headless tetap tidak menangkap WebGL — tetap gunakan trik .pm-snap + probe.

---
Task ID: 1-d s/d 6-d
Agent: main-agent (Z.ai Code)
Task: QA rutin + 3 fitur besar baru (Tutorial Interaktif, Smart Coach, Tantangan Harian) + polish styling menyeluruh

Work Log:

QA AWAL (agent-browser + probe __pmEngine/__pmStore):
- Build sehat: halaman 200, 0 console error, API leaderboard 200, dev.log bersih.
- Golden path terverifikasi ulang: gameover lemah (run 1 tower mati wave 5-6 — sesuai desain), victory run kuat (bot strategis lane-distribusi: wave 10, HP 95/120, 2⭐, 14 tower, dua 10×).
- Catatan QA bot: `Tower.charId` tidak ada (pakai `t.def.id`); `tryPlace(slotIndex, charId)` — urutan argumen. Bot yang menara satu jalur saja kalah wajar (lane lain bocor) — bukan bug balance.

FITUR BARU 1 — TUTORIAL INTERAKTIF (state-driven, main pertama):
- store.ts: `tutorialStep` (0=off, 1..6) + aksi setTutorialStep.
- engine.ts: state machine `updateTutorial(dt, st)` dipanggil di simTick — langkah maju dari AKSI nyata pemain: (1) pilih kartu → (2) pasang di slot → (3) mulai gelombang → (4) kill pertama → (5) intro DOA → (6) penutup → selesai. Timeout aman tiap langkah (bisa macet dihilangkan). `skipTutorial()` publik (tombol Lewati) tetap menandai selesai.
- persist.ts: `tutorialSeen`; achievements.ts: `isTutorialSeen()/markTutorialDone()` + lencana ke-14 'tutorial_done' (Murid Rajin 🎓).
- TutorialLayer.tsx (baru): gelembung Kakek Imam (mascot 👴 mengapung + badge 🕌, ekor gelembung, titik langkah 1/6, tombol Lewati pointer-events-auto) + cincin sorot `.tut-ring` (pulsing gold) yang mengukur bounding rect target `data-tut` tiap 700ms (hook useTargetRect, setState asinkron agar lolos lint react-hooks/set-state-in-effect).
- data-tut target: "cards" (CharacterBar baris kartu), "wave-btn" (tombol MULAI GELOMBANG di Hud), "dua-btn" (DuaButton wrapper).
- MainMenu: tombol "🎓 Ulangi Tutorial" (startGame({forceTutorial:true})) — hanya tampil jika tutorialSeen.

FITUR BARU 2 — SMART COACH (Saran Kakek Imam di Game Over):
- engine.onGameOver → `buildCoachTips(st, lossStreak)`: analisis run nyata (jumlah tower <6, tower L3 = 0, tidak ada Misbah & wave≥4, duaUsed=0, wave≥8) + empati saat lossStreak≥2; ambil 3 tips teratas; semua kalimat positif ramah anak.
- persist: `lossStreak` (bump saat kalah, clear saat menang); store: `coachTips`.
- EndScreens: CoachTipsCard (kartu hijau dash-border + avatar 👴 + baris tips stagger anim) menggantikan tip statis lama.
- Bonus fix: onGameOver/onVictory kini meng-clear funFact (modal unlock tidak menumpuk di layar akhir).

FITUR BARU 3 — TANTANGAN HARIAN (Daily Challenge):
- data.ts: `DailyModifier` + 8 modifier lucu (Jumat Berkah 🌟 reward+30%, Angin Kencang 💨 speed+15%, Masjid Kokoh 💪 HP+40, Gerhana Ceria 🌙 hp+20%/reward+25%, Rezeki Subur 🪙 modal+80, Bulan Purnama ✨ doa 2×, Tuyul Pesta 😅 steal 2×, Pagi Cerah ☀️ speed-10%/modal+40); `dailyKey()` (YYYY-MM-DD lokal) + `pickDailyModifier()` (hash tanggal → deterministic sama untuk semua pemain); `RUN_MODS` mutable + `resetRunMods()/applyDailyMods()`.
- Integrasi: Enemy constructor maxHp × enemyHpMult; Enemy.update speed × enemySpeedMult; onEnemyKilled reward × rewardMult (round); onEnemyLeaked steals × stealMult; store.addDuaCharge × duaChargeMult; startGame({daily:true}) → pahala+bonus, mosqueMaxHp+bonus (store.mosqueMaxHp baru — HUD & computeStars & heal DOA pakai max dinamis), toast pengumuman modifier.
- Victory daily: `recordDailyWin(todayKey)` → streak (kemarin menang → +1, else 1, idempotent per hari) + lencana ke-15 'daily_win' (Juara Harian 🔥) + banner "Tantangan Hari Ini Selesai!" + streak di layar menang; skor tantangan TIDAK masuk leaderboard (UI pengganti form submit); tombol Coba Lagi di layar akhir mempertahankan mode (restart {daily:true}).
- UI: DailyChallenge.tsx (kartu menu oranye: nama hari, modifier emoji+nama+desc, chip efek, streak pill 🔥, tombol MAIN TANTANGAN!, catatan tidak masuk papan rekor); chip `.daily-chip` di HUD saat mode aktif; backToMenu mereset mode.
- Probe QA baru: `window.__pmMods` (RUN_MODS) — verifikasi multiplier live.

STYLING (mandatory "lebih banyak detail"):
- CSS baru (globals.css +270 baris): .tut-bubble (panel krem + ekor), .tut-mascot (float anim + badge), .tut-skip, .tut-dot(-on), .tut-ring + @keyframes tut-pulse, .coach-card (dash border hijau), .coach-avatar, .daily-card (gradient peach oranye), .daily-effect-chip, .streak-pill, .btn-daily, .daily-chip, .daily-won-banner, .title-shimmer (judul menu gradient emerald→amber berjalan), :focus-visible outline emas untuk SEMUA tombol (a11y anak), .safe-bottom (env safe-area-inset untuk notch).
- BadgesModal: grid max-h-[52vh] + scroll (15 lencana).
- CharacterBar: safe-bottom.

BUGFIX/TEMUAN:
- [FIX] FunFact modal menumpuk di layar akhir → di-clear di onVictory/onGameOver.
- [PENTING untuk QA/dev] append CSS via bash `cat >>` TIDAK memicu recompile Turbopack — gunakan tool Edit/Write (kasus: semua class baru sempat hilang dari chunk CSS; setelah edit ulang → muncul). Chunk CSS: /_next/static/chunks/...css — cek via curl.
- [Artfak QA bukan bug] aksi sinkron sekaligus (pilih+pasang dalam satu eval) membuat tutorial step tertinggal — pemain nyata selalu ada frame di antara aksi; verifikasi ulang dengan advance() di antara aksi → langkah benar (2→3→4).

VERIFIKASI (probe + DOM + VLM + screenshot; artefak di /home/z/my-project/download/):
- ✓ Tutorial full flow: step 1→2 (pilih kartu) →3 (pasang) →4 (mulai wave) →6 (kill pertama, dua intro) → selesai (tutStep 0, tutorialSeen true, badge Murid Rajin); skip via klik DOM asli bekerja; tidak muncul lagi di game ke-2; force replay bekerja.
- ✓ Ring: membungkus kartu (349,576,582,120 vs kartu 357,584,566,104) & tombol MULAI (ringY 160 vs btnY 170, wraps=true); VLM: "cream bubble with round elderly-man avatar + gold pulsing ring".
- ✓ Bulan Purnama (modifier hari ini, 4 Sep 2026): duaCharge 16/kill (8×2 ✓); RUN_MODS via probe: enemyHp 22→26 (×1.2 ✓), reward 8→10 (×1.25 ✓); startGame klasik me-reset RUN_MODS ke 1 ✓.
- ✓ Daily victory: wave 10, streak 1 tersimpan (lastDailyWin 2026-09-04), badge daily_win, banner "Tantangan Hari Ini Selesai!", form skor disembunyikan + catatan tidak masuk papan rekor; chip HUD "✨TANTANGAN · Bulan Purnama" (desktop+mobile).
- ✓ Coach: 3 tips personal muncul (DOM .coach-card 3 baris + avatar); lossStreak 2 → tip empati di posisi pertama; VLM konfirmasi render bersih; funFact ter-clear di layar akhir.
- ✓ Menu: title shimmer gradient (computed style: linear-gradient + clip:text + transparent) — VLM: "green-to-gold gradient text"; kartu daily styled oranye (VLM konfirmasi); tombol MAIN TANTANGAN dalam viewport (desktop y 632-672 < 720; mobile btnVisible true).
- ✓ Mobile 390×844: menu, tutorial bubble (y 531-668 fit), daily chip + DOA button terlihat; VLM: tanpa overlap/kliping.
- ✓ Regression: victory klasik penuh (wave 10, 2⭐, HP 95/120, 140 defeated, dua 10×), lossStreak ter-reset saat menang, 0 console error, lint & tsc bersih.
- ✓ Probe tersedia: __pmEngine, __pmStore, __THREE, __pmMods (baru).

Stage Summary:
- 3 fitur besar: (1) Tutorial Interaktif 6 langkah state-driven dengan maskot Kakek Imam + cincin sorot pulsing — anak baru langsung dibimbing aksi nyata; (2) Smart Coach — analisis gaya main → 3 saran personal positif + empati kekalahan beruntun di layar Game Over; (3) Tantangan Harian — 8 modifier date-seeded, streak harian, lencana, chip HUD, mode terjaga saat retry, skor terpisah dari leaderboard.
- 2 lencana baru (Murid Rajin 🎓, Juara Harian 🔥) → total 15; grid modal scrollable.
- Styling: ~270 baris CSS baru (tutorial/coach/daily/shimmer/focus-visible/safe-area), judul menu gradient animasi, a11y keyboard focus jelas.
- Bug fix: modal funFact menumpuk di layar akhir.
- Catatan lingkungan: append CSS via bash tidak memicu recompile — WAJIB pakai tool file-edit untuk CSS; verifikasi chunk CSS via curl.

Unresolved issues / risks & rekomendasi fase berikutnya:
- Tantangan Harian belum punya tanda khusus di leaderboard (skipped by design — skema DB tidak diubah). Fase lanjut bisa tambah kolom `mode` + tab Klasik/Tantangan di Papan Rekor.
- Ide lanjutan dari backlog: karakter Sarah si Penjahit, setan Palasik, mode tantangan mingguan, pilihan bahasa ID/EN, audio pre-rendered, intro boss sinematik lebih kaya.
- Tutorial hanya klasik (daily tidak menampilkan tutorial — by design agar tantangan langsung menantang).
- Tablet fisik drag&drop tetap belum teruji di sandbox (pointer events sudah dipakai).
- Playtest nyata untuk panjang tutorial (timeout langkah 4/5 mungkin perlu tuning) dan pace streak harian.

---
Task ID: 7
Agent: main-agent (Z.ai Code)
Task: PROMPT LENGKAP PENYEMPURNAAN (P1-P6) — Fix layout void dunia, kamera pro (inertia/pinch/D-pad), Main Menu & Level Select & Settings profesional, Toko 100 karakter + character creator, roster 20 hantu lokal Indonesia, sistem generatif + star currency

Work Log:

QA AWAL (agent-browser + probe __pmEngine/__pmStore):
- Build sehat: halaman 200, 0 console error, smoke test bot (place tower → wave → kill) jalan normal, menu reset bersih.
- Probe: __pmEngine.get() tersedia; state store terverifikasi via probe (screen/menu, unlockedChars [ali,aisyah]).

P1 — WORLD EXPANSION (hilangkan kotak abu-abu kosong):
- Baru: src/lib/game/world.ts (~500 baris) — modul dunia luas:
  - createMegaGround(): plane rumput 230×150 (dari 76×48 — 4.5× lebih luas) dgn tekstur canvas 2048²: gradasi radial rumput, 340 bercak, halaman masjid + 3 jalur setan digambar ulang di posisi sama, jalanan desa dekoratif, 900 noise dots, 260 bunga luar arena.
  - buildWorldExpansion(): SEMUA merged (mergeGeometries) jadi 2 draw call (worldTerrain castShadow + worldDecor):
    * 22 perbukitan (elevasi kubah rendah, dikecualikan dari koridor sungai/kolam)
    * 210 pohon (round & pinus bertingkat, vertex-colored 5 varian hijau)
    * 6 cluster taman (pohon rapi + semak)
    * 130 batu/semak tersebar
    * 10 rumah desa (box + atap cone merah/oranye)
    * SUNGAI (ShapeGeometry bezier + tepian pasir, animasi emissive naik-turun)
    * KOLAM bulat + 10 bunga teratai (lily pads + bunga pink)
    * JEMBATAN KAYU 7 papan + pagar + 6 tiang di atas sungai
    * createMountainRange(): 2 lapis pegunungan parallax jauh (biru pucat 195u + hijau kabur 152u) — desaturasi + fog
    * createHighClouds(): 16 cluster awan tinggi statis (kesan luas)
- engine.ts: megaGround + worldExp + highClouds di setupWorld; fog diperluas 90/170 → 110/230; worldExp.update(elapsed) animasi air di simTick.
- [FIX] mergeGeometries gagal (indexed vs non-indexed geometry campur) → normGeo() konversi semua ke non-indexed + normal + uv seragam.
- [FIX] Bukit menutupi sungai/jembatan (hill di (58,-14) r30 overlap) → hillSpots digeser + safety-check koridor sungai/kolam di forEach.
- VERIFIKASI VLM: rumput memenuhi seluruh area sampai tepi (tidak ada void abu-abu) ✓; sungai+jembatan terlihat dari atas ✓; gunung parallax putih-biru terlihat dari photo mode ✓; burung/hills ✓.

P2 — KAMERA PRO:
- camera.ts (rewrite penting):
  - INERTIA: velocity tracking saat drag (lerp eksponensial), momentum 0.85s setelah lepas (damping lembut berhenti) — terverifikasi probe: drag 200px → momentum meluncur tx 12→68 unit.
  - ZOOM DAMPING: targetDist di-lerp (dt*7) — tidak lompat langsung; zoomBy/applyPinch pakai targetDist.
  - PINCH-TO-ZOOM: applyPinch(scaleRatio) — dua jari membuka → zoom in.
  - BOUNDS diperluas: pan ±88×62 (dari ±36×24) sesuai world baru; camera far 300→480.
  - recenter(): GSAP back.out 0.85s ke HOME (0,2,dist 40, elev 0.98) — terverifikasi (tunggu real-time utk GSAP tween).
  - rotateBy pakai stopMomentum.
- engine.ts: pinch tracking (activePointers Map, pinchDist, pinchMode); pointerdown kedua → mulai pinch & batal drag; pointermove ≥2 jari → applyPinch; pointerup hapus dari map; pointercancel listener.
- API publik baru: panCamera(dx,dz), zoomCamera(delta), recenterCamera() — dipakai tombol UI.
- Baru: src/components/game/MobileNav.tsx — D-pad 3×3 semi-transparan (4 arah + recenter tengah) + 3 tombol (zoom +/-, recenter ikon crosshair); auto-hide (opacity 0.55→1 saat sentuh/hover, label "🕹️ Geser kamera" muncul 2.6s); hold-to-accelerate pan (makin lama makin cepat ×3).
- CSS: .nav-cam-btn/.nav-cam-recenter/.nav-dpad(-cell/-active) grid 3×3.
- P3 tambahan: readDragSens()/readZoomSens() dari localStorage settings (0.3–2.2×) — dipakai panSpeed & zoomBy.
- VERIFIKASI: panWorked ✓, recentered ✓ (GSAP real-time), zoom damping smooth ✓, D-pad tampil di mobile 390×844 (VLM: "D-pad, zoom +/-, target button, character cards") ✓.

P3 — MAIN MENU PRO + LEVEL SELECT + SETTINGS:
- levels.ts (baru): 8 LEVEL bertema taman/kampung islami (Taman Masjid Raya → Kampung Santri → Kebun Kurma → Kolam Wudhu → Pasar Bunga → Puncak Menara → Hutan Bambu → Kubah Emas), tiap level: mapX/mapY posisi node di peta, waves (3-10 potongan WAVES), startPahala & mosqueHp berbeda, emoji, desc.
- store.ts: Screen + 'shop'|'levels'|'settings'; state levelId & totalWaves + setLevelInfo.
- engine.ts: startGame({levelId}) → levelWaves config; beginWave/updateWavePreview/onWaveComplete pakai this.levelWaves (dinamis); backToMenu reset levelId & levelWaves.
- HUD.tsx: wave counter & progress dots pakai totalWaves + levelWaves(levelId) dinamis.
- persist.ts: levelStars[] (rating 1-3 per level), bestLevelDone, ownedChars[], starCurrency.
- achievements.ts: getLevelProgress(), recordLevelResult(levelId, stars) — unlock level berikutnya; getStarCurrency/addStarCurrency/grantRunReward(pahala→⭐ 20:1)/getOwnedChars/buyChar(id, cost).
- engine.onVictory: recordLevelResult jika levelId>0 + grantRunReward → runStarGain.
- MainMenu.tsx (rewrite): profil chip pojok atas (avatar emoji rotasi + nama + total bintang) + currency chip ⭐; tombol MAIN besar (badge "Lanjut: Lv.N"); grid 3 ubin (TOKO 100 karakter/PETA 8 level/ATURAN); DailyChallengeCard tetap; tombol lencana/rekor/tutorial di bawah.
- LevelSelectScreen.tsx (baru): peta petualangan dgn polyline dashed jalur SVG, 8 node (locked/unlocked/current bouncing), rating ⭐1-3 per node, header total ⭐/MAX, dekorasi emoji (🌳🌴⛲🦋), modal preview level (emoji, gelombang+HP, desc, preview musuh dgn count, rekor bintang, tombol MULAI).
- SettingsScreen.tsx (baru): slider SFX & Musik terpisah (audio.setSfxVolume/setMusicVolume baru), toggle on/off, kualitas grafis 3 tombol (Ringan/Sedang/Jempolan), sensitivitas drag & zoom (localStorage pm-drag-sens/pm-zoom-sens → dipakai camera), reset progres (2-step confirm).
- audio.ts: sfxVolume/musicVolume + setSfxVolume(v)/setMusicVolume(v) — GainNode live.
- EndScreens: victory → tampil "+N Bintang Toko! (belanja di TOKO 🛒)" jika starGain>0; restart pertahankan levelId.
- CSS: profile-chip/-avatar, menu-tile, level-node(-unlocked/-locked/-current bounce), settings-card/-title, quality-opt(-active), cute-range slider (webkit+moz thumb bulat), shop-tab(-active), chip-filter(-on), shop-card, swatch(-on), creator-power(-on), scrollbar vertikal lucu.
- VERIFIKASI: Level 1 start → levelId=1, totalWaves=3, pahala 220, HP 130 ✓; bot run level 1 → VICTORY 2⭐, levelStars=[2], bestLevelDone=1, starCurrency=8 ✓; level 2 terkunci (terkunci label) ✓; settings slider event 50→80 ✓; VLM settings: sliders+quality+sens+reset semua ✓; mobile menu DOM: profile/mainBtn/tiles×3/dailyCard visible ✓; mobile levels 8 node visible ✓.

P4 — TOKO (100 karakter):
- roster.ts (baru ~330 baris): sistem generatif — 6 POWERS (Cahaya/Dzikir/Sedekah/Wangi/Nasihat/Adzan) × 3 sub-varian (Cepat/Tembus/Meledak dll — damageMult/rateMult/rangeMult balanced) × 10 THEMES visual (Santri Desa→Imam Muda, robe+accent hex) × 4 RARITY (Umum⚪/Langka🔵/Epik🟣/Legendaris🟠 dgn harga 15/40/90/200 + variasi).
  - 6 HERO signature (Ali/Aisyah/Umar/Fatimah/Misbah/Kakek) = legendaris 120⭐ dgn model CHAR_DEFS asli.
  - 94 generatif deterministik (mulberry seed): nama dari 40 FIRST_NAMES × 12 TITLES islami (unik, anti-duplikat), presentation (anak-laki/anak-perempuan/kakek), skin 5 tone.
  - CharCustom interface + palet warna (12 robe/6 accent/6 skin/6 hair) + aksesoris (tasbih/tas/sajadah/buku/lampion) + ekspresi (ceria/pemalu/semangat).
- models.ts: buildGenChibi(opts) — chibi generatif lengkap (pedestal ring accent, badan jubah dgn rarity glow emissive, kepala+addFace expression-scaled, peci/hijab+turban per presentation, aksesoris 3D per pilihan, halo cincin rarity epik+/bintang level); getRosterModel(rc)/getCustomModel(cc) dgn cache.
- ShopScreen.tsx (baru ~470 baris): header (back, judul, ⭐currency); TAB Beli/Buat; search input; panel filter (6 power chips + 4 rarity chips + 4 sort mode); GRID 100 kartu (2 col mobile → 5 col xl) tiap kartu: rarity badge pojok + "Milikmu" hijau jika owned + preview 3D RosterPreview berputar + nama + power·tema + harga/bintang (merah jika tak cukup); modal detail (preview besar, desc, varian power, tombol BELI N⭐); toast lokal sukses/gagal.
- CharCreator (tab Buat): preview 3D real-time CustomPreview 184px + panel: presentasi tubuh, swatch warna baju/aksen/kulit/rambut, aksesoris, ekspresi, 6 power (dgn catatan "tetap fair dari sistem game ⚖️") + 3 sub-varian; SIMPAN → localStorage penjaga-masjid-custom-char (max 12).
- RosterPreview.tsx (baru): useSpinPreview hook — WebGL kecil alpha canvas, auto-spin 0.9 rad/s + bob, try-catch WebGL fallback.
- VERIFIKASI: 100 kartu shop ✓ (totalCards=100); beli gen-13 (15⭐, currency 300→285, ownedChars=[gen-13]) ✓; filter/sort/search UI jalan ✓; character creator: tab buka, save → localStorage 1 entry (custom-*, presentation/robe/accent/skin/hair/accessory/expression/power/variant lengkap) ✓; VLM shop: grid kartu 3D + rarity badge + currency + polish ✓.

P5 — ROSTER 20 HANTU LOKAL INDONESIA:
- data.ts: EnemyId + 13 baru (sundel/leak/kolongwewe/jailangkung/bunian/butoijo/nyiblorong/palasik/suster/cindaku/gendruwo/wewerawa/kober); ENEMY_DEFS lengkap dgn hp/speed/damage/reward/scale + mekanik pembeda:
  * flying: sundel (pita pink), leak (zigzag+slowImmune), palasik (kucing melayang)
  * fleesOnHit: bunian (pemalu ngebut), kober (cape merah)
  * knockResist: kolongwewe 0.4, wewerawa 0.5, gendruwo 0.7, butoijo 0.75
  * tanker: butoijo 130hp, gendruwo 105hp
- models.ts: 13 model chibi unik dibangun (~460 baris): sundel (dress+rambut panjang+pita punggung+2 ekor pita berkibar), leak (kepala+rambut mengembang+3 pita warna-warni+taring), kolongwewe (jongkok+rambut acak+tangan dagu ngintip), jailangkung (boneka kayu+sendi kapsul+tali), bunian (topi daun kerucut+4 daun), butoijo (raksasa hijau+perut terang+telinga raksasa+taring+lengan panjang), nyiblorong (putri+rambut panjang+ekor ular emas-hijau 4 segmen+mahkota), palasik (kepala kucing+telinga+kumis+selimut melayang+ekor pita), suster (seragam putih+salib merah+topi perawat+rambut pirang+kaki ngesot depan), cindaku (harimau oranye+loreng+ekor+moncong+telinga), gendruwo (genderuwo lumut+bunga+sprout daun), wewerawa (ibu-ibu+PAYUNG TERATAI PINK+tangan pegang), kober (merah+tanduk kecil+CAPE berkibar+ekor).
- getEnemyModel parts +: cape, umbrella, hat.
- entities.ts: headY 13 baru; Enemy.update animasi idle unik per jenis: sundel pita berkibar+melayang, leak zigzag cepat 5.5Hz+pita memuntir, kolongwewe jongkok goyang+kepala ngintip kiri-kanan, jailangkung STOP-MOTION patah-patah (quantized 5Hz), bunian cepat malu-malu+topi goyang, butoijo goyangan lambat+lengan ayun, nyiblorong meliuk lateral+ekor bergelombang, palasik melayang+selimut berkibar, suster NGESOT condong belakang+geser lateral, cindaku jalan gesit+ekor goyang, gendruwo gempal goyang+lengan lebar, wewerawa santai+payung goyang, kober lari zigzag cape berkibar.
- WAVES rebalanced: wave 6 +sundel; wave 7 +leak; wave 8 suster/jailangkung/gendruwo/kolongwewe; wave 9 butoijo/nyiblorong/cindaku/wewerawa; wave 10 boss +palasik/bunian/kober (pocong/kunti dikurangi utk kompensasi).
- VERIFIKASI: spawn 13 enemy semua ok (0 error) ✓; VLM: "multiple different cute creature models… chibi… no broken/floating" ✓; FULL RUN 10 wave victory 2⭐ HP 95 (14 tower) dgn enemy baru ✓; run lemah (3 tower) kalah wave 7 — balance sehat ✓.

BUGFIX RINGAN:
- RosterPreview: hapus eslint-disable tak terpakai.
- ShopScreen: useMemo dipindah SEBELUM early-return (rules-of-hooks).
- models: comma-expression → block statement (no-unused-expressions).
- roster: perbaiki TS2367 comparison.

STYLING DETAIL TAMBAHAN (mandatory "lebih banyak detail"):
- ~330 baris CSS baru: navigasi kamera mobile (nav-dpad/nav-cam), profil chip + avatar gradient hijau, menu tile 3D shadow, level node (current bounce anim), settings card + slider lucu (thumb bulat radial-gradient), shop tab/chip/swatch/creator-power, scrollbar vertikal kustom emas utk semua overflow-y-auto, glow inset legendaris card.

VERIFIKASI TOTAL (probe + DOM + VLM + mobile 390×844):
- ✓ P1 world: megaGround/terrain/river/pond/mountains/bridge/highClouds semua di scene; rumput penuh sampai tepi (VLM konfirmasi); sungai+jembatan terlihat top-down (VLM).
- ✓ P2 kamera: inertia (drag→momentum tx 12→68), zoom damping (39.9→43.5→50 bertahap), recenter (tx→1.61 real-time GSAP), panCamera API, D-pad + zoom +/- + recenter tampil mobile.
- ✓ P3: Level select 8 node (2 terbuka, 6 terkunci), preview modal + musuh count + MULAI LEVEL; level 1 victory → levelStars=[2] bestLevelDone=1 starCurrency=8; settings slider SFX 50→80 via React event; mobile semua layar DOM-visible.
- ✓ P4: 100 kartu, beli sukses (300→285, gen-13 owned), filter power/rarity/sort aktif, creator save localStorage.
- ✓ P5: 13 spawn ok, VLM model unik lucu tak broken, full victory run.
- ✓ Tutorial fresh save: step 1→4→(kill)→selesai, tutorialSeen+badge tersimpan.
- ✓ lint bersih, tsc --noEmit bersih (kode game), dev.log bersih (GET 200), 0 console error.
- Artefak screenshot: download/final_menu.png, world_check.png, enemies.png, shop.png, settings.png, levels_mobile.png.

Stage Summary:
- P1 SELESAI: dunia 4.5× lebih luas (230×150) penuh rumput/bukit/hutan/taman/sungai/jembatan/kolam teratai/desa/gunung parallax 2 lapis/awan tinggi — void abu-abu HILANG, semua merged hemat draw call.
- P2 SELESAI: kamera inertia momentum + zoom damping + pinch-to-zoom + BOUNDS luas + recenter; MobileNav D-pad auto-hide + zoom ± + recenter (mobile friendly).
- P3 SELESAI: Main menu profesional (profil+bintang+MAIN+3 ubin), PETA PETUALANGAN 8 level node + rating bintang + unlock progresif, SETTINGS lengkap (volume slider terpisah/kualitas/sensitivitas/reset 2-step), wave counter dinamis per level.
- P4 SELESAI: TOKO 100 karakter (6 hero legendaris + 94 generatif deterministik 6 power × 3 varian × 10 tema × 4 rarity), beli pakai ⭐ (grantRunReward 20 pahala=1⭐), filter/sort/search, modal detail, character creator "Buat Sendiri" (warna/aksesoris/ekspresi/power fair) + preview 3D real-time + save localStorage.
- P5 SELESAI: 20 hantu lokal Indonesia chibi (13 baru: sundel bolong, leak mini, kolong wewe, jailangkung, orang bunian, buto ijo, nyi blorong, palasik, suster ngesot, cindaku, gendruwo bukit, wewe rawa berpayung teratai, setan kober) — tiap jenis model unik + animasi idle khas + mekanik pembeda (flying/immune/flee/tanker/zigzag) + wave 6-10 diperkaya.

Unresolved issues / risks & rekomendasi fase berikutnya:
- Karakter custom & roster yang DIBELI belum bisa dipasang di gameplay (masih 6 hero CHAR_DEFS) — fase berikutnya: integrasi CharacterBar dynaMis (roster card → placeTower pakai power stats heroId mapping) — perlu sistem placeTower generik di entities.
- Level 2-8 belum playtest e2e satu-satu (hanya level 1) — jalankan bot per level.
- Wave 10 agak padat (7 tipe) — pantau di playtest nyata.
- Karakter custom tersimpan tapi tidak dimuat kembali di creator (list saved chars belum ditampilkan).
- Leaderboard belum punya kolom level/mode.
- Ide lanjutan: Sarah si Penjahit, tantangan mingguan, bahasa EN, audio pre-rendered, partikel aura legendaris di gameplay.

---
Task ID: 8
Agent: main-agent (Z.ai Code)
Task: P7 — INTEGRASI KARAKTER MILIK PEMAIN KE GAMEPLAY (roster toko + custom bisa dipasang & bertarung) + creator load/hapus + aura legendaris + playtest level 2-8

Work Log:

QA AWAL (agent-browser + probe):
- Build sehat: halaman 200, 0 console error, probe lengkap (__pmEngine/__pmStore).
- KONFIRMASI GAP UTAMA (dari worklog fase lalu): tryPlace(slot, 'gen-13') THROW "Cannot read properties of undefined (reading 'cost')" — karakter yang dibeli di toko TIDAK BISA dipasang di gameplay (CHAR_DEFS hanya 6 hero). Ini prioritas #1.

P7 — INTEGRASI LENGKAP (roster + custom → gameplay):
1) data.ts: CharDef.id melebar dari CharId → string ( struktur aman, 'ali' tetap assign-able); tambah field rarity?: 'umum'|'langka'|'epik'|'legendaris' (untuk aura & styling).
2) BARU src/lib/game/chardb.ts (~100 baris):
   - getCharDef(id): hero → CHAR_DEFS; roster/custom → synthRosterDef(rc) dgn cache; fallback aman CHAR_DEFS.ali.
   - synthRosterDef: base stats dari HERO se-power (POWERS.heroId) × variant.damageMult/rateMult/rangeMult × RARITY_POWER (umum 0.92 / langka 1.0 / epik 1.08 / legendaris 1.15) → TETAP BALANCED.
   - Biaya per rarity: RARITY_COST 45/70/95/140 pahala; upgrade ×0.85/1.0/1.15/1.35.
   - Varian khusus: 'mentul' knockback ×1.5; 'subur' pahalaGen ×1.3; 'kilat' interval ×0.75.
   - aoeRadius/slowDuration diskalakan rangeMult; slowFactor/knockback/stun dari base.
   - isHeroChar / isCustomCharId helper.
3) roster.ts: REGISTRY karakter custom runtime:
   - loadCustomChars(): localStorage 'penjaga-masjid-custom-char' → Map<id, RosterChar> + rcModels (CharCustom per id) — dipanggil engine.init() & startGame().
   - getRosterChar(id) cek custom registry dulu → ROSTER.
   - saveCustomEntry(cc, name) / deleteCustomEntry(id) / listSavedCustoms().
   - SavedCustomEntry interface (id/presentation/warna/accessory/expression/power/variant/name).
4) models.ts: getTowerModel(charId, level) — resolusi terpusat: hero → getCharacterModel; custom-* → getCustomModel(cc); roster dgn heroId → model hero asli; roster generatif → getRosterModel; fallback ali.
5) entities.ts: Tower constructor & setLevel pakai getCharDef + getTowerModel (charId: string); placeTower(charId: string).
   - AURA PARTIKEL: rarity epik (tiap 0.9s) / legendaris (tiap 0.5s) → ctx.particles.sparkleRise orbit radius 0.6-1.1 sekitar tower, warna emas/ungu.
6) engine.ts: beginPlacing/updateHoverSlot/refreshSlotHighlights/tryPlace → getCharDef (charId: string); ghostChar: string.
   - startGame: loadCustomChars() + seed unlockedChars ← ownedChars (hero-umar → 'umar') + semua id custom → belanja toko LANGSUNG terasa di gameplay.
   - init(): loadCustomChars() awal + probe baru __pmRoster (ROSTER + getCharDef utk QA).
7) store.ts: selectedCharId/funFact.char/unlockedChars/SelectedTowerInfo.char → string (type widening).
8) CharacterBar.tsx (rewrite): 6 kartu hero + KARTU ROSTER/CUSTOM MILIK PEMAIN (border sesuai rarity RARITY_INFO.border, badge rarity emoji pojok, preview RosterPreview 3D berputar, harga ⭐, badge 💰 utk power nasihat) + indikator "Koleksi N+" dashed di ujung; panel preview terpilih pakai RosterPreview utk non-hero; onCardDown(charId: string).
9) TowerPanel/Hud(FunFactModal): CHAR_DEFS[x] → getCharDef(x).
10) ShopScreen CharCreator: input NAMA karakter (🏷️, max 24 char); KOLEKSI KARYA-MU list (max tampil, scroll 36px) tiap item: emoji power + nama + tombol Muat (Sparkles) + Hapus (X rose); loadSaved() set seluruh state custom + nama; removeSaved() delete + refresh; saveCustom pakai saveCustomEntry(nama).

VERIFIKASI (probe + DOM + VLM + screenshot):
- ✓ Seed owned: startGame → unlockedChars ['ali','aisyah','gen-13','kakek','custom-1'] (hero-kakek dari toko + gen-13 roster + custom-1 creator).
- ✓ tryPlace(0,'gen-13') & tryPlace(5,'custom-1') → true; def: "Zahra si Penolong (Cahaya Cepat)" orb dmg7 cost45 rarity umum / "Sarah Karyaku (Dzikir Luas)" bubble dmg9 — ATTACK & VARIAN benar dari power/variant!
- ✓ Combat: wave 1 selesai 5 defeated dgn tower roster+custom aktif; pahala flow normal.
- ✓ Upgrade roster tower: level 1→2, dmg 7→11 (multiplier varian+rarity jalan).
- ✓ Legendaris/epik roster placeable (gen-5 legendaris cost 140 dmg1[nasihat-economy by design], gen-10 epik); aura partikel: glow pool 21-22 alive particles regen tiap 0.5s.
- ✓ VLM gameplay: "chibi towers on green pads near dirt paths, at least one with hijab, mosque visible, no broken models" ✓.
- ✓ Level 2-8 e2e bot: L3 victory (47 defeated), L4 3⭐/hp120, L5 3⭐/115, L6 3⭐/115, L7 3⭐/110, L8 2⭐/85 (boss) — semua victory; save: levelStars [0,3,3,3,3,3,3,2], bestLevelDone 8, starCurrency 810.
- ✓ Creator: input nama; list "Muat Sarah Karyaku" + Hapus; klik Muat → state creator berubah (Anak Gamis aktif + nama "Sarah Karyaku" terisi) — siklus create→save→load→edit lengkap!
- ✓ Mobile 390×844: 8 kartu bar (6 hero + gen-13 + custom-1) + "Koleksi 2+" badge + D-pad; VLM rekonstruksi cocok.
- ✓ Tutorial fresh save: step 1→2→3→4→…→0 selesai (advance antar aksi), tutorialSeen tersimpan.
- ✓ lint bersih, tsc --noEmit bersih, 0 console error, dev.log GET 200.
- Artefak: download/roster_gameplay.png, download/charbar_mobile.png.

BUGFIX:
- [FIX] Custom char tidak muncul di CharacterBar (unlockedChars tidak di-seed id custom) → startGame kini gabungkan customs.map(id) ke seed.
- [FIX] TS error: onToast 'info' → 'good' (tipe toast lokal ShopScreen); comma-expression chardb; unused import addStarCurrency/grantRunReward dihapus.
- Catatan QA: gameover saat tutorial → tutorialStep tetap (restart tutorial otomatis di game berikut karena tutorialSeen false) — by design. Aksi probe sinkron berturut tanpa advance → step tertinggal (known artifact, pemain nyata selalu ada frame antar aksi).

STYLING DETAIL (mandatory):
- Kartu roster di CharacterBar: border rarity warna (abu/biru/ungu/emas), badge emoji rarity pojok kiri, preview 3D melayang dalam frame 72px, indikator Koleksi dashed amber.
- Creator: input nama pill rounded; koleksi list emerald card dgn btn-round mini (Muat golden, Hapus rose).

Stage Summary:
- SIKLUS GAME TERTUTUP PENUH: TOKO (beli ⭐) + CREATOR (buat & simpan) → START GAME (auto-unlock semua milikan) → PASANG & BERTARUNG (stats seimbang dari sistem: hero-base × varian × rarity) → UPGRADE → AURA legendaris/epik → MENANG → dapat ⭐ lagi utk belanja. Loop ekonomi lengkap!
- Semua 8 level terverifikasi menang (bot); tutorial & mobile regression pass.

Unresolved issues / risks & rekomendasi fase berikutnya:
- Slot kartu roster di CharacterBar bisa sangat panjang jika pemain memiliki banyak karakter (scroll horizontal membantu, tapi bisa pertimbangkan tab/kategori atau modal koleksi utk >12 kartu).
- Nasihat (sedekah) roster: pahalaGen varian 'subur'/'kilat' hanya 2 varian spesial — 'berkah' (range) tidak berpengaruh nyata ke gameplay economy tower (range dipakai cincin saja); bisa buat aura buff nyata nanti.
- Karakter roster/custom belum punya funFact edukatif unik (pakai teks generik) — bisa perkaya.
- Leaderboard belum ada kolom mode/level; wave 10 masih 7 tipe musuh (padat).
- Ide lanjutan: tab Koleksi terpisah dgn detail & statistik kepemilikan, sound cue khas per rarity, save cloud, pilihan bahasa EN.
