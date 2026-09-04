'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const LANGUAGES = [
  ['id', 'Indonesia'], ['en', 'English'], ['ar', 'العربية'], ['ms', 'Melayu'],
  ['hi', 'हिन्दी'], ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'],
  ['tr', 'Türkçe'], ['ur', 'اردو'], ['zh', '简体中文'], ['ja', '日本語'],
  ['ko', '한국어'], ['de', 'Deutsch'], ['it', 'Italiano'], ['ru', 'Русский'],
  ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['bn', 'বাংলা'], ['sw', 'Kiswahili'],
] as const

export type LanguageCode = (typeof LANGUAGES)[number][0]
type TranslationKey = keyof typeof translations.id

const translations = {
  id: {
    language: 'Bahasa', languageHint: 'Pilih bahasa permainan', settings: 'PENGATURAN',
    settingsHint: 'Atur biar nyaman dimainkan!', sound: 'Efek Suara (SFX)', music: 'Musik Latar',
    quality: 'Kualitas Grafis', camera: 'Kontrol Kamera', drag: 'Sensitivitas geser (drag)',
    zoom: 'Sensitivitas zoom (scroll/cubit)', slow: 'Lambat', fast: 'Cepat', smooth: 'Halus', bold: 'Nekat',
    resetTitle: 'Mulai dari Awal', resetDesc: 'Hapus semua rekor, lencana, bintang toko, dan progres level. Tidak bisa dibatalkan!',
    resetButton: 'Reset Semua Progres', yesReset: 'Ya, Hapus Semua!', cancel: 'Tidak Jadi',
    store: 'TOKO', collection: 'KOLEKSI', map: 'PETA', rules: 'ATURAN', owned: 'dimiliki', characters: 'karakter!',
  },
  en: {
    language: 'Language', languageHint: 'Choose game language', settings: 'SETTINGS', settingsHint: 'Make the game comfortable to play!', sound: 'Sound Effects (SFX)', music: 'Background Music', quality: 'Graphics Quality', camera: 'Camera Controls', drag: 'Drag sensitivity', zoom: 'Zoom sensitivity (scroll/pinch)', slow: 'Slow', fast: 'Fast', smooth: 'Smooth', bold: 'Bold', resetTitle: 'Start Over', resetDesc: 'Delete all records, badges, shop stars, and level progress. This cannot be undone!', resetButton: 'Reset All Progress', yesReset: 'Yes, Reset Everything!', cancel: 'Cancel', store: 'SHOP', collection: 'COLLECTION', map: 'MAP', rules: 'RULES', owned: 'owned', characters: 'characters!',
  },
  ar: {
    language: 'اللغة', languageHint: 'اختر لغة اللعبة', settings: 'الإعدادات', settingsHint: 'اجعل اللعبة مريحة!', sound: 'المؤثرات الصوتية', music: 'الموسيقى الخلفية', quality: 'جودة الرسوم', camera: 'عناصر التحكم بالكاميرا', drag: 'حساسية السحب', zoom: 'حساسية التكبير', slow: 'بطيء', fast: 'سريع', smooth: 'ناعم', bold: 'قوي', resetTitle: 'البدء من جديد', resetDesc: 'حذف كل السجلات والشارات والنجوم والتقدم. لا يمكن التراجع!', resetButton: 'إعادة ضبط التقدم', yesReset: 'نعم، احذف الكل!', cancel: 'إلغاء', store: 'المتجر', collection: 'المجموعة', map: 'الخريطة', rules: 'القواعد', owned: 'مملوك', characters: 'شخصية!',
  },
  ms: {
    language: 'Bahasa', languageHint: 'Pilih bahasa permainan', settings: 'TETAPAN', settingsHint: 'Jadikan permainan lebih selesa!', sound: 'Kesan Bunyi (SFX)', music: 'Muzik Latar', quality: 'Kualiti Grafik', camera: 'Kawalan Kamera', drag: 'Kepekaan seret', zoom: 'Kepekaan zum', slow: 'Perlahan', fast: 'Pantas', smooth: 'Lembut', bold: 'Kuat', resetTitle: 'Mula Semula', resetDesc: 'Padam semua rekod, lencana, bintang kedai dan kemajuan. Tidak boleh dibuat asal!', resetButton: 'Set Semula Kemajuan', yesReset: 'Ya, Padam Semua!', cancel: 'Batal', store: 'KEDAI', collection: 'KOLEKSI', map: 'PETA', rules: 'PERATURAN', owned: 'dimiliki', characters: 'watak!',
  },
  hi: { language: 'भाषा', languageHint: 'गेम की भाषा चुनें', settings: 'सेटिंग्स', settingsHint: 'गेम को आरामदायक बनाएं!', sound: 'ध्वनि प्रभाव', music: 'पृष्ठभूमि संगीत', quality: 'ग्राफिक्स गुणवत्ता', camera: 'कैमरा नियंत्रण', drag: 'ड्रैग संवेदनशीलता', zoom: 'ज़ूम संवेदनशीलता', slow: 'धीमा', fast: 'तेज़', smooth: 'हल्का', bold: 'तेज़', resetTitle: 'फिर से शुरू करें', resetDesc: 'सभी रिकॉर्ड और प्रगति हटाएं। इसे वापस नहीं किया जा सकता!', resetButton: 'सारी प्रगति रीसेट करें', yesReset: 'हाँ, सब हटाएं!', cancel: 'रद्द करें', store: 'दुकान', collection: 'संग्रह', map: 'नक्शा', rules: 'नियम', owned: 'स्वामित्व', characters: 'पात्र!', },
  es: { language: 'Idioma', languageHint: 'Elige el idioma del juego', settings: 'AJUSTES', settingsHint: '¡Juega con comodidad!', sound: 'Efectos de sonido', music: 'Música de fondo', quality: 'Calidad gráfica', camera: 'Controles de cámara', drag: 'Sensibilidad de arrastre', zoom: 'Sensibilidad del zoom', slow: 'Lento', fast: 'Rápido', smooth: 'Suave', bold: 'Fuerte', resetTitle: 'Empezar de nuevo', resetDesc: 'Borra récords y progreso. ¡No se puede deshacer!', resetButton: 'Restablecer progreso', yesReset: '¡Sí, borrar todo!', cancel: 'Cancelar', store: 'TIENDA', collection: 'COLECCIÓN', map: 'MAPA', rules: 'REGLAS', owned: 'obtenidos', characters: 'personajes!', },
  pt: { language: 'Idioma', languageHint: 'Escolha o idioma do jogo', settings: 'CONFIGURAÇÕES', settingsHint: 'Jogue com conforto!', sound: 'Efeitos sonoros', music: 'Música de fundo', quality: 'Qualidade gráfica', camera: 'Controles da câmera', drag: 'Sensibilidade do arraste', zoom: 'Sensibilidade do zoom', slow: 'Lento', fast: 'Rápido', smooth: 'Suave', bold: 'Forte', resetTitle: 'Começar de novo', resetDesc: 'Apague recordes e progresso. Não é possível desfazer!', resetButton: 'Redefinir progresso', yesReset: 'Sim, apagar tudo!', cancel: 'Cancelar', store: 'LOJA', collection: 'COLEÇÃO', map: 'MAPA', rules: 'REGRAS', owned: 'possuídos', characters: 'personagens!', },
  fr: { language: 'Langue', languageHint: 'Choisir la langue du jeu', settings: 'PARAMÈTRES', settingsHint: 'Jouez confortablement !', sound: 'Effets sonores', music: 'Musique de fond', quality: 'Qualité graphique', camera: 'Commandes de caméra', drag: 'Sensibilité du glissement', zoom: 'Sensibilité du zoom', slow: 'Lent', fast: 'Rapide', smooth: 'Doux', bold: 'Fort', resetTitle: 'Recommencer', resetDesc: 'Supprimer les records et la progression. Action irréversible !', resetButton: 'Réinitialiser la progression', yesReset: 'Oui, tout supprimer !', cancel: 'Annuler', store: 'BOUTIQUE', collection: 'COLLECTION', map: 'CARTE', rules: 'RÈGLES', owned: 'possédés', characters: 'personnages !', },
  tr: { language: 'Dil', languageHint: 'Oyun dilini seç', settings: 'AYARLAR', settingsHint: 'Oyunu rahatça oyna!', sound: 'Ses Efektleri', music: 'Arka Plan Müziği', quality: 'Grafik Kalitesi', camera: 'Kamera Kontrolleri', drag: 'Sürükleme hassasiyeti', zoom: 'Yakınlaştırma hassasiyeti', slow: 'Yavaş', fast: 'Hızlı', smooth: 'Yumuşak', bold: 'Güçlü', resetTitle: 'Baştan Başla', resetDesc: 'Tüm kayıtları ve ilerlemeyi sil. Bu işlem geri alınamaz!', resetButton: 'İlerlemeyi Sıfırla', yesReset: 'Evet, Hepsini Sil!', cancel: 'İptal', store: 'MAĞAZA', collection: 'KOLEKSİYON', map: 'HARİTA', rules: 'KURALLAR', owned: 'sahip olunan', characters: 'karakter!', },
  ur: { language: 'زبان', languageHint: 'کھیل کی زبان منتخب کریں', settings: 'ترتیبات', settingsHint: 'کھیل کو آرام دہ بنائیں!', sound: 'آواز کے اثرات', music: 'پس منظر کی موسیقی', quality: 'گرافکس کا معیار', camera: 'کیمرہ کنٹرولز', drag: 'کھینچنے کی حساسیت', zoom: 'زوم کی حساسیت', slow: 'آہستہ', fast: 'تیز', smooth: 'نرم', bold: 'مضبوط', resetTitle: 'نئی شروعات', resetDesc: 'تمام ریکارڈ اور پیش رفت حذف کریں۔ واپس نہیں ہو سکتا!', resetButton: 'تمام پیش رفت ری سیٹ کریں', yesReset: 'ہاں، سب حذف کریں!', cancel: 'منسوخ', store: 'دکان', collection: 'مجموعہ', map: 'نقشہ', rules: 'قواعد', owned: 'ملکیت', characters: 'کردار!', },
  zh: { language: '语言', languageHint: '选择游戏语言', settings: '设置', settingsHint: '让游戏玩起来更舒适！', sound: '音效', music: '背景音乐', quality: '画面质量', camera: '镜头控制', drag: '拖动灵敏度', zoom: '缩放灵敏度', slow: '慢', fast: '快', smooth: '平滑', bold: '强劲', resetTitle: '重新开始', resetDesc: '删除所有记录和进度。此操作无法撤销！', resetButton: '重置所有进度', yesReset: '是的，全部删除！', cancel: '取消', store: '商店', collection: '收藏', map: '地图', rules: '规则', owned: '已拥有', characters: '个角色！', },
  ja: { language: '言語', languageHint: 'ゲームの言語を選択', settings: '設定', settingsHint: '快適に遊ぼう！', sound: '効果音', music: 'BGM', quality: '画質', camera: 'カメラ操作', drag: 'ドラッグ感度', zoom: 'ズーム感度', slow: '遅い', fast: '速い', smooth: 'なめらか', bold: '強い', resetTitle: '最初から始める', resetDesc: '記録と進行状況をすべて削除します。元に戻せません！', resetButton: '進行状況をリセット', yesReset: 'はい、すべて削除！', cancel: 'キャンセル', store: 'ショップ', collection: 'コレクション', map: 'マップ', rules: 'ルール', owned: '所持', characters: 'キャラクター！', },
  ko: { language: '언어', languageHint: '게임 언어 선택', settings: '설정', settingsHint: '편안하게 플레이하세요!', sound: '효과음', music: '배경 음악', quality: '그래픽 품질', camera: '카메라 조작', drag: '드래그 감도', zoom: '줌 감도', slow: '느림', fast: '빠름', smooth: '부드러움', bold: '강함', resetTitle: '처음부터 시작', resetDesc: '모든 기록과 진행을 삭제합니다. 되돌릴 수 없습니다!', resetButton: '모든 진행 초기화', yesReset: '예, 모두 삭제!', cancel: '취소', store: '상점', collection: '컬렉션', map: '지도', rules: '규칙', owned: '보유', characters: '캐릭터!', },
  de: { language: 'Sprache', languageHint: 'Spielsprache wählen', settings: 'EINSTELLUNGEN', settingsHint: 'Bequem spielen!', sound: 'Soundeffekte', music: 'Hintergrundmusik', quality: 'Grafikqualität', camera: 'Kamerasteuerung', drag: 'Ziehempfindlichkeit', zoom: 'Zoomeempfindlichkeit', slow: 'Langsam', fast: 'Schnell', smooth: 'Sanft', bold: 'Stark', resetTitle: 'Neustart', resetDesc: 'Alle Rekorde und Fortschritte löschen. Nicht rückgängig machbar!', resetButton: 'Fortschritt zurücksetzen', yesReset: 'Ja, alles löschen!', cancel: 'Abbrechen', store: 'SHOP', collection: 'SAMMLUNG', map: 'KARTE', rules: 'REGELN', owned: 'besessen', characters: 'Charaktere!', },
  it: { language: 'Lingua', languageHint: 'Scegli la lingua del gioco', settings: 'IMPOSTAZIONI', settingsHint: 'Gioca comodamente!', sound: 'Effetti sonori', music: 'Musica di sottofondo', quality: 'Qualità grafica', camera: 'Controlli della telecamera', drag: 'Sensibilità trascinamento', zoom: 'Sensibilità zoom', slow: 'Lento', fast: 'Veloce', smooth: 'Morbido', bold: 'Forte', resetTitle: 'Ricomincia', resetDesc: 'Elimina record e progressi. Non si può annullare!', resetButton: 'Azzera progressi', yesReset: 'Sì, elimina tutto!', cancel: 'Annulla', store: 'NEGOZIO', collection: 'COLLEZIONE', map: 'MAPPA', rules: 'REGOLE', owned: 'posseduti', characters: 'personaggi!', },
  ru: { language: 'Язык', languageHint: 'Выберите язык игры', settings: 'НАСТРОЙКИ', settingsHint: 'Играйте с комфортом!', sound: 'Звуковые эффекты', music: 'Фоновая музыка', quality: 'Качество графики', camera: 'Управление камерой', drag: 'Чувствительность перетаскивания', zoom: 'Чувствительность зума', slow: 'Медленно', fast: 'Быстро', smooth: 'Плавно', bold: 'Сильно', resetTitle: 'Начать сначала', resetDesc: 'Удалить рекорды и прогресс. Отменить нельзя!', resetButton: 'Сбросить прогресс', yesReset: 'Да, удалить всё!', cancel: 'Отмена', store: 'МАГАЗИН', collection: 'КОЛЛЕКЦИЯ', map: 'КАРТА', rules: 'ПРАВИЛА', owned: 'получено', characters: 'персонажей!', },
  vi: { language: 'Ngôn ngữ', languageHint: 'Chọn ngôn ngữ trò chơi', settings: 'CÀI ĐẶT', settingsHint: 'Chơi thật thoải mái!', sound: 'Hiệu ứng âm thanh', music: 'Nhạc nền', quality: 'Chất lượng đồ họa', camera: 'Điều khiển camera', drag: 'Độ nhạy kéo', zoom: 'Độ nhạy thu phóng', slow: 'Chậm', fast: 'Nhanh', smooth: 'Mượt', bold: 'Mạnh', resetTitle: 'Chơi lại từ đầu', resetDesc: 'Xóa mọi kỷ lục và tiến trình. Không thể hoàn tác!', resetButton: 'Đặt lại tiến trình', yesReset: 'Có, xóa tất cả!', cancel: 'Hủy', store: 'CỬA HÀNG', collection: 'BỘ SƯU TẬP', map: 'BẢN ĐỒ', rules: 'LUẬT', owned: 'đã sở hữu', characters: 'nhân vật!', },
  th: { language: 'ภาษา', languageHint: 'เลือกภาษาของเกม', settings: 'ตั้งค่า', settingsHint: 'เล่นเกมอย่างสบายใจ!', sound: 'เอฟเฟกต์เสียง', music: 'เพลงพื้นหลัง', quality: 'คุณภาพกราฟิก', camera: 'การควบคุมกล้อง', drag: 'ความไวในการลาก', zoom: 'ความไวในการซูม', slow: 'ช้า', fast: 'เร็ว', smooth: 'นุ่มนวล', bold: 'แรง', resetTitle: 'เริ่มใหม่', resetDesc: 'ลบบันทึกและความคืบหน้าทั้งหมด ยกเลิกไม่ได้!', resetButton: 'รีเซ็ตความคืบหน้า', yesReset: 'ใช่ ลบทั้งหมด!', cancel: 'ยกเลิก', store: 'ร้านค้า', collection: 'คอลเลกชัน', map: 'แผนที่', rules: 'กฎ', owned: 'เป็นเจ้าของ', characters: 'ตัวละคร!', },
  bn: { language: 'ভাষা', languageHint: 'গেমের ভাষা বেছে নিন', settings: 'সেটিংস', settingsHint: 'আরামে খেলুন!', sound: 'সাউন্ড ইফেক্ট', music: 'ব্যাকগ্রাউন্ড মিউজিক', quality: 'গ্রাফিক্স মান', camera: 'ক্যামেরা নিয়ন্ত্রণ', drag: 'ড্র্যাগ সংবেদনশীলতা', zoom: 'জুম সংবেদনশীলতা', slow: 'ধীর', fast: 'দ্রুত', smooth: 'মসৃণ', bold: 'শক্তিশালী', resetTitle: 'আবার শুরু করুন', resetDesc: 'সব রেকর্ড ও অগ্রগতি মুছে ফেলুন। ফিরিয়ে আনা যাবে না!', resetButton: 'সব অগ্রগতি রিসেট করুন', yesReset: 'হ্যাঁ, সব মুছুন!', cancel: 'বাতিল', store: 'দোকান', collection: 'সংগ্রহ', map: 'মানচিত্র', rules: 'নিয়ম', owned: 'মালিকানাধীন', characters: 'চরিত্র!', },
  sw: { language: 'Lugha', languageHint: 'Chagua lugha ya mchezo', settings: 'MIPANGILIO', settingsHint: 'Cheza kwa raha!', sound: 'Madhara ya sauti', music: 'Muziki wa nyuma', quality: 'Ubora wa picha', camera: 'Vidhibiti vya kamera', drag: 'Usikivu wa kuvuta', zoom: 'Usikivu wa kukuza', slow: 'Polepole', fast: 'Haraka', smooth: 'Laini', bold: 'Nguvu', resetTitle: 'Anza upya', resetDesc: 'Futa rekodi na maendeleo yote. Haiwezi kutenduliwa!', resetButton: 'Weka upya maendeleo', yesReset: 'Ndiyo, futa yote!', cancel: 'Ghairi', store: 'DUKA', collection: 'MKUSANYIKO', map: 'RAMANI', rules: 'KANUNI', owned: 'inayomilikiwa', characters: 'wahusika!', },
} as const

type LanguageContextValue = { language: LanguageCode; setLanguage: (language: LanguageCode) => void; t: (key: TranslationKey) => string }
const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'id'
    const saved = window.localStorage.getItem('pm-language') as LanguageCode | null
    return LANGUAGES.some(([code]) => code === saved) ? saved! : 'id'
  })

  const setLanguage = (next: LanguageCode) => {
    setLanguageState(next)
    window.localStorage.setItem('pm-language', next)
  }

  useEffect(() => {
    const rtl = language === 'ar' || language === 'ur'
    document.documentElement.lang = language
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [language])

  const t = (key: TranslationKey) => translations[language][key] ?? translations.id[key]
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}