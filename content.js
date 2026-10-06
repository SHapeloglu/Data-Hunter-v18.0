// content.js - v18.5 (Firma eşleştirme; yardımcılar extractors.js'te)

// --- FİRMA EŞLEŞTİRME ---
// Rehber sayfalarında her firma bir tablo satırında (<tr>) veya birbirini tekrarlayan bir kartta durur.
// Bulunan değerin elemanından yukarı çıkıp o kaydı bulur, firma adını kaydın başlığından alır.
const NAME_SELECTORS = [
  "h1, h2, h3, h4, h5, h6",
  "[class*='firma' i], [class*='unvan' i], [class*='company' i], [class*='title' i], [class*='name' i], [class*='baslik' i]",
  "strong, b, th"
];
const contactLike = t => /@|https?:\/\/|www\./i.test(t) || /^[\s\d+().\/-]+$/.test(t) ||
  /^(tel|telefon|gsm|cep|faks|fax|e-?posta|e-?mail|mail|web|adres|address|phone)\b/i.test(t);
const cleanName = t => (t || "").replace(/\s+/g, " ").trim();
const nameOk = t => t.length >= 3 && t.length <= 150 && !contactLike(t);

function findRecord(el) {
  for (let a = el, depth = 0; a && a !== document.body && depth < 10; a = a.parentElement, depth++) {
    const len = (a.textContent || "").length;
    if (len > 4000) return null;                         // tüm listeye çıktık
    if (a.closest("footer, header, nav")) return null;    // site altbilgisi (odanın kendi iletişimi)
    if (a.tagName === "TR") return a;
    const parent = a.parentElement;
    if (!parent || len < 40) continue;                    // tek bir <span class="tel"> kart değildir
    const twins = Array.from(parent.children).filter(c => c.tagName === a.tagName && c.className === a.className);
    if (twins.length >= 2 && (a.tagName === "LI" || a.className || /^(DIV|ARTICLE|SECTION)$/.test(a.tagName))) return a;
  }
  return null;
}

function nameFromRecord(rec) {
  for (const sel of NAME_SELECTORS) {
    for (const n of rec.querySelectorAll(sel)) {
      const t = cleanName(n.innerText);
      if (nameOk(t)) return t;
    }
  }
  if (rec.tagName === "TR") {                              // ilk "isim gibi" hücre (sıra no, telefon vb. atlanır)
    for (const td of rec.cells) {
      const t = cleanName(td.innerText);
      if (nameOk(t) && /[a-zçğıöşü]/i.test(t)) return t;
    }
  }
  const line = (rec.innerText || "").split("\n").map(cleanName).find(nameOk);
  return line || "";
}

function companyFor(el, isDetailPage) {
  if (!el) return "";
  const rec = findRecord(el);
  if (rec) return nameFromRecord(rec);
  // Firma detay sayfası (sayfada az iletişim bilgisi var): firma adı genelde tek <h1>
  if (isDetailPage && !el.closest("footer, header, nav")) {
    const h1 = document.querySelectorAll("h1");
    if (h1.length === 1 && nameOk(cleanName(h1[0].innerText))) return cleanName(h1[0].innerText);
  }
  return "";
}

// Değer -> sayfadaki elemanı (ilk görülen)
function locateValues(emailRegEx, wantPhones, wantSocial) {
  const map = new Map();
  const put = (k, el) => { if (k && !map.has(k)) map.set(k, el); };
  for (const a of document.getElementsByTagName("a")) {
    const href = a.href || "";
    if (href.startsWith("mailto:")) put(href.slice(7).split("?")[0].trim().toLowerCase(), a);
    if (wantPhones) put(DH.phoneFromHref(href), a);
    if (wantSocial) { const s = DH.parseSocial(href); if (s) put(s.value, a); }
    if (/^https?:/i.test(href)) put("web:" + href.toLowerCase().replace(/\/+$/, ""), a);
  }
  if (!document.body) return map;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seenParents = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) continue;
    const text = n.nodeValue;
    if (text.includes("@")) (text.match(emailRegEx) || []).forEach(m => put(m.toLowerCase(), parent));
    // "Tel:" etiketi ayrı bir <b>'de olabilir; bu yüzden üst elemanın metnine bakılır
    if (wantPhones && /\d[\d\s().-]{6,}/.test(text) && !seenParents.has(parent)) {
      seenParents.add(parent);
      DH.findPhonesInText(parent.innerText || "").forEach(p => put(p, parent));
    }
  }
  return map;
}

