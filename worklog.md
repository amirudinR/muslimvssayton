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

---
Task ID: 9
Agent: main-agent (Z.ai Code)
Task: P8 — LAYAR KOLEKSI PENUH + BUFF NASIHAT NYATA DI GAMEPLAY + funFact EDUKATIF UNIK + KOLOM MODE LEADERBOARD + SFX RARITY + polish styling

Work Log:

QA AWAL (agent-browser + probe):
- Dev server 200 OK, console bersih (hanya "WebGL Context Lost" headless yang wajar), probe lengkap.
- Simulasi cepat: startGame level 1 → wave 3 HP 101 tanpa error — game P1-P7 stabil, lanjut ke fitur baru sesuai rekomendasi fase sebelumnya.

P8-a — LAYAR KOLEKSI (menjawab risiko "CharacterBar bisa sangat panjang"):
- BARU src/lib/game/collection.ts: openCollection() / closeCollection() / refreshCollData() — memuat data localStorage → store secara SINKRON (bebas react-hooks/set-state-in-effect, bebas impor melingkar store↔achievements).
- BARU src/components/game/CollectionScreen.tsx (~480 baris): overlay full-screen z-50:
  * Header (judul + ⭐ currency + close), kartu statistik kepemilikan: total X/100, progress bar animasi stripes emerald→amber, chip jumlah per rarity.
  * Tab "Milikku" / "Semua (100)" + pencarian nama + filter power (6) & rarity (4) + sort rarity→nama.
  * Grid kartu 2/3/4/5 kolom responsif: kartu owned (warna + badge "Milikmu") vs locked (grayscale + 🔒 harga ⭐); kartu legendaris owned dapat efek shimmer kilau animasi.
  * Modal detail: preview 3D berputar, tema, TABEL STATISTIK NYATA level 1 (damage/range/ritme ATAU sedekah+aura nasihat dari getCharDef), power+varian, FUNFACT EDUKATIF UNIK 💡, desc rarity, tombol BELI (jingle rarity!) / "PASANG PENJAGA INI!" (saat bermain) / "Mainkan Koleksimu!" (dari menu → level select).
- BARU LazyRosterPreview (RosterPreview.tsx): preview 3D hanya MOUNT saat kartu terlihat (IntersectionObserver rootMargin 180px + histeresis unmount 1.6s) + cleanup forceContextLoss() — grid 100 kartu kini hanya ~15 konteks WebGL hidup (sebelumnya 100 → berisiko jenuh konteks browser). Diterapkan juga di grid TOKO.
- Integrasi: MainMenu tile KOLEKSI ke-4 (grid-cols-2 sm:grid-cols-4, badge jumlah owned ✨); CharacterBar indikator "Koleksi N+" → TOMBOL membuka layar (game AUTO-JEDA saat bermain, resume saat ditutup); GameShell Escape menutup koleksi; guard Space-toggle; EndScreens menu jeda disembunyikan saat koleksi terbuka (tidak tumpang tindih).
- store.ts: collectionOpen, collOwned, collCurrency, collCustoms, collPausedByUs + setCollectionOpen.

P8-b — BERKAH NASIHAT (menjawasi risiko "varian 'berkah' tidak berpengaruh nyata"):
- entities.ts Tower: buffMult (1..1.22), nasihatGlow (cincin emerald berputar di kaki tower yang di-buff), buffRing (cincin radius aura berdenyut pada tower sedekah/nasihat), buffRadius basis MANDIRI 4.5/5.5/6.5 per level (bukan range serangan yang memang 2) ×1.4 utk varian 'berkah' → 6.3/7.7/9.1 — varian berkah kini punya efek gameplay nyata!
- EntityManager.applyNasihatAuras() tiap frame sebelum tower update: tower 'sedekah' (Misbah + semua power nasihat) memperkuat tower tetangga dalam radius: damage × buffMult (dan hasil sedekah tower sedekah lain juga × buffMult). Tidak menumpuk (ambil maksimum). NASIHAT_BUFF = [1.10, 1.16, 1.22].
- TowerPanel: badge "💡 Berkah Nasihat +N%" (refresh live via simTick saat nilai berubah) + baris "💡 Aura nasihat rad. X · +N%" untuk tower sedekah.
- VERIFIKASI: misbah+ali jarak 0.5 → ali buffMult 1.1 glow visible ✓; aisyah jarak 5.6 > 4.5 → tidak ter-buff ✓; gen-5 (varian berkah, radius 6.3) → ali jarak 5.1 TER-BUFF ✓ (mustahil dgn radius standar); panel DOM "💡 Berkah Nasihat+10%" ✓; VLM: "green glowing rings on the ground near characters, no broken visuals" ✓.

P8-c — FUNFACT EDUKATIF UNIK (menjawasi risiko "roster funFact generik"):
- chardb.ts: POWER_FACTS (6 power × 3 fakta islami ramah anak Indonesia: sholat cahaya, dzikir menenangkan, sedekah menolak bala, wudhu separuh iman, nasihat amanah, Bilal muadzin pertama) + hashPick deterministik by id → tiap karakter punya funFact unik + suffix varian.
- Engine tryPlace: funFact "Tahukah Kamu? 🤔" saat PERTAMA memasang karakter non-hero run itu (hanya saat wave tidak aktif agar tidak mengganggu); FunFactModal judul kontekstual (place vs unlock); placedThisRun direset tiap startGame.
- VERIFIKASI: pasang gen-13 → modal "Tahukah Kamu?" + "Bangun subuh itu sindiran setan paling ampuh..." ✓; modal detail koleksi menampilkan funFact unik ✓.

P8-d — LEADERBOARD KOLOM MODE (menjawasi risiko "leaderboard belum ada kolom mode/level"):
- prisma schema: ScoreEntry.mode String @default("Klasik") + db:push sukses.
- API route: validasi sanitizeMode (whitelist "Klasik"/"Daring Harian" + pola /^Level \d{1,2}$/; sisanya → "Klasik") — uji XSS `<script>` ditolak ✓.
- CATATAN PENTING: dev server memuat client Prisma LAMA di memori (kolom baru tak dikenal tanpa restart; server tak boleh di-restart manual) → route dialihkan ke RAW SQL ($queryRawUnsafe/$executeRawUnsafe) yang kompatibel klien lama & baru, ranking/prune tetap sama.
- EndScreens submit: mode = dailyMode ? 'Daring Harian' : levelId>0 ? `Level ${levelId}` : 'Klasik'.
- MenuModals: chip mode di baris leaderboard (🔥 Daring Harian oranye / 🗺️ Level N biru; Klasik tanpa chip).
- VERIFIKASI: POST "Level 3"/"Daring Harian" tersimpan ✓; UI victory level 3 → skor masuk dgn mode "Level 3" ✓; chip tampil di modal ✓.

SFX & STYLING DETAIL (mandatory):
- audio.buyRarity(rarity): 4 jingle berbeda (umum pop+koin, langka triple-chime, epik arpeggio+bel, legendaris fanfare+sorak) — dipakai di Toko & Koleksi.
- ~150 baris CSS baru: .coll-stat-card (radial + shadow emerald), .coll-progress-fill (gradasi + stripes bergerak @keyframes), .coll-rarity-chip, .coll-tab/-active, .coll-card (owned/locked/legend + shimmer legendaris @keyframes legend-shimmer), .lb-mode-chip (daily orange / level biru).
- Tile KOLEKSI menu dgn badge jumlah; Tombol KOLEKSI di CharacterBar (dashed amber + gradient + shadow-inner).

BUGFIX TERKAIT:
- [FIX] GameShell import kehilangan newline saat edit (parse error HMR) — dipulihkan.
- [FIX] react-hooks/set-state-in-effect pada pemuatan data koleksi → refactor ke helper modul collection.ts (set sinkron di luar React).
- [FIX] buffRadius awal memakai range tower (Misbah range 2 → radius 2 tak berguna) → basis mandiri 4.5/5.5/6.5.
- MergeGeometries error 11× di console ternyata ARTEFAK HMR transien saat file setengah diedit — load bersih 0 error (dikonfirmasi dgn init-script capture stack).

VERIFIKASI TOTAL (probe + DOM + VLM + API + mobile 390×844):
- ✓ Koleksi dari menu: open → data (owned/currency/customs) termuat; tab Milikku 4 kartu, Semua 100 kartu; filter umum → beli "Adib si Ceria" 21⭐: owned 3→4, currency 100→79, toast, statistik "4/100" live-update.
- ✓ Koleksi saat bermain: klik tombol KOLEKSI → paused=true, menu jeda TERSEMBUNYI, klik kartu Zahra → PASANG → koleksi tutup + unpause + selectedCharId=gen-13 + dragging → tryPlace sukses (ditolak dulu saat pahala kurang — logika ekonomi benar).
- ✓ Lazy preview: shop 100 kartu hanya ~16 canvas hidup; scroll ke bawah tetap 16 (konteks dilepas/muat ulang).
- ✓ Buff nasihat: angka + visual ring emerald (VLM konfirmasi) + panel badge + pahalaGen ter-buff.
- ✓ Leaderboard: mode tersimpan & tampil; run level 3 victory → submit "Level 3" otomatis; XSS ditolak; prune tetap jalan.
- ✓ Mobile 390×844: menu 4 tile 2 kolom, koleksi readable (VLM), progress+tab+filter OK.
- ✓ Pause normal (space) tetap berfungsi; Escape menutup koleksi.
- ✓ lint bersih, tsc --noEmit bersih (kode proyek), dev.log bersih, console 0 error.
- Artefak: download/collection_screen.png, collection_grid.png, collection_mobile.png, funfact_place.png, nasihat_buff.png, leaderboard_mode.png.

Stage Summary:
- P8 SELESAI: Layar KOLEKSI profesional (statistik kepemilikan + progress + filter + beli + pasang langsung + lazy WebGL), buff Nasihat kini strategi nyata (tower dukungan memberi +10/16/22% damage & pahala area, varian 'berkah' radius terluas), funFact edukatif unik per karakter (modal "Tahukah Kamu?"), leaderboard berlabel mode asal skor, jingle beli per rarity.
- Loop ekonomi & koleksi kini punya "rumah" sendiri: TOKO (belanja) → KOLEKSI (album + statistik + deploy) → GAMEPLAY (buff sinergi) → MENANG → ⭐.

