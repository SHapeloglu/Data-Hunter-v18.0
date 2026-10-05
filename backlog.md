# backlog.md — Data Hunter Fikir Havuzu

- Kara listede tam domain eşleşmesi seçeneği (alt dize yerine `endsWith('@'+d)` / host eşleşmesi).
- Sadece izin verilen sitelerde çalışma modu (whitelist) — `<all_urls>` yerine isteğe bağlı host izni.
- Büyük listelerde performans: `emailData` için `Set` tabanlı tekrar kontrolü (şu an `some()` ile O(n²)).
- MailFinder / MailSenderVerifier'a doğrudan aktarım (CSV yerine API).
- Toplanan adreslerde basit sözdizimi/MX kontrolü (yanlış pozitifleri azaltmak için, ör. `image@2x.png`).

## Ekleme Şablonu

```markdown
### Başlık
- **Kategori:** yeni özellik / iyileştirme / teknik borç / araştırma
- **Neden:** kısa gerekçe
- **Notlar:** büyüklük, bağımlılıklar, riskler
```
