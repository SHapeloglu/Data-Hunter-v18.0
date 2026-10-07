# task.md — Data Hunter v18 Görevleri

## 🔜 Sıradaki

- [ ] **(kullanıcıdan bekleniyor)** Gerçek oda/dernek rehberlerinde firma adı boş/yanlış çıkan sayfa adresleri → `findRecord` kurallarını o yapılara göre genişlet
- [ ] Domain filtresini telefon/sosyal/firma için de anlamlı hale getir (ör. firma adında ara)
- [ ] Telefon/sosyal yakalamayı gerçek sitelerde dene; yanlış pozitif görülürse `extractors.js` kurallarını sıkılaştır
- [ ] `scanSpeed` ("vites") ayarını ya `content.js`'te uygula ya da arayüzden kaldır
- [ ] `content.7z` arşivini repodan çıkar
- [ ] Popup'taki kişisel onay metnini ("…Hümeyra") genel bir metne çevir (paylaşılacaksa)

## 🚧 Devam Eden

_(şu anda boş)_

## ✅ Tamamlanan

- [x] 2026-10-07 — Ayarlar'a "Web adreslerini yakala"; web adresleri yalnız dış linklerden (.js/CDN/kendi site/harita/wa.me hariç)
- [x] 2026-10-07 — "Sadece cep telefonlarını göster (05…)" süzgeci

- [x] 2026-10-07 — "Sadece telefonları göster" anahtarı (popup görünüm süzgeci)

- [x] 2026-10-06 — Değerler firma adıyla eşleşiyor (tablo/kart/detay sayfası); "Firma CSV" (firma başına satır)

- [x] 2026-10-06 — Telefon numarası ve sosyal medya hesabı yakalama (Ayarlar'dan, varsayılan kapalı); sağ tıkla elle ekleme de bu türleri tanıyor
- [x] 2026-10-06 — Popup'ta toplanan değerler `textContent` ile basılıyor (XSS)
- [x] 2026-10-06 — CSV üretimi `DH.buildCsv`'de tek fonksiyon; `;`/`"` kaçışı ve formül enjeksiyonu koruması

- [x] 2026-10-05 — Çalışma dosyaları kod okunarak yeniden yazıldı
- [x] 2026-05-13 — v18.0 GitHub'a yüklendi
