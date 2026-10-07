# session.md — Data Hunter v18 Oturum Günlüğü

---

## 2026-10-07
**Yapılanlar:** "Sadece telefonları göster" anahtarı eklendi (`onlyPhones`, yalnız görünüm; `onlyEmails` ile karşılıklı kapanır; sayaç "gösterilen / toplam"). Başsız Chromium'da test edildi.
**Bağlam:** Aynı gün SMSMotoru (PHP toplu SMS paneli, ayrı depo) düzeltilip smsmotoru.bidanismanlik.com.tr'ye (DirectAdmin) kuruldu; Data Hunter Firma CSV'si oraya doğrudan içe aktarılabiliyor. SMS sağlayıcısıyla henüz anlaşılmadı.
**Açık sorunlar:** Web adresi toplama `.js` kaynak dosyalarını da alıyor (task.md).

---

## 2026-10-06
**Yapılanlar:** Telefon + sosyal medya yakalama eklendi (`extractors.js` yeni ortak dosya). Ayarlar'a iki anahtar (`capturePhones`, `captureSocial`), listede TEL / platform rozetleri. Popup `innerHTML` → `textContent`. CSV tek fonksiyonda, kaçışlı; telefon `="+90…"` olarak yazılıyor (Excel baştaki +/0'ı silmesin). Toplu mailto artık yalnız e-postaları alıyor (önceden "Web Sitesi" dışındaki her şeyi alıyordu). Web sitesi için ✖ düğmesi `https:`'yi kara listeye ekliyordu, host'u ekleyecek şekilde düzeltildi.
**Kararlar / neden:** Yeni türler varsayılan kapalı (KVKK). Sosyal hesaplar yalnız gerçek `<a href>` bağlantılarından, paylaş/intent/gönderi linkleri hariç. Telefon serbest metinde `innerText`'ten (script içi rakamlar yakalanmasın).
**Test:** Node ile birim test (TR/uluslararası numaralar, tarih/fiyat/IBAN reddi, platform linkleri) + başsız Chromium'da eklenti yüklenip test sayfasında uçtan uca doğrulandı.
**Ek düzeltme (oda/dernek rehberleri için):** Aynı satırdaki "0212 … - 0212 …" numaraları birleşip ikisi de kayboluyordu → ayraçlarda bölünüyor. "Faks/Fax" etiketli numaralar atlanıyor. "Tel: 212 123 45 67" gibi başında 0 olmayan numaralar yalnız telefon etiketinden sonra alınıyor.
**Firma eşleştirme:** Her kayda `company` ve `page` eklendi; firma adı değerin bulunduğu tablo satırı/kartın başlığından alınıyor. Popup'ta firma adı değerin altında; yeni "📇 Firma CSV" düğmesi (Firma;Telefon;E-Posta;Web Sitesi;Sosyal Medya;Sayfa;Tarih). Normal CSV'ye Firma ve Sayfa sütunları eklendi (sona; eski sütunlar yerinde). Tablo, kart ve detay sayfası örnekleriyle başsız Chromium'da test edildi; faks ve altbilgideki oda iletişimi doğru ayrıldı.
**Teslim:** PR #1 (https://github.com/SHapeloglu/Data-Hunter-v18.0/pull/1) `main`'e birleştirildi.
**Kullanım bağlamı:** Kullanıcı sanayi/ticaret odaları ve derneklerin üye rehberlerinden firma iletişim bilgisi topluyor. KVKK/ticari ileti notları kullanıcıya iletildi (tacir/esnafa B2B ileti onaysız gönderilebilir ama ret hakkı ve aydınlatma şart; dernek yöneticilerinin kişisel numaraları bu kapsamda değil; veriyi toplayan taraf ayrı veri sorumlusu olur). Konu kapandı, tekrar açmaya gerek yok.
**Sıradaki adım (kaldığımız yer):** Kullanıcı yeni sürümü yükleyip gerçek oda/dernek sitelerinde deneyecek. Firma adı boş/yanlış çıkan site adresleri gelirse `content.js:findRecord/nameFromRecord` o yapıya göre genişletilecek. Test için: `/tmp/.../scratchpad`'daki Playwright betikleri kalıcı değil; benzer test `pages/{tablo,kart,detay}.html` örnek sayfaları + `--load-extension` ile başsız Chromium (`/opt/pw-browsers/chromium`) üzerinden yeniden kurulabilir.
**Açık sorunlar:** Firma eşleştirme sezgisel — gerçek sitelerde denenmedi. Aynı değer iki firmada geçerse ilk firma kalır. Domain filtresi yalnız e-postalara uygulanıyor. `wa.me` linki "Sadece e-posta" kapalıyken ayrıca "Web Sitesi" olarak da düşüyor. CSV başlığı geriye uyum için hâlâ `Email`.

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
