// content.js - v18.4 (Telefon + Sosyal Medya; yardımcılar extractors.js'te)
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
    
    chrome.storage.local.get({emailData: []}, (result) => {
      let dataList = result.emailData;
      let isChanged = false;
      const filter = (status.domainFilter || "").toLowerCase();

      foundEmails.forEach(email => {
        const clean = email.toLowerCase().trim();
        // E-postanın içinde engellenmiş herhangi bir kelime veya uzantı var mı?
        const isBlocked = status.blockedDomains.some(d => clean.includes(d));
        
        if (clean.includes(filter) && !isBlocked && !dataList.some(e => e.email === clean)) {
          dataList.push({ 
            email: clean, 
            type: "E-Posta", 
            source: pageTitle, 
            date: new Date().toLocaleDateString() 
          });
          isChanged = true;
        }
      });

      foundUrls.forEach(url => {
        let cleanUrl = url.toLowerCase().trim().replace(/[.,;:"'<>]$/g, "");
        const isBlocked = status.blockedDomains.some(d => cleanUrl.includes(d));
        
        // Sosyal medya yakalama açıksa o profiller "Web Sitesi" olarak ikinci kez eklenmesin
        const isSocial = status.captureSocial && DH.parseSocial(cleanUrl);
        
        if (!cleanUrl.includes("@") && !isBlocked && !isSocial && !dataList.some(e => e.email === cleanUrl)) {
          dataList.push({ 
            email: cleanUrl, 
            type: "Web Sitesi", 
            source: pageTitle, 
            date: new Date().toLocaleDateString() 
          });
          isChanged = true;
        }
      });

      foundPhones.forEach(phone => {
        const isBlocked = status.blockedDomains.some(d => phone.includes(d));
        if (!isBlocked && !dataList.some(e => e.email === phone)) {
          dataList.push({ 
            email: phone, 
            type: "Telefon", 
            source: pageTitle, 
            date: new Date().toLocaleDateString() 
          });
          isChanged = true;
        }
      });

      foundSocial.forEach(s => {
        const isBlocked = status.blockedDomains.some(d => s.value.toLowerCase().includes(d));
        if (!isBlocked && !dataList.some(e => e.email === s.value)) {
          dataList.push({ 
            email: s.value, 
            type: "Sosyal Medya", 
            platform: s.platform,
            source: pageTitle, 
            date: new Date().toLocaleDateString() 
          });
          isChanged = true;
        }
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