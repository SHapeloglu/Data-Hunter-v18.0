# architect.md — Data Hunter v18 Mimarisi

```
Her sayfa ── content.js (yükleme + scroll debounce 1.5s)
               │ regex: e-posta, mailto:, URL (onlyEmails kapalıysa)
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
| `emailData` | `[{email, type, source, date}]` | `[]` | hepsi |
| `isActive` | bool | true | content, popup |
| `onlyEmails` | bool | false | content, popup |
| `domainFilter` | string | "" | content (e-postada `includes`) |
| `blockedDomains` | string[] | [] | content, popup (eklerken mevcut eşleşenler listeden silinir) |
| `scanSpeed` | string | "0" | sadece popup (kullanılmıyor) |
| `mailBody` | string | "" | popup (mailto gövdesi) |
| `autoSaveActive` | bool | false | popup, background |
| `autoSaveInterval` | number (dk) | 5 | popup → `chrome.alarms.create(periodInMinutes)` |
| `autoClearAfterSave` | bool | false | background |

## Mimari Kararlar

- **Tüm sayfalarda pasif tarama**: kullanıcı müdahalesi olmadan toplama (v18 "AutoSave" teması).
- **Kara liste = alt dize eşleşmesi**: hem domain hem kelime engellemeye yarıyor; ama kısa girdiler (ör. "co") geniş eşleşir.
- **Otomatik yedek data URL ile**: MV3 service worker'da `URL.createObjectURL` olmadığı için base64 `data:` URL.
