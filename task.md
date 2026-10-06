# task.md — Data Hunter v18 Görevleri

## 🔜 Sıradaki

- [ ] Telefon/sosyal yakalamayı gerçek sitelerde dene; yanlış pozitif görülürse `extractors.js` kurallarını sıkılaştır
- [ ] `scanSpeed` ("vites") ayarını ya `content.js`'te uygula ya da arayüzden kaldır
- [ ] `content.7z` arşivini repodan çıkar
- [ ] Popup'taki kişisel onay metnini ("…Hümeyra") genel bir metne çevir (paylaşılacaksa)

## 🚧 Devam Eden

_(şu anda boş)_

## ✅ Tamamlanan

- [x] 2026-10-06 — Telefon numarası ve sosyal medya hesabı yakalama (Ayarlar'dan, varsayılan kapalı); sağ tıkla elle ekleme de bu türleri tanıyor
- [x] 2026-10-06 — Popup'ta toplanan değerler `textContent` ile basılıyor (XSS)
- [x] 2026-10-06 — CSV üretimi `DH.buildCsv`'de tek fonksiyon; `;`/`"` kaçışı ve formül enjeksiyonu koruması

- [x] 2026-10-05 — Çalışma dosyaları kod okunarak yeniden yazıldı
- [x] 2026-05-13 — v18.0 GitHub'a yüklendi
