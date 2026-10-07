// extractors.js - content.js, background.js ve popup.js tarafından ortak kullanılır
// (telefon / sosyal medya ayrıştırma + tek CSV üreticisi)
var DH = (() => {
  // --- TELEFON ---
  // Metindeki aday: isteğe bağlı +/00, rakamla ya da "(" ile başlar; aynı satırda kalır.
  const phoneCandidateRegEx = /(?:\+|00)?\(?\d[\d \t ().\/-]{7,20}\d/g;

  // Ham metni "+905321234567" biçimine çevirir; telefona benzemiyorsa null.
  // strict: serbest metin için (yalnız +, 00 veya TR 0'lı numaralar kabul edilir)
  // strict değilse: tel:/wa.me gibi zaten telefon olduğu bilinen kaynaklar.
  function normalizePhone(raw, strict = true) {
    const s = String(raw).trim().replace(/^\(/, "");
    const digits = s.replace(/\D/g, "");
    let out = null;
    if (s.startsWith("+")) out = "+" + digits;
    else if (digits.startsWith("00")) out = "+" + digits.slice(2);
    else if (/^0[2-58]\d{9}$/.test(digits)) out = "+90" + digits.slice(1); // TR: 0532..., 0212..., 0850...
    else if (!strict && /^90[2-58]\d{9}$/.test(digits)) out = "+" + digits;
    else if (!strict && digits.length >= 7 && digits.length <= 15) out = digits;
    if (!out) return null;
    if (out.startsWith("+")) {
      const n = out.length - 1;
      if (n < 10 || n > 15) return null;
      if (out.startsWith("+90") && n !== 12) return null;
    }
    return out;
  }

  const faxLabelRegEx = /fa(?:ks|x)\.?\s*(?:no)?\s*:?\s*$/i;
  const phoneLabelRegEx = /(?:tel|telefon|phone|gsm|cep)\.?\s*(?:no)?\s*:?\s*$/i;

  function findPhonesInText(text) {
    const found = [];
    // "0212 123 45 67 - 0212 123 45 69" gibi listeler tek aday olarak birleşmesin
    const src = text.replace(/[ \t ]+[-–\/|][ \t ]+/g, "\n");
    let m;
    phoneCandidateRegEx.lastIndex = 0;
    while ((m = phoneCandidateRegEx.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 15), m.index);
      if (faxLabelRegEx.test(before)) continue;                       // faks numaralarını atla
      let p = normalizePhone(m[0], true);
      // "Tel: 212 123 45 67" — başında 0 yok ama etiket telefon olduğunu söylüyor
      if (!p && phoneLabelRegEx.test(before) && /^[2-58]\d{9}$/.test(m[0].replace(/\D/g, ""))) {
        p = "+90" + m[0].replace(/\D/g, "");
      }
      if (p && !found.includes(p)) found.push(p);
    }
    return found;
  }

  // tel:, wa.me/<no>, api.whatsapp.com/send?phone=<no>
  function phoneFromHref(href) {
    if (!href) return null;
    if (href.startsWith("tel:")) {
      return normalizePhone(decodeURIComponent(href.slice(4).split(/[?;,]/)[0]), false);
    }
    try {
      const u = new URL(href);
      const host = u.hostname.replace(/^www\./, "");
      let num = null;
      if (host === "wa.me") num = u.pathname.split("/")[1];
      else if (host === "api.whatsapp.com" || host === "web.whatsapp.com") num = u.searchParams.get("phone");
      if (num && /^\+?\d{10,15}$/.test(num)) return "+" + num.replace(/^\+/, "");
    } catch (e) {}
    return null;
  }

  // --- SOSYAL MEDYA ---
  const RESERVED = {
    instagram: ["p", "reel", "reels", "explore", "accounts", "stories", "tv", "direct", "about", "legal", "developer", "web"],
    facebook: ["sharer", "sharer.php", "share", "share.php", "dialog", "plugins", "tr", "login", "login.php", "help",
               "policies", "privacy", "groups", "events", "watch", "marketplace", "pages", "hashtag", "photo", "photo.php",
               "story.php", "permalink.php", "l.php", "legal", "business", "gaming", "ads", "home.php", "reel", "videos"],
    x: ["intent", "share", "home", "search", "hashtag", "i", "explore", "settings", "login", "signup", "tos",
        "privacy", "messages", "notifications", "compose"],
    telegram: ["share", "joinchat", "addstickers", "proxy", "iv"]
  };
  const handleOk = h => !!h && /^[A-Za-z0-9._-]{2,100}$/.test(h);
  const ok = (list, h) => handleOk(h) && !list.includes(h.toLowerCase());

  // Profil bağlantısını {platform, value} olarak döndürür (value: "instagram.com/kullanici").
  // Paylaş/intent/gönderi bağlantıları ve takip pikselleri null döner.
  function parseSocial(href) {
    let u;
    try { u = new URL(/^https?:\/\//i.test(href) ? href : "https://" + href); } catch (e) { return null; }
    let host = u.hostname.toLowerCase();
    const stripped = host.replace(/^(www\.|m\.|mobile\.|[a-z]{2}\.|[a-z]{2}-[a-z]{2}\.)/, ""); // tr.linkedin.com, m.facebook.com
    if (stripped.includes(".")) host = stripped;                                                  // fb.com -> "com" olmasın
    const s = u.pathname.split("/").filter(Boolean);
    const first = s[0] || "";

    switch (host) {
      case "instagram.com":
        return ok(RESERVED.instagram, first) ? { platform: "Instagram", value: "instagram.com/" + first.toLowerCase() } : null;
      case "facebook.com":
      case "fb.com":
        if (first === "profile.php" && /^\d+$/.test(u.searchParams.get("id") || "")) {
          return { platform: "Facebook", value: "facebook.com/profile.php?id=" + u.searchParams.get("id") };
        }
        return ok(RESERVED.facebook, first) ? { platform: "Facebook", value: "facebook.com/" + first.toLowerCase() } : null;
      case "twitter.com":
      case "x.com":
        return ok(RESERVED.x, first) && /^\w{1,15}$/.test(first) ? { platform: "X", value: "x.com/" + first.toLowerCase() } : null;
      case "linkedin.com":
        if ((first === "in" || first === "company") && handleOk(s[1])) {
          return { platform: "LinkedIn", value: `linkedin.com/${first}/${s[1].toLowerCase()}` };
        }
        return null;
      case "youtube.com":
        if (first.startsWith("@") && handleOk(first.slice(1))) return { platform: "YouTube", value: "youtube.com/" + first.toLowerCase() };
        if (first === "channel" && handleOk(s[1])) return { platform: "YouTube", value: "youtube.com/channel/" + s[1] }; // ID büyük/küçük harf duyarlı
        if ((first === "c" || first === "user") && handleOk(s[1])) return { platform: "YouTube", value: `youtube.com/${first}/${s[1].toLowerCase()}` };
        return null;
      case "tiktok.com":
        return first.startsWith("@") && handleOk(first.slice(1)) ? { platform: "TikTok", value: "tiktok.com/" + first.toLowerCase() } : null;
      case "t.me":
      case "telegram.me": {
        const h = first === "s" ? s[1] : first;
        return ok(RESERVED.telegram, h) ? { platform: "Telegram", value: "t.me/" + h.toLowerCase() } : null;
      }
    }
    return null;
  }

  // --- WEB SİTESİ ---
  // Firma sitesi olamayacak adresler: harita/WhatsApp, CDN ve kod kütüphaneleri, paylaşım servisleri, sosyal ağlar
  // (sosyal hesaplar "Sosyal medya" türünde ayrıca yakalanır)
  const SKIP_HOSTS = /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|wa\.me|whatsapp\.com|apple\.com|youtube\.com|youtu\.be|facebook\.com|fb\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|t\.me|telegram\.me|w3\.org|schema\.org|gstatic\.com|googleapis\.com|googletagmanager\.com|cloudflare\.com|jsdelivr\.net|maxcdn\.com|bootstrapcdn\.com|addthis\.com|sharethis\.com)$/;
  const ASSET_EXT = /\.(js|css|json|xml|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|pdf|docx?|xlsx?|zip|rar|mp4|mp3)$/i;

  // <a href> adresini kayıt değerine çevirir ("https://firma.com/"); firma sitesi değilse null.
  // pageHost verilirse sitenin kendi sayfalarına (ve alt alan adlarına) giden linkler atlanır.
  function normalizeWebUrl(href, pageHost) {
    let u;
    try { u = new URL(href); } catch (e) { return null; }
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const page = (pageHost || "").toLowerCase().replace(/^www\./, "");
    if (page && (host === page || host.endsWith("." + page) || page.endsWith("." + host))) return null;
    if (SKIP_HOSTS.test(host) || ASSET_EXT.test(u.pathname)) return null;
    return (u.origin + u.pathname).toLowerCase();   // ?utm=... gibi parametreler atılır
  }

  // --- CSV (popup + otomatik yedek aynı fonksiyonu kullanır) ---
  function csvCell(v) {
    let s = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;                // Excel formül enjeksiyonuna karşı
    return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  // Telefonlar ="+90..." olarak yazılır; böylece Excel sayıya çevirip başındaki + / 0'ı silmez.
  const phoneCell = phones => phones.length ? `="${phones.map(p => String(p).replace(/[^\d+]/g, "")).join(" | ")}"` : "";

  function buildCsv(rows) {
    return "\uFEFFEmail;Tip;Kaynak;Tarih;Firma;Sayfa\n" + rows.map(e => [
      e.type === "Telefon" ? phoneCell([e.email]) : csvCell(e.email),
      csvCell(e.type), csvCell(e.source), csvCell(e.date), csvCell(e.company), csvCell(e.page)
    ].join(";")).join("\n");
  }

  // Firma başına tek satır: aynı firma adına düşen telefon/e-posta/web/sosyal değerler birleştirilir.
  // Firması bulunamayan kayıtlar kendi satırlarında, Firma sütunu boş kalır.
  function buildCompanyCsv(rows) {
    const groups = new Map();
    rows.forEach((e, i) => {
      const key = e.company ? "f:" + e.company.toLocaleLowerCase("tr") : "r:" + i;
      if (!groups.has(key)) groups.set(key, { company: e.company || "", tel: [], mail: [], web: [], social: [], page: e.page || e.source || "", date: e.date });
      const g = groups.get(key);
      const bucket = { "Telefon": g.tel, "E-Posta": g.mail, "Web Sitesi": g.web, "Sosyal Medya": g.social }[e.type];
      if (bucket && !bucket.includes(e.email)) bucket.push(e.email);
    });
    return "\uFEFFFirma;Telefon;E-Posta;Web Sitesi;Sosyal Medya;Sayfa;Tarih\n" + Array.from(groups.values()).map(g => [
      csvCell(g.company), phoneCell(g.tel), csvCell(g.mail.join(" | ")), csvCell(g.web.join(" | ")),
      csvCell(g.social.join(" | ")), csvCell(g.page), csvCell(g.date)
    ].join(";")).join("\n");
  }

  return { normalizePhone, findPhonesInText, phoneFromHref, parseSocial, normalizeWebUrl, buildCsv, buildCompanyCsv };
})();
