# Data Hunter v18 — AutoSave (Chrome eklentisi)

Gezdiğiniz web sayfalarındaki **e-posta adreslerini** (ve isteğe bağlı olarak **web adreslerini**) otomatik toplayan, listeleyen ve CSV olarak dışa aktaran Manifest V3 tarayıcı eklentisi.

## Özellikler

- Sayfa açıldığında ve kaydırma durduğunda sayfa içeriğinden e-posta ve `mailto:` bağlantılarını toplar.
- "Sadece e-posta" modu (web adreslerini atlar).
- **Domain filtresi** — yalnız belirli bir alan adını içeren adresleri topla.
- **Kara liste** — istenmeyen alan adlarını/kelimeleri engelle; listeden tek tıkla ekle veya elle gir.
- **Sağ tık → "Data Hunter'a Ekle"** ile seçili metni elle ekleme.
- **CSV indirme** (`;` ayraçlı, UTF-8 BOM — Türkçe Excel ile uyumlu).
- **Otomatik yedek** — belirlediğiniz dakika aralığında listeyi CSV olarak indirir; isterseniz yedekten sonra listeyi temizler.
- Toplu e-posta taslağı: tüm adresleri BCC'ye koyarak varsayılan posta programını açar.

## Kurulum

1. Bu klasörü indirin.
2. `chrome://extensions` → **Geliştirici modu** → **Paketlenmemiş öğe yükle** → klasörü seçin.
3. Eklenti tüm sayfalarda çalışır; daha önce açık olan sekmeleri bir kez yenileyin.

## Kullanım

| Sekme | Ne yapar |
|---|---|
| Avcı | Toplanan adresler, sayaç, aktif/pasif, sadece e-posta, domain filtresi, CSV indir, temizle, mail taslağı |
| Kara liste | Engellenen alan adları; "Engeli Kaldır" |
| Ayarlar | Otomatik yedek aç/kapa, aralık (dk), yedekten sonra temizle |

Listedeki bir adrese tıklamak onu panoya kopyalar; ✖ düğmesi o alan adını kara listeye alır.

## Önemli

- Toplanan adresler **kişisel veridir**. KVKK/GDPR'a ve izinsiz ticari ileti (spam) kurallarına uymak kullanıcının sorumluluğundadır.
- Veriler yalnızca tarayıcınızda (`chrome.storage.local`) tutulur; eklenti hiçbir sunucuya veri göndermez.
- `content.7z` eski bir arşiv kopyasıdır, eklenti tarafından kullanılmaz.

## Dosyalar

| Dosya | Görev |
|---|---|
| `manifest.json` | Eklenti tanımı ve izinler |
| `content.js` | Sayfadan adres toplama |
| `background.js` | Sağ tık menüsü ve otomatik CSV yedeği |
| `popup.html`, `popup.js` | Arayüz |
