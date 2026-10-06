# architect.md — Data Hunter v18 Mimarisi

```
Her sayfa ── extractors.js + content.js (yükleme + scroll debounce 1.5s)
               │ regex: e-posta, mailto:, URL (onlyEmails kapalıysa)
               │ capturePhones: tel:/wa.me linkleri + innerText'te telefon → "+90…" normalize
               │ captureSocial: <a href> profil linkleri (Instagram, Facebook, X, LinkedIn, YouTube, TikTok, Telegram)
               │ filtre: isActive, blockedDomains, domainFilter, tekrar kontrolü
               ▼
        chrome.storage.local.emailData ──REFRESH_UI mesajı──► popup.js (liste, kara liste, ayarlar)
               ▲                                                 ├─ CSV indir (Blob)
background.js ─┤ contextMenus "addManualEmail" (seçili metin)     ├─ mailto:?bcc=…
               └ alarms "autoSaveAlarm" → data:text/csv;base64 → chrome.downloads (ops. sonra listeyi temizle)
```

## Depolama Anahtarları (`chrome.storage.local`)

| Anahtar | Tip | Varsayılan | Kullanan |
|---|---|---|---|
| `emailData` | `[{email, type, source, date, platform?}]` — `type`: `"E-Posta"` / `"Web Sitesi"` / `"Telefon"` / `"Sosyal Medya"` (`platform` yalnız sosyalde) | `[]` | hepsi |
| `isActive` | bool | true | content, popup |
| `onlyEmails` | bool | false | content, popup |
| `domainFilter` | string | "" | content (e-postada `includes`) |
| `blockedDomains` | string[] | [] | content, popup (eklerken mevcut eşleşenler listeden silinir) |
| `scanSpeed` | string | "0" | sadece popup (kullanılmıyor) |
| `mailBody` | string | "" | popup (mailto gövdesi) |
| `autoSaveActive` | bool | false | popup, background |
| `autoSaveInterval` | number (dk) | 5 | popup → `chrome.alarms.create(periodInMinutes)` |
| `autoClearAfterSave` | bool | false | background |
| `capturePhones` | bool | false | content, popup |
| `captureSocial` | bool | false | content, popup |

## Mimari Kararlar

- **Tüm sayfalarda pasif tarama**: kullanıcı müdahalesi olmadan toplama (v18 "AutoSave" teması).
- **Kara liste = alt dize eşleşmesi**: hem domain hem kelime engellemeye yarıyor; ama kısa girdiler (ör. "co") geniş eşleşir.
- **Ortak yardımcılar `extractors.js`'te** (global `DH`): content script'e manifest'ten, service worker'a `importScripts`, popup'a `<script>` ile yüklenir. CSV üretimi (`DH.buildCsv`) artık tek yerde.
- **Telefon/sosyal varsayılan kapalı**: kişisel veri; kullanıcı Ayarlar'dan bilinçli açar. Serbest metinde yalnız `+`, `00` veya TR `0[2-58]…` ile başlayan numaralar alınır (tarih/fiyat/IBAN yanlış pozitiflerini azaltmak için); `tel:` linklerinde daha esnek.
- **Toplu mailto yalnız `"E-Posta"`** türünü BCC'ye koyar.
- **Otomatik yedek data URL ile**: MV3 service worker'da `URL.createObjectURL` olmadığı için base64 `data:` URL.