async function captureData() {
  chrome.storage.local.get({
    isActive: true, 
    onlyEmails: false, 
    domainFilter: "", 
    blockedDomains: [],
    capturePhones: false,
    captureSocial: false
  }, async (status) => {
    
    if (!status.isActive) return;

    const currentHost = window.location.hostname.toLowerCase();
    // Sayfa domaini kara listedeyse direkt çık
    if (status.blockedDomains.some(d => currentHost.includes(d))) return;

    const pageTitle = document.title || "Sayfa";
    const emailRegEx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const urlRegEx = /(www\.[a-zA-Z0-9.-]+\.[a-z]{2,}|https?:\/\/[^\s"'<>]+)/gi;

    const htmlContent = document.documentElement.innerHTML;
    let foundEmails = htmlContent.match(emailRegEx) || [];

    const allLinks = document.getElementsByTagName('a');
    for (let i = 0; i < allLinks.length; i++) {
      const href = allLinks[i].href;
      if (href && href.startsWith('mailto:')) {
        const cleanMail = href.replace('mailto:', '').split('?')[0].trim();
        if (cleanMail && !foundEmails.includes(cleanMail)) {
          foundEmails.push(cleanMail);
        }
      }
    }

    const foundUrls = status.onlyEmails ? [] : (htmlContent.match(urlRegEx) || []);

    // Telefon: tel:/WhatsApp linkleri + görünür metin (innerHTML'deki script/ID rakamlarını atlamak için innerText)
    let foundPhones = [];
    if (status.capturePhones) {
      foundPhones = DH.findPhonesInText(document.body ? document.body.innerText : "");
      for (let i = 0; i < allLinks.length; i++) {
        const p = DH.phoneFromHref(allLinks[i].href);
        if (p && !foundPhones.includes(p)) foundPhones.push(p);
      }
    }

    // Sosyal medya: yalnızca gerçek bağlantılardaki profil adresleri
    let foundSocial = [];
    if (status.captureSocial) {
      for (let i = 0; i < allLinks.length; i++) {
        const s = DH.parseSocial(allLinks[i].href);
        if (s && !foundSocial.some(x => x.value === s.value)) foundSocial.push(s);
      }
    }
    
    const located = locateValues(emailRegEx, status.capturePhones, status.captureSocial);
    const isDetailPage = foundPhones.length + new Set(foundEmails.map(e => e.toLowerCase())).size <= 4;
    const companyCache = new Map();
    const company = key => {
      const el = located.get(key);
      if (!el) return "";
      if (!companyCache.has(el)) companyCache.set(el, companyFor(el, isDetailPage));
      return companyCache.get(el);
    };
    const pageUrl = location.href;

    chrome.storage.local.get({emailData: []}, (result) => {
      let dataList = result.emailData;
      let isChanged = false;
      const filter = (status.domainFilter || "").toLowerCase();

      // Yeni kaydı ekler; kayıt zaten varsa ama firma adı boşsa ve şimdi bulunduysa doldurur
      const addEntry = (value, type, firm, extra = {}) => {
        const existing = dataList.find(e => e.email === value);
        if (existing) {
          if (!existing.company && firm) { existing.company = firm; existing.page = pageUrl; isChanged = true; }
          return;
        }
        dataList.push({ 
          email: value, 
          type, 
          ...extra,
          company: firm,
          source: pageTitle, 
          page: pageUrl,
          date: new Date().toLocaleDateString() 
        });
        isChanged = true;
      };

      foundEmails.forEach(email => {
        const clean = email.toLowerCase().trim();
        // E-postanın içinde engellenmiş herhangi bir kelime veya uzantı var mı?
        const isBlocked = status.blockedDomains.some(d => clean.includes(d));
        
        if (clean.includes(filter) && !isBlocked) addEntry(clean, "E-Posta", company(clean));
      });

      foundUrls.forEach(url => {
        let cleanUrl = url.toLowerCase().trim().replace(/[.,;:"'<>]$/g, "");
        const isBlocked = status.blockedDomains.some(d => cleanUrl.includes(d));
        
        // Sosyal medya yakalama açıksa o profiller "Web Sitesi" olarak ikinci kez eklenmesin
        const isSocial = status.captureSocial && DH.parseSocial(cleanUrl);
        
        if (!cleanUrl.includes("@") && !isBlocked && !isSocial) {
          addEntry(cleanUrl, "Web Sitesi", company("web:" + cleanUrl.replace(/\/+$/, "")));
        }
      });

      foundPhones.forEach(phone => {
        const isBlocked = status.blockedDomains.some(d => phone.includes(d));
        if (!isBlocked) addEntry(phone, "Telefon", company(phone));
      });

      foundSocial.forEach(s => {
        const isBlocked = status.blockedDomains.some(d => s.value.toLowerCase().includes(d));
        if (!isBlocked) addEntry(s.value, "Sosyal Medya", company(s.value), { platform: s.platform });
      });

      if (isChanged) {
        chrome.storage.local.set({emailData: dataList});
        chrome.runtime.sendMessage({type: "REFRESH_UI"}, () => { 
          if (chrome.runtime.lastError) return; 
        });
      }
    });
  });
}

captureData();

window.addEventListener('scroll', () => {
    clearTimeout(window.scTimer);
    window.scTimer = setTimeout(captureData, 1500);
});