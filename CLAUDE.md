# CLAUDE.md — Data Hunter v18 (Chrome eklentisi)

Ziyaret edilen sayfalardan e-posta adreslerini (ve isteğe bağlı web adreslerini) otomatik toplayan Manifest V3 eklentisi. Kara liste (domain/kelime), domain filtresi, sağ tıkla manuel ekleme, CSV dışa aktarma, periyodik otomatik CSV yedeği ve toplu `mailto:` (BCC) özelliği var.

- GitHub: https://github.com/SHapeloglu/Data-Hunter-v18.0 (tek commit, 2026-05-13)
- Mimari: `architect.md` · Görevler: `task.md` · Fikirler: `backlog.md` · Günlük: `session.md`

## Çalıştırma

Derleme yok. `chrome://extensions` → Geliştirici modu → "Paketlenmemiş öğe yükle" → bu klasör. Kod değişince eklentiyi yeniden yükle **ve açık sekmeleri yenile** (content script sadece sayfa yüklenince enjekte olur).

## Dosyalar

- `manifest.json` — izinler: `storage, activeTab, scripting, alarms, downloads, contextMenus`; content script `<all_urls>`.
- `content.js` — sayfa HTML'inden regex ile e-posta + `mailto:` linkleri + (ops.) URL toplar; ilk yüklemede ve kaydırma durduktan 1,5 sn sonra çalışır.
- `background.js` — sağ tık menüsü ("Data Hunter'a Ekle"), `autoSaveAlarm` ile otomatik CSV indirme.
- `popup.html` / `popup.js` — sekmeli arayüz (avcı listesi / kara liste / ayarlar), CSV indirme, `mailto:` BCC.
- `content.7z` — `content.js`'in eski bir arşiv kopyası; kullanılmıyor.

## Kurallar ve Tuzaklar

- Tüm durum `chrome.storage.local`'da (anahtarlar `architect.md`'de). Yeni ayar eklerken `popup.js:updateUI` içindeki varsayılan nesneye de ekle.
- `emailData[].email` alanı hem e-posta hem URL tutuyor; tür `type` ile ayrılıyor (`"E-Posta"` | `"Web Sitesi"`) — bu Türkçe dizeler karşılaştırmada kullanılıyor, değiştirme.
- CSV ayracı `;` ve UTF-8 BOM'lu (Türkçe Excel uyumu); CSV üretimi `popup.js` ve `background.js`'te **iki kez** yazılmış — birini değiştirirsen diğerini de.
- `scanSpeed` ("vites") ayarı kaydediliyor ama `content.js` kullanmıyor.
- Popup'ta toplanan adresler `innerHTML` ile basılıyor → kötü niyetli sayfa içeriği popup'ta HTML olarak çalışabilir; `textContent` tercih et.
- Toplanan veriler kişisel veri: KVKK/GDPR ve toplu e-posta mevzuatı (izinsiz ticari ileti) kullanıcının sorumluluğunda — özellik eklerken bunu genişletici değil, kontrol edici yönde düşün.
- Oturum sonunda `session.md`'ye kayıt düş, `task.md`'yi güncelle.