Unresolved issues / risks & rekomendasi fase berikutnya:
- Prisma client di dev server masih versi lama (route leaderboard sudah raw-SQL-proof, tapi model Prisma baru baru terpakai setelah restart server berikutnya) — tidak mempengaruhi fungsi.
- Koleksi belum menampilkan statistik pemakaian (berapa kali dipasang/menang) — bisa ditambah counter per karakter.
- Lazy preview punya potensi kedipan sangat singkat saat scroll cepat (histeresis 1.6s menahan); jika terganggu bisa naikkan ke 2.5s.
- funFact 'place' belum muncul bila penempatan pertama terjadi saat wave aktif (by design, non-intrusif).
- Ide lanjutan: sorting koleksi by power rarity DESC default; tab "Karya Sendiri" terpisah; pencarian tema; export/share screenshot koleksi; bahasa EN; cloud save.

---
Task ID: 10
Agent: sub-agent (P9-a Weekly Challenge)
Task: P9-a — TANTANGAN MINGGUAN (Weekly Challenge): mode mingguan lebih sulit berhadiah besar (tema violet), streak pekan, badge baru, skor masuk papan rekor berlabel "Tantangan Mingguan"

Work Log:
- data.ts: refactor `ModeMods` (enemyHpMult/enemySpeedMult/rewardMult/startPahalaBonus/mosqueHpBonus/duaChargeMult/stealMult) → `DailyModifier extends ModeMods`; `applyDailyMods(mod: ModeMods)` (nama fungsi dipertahankan). BARU: `WeeklyModifier` (+ rewardStars 25-40), `WEEKLY_MODIFIERS` (8 entri Indonesia ramah anak: Badai Setan 🌪️, Kabut Pekat 🌫️, Gerimis Berkah 🌧️ [chip duplikat di spec dirapikan jadi 2 chip], Malam Bermega ✨, Pasukan Gergasi 👹, Zakat Mengalir 💰, Uji Iman 🕋 [terberat, 40⭐], Jumat Berkah 🕌), helper ISO-week: `weeklyKey()` (YYYY-Www, Senin awal pekan), `pickWeeklyModifier(key)` (hash sama seperti daily), `daysUntilNextWeek()`.
- store.ts: state baru `weeklyMode` / `weeklyMod: WeeklyModifier | null` / `weeklyStreakResult` + reset di `resetForNewGame()`; persist.ts: `SaveData` + `weeklyStreak` / `lastWeeklyWin` (default 0/null, merge defensif utk save lama).
- achievements.ts: `getWeeklyStreakInfo()`, `recordWeeklyWin(weekKey)` (idempotent per pekan; streak+1 bila lastWeeklyWin === weeklyKey(7 hari lalu), selain itu 1); badge baru `{ weekly_win, 'Penjaga Pekanan' 📅 }` (BADGES 15→16; pill menu sudah dinamis BADGES.length — tidak ada hardcode 15); event `weeklyWin` di BadgeCtx + case unlock.
- engine.ts: field `weeklyKeyRun`; `startGame({ weekly })` — branch setelah daily: applyDailyMods(wmod) + mosqueHpBonus + startPahalaBonus + set store weeklyMode/weeklyMod + toast "TANTANGAN PEKAN INI"; konfigurasi KLASIK (levelId 0, WAVES penuh 10 gelombang — getLevel(0)→undefined→branch klasik terverifikasi); reset weeklyKeyRun bersama dailyKeyRun di startGame; backToMenu reset weeklyMode/weeklyMod; onVictory: hitung runStarGain + bonus mingguan SEBELUM screen 'victory', recordWeeklyWin → weeklyStreakResult, addStarCurrency(rewardStars), checkBadges weeklyWin, ring burst violet 0x8b5cf6 di masjid (mirror oranye daily).
- BARU src/components/game/WeeklyChallenge.tsx: kartu violet clone DailyChallenge — header CalendarDays + "TANTANGAN MINGGUAN" + chip "Pekan {n}", emoji besar animasi, effect chips `.weekly-effect-chip`, pill emas "🏆 Bonus +N⭐ kalau menang!", streak pill "🔥 N pekan beruntun" / hint, tombol `.btn-weekly` "TERIMA TANTANGAN!" / "Main Lagi Minggu Ini?", footnote countdown "Pekan baru dalam N hari" + "skor masuk papan rekor".
- MainMenu.tsx: `<WeeklyChallengeCard />` tepat setelah `<DailyChallengeCard />`.
- EndScreens.tsx: mode label skor `weeklyMode ? 'Tantangan Mingguan' : ...`; banner kemenangan violet `.weekly-won-banner` (📅 "Tantangan Mingguan Selesai!" + nama mod + streak pekan, mirror JSX daily); restart `weeklyMode ? { weekly: true } : ...`; ScoreSubmit TETAP tampil utk mingguan (hanya daily yang suppress — sesuai spec).
- Hud.tsx: chip `.weekly-chip` "📅 PEKANAN · {nama}" mirror animasi chip daily.
- MenuModals.tsx: chip mode leaderboard → 'Tantangan Mingguan' kelas `lb-mode-weekly` emoji 📅; api/leaderboard/route.ts: MODE_WHITELIST + 'Tantangan Mingguan'.
- globals.css: famili WEEKLY violet (~130 baris, header `/* ===== TANTANGAN MINGGUAN ===== */`): `.weekly-card` (bg #f3efff→#ece4ff, border #c4b5fd), `.weekly-effect-chip`, `.weekly-week-chip`, `.weekly-reward-pill` (emas), `.weekly-streak-pill`, `.btn-weekly` (gradient #a78bfa→#8b5cf6, shadow #7c3aed), `.weekly-chip`, `.weekly-won-banner`, `.lb-mode-weekly` (#ede9fe/#6d28d9/#c4b5fd) — semua mirror konvensi famili .daily-*.

BUG DITEMUKAN & DIPERBAIKI:
- [FIX] PRE-EXISTING (P4): banner "+N Bintang Toko!" di layar kemenangan TIDAK PERNAH tampil — EndScreens ter-mount sejak awal aplikasi sehingga `useState(() => __pmEngine?.runStarGain)` selalu terbaca 0 (engine dibuat di useEffect setelah render pertama). Fix: starGain kini dibaca saat render layar 'victory' (bukan sekali di mount) + onVictory menghitung runStarGain SEBELUM `screen: 'victory'` agar nilai selalu final. Terverifikasi klasik (25⭐) & mingguan (26+30=56⭐ kini tampil).
- Catatan QA: submit skor pertama via eval tampak "gagal" (scoreSubmitted false) — artefak HMR (edit EndScreens di tengah tes me-remount form & reset state lokal); POST-nya sendiri sukses masuk DB. Re-test setelah reload: UI submit → DB mode "Tantangan Mingguan" ✓.

VERIFIKASI (probe __pmEngine/__pmStore + DOM + API + VLM):
- ✓ lint bersih; tsc --noEmit: src/ 0 error (hanya error pre-existing di examples/ & skills/ scaffold); dev.log HMR "✓ Compiled" tanpa error.
- ✓ Menu: .weekly-card + .btn-weekly render di bawah .daily-card; chip "Pekan 36"; pill "🏆 Bonus +30⭐"; tombol "TERIMA TANTANGAN!".
- ✓ startGame({weekly:true}) → screen 'playing', weeklyMode true, mod 'Jumat Berkah' 🕌 (varian mingguan, ≠ daily 'Jumat Berkah' 🌟), mosqueMaxHp 145 (120+25), RUN_MODS {rewardMult 1.25, duaChargeMult 1.7}, totalWaves 10, levelId 0, dailyMode false; advance(5) tanpa error.
- ✓ HUD: .weekly-chip "🕌 PEKANAN · Jumat Berkah".
- ✓ Menang (onVictory): weeklyStreakResult 1, starCurrency 103→133 (+30), badge weekly_win terbuka, lastWeeklyWin '2026-W36'; menang kedua pekan sama → streak tetap 1 (idempotent); backdate lastWeeklyWin ke W35 → menang W36 → streak 2 ✓.
- ✓ Layar menang: banner violet "Tantangan Mingguan Selesai!" + "+56 Bintang Toko!" (termasuk bonus) + form submit skor TAMPIL (tidak di-suppress); submit UI "PekanJuara" → DB mode "Tantangan Mingguan" ✓; XSS mode tetap ditolak → "Klasik".
- ✓ Leaderboard modal: chip violet 📅 "Tantangan Mingguan" (kelas lb-mode-weekly).
- ✓ VLM: kartu violet rapi di bawah kartu oranye tanpa glitch; banner menang + banner bintang + form submit terkonfirmasi visual; chip HUD terkonfirmasi.
- Artefak: download/weekly_card.png, weekly_card_won.png, weekly_hud.png, weekly_victory.png, weekly_leaderboard.png.

Stage Summary:
- P9-a SELESAI: mode Tantangan Mingguan penuh — modifier pekan-seeded lebih sulit (8 varian, hingga musuh +35% kuat / imbalan +60%), bonus ⭐ toko 25-40 saat menang, streak pekan beruntun + badge "Penjaga Pekanan", tema violet konsisten (kartu menu, chip HUD, banner menang, chip leaderboard), dan skor TETAP masuk papan rekor berlabel "Tantangan Mingguan" (whitelist API + UI). Bonus: bug lama banner bintang toko P4 ikut diperbaiki sehingga bonus mingguan terlihat di layar menang.

---
Task ID: 11
Agent: sub-agent (P9-c Kotak Sedekah power-ups)
Task: P9-c — KOTAK SEDEKAH: power-up in-run — kotak sedekah ajaib muncul di lapangan saat wave aktif, diketuk pemain untuk buff sementara (damage/rate/pahala berdurasi + Perisai Masjid 3 muatan) dengan klaster pill HUD + hitung mundur.

Work Log:
- data.ts: section baru `P9-c: KOTAK SEDEKAH` — `PowerupDef` (id/name/emoji/desc/color/duration/kind), `POWERUPS` 4 varian (🏹 Panah Berkah +30% dmg 20dtk, 🪭 Kipas Ajaib rate×0.75 18dtk, 💰 Hujan Pahala +40% 25dtk, 🛡️ Perisai Masjid 3 muatan instan), `POWERUP_CONST` (firstDelay 22, interval [26,40], lifetime 14, bobHeight 0.55, baseY 0.9), `POWERUP_MULT` {damage 1.3, rate 0.75, pahala 1.4}.
- entities.ts: ManagerCtx +`powerDamageUntil`/`powerRateUntil`/`powerRewardUntil` (init -1 di constructor EntityManager, ikut direset di reset()); Tower.update: pengali `pwDmg`/`pwRate` dari ctx diterapkan ke dmg DAN ke semua 4 jalur cooldown (aura/sedekah/adzan/proyektil orb-bubble-coin); `activatePowerup(kind, duration)` + getter `powerDamageUntil`/`powerRateUntil`/`powerRewardUntil`/`powerRewardActive` utk engine.
- store.ts: `ActivePowerup` (id/name/emoji/remaining/kind), state `activePowerups` + `shieldCharges`, action `setActivePowerups`/`setShieldCharges`, keduanya di-reset `resetForNewGame()`.
- engine.ts (section `P9-c: KOTAK SEDEKAH`): field `private` TS (bukan #, agar probe QA bisa baca) powerupGroup/powerupDef/powerupSpawnedAt/powerupExpiresAt/nextPowerupAt/powerupSpin/shieldCharges/lastPowerupHudJson + Plane hit-test. `randomPowerupSpot()`: lane acak t∈[0.3,0.7] + offset tegak lurus 2.2–2.8 sisi acak, validasi ≥1.8 dari SLOTS, luar platform masjid, dalam rumput inti, retry 10×, fallback (-6, 10.8) halaman depan. `buildPowerupBox()`: BoxGeometry emas 0.62×0.5 + tutup warna def.color + RingGeometry emisif 0.7 di bawah. `spawnPowerupAt()` set expiry + jadwal next rand(26..40). Pickup di onPointerUp (SEBELUM logika slot/tower, unified mouse+touch, wasClick + jarak bidang < 1.3): buyRarity('epik') + firework + sparkleRise×2 + rings, `collectPowerup()` refactored shared dengan `debugCollectPowerup()`, toast "{emoji} {name} aktif!". `updatePowerups(waveActive)` di simTick (gameDt>0): spawn hanya saat wave aktif, expire → smokePuff + toast "Kotak sedekah menghilang... 😢", `syncPowerupHud()` recompute list dari getter until (banding JSON anti re-render spam, force saat collect) + sync shield. `updatePowerupVisual(dt)` selalu: bob sin(now*2.2), spin dt*1.4, 3 dtk terakhir pulse scale 1±0.18 + kedip emisif, auto-despawn saat screen bukan 'playing'. onEnemyLeaked: shield > 0 → charge--, rings biru 0x9ecbff + sparkle + toast "🛡️ Perisai masjid menahan 1 musuh!", return dini (musuh tetap leaked/terbersihkan, HP & curian tuyuh TIDAK jalan). onEnemyKilled: reward × POWERUP_MULT.pahala saat powerRewardActive. beginWave wave-1: nextPowerupAt 0 → now+firstDelay. startGame/backToMenu/dispose: despawn + reset semua field. QA: `debugSpawnPowerup(defId?)` + `debugCollectPowerup()`.
- BARU src/components/game/PowerupBadges.tsx: klaster pill fixed bottom-32 left-3 z-30 (di bawah DuaButton yang di tengah-kiri), AnimatePresence slide-in/out, pill per activePowerup (emoji + nama + ⏳ countdown ceil) + pill perisai "🛡️ Perisai ×N"; kind → kelas aksen. Dipasang di GameShell setelah <DuaButton />.
- globals.css: section `===== POWERUP (KOTAK SEDEKAH) =====` (~65 baris) — .powerup-pill (rounded-full border-2 font-black 11px px-3 py-1 backdrop-blur hard-shadow pointer-events-none + animasi powerup-pulse 1↔1.04), .powerup-pill-time (tabular-nums), varian -damage (emas #f5c518), -rate (teal #2dd4bf), -pahala (hijau #86d95c), -shield (biru #7cb6f9).

VERIFIKASI (agent-browser probe __pmEngine/__pmStore + DOM + PointerEvent sintetis + VLM):
- ✓ lint bersih; tsc --noEmit: src/ 0 error (hanya pre-existing examples/ & skills/); dev.log HMR "✓ Compiled" tanpa error; console 0 error.
- ✓ startGame level 1 → activePowerups [], shieldCharges 0; advance(26) → wave 1 aktif, nextPowerupAt 47 (=25+22), belum ada kotak; advance(23) → kotak natural muncul (hujan-pahala).
- ✓ debugSpawnPowerup('perisai-masjid') → powerupGroup truthy di (13.55, 1.66, -1.77) — jauh dari slot; debugCollectPowerup → shieldCharges 3 + toast "🛡️ Perisai Masjid aktif!".
- ✓ PICKUP POINTER NYATA: proyeksi posisi kotak → layar (1204, 332), dispatch PointerEvent pointerdown+pointerup di canvas → kotak terkumpul via jalur player (bukan debug), activePowerups terisi + powerRewardActive true.
- ✓ Panah Berkah: collect → remaining 20 → berkurang tiap detik → kosong setelah advance melewati durasi; Kipas: rateUntil = now+18; kotak tak diambil → expire 14 dtk + toast "Kotak sedekah menghilang... 😢" + rateUntil tetap -1.
- ✓ Hujan Pahala: kill pocong 8 → 11 pahala (×1.4) — starsEarned 22 utk 2 kill (deterministik, buff dikumpulkan setelah wave mulai).
- ✓ Perisai: 6 pocong lolos tanpa tower → shield 3→0 menahan 3 (mosqueHp penuh), 3 sisanya lolos normal (130→121 = 3×3 dmg) — perisai membatalkan leak sepenuhnya.
- ✓ Gate wave: nextPowerupAt sengaja jatuh di jeda antar-wave → TIDAK spawn; wave 2 mulai → langsung spawn.
- ✓ startGame reset (active 0, shield 0, box null, nextAt 0, until -1); screen 'victory' → kotak & pill otomatis bersih; run kemenangan penuh level 1 (3 tower, 170 dtk) sukses tanpa error — siklus natural spawn berjalan (nextAt 47→128).
- ✓ DOM pills: ".powerup-pill-shield | 🛡️Perisai ×3", ".powerup-pill-damage | 🏹Panah Berkah⏳ 20s", ".powerup-pill-rate | 🪭Kipas Ajaib⏳ 18s" — VLM konfirmasi klaster 3 pill (biru/emas/teal) di kiri-bawah, tampil rapi tanpa tumpang tindih DuaButton.
- Artefak: download/powerup_box.png, download/powerup_hud.png.

Stage Summary:
- P9-c SELESAI: Kotak Sedekah hadir sebagai engagement aktif mid-wave — kotak emas melayang (bob + spin + cincin warna buff + pulse/kedip 3 dtk terakhir) muncul tiap 26–40 dtk selama wave aktif (pertama 22 dtk setelah wave 1), diketuk (mouse/touch, hit-test bidang radius 1.3) untuk power-up sementara: +30% damage / +25% kecepatan serang (semua jenis serangan & sedekah) / +40% pahala kill — dengan pill HUD countdown per kind — atau Perisai Masjid 3 muatan yang menahan leak tanpa HP/curian. QA helpers debugSpawnPowerup/debugCollectPowerup + probe field private-TS tersedia untuk pengujian otomatis; semua mode (klasik/level/harian/mingguan) didukung.

---
Task ID: 12
Agent: sub-agent (P9-b usage stats)
Task: P9-b — STATISTIK PEMAKAIAN KARAKTER: lacak berapa kali tiap karakter dipasang & ikut menang (persist), tampilkan di layar KOLEKSI (badge kartu + chip modal detail) + sorting "📊 Paling Dipakai".

Work Log:
- persist.ts: `SaveData` + `charUsage: Record<string, { placed: number; wins: number }>` (key = id gameplay: 'ali', 'gen-13', 'custom-1'); DEFAULT_SAVE + `charUsage: {}`; merge defensif `sanitizeCharUsage()` di loadSave — entri malformed (placed/wins bukan number, entri string, object tanpa field) DILEWATI, nilai di-clamp ≥0; semua jalur return loadSave kini memberi object `charUsage` segar (hindari referensi bersama dgn DEFAULT_SAVE).
- achievements.ts: section "P9-b: statistik pemakaian karakter" — `getCharUsage()` (salinan defensif dari saveCache), `recordCharPlaced(charId)` (placed++, init entri, flush write-through → localStorage langsung), `recordCharsWon(charIds)` (wins++ per id UNIK via Set, flush).
- engine.ts: import + 2 hook — `tryPlace()`: `recordCharPlaced(def.id)` tepat setelah checkBadges towerPlaced; `onVictory()`: `recordCharsWon([...new Set(this.manager.towers.map(t => t.def.id))])` setelah clearLossStreak (semua tower yang masih berdiri dianggap ikut menang).
- store.ts: state `collUsage` (default {}) di antara field koleksi.
- collection.ts: `openCollection()` + `refreshCollData()` kini memuat `collUsage: getCharUsage()` sinkron ke store.
- CollectionScreen.tsx: (1) badge kartu `.coll-usage-badge` "📊 N×" kanan-bawah kartu MILIK yang pernah dipasang (lookup via `placeIdOf(c)` → id gameplay; title "Dipasang N× · Menang N×"); (2) modal detail: 2 chip `.coll-usage-chip` "📊 Dipasang N×" + "🏆 Menang N×" (hanya jika milik + placed > 0); (3) toggle urutan di baris filter: "Urutkan: ⭐ Rarity | 📊 Paling Dipakai" — mode usage = milik by placed DESC → sisa milik → belum dimilik by rarity (tie-break rarity+nama), berlaku utk tab Milikku & Semua.
- globals.css: section "P9-b — STATISTIK PEMAKAIAN KARAKTER" (~65 baris): `.coll-usage-badge` (absolute bottom-right, white/85, border 1.5px emerald-200, 9px font-black, rounded-full, pointer-events-none), `.coll-usage-chip` (emerald-50/200/700, 10px), `.coll-sort-chip`/`-on` (clone .coll-tab versi mungil).
- [FIX] PRE-EXISTING (P8/Task 9): modal detail koleksi "nyangkut" — menutup layar koleksi saat modal terbuka (X / "Mainkan Koleksimu!" / PASANG) TIDAK menghapus state `selected`, sehingga modal karakter lama muncul lagi begitu koleksi dibuka ulang. Fix: `setSelected(null)` di `close()` + `pickAndPlace()`.

VERIFIKASI (agent-browser probe __pmEngine/__pmStore + localStorage + DOM + VLM):
- ✓ lint bersih; tsc --noEmit: src/ 0 error (hanya pre-existing examples/ & skills/); dev.log HMR "✓ Compiled" tanpa error; console browser 0 error.
- ✓ SAVE LAMA → save existing tanpa charUsage tetap aman dimuat; startGame({levelId:1}) → tryPlace(0,'ali') → localStorage LANGSUNG berisi charUsage.ali = {placed:1, wins:0} (write-through terbukti); tryPlace(1,'aisyah')+(2,'umar') sukses, tryPlace(3,'ali') ditolak benar (pahala tinggal 10 < cost — ekonomi jalan).
- ✓ MENANG: advance(400) dgn 3 tower → screen 'victory' → charUsage ketiga karakter wins:1 (placed tetap).
- ✓ KOLEKSI NYATA: backToMenu → klik tile KOLEKSI (DOM click) → collUsage termuat ke store; tab Milikku 4 kartu → 2 badge "📊 1×" (ali+aisyah; kartu tanpa pemakaian tanpa badge, umar tak dimiliki → tak berbadge) dgn title "Dipasang 1× · Menang 1×"; computed style badge: absolute/right-bottom 6px/rounded-full/pointer-events none.
- ✓ MODAL DETAIL: klik kartu Ali → 2 chip "📊 Dipasang 3× | 🏆 Menang 1×" (setelah run tambahan ali 2×).
- ✓ SORTING: chip "⭐ Rarity | 📊 Paling Dipakai" render; klik Paling Dipakai → Ali (3×) jadi kartu PERTAMA di Milikku & Semua (100 kartu, owned+usage di atas, lalu milik, lalu unowned by rarity); chip aktif bergaya hijau (.coll-sort-chip-on).
- ✓ DEFENSIF: inject charUsage malformed (placed:"broke", entri tanpa wins, entri string) + reload → buka koleksi → collUsage hanya berisi entri valid (umar), 0 badge, tanpa crash; state valid dipulihkan setelahnya (2 badge kembali).
- ✓ [FIX] modal nyangkut: buka modal Ali → tutup koleksi (X) → buka lagi → modal TIDAK muncul lagi (sebelum fix: muncul — terkonfirmasi lewat screenshot awal).
- ✓ VLM: grid sorted (badge "📊 3×/1×" kanan-bawah kartu, chip urutan aktif hijau, Ali pertama, tanpa tumpang tindih); modal (2 chip hijau rapi); mobile 390px badge+chip terbaca, layout utuh.
- Artefak: download/coll_usage.png, coll_usage_modal.png, coll_usage_sorted.png, coll_usage_mobile.png, coll_usage_final.png.

Stage Summary:
- P9-b SELESAI: Statistik pemakaian karakter kini terekam permanen (placed/wins per id gameplay, write-through ke localStorage, tahan save lama & entri rusak) dan tampil di KOLEKSI: badge "📊 N×" di kartu milik, chip "Dipasang/Menang" di modal detail, plus sorting "Paling Dipakai" (favorit pemain naik ke atas). Bonus: bug modal detail koleksi yang muncul kembali saat dibuka ulang (P8) ikut diperbaiki.

---
Task ID: 13
Agent: sub-agent (P9 final QA)
Task: QA integrasi final fase P9 — regresi clean-load + alur penuh Tantangan Mingguan (menang, streak, submit skor) + cross-check Kotak Sedekah + statistik pemakaian koleksi + leaderboard mode + mobile 390×844 + audit console/lint/tsc (tanpa mengubah source).

Work Log:
- SETUP: dev server 200; localStorage dibersihkan → save segar (collOwned hero-ali+hero-aisyah, charUsage kosong); probe lengkap (__pmEngine/__pmStore/__THREE true). [A PASS]
- MENU: .weekly-card (violet) + .daily-card + tombol MAIN render; page errors kosong; VLM konfirmasi kartu violet rapi di bawah kartu oranye tanpa glitch. Artefak download/qa_final_menu.png. [A PASS]
- MINGGUAN startGame({weekly:true}) → screen playing, weeklyMode true, weeklyMod "Jumat Berkah" 🕌, totalWaves 10, levelId 0, mosqueMaxHp 145 (120+25), pahala 180. HUD .weekly-chip "🕌 PEKANAN · Jumat Berkah" (artefak qa_final_weekly_hud.png). [B PASS]
- CROSS-FEATURE: debugSpawnPowerup('panah-berkah') + debugCollectPowerup di mode mingguan → activePowerups 1 (remaining 20). [B PASS]
- RUN MINGGUAN #1: 10 tower (ali, aisyah×2, umar×2, fatimah×2, misbah, kakek×2) → VICTORY wave 10, mosqueHp 62/145 (bintang 1); weeklyStreakResult 1; banner violet "📅 Tantangan Mingguan Selesai!" + "⭐ +137 Bintang Toko!" (107 run + 30 bonus mingguan); form ScoreSubmit TAMPIL (tidak di-suppress utk mingguan); starCurrency 0→137; badge weekly_win terbuka; lastWeeklyWin 2026-W36. Submit "QA-P9 Mingguan" → scoreSubmitted true, POST 200, DB id 69 mode "Tantangan Mingguan" (verif sqlite langsung; bintang 1 → peringkat di luar top-10 papan). Artefak qa_final_weekly_victory.png (VLM: banner violet + banner bintang + form submit terkonfirmasi). [B PASS]
- RUN MINGGUAN #2 (agar entri QA masuk top-10 papan utk cek UI): auto-place loop 10 tower → VICTORY mosqueHp 102/145 (70% → bintang 2), streak TETAP 1 (idempotent pekan sama — benar), pahala 2299, defeated 153; starCurrency 137→281 (+144 = 114 run + 30 bonus); submit "QA-P9 Mingguan" lagi → rank 9 papan rekor. charUsage tercatat lintas fitur: ali 2/2, aisyah 4/2, umar 5/2, fatimah 5/2, misbah 2/2, kakek 5/2 (placed/wins) — persist di localStorage. [B PASS]
- POWERUP RESET: startGame({levelId:1}) setelah run mingguan → activePowerups [], shieldCharges 0, weeklyMode false, mosqueMaxHp 130, totalWaves 3. [C PASS]
- SPAWN NATURAL: advance(50) → wave 1 aktif + kotak powerup muncul sendiri (powerupGroup truthy), nextPowerupAt 80. [C PASS]
- PERISAI: collect 'perisai-masjid' → shieldCharges 3 (kind instan, benar tidak masuk activePowerups). Tanpa tower: sebelum perisai 6 pocong lolos (HP 130→112); dengan perisai HP TETAP 112 saat shield 3→2 (advance 30dtk), lalu 2→0 (2 serapan) dan HP mulai turun 112→92 (20 dmg leak sisa) — perisai 100% menahan leak tanpa HP turun selama muatan ada. [C PASS]
- PILL HUD: .powerup-pill-shield "🛡️Perisai ×3" + .powerup-pill-damage "🏹Panah Berkah⏳ 20s" + .powerup-pill-rate "🪭Kipas Ajaib⏳ 18s" di DOM; artefak qa_final_powerup.png (retake: potret pertama tertutup modal "Karakter Baru Terbuka!" Fatimah — perilaku unlock normal; VLM konfirmasi pill terbaca, tidak tumpang tindih tombol DOA BERSAMA). [C PASS]
- KOLEKSI: klik nyata tile KOLEKSI → collUsage termuat; badge kartu "📊 4×" (Aisyah, title "Dipasang 4× · Menang 2×") & "📊 2×" (Ali); modal detail 2 chip "📊 Dipasang 4×" + "🏆 Menang 2×". Artefak qa_final_coll.png, qa_final_coll_modal.png. [D PASS]
- SORTING: tab Semua urut Rarity → kartu pertama "Adib si Rajin Sholat" (belum dimiliki); klik chip "📊 Paling Dipakai" (.coll-sort-chip) → kartu pertama BERUBAH jadi "Aisyah si Penghafal Doa 📊 4×" lalu "Ali 📊 2×" (milik ber-pemakaian dulu) → milik lain → belum dimilik by rarity; chip aktif bergaya .coll-sort-chip-on; 0 error. Artefak qa_final_coll_sorted.png. [D PASS]
- LEADERBOARD: modal Papan Rekor → 10 baris, 4 chip violet .lb-mode-weekly "📅 Tantangan Mingguan"; baris "9 | QA-P9 Mingguan | 📅 Tantangan Mingguan | 👻 153 · 🛡️ gel. 10 · 🌟 2299 | ⭐⭐" — identik dgn DB/API. Artefak qa_final_leaderboard.png (baris perlu discroll ke dalam list max-h-80; VLM konfirmasi rank 9 + chip violet). [E PASS]
- MOBILE 390×844: menu scrollable (854>691), kartu mingguan terjangkau scroll (top 429→bottom 747 in-view); game mingguan: chip (x99,y172,w191) vs pill perisai (x10,y687,w106) vs tombol DOA BERSAMA (x10,y430-516) — TIDAK overlap, chip tidak keluar layar; VLM: readable, tanpa glitch. Artefak qa_final_mobile_menu.png, qa_final_mobile_weekly_card.png, qa_final_mobile_game.png. Viewport dikembalikan 1280×800. [F PASS]
- AUDIT: agent-browser errors KOSONG (dicek berkali); console 0 [error], hanya 1 warning benign "THREE.WebGLRenderer: WEBGL_lose_context extension not supported" (headless, lazy preview — sesuai spec OK); dev.log semua "✓ Compiled" + GET / 200 + POST/GET /api/leaderboard 200, tanpa error kompilasi; `bun run lint` (eslint .) BERSIH; `npx tsc --noEmit`: src/ 0 error (hanya 4 error pre-existing di examples/ & skills/ scaffold, exit 0). Reload final: probe + menu + save (starCurrency 281, weeklyStreak 1, charUsage utuh) semuanya sehat. [G PASS]

BUG / TEMUAN:
- [MINOR — laten, tanpa dampak pemain] engine.ts backToMenu() (baris 934-963) me-reset state powerup di sisi engine (despawnPowerupBox) tetapi TIDAK me-reset store activePowerups/shieldCharges → nilai basi tersisa di store setelah kembali ke menu mid-run (teramati: activePowerups 1, shieldCharges 3 di menu). Tidak terlihat pemain karena PowerupBadges.tsx (baris 32) hanya render saat screen === 'playing', dan startGame → resetForNewGame membersihkan keduanya. SARAN FIX: tambahkan `activePowerups: [], shieldCharges: 0` pada gameStore.set di backToMenu() (opsional + `this.lastPowerupHudJson = ''`).
- [OBSERVASI] collUsage di store bernilai {} sampai layar koleksi dibuka (lazy sync load by design P9-b); localStorage tetap berisi data — bukan bug.
- [OBSERVASI] Screenshot pertama powerup tertutup modal unlock karakter (timing unlock sesudah victory run) — bukan bug, retake sukses.
- TIDAK ADA blocker kritis; TIDAK ADA file source diubah.

Stage Summary:
- A Clean-load regression: PASS (probes, kartu menu, MAIN, errors kosong, save segar).
- B Tantangan Mingguan full flow: PASS (start→HUD chip→powerup cross-test→10 tower→VICTORY 2× , streak 1 idempotent, banner "+137/+144 Bintang" termasuk bonus +30⭐, form submit tampil, POST 200 mode "Tantangan Mingguan", rank 9 papan).
- C Kotak Sedekah cross-check: PASS (reset store, spawn natural ~22dtk, perisai 3 muatan menahan leak tanpa HP turun, pill HUD shield+damage+rate, screenshot).
- D Statistik pemakaian: PASS (badge 📊 N× + title, chip modal Dipasang/Menang, sorting "Paling Dipakai" mengubah kartu pertama → terpakai terbanyak, 0 error).
- E Leaderboard mode: PASS ("QA-P9 Mingguan" rank 9 dgn chip violet 📅 Tantangan Mingguan, identik DB/API).
- F Mobile 390×844: PASS (menu scrollable + kartu mingguan terbaca; HUD chip + pill + DOA BERSAMA tanpa overlap).
- G Audit: PASS (errors kosong; console 0 error + 1 warning benign; dev.log bersih 200s; lint bersih; tsc src/ 0 error).
- VERDICT: P9 (Task 10+11+12) LULUS QA INTEGRASI FINAL — 7/7 seksi PASS, 1 bug minor laten (reset store powerup di backToMenu) dilaporkan dgn saran fix, 0 blocker.

---
Task ID: 13-b
Agent: sub-agent (bugfix backToMenu powerup state)
Task: Fix stale activePowerups/shieldCharges in store after backToMenu()

Work Log:
- Baca laporan QA Task 13 (bug MINOR laten) + engine.ts backToMenu() (baris 934-963): gameStore.set me-reset screen/popup/mode TETAPI tidak me-reset activePowerups/shieldCharges → nilai basi (mis. shield 3, act 1) tertinggal di store setelah quit mid-run (tak terlihat pemain; resetForNewGame membersihkan di startGame berikutnya).
- FIX engine.ts backToMenu(): (1) tambah `activePowerups: []` + `shieldCharges: 0` di objek gameStore.set (dgn komentar) — sesuai saran QA; (2) reset mirror engine `this.shieldCharges = 0` + `this.lastPowerupHudJson = ''` di samping despawnPowerupBox() — meniru pola startGame (baris 885-888) agar syncPowerupHud tidak pernah menulis balik nilai basi ke store (defensive, 0 risiko regresi).
- VERIFIKASI STATIS: `bun run lint` (eslint .) BERSIH exit 0; `npx tsc --noEmit` exit 0 — src/ 0 error (hanya 4 error pre-existing di examples/ & skills/, sama spt sebelum fix).
- VERIFIKASI BROWSER (agent-browser, dev server 3000): open + 3s → probe __pmEngine/__pmStore true.
  - startGame({levelId:1}) → 'ok'; debugSpawnPowerup('perisai-masjid') + debugCollectPowerup() → 'done'; store: {shield:3, act:0} ✓ (state basi terbentuk sesuai skenario QA).
  - backToMenu() → 'back'; store: {screen:'menu', shield:0, act:0} ✓✓ FIX TERBUKTI (sebelum fix: shield tetap 3).
  - REGRESI tambahan: 'panah-berkah' (kind damage/timed) → {playing, shield:0, act:1}; backToMenu → {menu, shield:0, act:0} ✓; startGame({levelId:1}) berikutnya sehat → {playing, shield:0, act:0, wave:0}, lalu backToMenu 'clean'. agent-browser errors KOSONG.

Stage Summary:
- BUGFIX 13-b SELESAI: backToMenu() kini me-reset activePowerups [] + shieldCharges 0 di store (plus mirror engine shieldCharges/lastPowerupHudJson agar konsisten) — tidak ada lagi nilai power-up basi di store setelah kembali ke menu mid-run. Lint bersih, tsc src/ 0 error baru, verifikasi browser PASS utk powerup instan (perisai) & timed (panah) + startGame berikutnya normal + 0 page error.

---
Task ID: P9-FINAL
Agent: main-agent (Z.ai Code)
Task: PENUTUP FASE P9 — Tantangan Mingguan + Kotak Sedekah + Statistik Koleksi

Status Proyek Saat Ini:
- Game dalam kondisi sehat dan lengkap: seluruh fitur inti P1-P8 stabil (terverifikasi ulang lewat regresi clean-load QA final) — engine 3D Three.js + bloom + kamera pro, PETA 8 level + mode klasik + Daring Harian + Tantangan Mingguan, TOKO 100 karakter (6 hero legendaris + 94 generatif) + character creator, layar KOLEKSI penuh (statistik kepemilikan + filter + beli + deploy langsung + lazy WebGL preview), buff Nasihat nyata di gameplay, funFact edukatif, leaderboard berlabel mode, 20 hantu lokal Indonesia chibi dengan mekanik unik, 16 badge, dan sistem ekonomi ⭐ lengkap (TOKO → KOLEKSI → GAMEPLAY → MENANG → ⭐) — ditambah fase P9 yang baru saja selesai dan LULUS QA integrasi final 7/7 seksi. Audit menyeluruh bersih: `bun run lint` (eslint .) PASS, `npx tsc --noEmit` src/ 0 error (hanya 4 error pre-existing di scaffold examples/ & skills/), console browser 0 error (1 warning benign WebGL headless), dev.log hanya "✓ Compiled" + GET/POST 200.

Tujuan Fase / Modifikasi Selesai / Hasil Verifikasi:
- P9-a (Task ID 10): TANTANGAN MINGGUAN — 8 modifier pekanan bertema violet (WEEKLY_MODIFIERS: Badai Setan 🌪️, Kabut Pekat 🌫️, Gerimis Berkah 🌧️, Malam Bermega ✨, Pasukan Gergasi 👹, Zakat Mengalir 💰, Uji Iman 🕋 terberat 40⭐, Jumat Berkah 🕌) deterministik per pekan ISO (weeklyKey "YYYY-Www" Senin awal pekan + pickWeeklyModifier, hash sama seperti daily); startGame({weekly:true}) → konfigurasi klasik 10 wave penuh + mosqueHpBonus + startPahalaBonus + toast "TANTANGAN PEKAN INI"; streak idempotent per pekan (recordWeeklyWin: menang 2× di pekan sama streak tetap 1; backdate W35→W36 membuktikan streak 2) + badge baru "Penjaga Pekanan" 📅 (BADGES 15→16, event weeklyWin); bonus rewardStars 25-40⭐ masuk banner kemenangan violet "+N Bintang Toko!" (dihitung SEBELUM screen 'victory') + ring burst violet di masjid; skor TETAP masuk leaderboard mode "Tantangan Mingguan" (MODE_WHITELIST API + chip violet .lb-mode-weekly, XSS tetap ditolak); WeeklyChallengeCard violet di menu (chip "Pekan N" + pill bonus emas + streak + countdown pekan baru) + chip HUD .weekly-chip + banner .weekly-won-banner, famili CSS ~130 baris mirror konvensi .daily-*. BUGFIX BONUS (pre-existing P4): banner "+N Bintang Toko!" tidak pernah tampil (useState membaca runStarGain sekali saat mount, padahal engine baru dibuat di useEffect setelah render pertama → selalu 0) — diperbaiki dengan membaca nilai saat render layar 'victory'; terverifikasi klasik +25⭐ & mingguan +56⭐ (26 run + 30 bonus) kini tampil.
- P9-c (Task ID 11): KOTAK SEDEKAH power-up — 4 varian POWERUPS: 🏹 Panah Berkah (+30% damage, 20 dtk), 🪭 Kipas Ajaib (rate ×0.75, 18 dtk), 💰 Hujan Pahala (+40% reward kill, 25 dtk), 🛡️ Perisai Masjid (3 muatan instan — blok leak tanpa HP/curian turun); kotak emas melayang (bob + spin + cincin emisif warna buff + pulse/kedip 3 dtk terakhir) spawn HANYA saat wave aktif (firstDelay 22 dtk, interval rand 26-40 dtk, umur 14 dtk → smokePuff + toast "Kotak sedekah menghilang... 😢"), randomPowerupSpot memvalidasi posisi ≥1.8 dari SLOTS + luar platform masjid + dalam rumput inti (retry 10×, fallback halaman depan); pickup via pointer unified mouse+touch (hit-test bidang jarak < 1.3, diproses sebelum logika slot/tower) → SFX jingle epik buyRarity('epik') + firework + sparkle; multiplier diterapkan ke dmg DAN semua attack kind / 4 jalur cooldown (aura/sedekah/adzan/proyektil) + reward kill saat powerRewardActive; HUD PowerupBadges: klaster pill kiri-bawah dengan emoji + ⏳ countdown per warna (damage emas / rate teal / pahala hijau) + pill biru "🛡️ Perisai ×N", diff JSON anti re-render spam, auto-despawn saat bukan 'playing'; helper QA debugSpawnPowerup(defId?)/debugCollectPowerup(); berlaku di semua mode (klasik/level/harian/mingguan).
- P9-b (Task ID 12): STATISTIK PEMAKAIAN — SaveData.charUsage: Record<id gameplay, {placed, wins}> (key 'ali'/'gen-13'/'custom-1') write-through ke localStorage + merge defensif sanitizeCharUsage (entri malformed dilewati, nilai clamp ≥0, aman untuk save lama); recordCharPlaced() di-hook di engine.tryPlace() + recordCharsWon() di onVictory() (tower yang masih berdiri saat menang, id unik via Set); tampil di layar KOLEKSI: badge "📊 N×" kanan-bawah kartu milik (title "Dipasang N× · Menang N×"), 2 chip modal detail "📊 Dipasang N×" + "🏆 Menang N×" (hanya jika milik + placed > 0), dan toggle urutan "⭐ Rarity | 📊 Paling Dipakai" (milik by placed DESC dulu → milik lain → belum dimilik by rarity; berlaku di tab Milikku & Semua); collUsage dimuat sinkron via openCollection()/refreshCollData(). BUGFIX (pre-existing P8): stale detail modal koleksi — state selected tidak di-clear saat close()/pickAndPlace() sehingga modal karakter lama muncul lagi begitu koleksi dibuka ulang — diperbaiki dengan setSelected(null).
- BUGFIX 13-b: backToMenu() kini membersihkan activePowerups/shieldCharges di store (nilai basi tersembunyi).
- VERIFIKASI TOTAL (Task ID 13): QA 7/7 PASS — (A) regresi clean-load: probe + kartu menu + save segar + errors kosong; (B) alur penuh mingguan 2× victory: streak idempotent pekan sama, "+137⭐ & +144⭐ termasuk bonus +30⭐" (107+30 lalu 114+30), submit DB/UI cocok (POST 200, mode "Tantangan Mingguan", rank 9 papan rekor, verif sqlite langsung); (C) Kotak Sedekah: reset store bersih, spawn natural ~22 dtk, shield blok 100% bocor saat aktif (HP tetap saat muatan 3→0 lalu turun normal setelah habis), multiplier pahala 8→11 (×1.4) verified, pill HUD DOM benar; (D) statistik koleksi: badge 📊 4×/2× + chip modal + sorting "Paling Dipakai" mengubah kartu pertama; (E) leaderboard: baris rank 9 + chip violet identik DB/API; (F) mobile 390×844: menu scrollable, chip HUD vs pill perisai vs tombol DOA BERSAMA tanpa overlap; (G) audit akhir: lint bersih, tsc src/ 0 error, console 0 error, dev.log bersih. 11 screenshot artefak di download/qa_final_*.png (menu, weekly_hud, weekly_victory, powerup, coll, coll_modal, coll_sorted, leaderboard, mobile_menu, mobile_weekly_card, mobile_game). Follow-up BUGFIX 13-b juga diverifikasi ulang di browser (powerup instan & timed, startGame berikutnya normal, 0 page error) — P9 dinyatakan LULUS dengan 0 blocker.

Isu Belum Terselesaikan / Risiko & Rekomendasi Prioritas Fase Berikutnya:
- Karakter roster/custom belum punya funFact edukatif unik (masih generik) — prioritas sedang.
- Bahasa EN belum ada (i18n) — prioritas sedang, tugas besar menyentuh semua komponen.
- Lazy preview koleksi bisa kedip singkat saat scroll cepat (histeresis 1.6s) — naikkan ke 2.5s bila terganggu.
- Power-up: belum ada variasi kotak spesial/langka (mis. kotak hujan bintang event) — ide pengayaan.
- Statistik charUsage belum dipakai untuk rekomendasi strategi (mis. "Karakter andalanmu") — ide.
- Cloud save & export screenshot koleksi — ide jangka panjang.
- Prisma client dev server masih versi lama (leaderboard raw-SQL aman) — tidak mempengaruhi fungsi.

---
Task ID: P10 (14-a/14-b/14-c)
Agent: main-agent (Z.ai Code)
Task: FASE P10 — Kotak Bintang langka + Karakter Andalan (MVP) + funFact tema + polish styling

Status Proyek Saat Ini:
- Awal sesi: QA baseline P9 semuanya PASS (probe live, gameplay start/place/advance bersih, powerup spawn+collect+backToMenu-reset OK, lint/tsc/console 0 error). Game stabil — lanjut fitur baru sesuai rekomendasi P9-FINAL.

Work Log:

QA AWAL (agent-browser):
- Dev server 200 OK; probe __pmEngine/__pmStore/__THREE lengkap; menu (weekly+daily card) render; startGame level 1 → wave 1 aktif HP 130; debugSpawn+collect powerup aktif; backToMenu shield 0/act 0 (fix 13-b masih jalan); lint & tsc bersih; 0 page error.

P10-b: KOTAK BINTANG (power-up langka, Task 14-b):
- data.ts: PowerupDef.kind + 'star'; STAR_POWERUP (id 'kotak-bintang', emoji 🌟, durasi 12s, warna 0xffe066); STAR_BOX_CHANCE = 0.14; starBoxPahala(wave) = 60 + wave×5.
- engine.ts: spawn di updatePowerups kini 14% peluang Kotak Bintang vs POWERUPS biasa + toast khusus "🌟 KOTAK BINTANG LANGKA muncul! Buruan ketuk!" (toast biasa utk kotak reguler).
- buildPowerupBox: varian bintang — body emas lebih metalik+emissive, skala 1.18, OCTAHEDRON bintang berputar di tutup (starTopper, bob + spin), bintang kedua mengorbit (starOrbit radius 0.55), cincin ganda; sparkleRise tiap 0.6s selama hidup (starSparkleAcc).
- collectPowerup jalur 'star': pahala instan starBoxPahala(wave) masuk pahala+stats.starsEarned, activatePowerup('damage') + activatePowerup('rate') 12s sekaligus, VFX perayaan (firework×3 + rings×2 + sparkle×3 + showPahala), audio.buyRarity('legendaris'), toast "+N pahala & semua berkah!".
- updatePowerupVisual: topper/orbit animasi; skala urgensi mempertahankan faktor 1.18 utk bintang.
- debugSpawnPowerup menerima id 'kotak-bintang' (pool [STAR_POWERUP, ...POWERUPS]).
- PowerupBadges: KIND_CLASS + 'star' → .powerup-pill-star (fallback aman TS Record).
- CSS: .powerup-pill-star (emas berkilau + powerup-pulse 1.1s).

P10-a: KARAKTER ANDALAN / MVP PEMAIN (Task 14-a):
- achievements.ts: getFavoriteChar() → {id, placed, wins} (maks placed, tie-break wins; null bila kosong) + favoriteTitle(wins): 0-2 "Pemain Andalan 🌱" / 3-5 "Penjaga Setia 🛡️" / 6-9 "Bintang Lapangan ⭐" / 10+ "Legenda Masjid 🏆".
- MainMenu.tsx: banner .mvp-banner (emoji karakter beranimasi wobble, label "⭐ KARAKTER ANDALAN", nama+gelar, chip 📊 N× & 🏆 N, ChevronRight) di antara kartu judul & tombol MAIN — klik → buka Koleksi.
- [BUGFIX saat QA] mvp semula dibaca sekali via useState (stale seperti bug banner bintang P9!) → kini dihitung INLINE saat render dengan gate screen==='menu' (re-aktif tiap kembali ke menu; terverifikasi: run 3 tower → victory → backToMenu → banner langsung update 📊2×🏆1).
- CollectionScreen.tsx: kartu sorotan .mvp-card di atas grid tab Milikku (emoji besar mvp-emoji-lg, label "⭐ KARAKTER ANDALANMU", nama, gelar, chip Dipasang/Menang, tombol Detail → modal) — dihitung dari collUsage via useMemo (ikut refresh saat data koleksi berubah) + lookup RosterChar via placeIdOf.
- CSS (~100 baris): .mvp-banner/-emoji/-label/-name/-title/-stat(-win) ungu-lavender + emas; .mvp-card (radial+linear gradient, mvp-sheen kilau menyapu 3.2s via ::after); tombol Detail di-stack self-end di bawah chip (align fix dari feedback VLM).

P10-c: funFact TEMA (Task 14-c):
- chardb.ts: THEME_FACTS 11 kunci × 3 fakta (30 fakta baru: santri_desa/santri_kota/pesantren/yatim_ceria/juara_adzan/penjahit/petani/pedagang/dokter_cilik/imam_muda + custom khusus karakter buatan pemain).
- synthFunFact: pool gabungan POWER_FACTS + THEME_FACTS (6 pilihan per karakter vs 3 dulu) — deterministik by id hash, tetap + label varian.
- Terverifikasi: gen-5 dapat fakta tema petani ("Menanam 1 pohon itu sedekah jariah"), gen-10 fakta dokter_cilik (Ibnu Sina), gen-1/13 tetap fakta power — variasi nyata.

VERIFIKASI (probe + DOM + VLM + mobile 390×844):
- ✓ Kotak Bintang: debugSpawn → powerupGroup.userData.isStar true + starTopper/starOrbit ada; collect → pahala 220→285 (+65 = 60+5×wave1 ✓), pil damage:12 & rate:12 aktif; advance(15) → pil habis tepat 12s; VLM: pil emas/teal terbaca jelas.
- ✓ Weekly + star box cross-test: startGame({weekly:true}) mode Jumat Berkah + kotak bintang berfungsi (pahala 180+65=245 ✓).
- ✓ MVP: fresh user tanpa usage → banner TIDAK tampil (benar); place 1 tower → backToMenu → banner muncul; full victory 3 tower → semua charUsage wins+1 & banner update live; VLM menu: banner "Ali · Pemain Andalan" + stat badge jelas, layout bersih.
- ✓ Koleksi: kartu MVP (Umar 5×/2× saat data QA lama) + tombol Detail stack rapi (chips bottom 309 → btn top 313); VLM: kartu prominent & well-formatted.
- ✓ Mobile 390×844: banner MVP fitsX (x:0 w:390), VLM: teks tidak terpotong, semua elemen muat.
- ✓ funFact variasi: gen-1/2/3/13 fakta power, gen-5/10 fakta tema — pool 6 bekerja.
- ✓ Regresi: lint bersih, tsc --noEmit src/ 0 error, dev.log hanya ✓ Compiled + GET 200, agent-browser errors kosong.

Stage Summary:
- P10 SELESAI: (1) Kotak Bintang langka 14% — momen kejutan besar saat wave aktif (semua berkah + pahala instan + perayaan VFX/SFX legendaris, hiasan bintang 3D berputar + orbit + sparkle periodik); (2) Karakter Andalan memberi identitas progres personal (banner menu reaktif + kartu sorotan koleksi + sistem gelar 4 tingkat); (3) funFact koleksi kini 2× lebih variatif (48 fakta: 18 power + 30 tema, termasuk 3 khusus karakter custom pemain).

Isu Belum Terselesaikan / Risiko & Rekomendasi Fase Berikutnya:
- Menu MainMenu records/levelProg/starCur/ownedCount masih dibaca sekali via useState (stale dalam satu sesi — hanya terlihat setelah reload; pola perbaikan sama seperti mvp inline). PRIORITAS RENDAH-SEDANG.
- Bahasa EN (i18n) belum ada — prioritas sedang, tugas besar.
- i18n + funFact EN akan butuh map bahasa ganda.
- Kotak Bintang belum punya efek layar penuh (flash emas sekejap) — ide pengayaan visual.
- Statistik charUsage belum ada "hall of fame" historis (top 3 all-time) — ide.
- Ide lain: SFX khusus spawn kotak bintang (saat ini hanya toast), tutorial micro utk kotak sedekah, wave 11+ endless mode, cloud save.
- catatan QA: window.open popup test membuat konteks browser baru (localStorage terpisah) — gunakan tab yang sama saat QA berikutnya, atau QA ulang dari fresh state (justru berguna utk uji first-run).

---
Task ID: P11 (15-a/15-b/15-c)
Agent: main-agent (Z.ai Code)
Task: FASE P11 — Mode Tak Berujung (endless) + fix stale reads MainMenu + polish Kotak Bintang

Status Proyek Saat Ini:
- Awal sesi: QA baseline P10 semua PASS (probe, menu lengkap 4 kartu, startGame/place/starbox/backToMenu, lint/tsc/0 error) → game stabil, lanjut fitur sesuai rekomendasi P10: endless mode + fix stale reads + SFX/flash kotak bintang.

Work Log:

QA AWAL (agent-browser):
- 200 OK, probe lengkap, mvp-banner + weekly-card render, startGame level 1 + tryPlace + starbox collect + backToMenu bersih, 0 error.

P11-a: FIX STALE READS MAINMENU (rekomendasi P10):
- MainMenu.tsx: records/levelProg/starCur/ownedCount semula dibaca SEKALI via useState (nilai basi dalam sesi — ⭐ currency tidak bertambah setelah menang sampai reload) → kini dihitung INLINE saat render dengan gate `onMenu = screen==='menu' && typeof window !== 'undefined'` (pola sama dengan fix MVP P10).
- VERIFIKASI: setelah run + backToMenu TANPA reload, chip currency menampilkan nilai segar dari localStorage (188) ✓.

P11-b: MODE TAK BERUJUNG (ENDLESS):
- data.ts: generateEndlessWave(waveNum) — PRNG mulberry32 deterministik per nomor wave; pool 3 tier musuh (COMMON pocong/tuyul/kunti, MID 7 tipe, LATE 9 tipe) dgn probabilitas naik seiring wave; 3-4 grup, count 3-5 + wave/3 (cap 14), interval min 0.55; boss tiap wave %5 == 0 (banaspati + 2 pengikut pool + pocong); reward 50+wave×3 (boss 90+wave×4).
- persist.ts: SaveData.bestEndlessWave (default 0, merge defensif clamp ≥0).
- achievements.ts: getBestEndlessWave() + recordEndlessWave(wave) → boolean newRecord.
- store.ts: endlessMode + endlessNewRecord (+ interface + default + resetForNewGame).
- engine.ts:
  - startGame opts + endless?: boolean → set endlessMode + toast khusus ×2.
  - [FIX KRITIS tersembunyi] onWaveComplete: `WAVES[waveNum-1]` (global, undefined utk wave>10!) → `this.levelWaves[waveNum-1] ?? WAVES[...]` — dulu aman karena level reward kebetulan selaras; WAJIB utk endless (flag lama worklog "caution" kini terselesaikan).
  - onWaveComplete: saat waveNum >= levelWaves.length + endlessMode → push generateEndlessWave (bukan onVictory) + toast "♾️ Gelombang tak berujung terus datang!" / boss warning.
  - continueEndless() PUBLIC: validasi (victory + bukan daily/weekly/level) → screen playing + endlessMode + resume BGM + reset pose tower (menari saat victory) + generate wave 11+ + nextWaveIn + toast.
  - runRewardBase field: pahala dasar yang SUDAH ditukar ⭐ (set di onVictory setelah grantRunReward); onGameOver endless: delta = starsEarned - runRewardBase → runStarGain = grantRunReward(delta) (hadiah ⭐ dari pahala selama bertahan) + endlessNewRecord = recordEndlessWave(st.wave) + toast REKOR BARU.
  - backToMenu: reset endlessMode/endlessNewRecord.
- EndScreens.tsx:
  - Victory klasik (bukan daily/weekly/level): tombol teal "♾️ LANJUT TAK BERUJUNG! (semua penjaga dipertahankan)" → continueEndless.
  - Gameover endless: banner teal "Bertahan hingga Gelombang N!" + kondisional "🏆 REKOR BARU!" + banner "+N Bintang Toko! (dari pahala bertahan)" (starGain kini dibaca juga di gameover endless) + ScoreSubmit dgn TIER bintang dari kedalaman wave (≥15→3⭐, ≥12→2⭐, ≥10→1⭐, else 0) agar run hebat terlihat di papan + restart endless.
  - ScoreSubmit mode label: 'Tak Berujung'.
- Hud.tsx: panel wave "♾️ Gelombang N ∞" (bukan N/total) + dot "+∞" + chip teal .endless-chip "TAK BERUJUNG · Bertahan selama mungkin!" (spin 360° linear 3.2s).
- MenuModals.tsx: chip .lb-mode-endless + emoji ♾️.
- API leaderboard: whitelist + 'Tak Berujung'; [FIX VALIDASI] stars 0-3 (dulu 1-3 → endless gameover ditolak 400!) + wave 0-999 (dulu 0-10 → wave 11+ ditolak!).
- EndlessChallenge.tsx BARU: kartu teal (emoji ♾️ wobble, header + chip Rekor: Gel. N, 3 chip efek, tombol MULAI BERTAHAN!, footnote) — mounted di MainMenu setelah WeeklyChallengeCard.
- CSS ~110 baris: .endless-card/-effect-chip/-best-chip, .btn-endless, .endless-chip, .endless-won-banner, .lb-mode-endless (semua teal #2dd4bf/#14b8a6/#0d9488 family, mirror konvensi weekly).

P11-c: POLISH KOTAK BINTANG:
- Spawn kotak bintang kini dirayakan: audio.tada() + showStarFlash() — overlay radial-gradient emas (rgba(255,224,102)) z-39 fade 0.7s auto-remove 800ms (pattern flash screenshot engine).
- VERIFIKASI: div flash muncul di body dengan cssText benar lalu auto-remove.

VERIFIKASI (probe + DOM + VLM + DB + mobile):
- ✓ Endless dari menu: startGame({endless:true}) → mode aktif + chip HUD; tanpa tower → gameover wave 4 → endlessNewRecord TRUE + bestEndlessWave 4 tersimpan + banner "♾️ Bertahan hingga Gelombang 4! 🏆 REKOR BARU!" + form submit tampil; POST awal 400 (bug validasi stars/wave) → setelah fix 200.
- ✓ Entry DB: {name: QA-P11 Endless, stars: 0, wave: 4, mode: Tak Berujung} (sqlite verify).
- ✓ Victory klasik → LANJUT TAK BERUJUNG button tampil → klik → screen playing + endlessMode + 8 tower DIPERTAHANKAN + wave 10 + levelWaves 10→11 + pahala/HP dipertahankan + chip HUD.
- ✓ Simulasi endless: wave 11 → 58 berturut (levelWaves tumbuh 11→32→59), boss wave 15/30/35/... semua terselesaikan (HP bertahan berkat tower upgrade + powerup farm).
- ✓ Gameover endless lanjutan (tower dihapus utk paksa): wave 16, endlessNewRecord TRUE (16 > best 4), runStarGain 95 = grantRunReward(delta 1895) — total starCurrency 93+95=188 PERSIS ✓; banner "+95 Bintang Toko! (dari pahala bertahan)" di DOM ✓.
- ✓ Submit tier: wave 16 → stars 3 → POST 200 → DB {QA-P11 Wave16, stars 3, wave 16, defeated 288, pahala 3778, mode Tak Berujung} → LEADERBOARD RANK #1 dgn chip teal "♾️ Tak Berujung" (VLM verify).
- ✓ Gameover wave 4 (bukan rekor): banner TANPA "REKOR BARU" (kondisional benar) + VLM: form + coach tips + tombol lengkap, layout bersih.
- ✓ Mobile 390×844: kartu endless fits (x16 w359), chip HUD fits, wave panel "♾️ Gelombang 0 ∞+∞" — VLM: no overlap.
- ✓ Regresi akhir: reload fresh → probe + 5 kartu menu (daily/weekly/endless/mvp) render; lint bersih; tsc --noEmit src/ 0 error; dev.log bersih; agent-browser errors KOSONG.
- Artefak: p11_endless_menu.png, p11_endless_card.png, p11_victory_continue.png, p11_endless_gameover2/3.png, p11_leaderboard_endless.png, p11_mobile_menu/endless/game.png, p11_star_flash.png.

CATATAN QA PENTING (utk sesi berikut):
- Eval loop advance() besar (advance(10)×40 dalam 1 eval) saat state wave 58 + banyak entitas → timeout CDP (main thread blocked) → browser close + open pulihkan. BATASI chunk eval (advance ≤ 240s sim per eval, atau pecah per 12s seperti bot sukses).
- Bun + better-sqlite3 native module crash (NAPI fatal) — QA DB via curl API GET (top 10) saja.

Stage Summary:
- P11 SELESAI: (1) MODE TAK BERUJUNG lengkap end-to-end — 2 pintu masuk (kartu menu teal dgn rekor + tombol LANJUT di victory klasik), generator gelombang deterministik per nomor (pool 19 musuh 3 tier + boss tiap 5), rekor bestEndlessWave persist, hadiah ⭐ delta pahala selama bertahan, skor masuk leaderboard dgn tier bintang + chip teal; (2) fix stale reads MainMenu (currency/records live tanpa reload); (3) polish Kotak Bintang (SFX tada + flash emas radial); + 2 bug validasi API ditemukan & difix (stars 0, wave >10 ditolak).
- Bot bertahan hingga wave 58 (boss ×8+ survived) — endless balance: menantang tapi bisa sangat jauh dengan strategy bagus.

Isu Belum Terselesaikan / Risiko & Rekomendasi Fase Berikutnya:
- Bahasa EN (i18n) masih prioritas sedang — tugas besar menyentuh semua komponen.
- Endless leaderboard: ranking pakai stars DESC — run endless 3⭐ wave 15-16 sejajar dgn victory 3⭐; pertimbangkan kolom/mode-filter khusus papan rekor (tab "♾️ Terjauh" sort wave DESC).
- Kartu endless menambah tinggi scroll menu (4 kartu sekarang) — pertimbangkan tab/kategori di mobile bila feedback pengain sempit.
- Tutorial bubble sempat tertangkap kamera QA di gameplay (screen playing) — by design; pastikan markTutorialDone jalan di run nyata.
- Ide: wave milestone reward (⭐ bonus tiap 5 wave), enemy speed scale pelan di wave sangat tinggi (HP saja sekarang — wave 50+ hanya HP naik), hujan bintang VFX boss endless, save mid-run.

---
Task ID: P12 (16-a/16-b/16-c/16-d)
Agent: main-agent (Z.ai Code)
Task: FASE P12 — Milestone Tak Berujung + Papan Rekor "Terjauh" + Hujan Bintang VFX + polish styling

Status Proyek Saat Ini:
- Awal sesi: QA baseline P11 semua PASS (probe live, startGame/tryPlace/advance/backToMenu bersih, star box +65 pahala, lint/tsc/0 error) → game stabil, lanjut fitur sesuai rekomendasi P11: milestone reward endless, papan rekor khusus endless, VFX, kecepatan musuh wave tinggi.

Work Log:

QA AWAL (agent-browser):
- 200 OK; probe lengkap; endless mode regression (startGame({endless:true}) + 2 tower + wave 2); star box collect (+65); backToMenu shield/act 0 (fix 13-b masih jalan); lint & tsc bersih; dev.log bersih.

P12-a: MILESTONE TAK BERUJUNG (bonus ⭐ tiap 5 gelombang):
- data.ts: ENDLESS_MILESTONE_STEP = 5; milestoneReward(waveNum) = min(12, 4 + floor(wave/5)) → gel.5=5⭐, 10=6⭐, 15=7⭐, 40+=12⭐ (cap).
- store.ts: field baru endlessMilestones + endlessMilestoneStars (default 0, reset di resetForNewGame).
- engine.ts onWaveComplete: saat st.endlessMode && waveNum % 5 === 0 → addStarCurrency(bonus) + store counter + particles.starRain(26) + showStarFlash + audio.tada + toast tertunda "🏁 MILESTONE! N gelombang bertahan! +N⭐ bonus toko!" + checkBadges({event:'endlessMilestone', wave}). [BUGFIX-DEV] semula ditaruh DI DALAM gerbang waveNum >= levelWaves.length → milestone gel. 5 tidak pernah terpicu (wave 5 masih def klasik); DIPINDAH ke luar gerbang agar semua kelipatan 5 berhitung.
- [BUGFIX P12 — UX laten P11] totalWaves store tidak pernah bertumbuh di endless (mentok 10) → tombol "MULAI GELOMBANG!" + preview gelombang berikutnya HILANG setelah gel. 10 (pemain menunggu 16 dtk tanpa tombol skip). FIX: onWaveComplete endless set totalWaves = levelWaves.length setelah push; continueEndless ikut sinkron; + guard kondisi HUD (wave < totalWaves || endlessMode).
- onGameOver: rekor baru (wave ≥ 5) → starRain(22) + audio.cheer. backToMenu: reset endlessMilestones/Stars (pola 13-b).
- achievements.ts: BADGES 16→17 — 'endless_15' "Penjelajah Abadi ♾️ (Milestone gel. 15 di Tak Berujung)"; BadgeCtx event 'endlessMilestone'.
- Hud.tsx: chip emas .milestone-chip "🏁 N MILESTONE · +N⭐" di bawah chip endless (AnimtePresence, muncul setelah milestone pertama, emoji wobble).
- EndScreens.tsx gameover endless: kartu rekap .milestone-recap "🏁 N milestone tercapai! +N⭐ bonus sudah diterima selama bertahan ✨".
- EndlessChallenge.tsx: chip efek baru "🏁 Milestone ⭐ tiap 5 gel." + footnote menyebut tab ♾️ Terjauh.

P12-b: PAPAN REKOR "TERJAUH" (rekomendasi P11 — ranking endless pakai wave):
- API route.ts: GET menerima ?sort=wave → WHERE mode='Tak Berujung' ORDER BY wave DESC, stars DESC, defeated DESC (SQL string tetap, aman injeksi); default tak berubah (RANK_SQL_BEST sama spt sebelumnya).
- MenuModals.tsx LeaderboardModal: state tab 'best' | 'far' + switchTab (chime + refetch) + tombol .lb-tab "🏆 Terbaik" / .lb-tab-far "♾️ Terjauh" (role=tablist, aria-selected); baris mode far menampilkan metrik utama .lb-wave-big (angka besar + label "gel.") menggantikan StarRow, subjudul hanya 👻+🌟; empty state khusus; catatan teal penjelasan; key baris prefixed tab agar animasi re-mount.
- CSS: .lb-tabs/.lb-tab(-active emas)/.lb-tab-far(-active teal)/.lb-wave-big/.lb-wave-num/.lb-wave-label.

P12-c: HUJAN BINTANG VFX + KECEPATAN MUSUH WAVE TINGGI:
- particles.ts: starRain(x, z, count=26) — bintang emas 4-palet jatuh dari y 5.5-8 (gravity 6, life 1.2-1.9, drag 0.995) radius 6 + 8 glow turun + 2 cincin emas menyapu tanah; dipakai milestone & rekor baru.
- entities.ts Enemy: waveSpeedMul = wave > 30 ? 1 + min(0.18, (wave-30)*0.006) : 1 (gel. 31 +0.6% … gel. 60+ cap +18%) — diterapkan di speed efektif update() agar wave 50+ tetap menantang (dulu hanya HP yang naik).

P12-d: POLISH STYLING (wajib):
- .star-gain-banner: banner "+N Bintang Toko!" (victory + gameover endless) kini bershine-sweep + tepi emas (mvp-sheen reuse 2.4s).
- .boss-hp-fill: HP bar boss kini bergaris diagonal berjalan (boss-stripes 0.9s) — kesan "panas".
- Hover lift: .daily-card/.weekly-card/.endless-card translateY(-3px) scale(1.012) + shadow deepen per warna tema (transisi bouncy cubic-bezier).
- Scrollbar Firefox: scrollbar-width thin + scrollbar-color amber (lintas browser, sebelumnya hanya webkit).
- CSS P12 total ~150 baris (milestone-chip/-recap + milestone-glow + lb-tab family + wave-big + polish).

BUGFIX BONUS (pre-existing laten, ditemukan QA):
- [framer-motion] banner boss HUD: animate rotate [0,-2,2,-1,0] (5 keyframe) + transition spring → framer-motion melempar error "Only two keyframes currently supported with spring" TIAP banner boss muncul (terlihat di console errors, tidak crash). FIX: per-property transition rotate: {type:'tween', duration:0.55, ease:'easeInOut'} — goyangan boss tetap jalan, error hilang (verifikasi: browser session fresh + trigger banner boss → 0 error; sebelumnya 2 error ter-log).

VERIFIKASI (probe + DOM + VLM + DB + mobile):
- ✓ Milestone berurutan: gel.5 selesai → ms=1 +5⭐; gel.10 → ms=2 +6⭐ DAN totalWaves 10→11; gel.15 → ms=3 +7⭐ (totalWaves tumbuh 10→16 via wave 11-15); run lanjut wave 16 tanpa error.
- ✓ HUD: .milestone-chip "🏁3 MILESTONE · +18⭐" + .endless-chip; sim state wave 12/12 → tombol "MULAI GELOMBANG! (11s)" TETAP tampil (bugfix totalWaves) — VLM: chip teal + chip emas + tombol + panel "Gelombang 12 ∞" semuanya jelas, no overlap.
- ✓ Gameover endless (run 8 tower god-HP): recap "🏁1 milestone tercapai! +5⭐ bonus sudah diterima" + "+18 Bintang Toko! (dari pahala bertahan)" + banner teal "Bertahan hingga Gelombang 8!" + form submit — VLM 4/4 YES, layout bersih. Run ms=3: recap "+18⭐" + "+52 Bintang" terverifikasi DOM.
- ✓ Badge: save.achievements berisi 'endless_15' setelah milestone gel. 15 (badgeCount 10).
- ✓ API ?sort=wave: hanya mode Tak Berujung, urut wave DESC (16 → 8 → 4); default tetap stars DESC semua mode; dev.log query SQL benar.
- ✓ E2E submit: form gameover (React setter input "QA-P12 Terjauh" + klik tombol Kirim skor) → POST 200 → DB {QA-P12 Terjauh, wave 8, mode Tak Berujung} tampil di papan Terjauh.
- ✓ UI leaderboard: tab emas "Terbaik" (aktif, baris bintang ⭐ + mode chip) vs tab teal "Terjauh" (aktif, .lb-wave-big angka + "gel.") — VLM 2 screenshot 4-5/4-5 YES no overlap.
- ✓ Mobile 390×844: menu scrollable, endless card fits 0→390 + chip "🏁 Milestone ⭐ tiap 5 gel." terbaca; modal leaderboard 325w fits; HUD chip milestone/endless/DOA fits tanpa overlap; menu bottom: tombol Lencana/Papan Rekor + footer terlihat (VLM 4/4 YES).
- ✓ Regresi akhir: lint bersih; tsc --noEmit src/ 0 error; agent-browser errors 0 (session fresh setelah fix banner boss); dev.log hanya ✓ Compiled + GET 200 (+ query sort=wave).
- Artefak screenshot: p12_gameover_clean.png, p12_gameover_final.png, p12_lb_best_tab.png, p12_lb_far_tab.png, p12_hud_chips.png, p12_mobile_menu.png, p12_mobile_menu_bottom.png, p12_mobile_lb_far.png, p12_mobile_game.png, p12_menu_desktop.png.

CATATAN QA PENTING (utk sesi berikut):
- Headless: animasi EXIT framer-motion membeku tanpa tick rAF (modal funFact 'Karakter Baru Terbuka!' dapat menutupi screenshot gameover) → solusi: pre-seed unlockedChars dgn 6 id (ali/aisyah/umar/fatimah/kakek/misbah) SEBELUM startGame agar popup unlock tidak muncul, atau sembunyikan overlay utk screenshot.
- `agent-browser close` me-reset profil (localStorage hilang) — berguna utk uji first-run, tapi state QA panjang hilang.
- Tombol submit skor gameover: aria-label "Kirim skor" (berisi ikon Send, tanpa teks) — klik via [aria-label].
- Red badge "1 Issue" pojok kiri bawah screenshot = overlay agent-browser sendiri (bukan game).

Stage Summary:
- P12 SELESAI: (1) Milestone Tak Berujung tiap 5 gelombang — bonus ⭐ langsung (5-12⭐ naik bertahap) + hujan bintang + flash emas + chip HUD live + rekap gameover + lencana ke-17 "Penjelajah Abadi"; (2) bugfix UX laten totalWaves (tombol MULAI GELOMBANG + preview kembali di endless gel. 10+); (3) Papan Rekor tab "♾️ Terjauh" (API ?sort=wave + UI teal dgn metrik gelombang besar) — run endless kini bersaing adil; (4) VFX starRain + kecepatan musuh wave 31+ (cap +18%); (5) polish styling: shine banner bintang, HP bar boss bergaris, hover lift kartu tantangan, scrollbar Firefox; (6) bugfix framer-motion banner boss (error console per boss wave, kini 0).

Isu Belum Terselesaikan / Risiko & Rekomendasi Fase Berikutnya:
- Bahasa EN (i18n) masih prioritas sedang — tugas besar menyentuh semua komponen (makin besar tiap fase baru).
- Menu mobile makin panjang (5 kartu: judul, mvp, daily, weekly, endless) — pertimbangkan tab/kategori atau horizontal scroll utk kartu tantangan (rekomendasi P11 yang belum ditangani).
- Kecepatan musuh wave 31+ hanya diverifikasi statis (wave 60+ sulit dicapai QA) — logika trivial, risiko rendah.
- Ide lanjutan: milestone badge tier (5/10/15/20), efek layar "MILESTONE" besar (flash + text banner React, saat ini toast), statistik sejarah milestone di koleksi, save mid-run, cloud save.
- Kotak Bintang & milestone keduanya emas — bila bentrok visual saat bersamaan, pertimbangkan warna milestone (mis. teal-emas dua-ton).
