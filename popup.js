// popup.js - v18.0 (Geliştirilmiş Kara Liste)
let emails = [];

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

function updateUI() {
  chrome.storage.local.get({
    emailData: [], isActive: true, onlyEmails: false,
    scanSpeed: "0", domainFilter: "", mailBody: "", blockedDomains: [],
    autoSaveActive: false, autoSaveInterval: 5, autoClearAfterSave: false
  }, (res) => {
    emails = res.emailData;
    document.getElementById('totalCount').innerText = emails.length;
    document.getElementById('activeStatus').checked = res.isActive;
    document.getElementById('onlyEmailsStatus').checked = res.onlyEmails;
    document.getElementById('vites').value = res.scanSpeed;
    document.getElementById('domainFilter').value = res.domainFilter;
    document.getElementById('mailBody').value = res.mailBody;
    document.getElementById('autoSaveActive').checked = res.autoSaveActive;
    document.getElementById('autoSaveInterval').value = res.autoSaveInterval;
    document.getElementById('autoClearAfterSave').checked = res.autoClearAfterSave;
    
    renderHunter(emails, res.onlyEmails);
    renderBlacklist(res.blockedDomains);
  });
}

function renderHunter(data, onlyEmailsActive) {
  const div = document.getElementById('listE');
  div.innerHTML = data.length ? "" : "<p style='text-align:center;color:#999;font-size:11px;'>Liste Boş</p>";
  let displayData = onlyEmailsActive ? data.filter(item => item.type === "E-Posta") : [...data];
  displayData.reverse().forEach(item => {
    const el = document.createElement('div');
    el.className = 'item';
    const domain = item.email.includes('@') ? item.email.split('@')[1] : item.email.replace('www.', '').split('/')[0];
    const blockBtn = document.createElement('button');
    blockBtn.innerHTML = "✖";
    blockBtn.style.cssText = "padding: 2px 8px; font-size: 10px; border: 1px solid #d32f2f; background: #fff; color: #d32f2f; border-radius: 4px; cursor: pointer;";
    blockBtn.onclick = () => toggleBlock(domain);
    const info = document.createElement('div');
    info.style.flex = "1";
    const color = item.type === "Web Sitesi" ? "#ff9800" : "#673ab7";
    info.innerHTML = `<span style="background:${color}; color:white; padding:1px 4px; border-radius:3px; font-size:9px;">${item.type === "Web Sitesi" ? "WEB" : "MAIL"}</span> <strong style="font-size:11px;">${item.email}</strong>`;
    info.onclick = () => { navigator.clipboard.writeText(item.email); alert("Kopyalandı!"); };
    el.appendChild(blockBtn);
    el.appendChild(info);
    div.appendChild(el);
  });
}

function renderBlacklist(blocked) {
  const div = document.getElementById('listB');
  div.innerHTML = blocked.length ? "" : "<p style='text-align:center;color:#999;font-size:11px;padding:20px;'>Kara liste boş.</p>";
  blocked.forEach(domain => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<span style="font-size:11px; color:#d32f2f; font-weight:bold;">${domain}</span>`;
    const undoBtn = document.createElement('button');
    undoBtn.innerHTML = "Engeli Kaldır";
    undoBtn.style.cssText = "padding: 3px 8px; font-size: 9px; background: #eee; color: #333; border: 1px solid #ccc; border-radius: 3px;";
    undoBtn.onclick = () => toggleBlock(domain);
    el.appendChild(undoBtn);
    div.appendChild(el);
  });
}

function toggleBlock(domain) {
  chrome.storage.local.get({blockedDomains: [], emailData: []}, (res) => {
    let blocked = res.blockedDomains;
    let dataList = res.emailData;
    if (blocked.includes(domain)) {
      blocked = blocked.filter(d => d !== domain);
    } else {
      blocked.push(domain);
      dataList = dataList.filter(item => !item.email.includes(domain));
    }
    chrome.storage.local.set({blockedDomains: blocked, emailData: dataList}, () => updateUI());
  });
}

// Manuel Kara Liste Ekleme Butonu
document.getElementById('addBlacklistBtn').onclick = () => {
  const input = document.getElementById('manualBlacklistInput');
  const val = input.value.trim().toLowerCase();
  if (val) {
    chrome.storage.local.get({blockedDomains: [], emailData: []}, (res) => {
      let blocked = res.blockedDomains;
      if (!blocked.includes(val)) {
        blocked.push(val);
        const filteredData = res.emailData.filter(item => !item.email.includes(val));
        chrome.storage.local.set({blockedDomains: blocked, emailData: filteredData}, () => {
          input.value = "";
          updateUI();
        });
      }
    });
  }
};

document.getElementById('clearBtn').onclick = () => {
  if(confirm("Mailleri temizliyorum Hümeyra. Kara listen korunacak!")) {
    chrome.storage.local.set({emailData:[]}, () => updateUI());
  }
};

document.getElementById('autoSaveActive').onchange = (e) => {
  const active = e.target.checked;
  const interval = parseInt(document.getElementById('autoSaveInterval').value) || 5;
  chrome.storage.local.set({ autoSaveActive: active }, () => {
    if (active) {
      chrome.alarms.create("autoSaveAlarm", { periodInMinutes: interval });
    } else {
      chrome.alarms.clear("autoSaveAlarm");
    }
  });
};

document.getElementById('autoSaveInterval').oninput = (e) => {
  const min = parseInt(e.target.value) || 5;
  chrome.storage.local.set({ autoSaveInterval: min });
  chrome.storage.local.get("autoSaveActive", (res) => {
    if (res.autoSaveActive) chrome.alarms.create("autoSaveAlarm", { periodInMinutes: min });
  });
};

document.getElementById('autoClearAfterSave').onchange = (e) => {
  chrome.storage.local.set({ autoClearAfterSave: e.target.checked });
};

document.getElementById('activeStatus').onchange = (e) => chrome.storage.local.set({ isActive: e.target.checked });
document.getElementById('onlyEmailsStatus').onchange = (e) => chrome.storage.local.set({ onlyEmails: e.target.checked }, () => updateUI());
['vites', 'domainFilter', 'mailBody'].forEach(id => {
  document.getElementById(id).oninput = (e) => chrome.storage.local.set({ [id === 'vites' ? 'scanSpeed' : id]: e.target.value });
});

document.getElementById('mailBtn').onclick = () => {
    const list = emails.filter(e => e.type !== "Web Sitesi").map(e => e.email).join(',');
    if(list) window.location.href = `mailto:?bcc=${list}&body=${encodeURIComponent(document.getElementById('mailBody').value)}`;
};

document.getElementById('dlBtn').onclick = () => {
  let csv = "\uFEFFEmail;Tip;Kaynak;Tarih\n" + emails.map(e => `${e.email};${e.type};${e.source};${e.date}`).join('\n');
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  link.download = "DataHunter_v18.csv";
  link.click();
};

chrome.runtime.onMessage.addListener(m => m.type === "REFRESH_UI" && updateUI());
updateUI();