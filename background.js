// background.js - v18.1 (Geliştirilmiş Kayıt Sistemi)
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
    const selectedText = info.selectionText.trim().toLowerCase();
    const isEmail = selectedText.includes("@");
    const isUrl = selectedText.includes("www.") || selectedText.includes("http");

    if (isEmail || isUrl) {
      chrome.storage.local.get({emailData: []}, (res) => {
        let dataList = res.emailData;
        if (!dataList.some(e => e.email === selectedText)) {
          dataList.push({
            email: selectedText,
            type: isEmail ? "E-Posta" : "Web Sitesi",
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
    let csvContent = "\uFEFFEmail;Tip;Kaynak;Tarih\n" + 
                     res.emailData.map(e => `${e.email};${e.type};${e.source};${e.date}`).join('\n');
    
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