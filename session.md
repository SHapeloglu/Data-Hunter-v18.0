# session.md — Data Hunter v18 Oturum Günlüğü

---

## 2026-10-06
**Yapılanlar:** Telefon + sosyal medya yakalama eklendi (`extractors.js` yeni ortak dosya). Ayarlar'a iki anahtar (`capturePhones`, `captureSocial`), listede TEL / platform rozetleri. Popup `innerHTML` → `textContent`. CSV tek fonksiyonda, kaçışlı; telefon `="+90…"` olarak yazılıyor (Excel baştaki +/0'ı silmesin). Toplu mailto artık yalnız e-postaları alıyor (önceden "Web Sitesi" dışındaki her şeyi alıyordu). Web sitesi için ✖ düğmesi `https:`'yi kara listeye ekliyordu, host'u ekleyecek şekilde düzeltildi.
**Kararlar / neden:** Yeni türler varsayılan kapalı (KVKK). Sosyal hesaplar yalnız gerçek `<a href>` bağlantılarından, paylaş/intent/gönderi linkleri hariç. Telefon serbest metinde `innerText`'ten (script içi rakamlar yakalanmasın).
**Test:** Node ile birim test (TR/uluslararası numaralar, tarih/fiyat/IBAN reddi, platform linkleri) + başsız Chromium'da eklenti yüklenip test sayfasında uçtan uca doğrulandı.
**Açık sorunlar:** Domain filtresi yalnız e-postalara uygulanıyor. `wa.me` linki "Sadece e-posta" kapalıyken ayrıca "Web Sitesi" olarak da düşüyor. CSV başlığı geriye uyum için hâlâ `Email`.

---

## 2026-10-05

- Şablondan üretilmiş çalışma dosyaları kod okunarak yeniden yazıldı.
- Tespitler: popup'ta `innerHTML` XSS riski, CSV kodu iki yerde, `scanSpeed` kullanılmıyor, `content.7z` artık dosya.

---

## 2026-05-13

- v18.0 tek commit ile yüklendi (dosya başlıklarında v18.1 background, v18.3 content sürüm notları var). Öncesine ait kayıt yok.

---

### Kayıt Şablonu

```markdown
## YYYY-AA-GG
**Yapılanlar:** ...
**Kararlar / neden:** ...
**Açık sorunlar:** ...
**Sıradaki adım:** ...
```
