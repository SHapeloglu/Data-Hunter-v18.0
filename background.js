// background.js - v18.2 (Telefon + Sosyal Medya, ortak CSV)
importScripts("extractors.js");
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "addManualEmail",
      title: "Data Hunter'a Ekle: '%s'",
      contexts: ["selection"]
    });
  });
});

// Sağ tık menüsü
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addManualEmail") {
    const rawText = info.selectionText.trim();
    const selectedText = rawText.toLowerCase();
    const isEmail = selectedText.includes("@");
    const social = !isEmail && DH.parseSocial(rawText);
    const isUrl = !social && (selectedText.includes("www.") || selectedText.includes("http"));
    const phone = !isEmail && !social && !isUrl && DH.normalizePhone(rawText, false);

    let entry = null;
    if (isEmail) entry = { email: selectedText, type: "E-Posta" };
    else if (social) entry = { email: social.value, type: "Sosyal Medya", platform: social.platform };
    else if (isUrl) entry = { email: selectedText, type: "Web Sitesi" };
    else if (phone) entry = { email: phone, type: "Telefon" };

    if (entry) {
      chrome.storage.local.get({emailData: []}, (res) => {
        let dataList = res.emailData;
        if (!dataList.some(e => e.email === entry.email)) {
          dataList.push({
            ...entry,
            source: "Manuel: " + (tab.title || "Sayfa"),
            date: new Date().toLocaleDateString()
          });
          chrome.storage.local.set({emailData: dataList}, () => {
            chrome.runtime.sendMessage({type: "REFRESH_UI"}, () => { if (chrome.runtime.lastError) return; });
          });
        }
      });
    }
  }
});

// OTOMATİK KAYIT SİSTEMİ
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoSaveAlarm") {
    console.log("Alarm tetiklendi, kayıt başlatılıyor...");
    handleAutoSave();
  }
});

async function handleAutoSave() {
  chrome.storage.local.get({
    emailData: [], 
    autoSaveActive: false, 
    autoClearAfterSave: false
  }, (res) => {
    // Veri yoksa veya ayar kapalıysa çık
    if (!res.autoSaveActive || res.emailData.length === 0) {
      console.log("Kayıt şartları oluşmadı: Aktif mi?", res.autoSaveActive, "Veri sayısı:", res.emailData.length);
      return;
    }

    // CSV içeriğini oluştur (Excel dostu olması için UTF-8 BOM ekliyoruz)
    const csvContent = DH.buildCsv(res.emailData);
    
    // Doğrudan Base64 formatına çeviriyoruz (Daha kararlı çalışır)
    const base64Data = btoa(unescape(encodeURIComponent(csvContent)));
    const finalUrl = "data:text/csv;base64," + base64Data;

    chrome.downloads.download({
      url: finalUrl,
      filename: `DataHunter_AutoBackup_${Date.now()}.csv`,
      saveAs: false,
      conflictAction: "uniquify" // Aynı isimde dosya varsa sonuna (1) ekler
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("İndirme Hatası:", chrome.runtime.lastError.message);
        return;
      }
      
      console.log("İndirme başarılı, ID:", downloadId);

      // Eğer "Yedekten sonra temizle" açıksa listeyi sil
      if (res.autoClearAfterSave) {
        chrome.storage.local.set({emailData: []}, () => {
          console.log("Liste temizlendi.");
          chrome.runtime.sendMessage({type: "REFRESH_UI"}, () => { if (chrome.runtime.lastError) return; });
        });
      }
    });
  });
}