// popup.js - v18.1 (Telefon + Sosyal Medya)
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
    autoSaveActive: false, autoSaveInterval: 5, autoClearAfterSave: false,
    capturePhones: false, captureSocial: false
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
    document.getElementById('capturePhones').checked = res.capturePhones;
    document.getElementById('captureSocial').checked = res.captureSocial;
    
    renderHunter(emails, res.onlyEmails);
    renderBlacklist(res.blockedDomains);
  });
}

const BADGES = {
  "E-Posta": { label: "MAIL", color: "#673ab7" },
  "Web Sitesi": { label: "WEB", color: "#ff9800" },
  "Telefon": { label: "TEL", color: "#00897b" },
  "Sosyal Medya": { label: "SOSYAL", color: "#1e88e5" }
};

function renderHunter(data, onlyEmailsActive) {
  const div = document.getElementById('listE');
  div.innerHTML = data.length ? "" : "<p style='text-align:center;color:#999;font-size:11px;'>Liste Boş</p>";
  let displayData = onlyEmailsActive ? data.filter(item => item.type === "E-Posta") : [...data];
  displayData.reverse().forEach(item => {
    const el = document.createElement('div');
    el.className = 'item';
    // ✖ ile kara listeye alınacak anahtar: e-postada domain, sitede host, telefon/sosyalde değerin kendisi
    let domain;
    if (item.type === "E-Posta") domain = item.email.split('@')[1];
    else if (item.type === "Web Sitesi") domain = item.email.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    else domain = item.email;
    const blockBtn = document.createElement('button');
    blockBtn.textContent = "✖";
    blockBtn.style.cssText = "padding: 2px 8px; font-size: 10px; border: 1px solid #d32f2f; background: #fff; color: #d32f2f; border-radius: 4px; cursor: pointer;";
    blockBtn.onclick = () => toggleBlock(domain);
    const info = document.createElement('div');
    info.style.flex = "1";
    const badge = BADGES[item.type] || BADGES["E-Posta"];
    // Toplanan değerler sayfadan geliyor: innerHTML yerine textContent (XSS)
    const tag = document.createElement('span');
    tag.style.cssText = `background:${badge.color}; color:white; padding:1px 4px; border-radius:3px; font-size:9px;`;
    tag.textContent = item.type === "Sosyal Medya" && item.platform ? item.platform.toUpperCase() : badge.label;
    const value = document.createElement('strong');
    value.style.fontSize = "11px";
    value.textContent = item.email;
    info.append(tag, " ", value);
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
    const label = document.createElement('span');
    label.style.cssText = "font-size:11px; color:#d32f2f; font-weight:bold;";
    label.textContent = domain;
    el.appendChild(label);
    const undoBtn = document.createElement('button');
    undoBtn.textContent = "Engeli Kaldır";
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

document.getElementById('capturePhones').onchange = (e) => chrome.storage.local.set({ capturePhones: e.target.checked });
document.getElementById('captureSocial').onchange = (e) => chrome.storage.local.set({ captureSocial: e.target.checked });

document.getElementById('activeStatus').onchange = (e) => chrome.storage.local.set({ isActive: e.target.checked });
document.getElementById('onlyEmailsStatus').onchange = (e) => chrome.storage.local.set({ onlyEmails: e.target.checked }, () => updateUI());
['vites', 'domainFilter', 'mailBody'].forEach(id => {
  document.getElementById(id).oninput = (e) => chrome.storage.local.set({ [id === 'vites' ? 'scanSpeed' : id]: e.target.value });
});

document.getElementById('mailBtn').onclick = () => {
    const list = emails.filter(e => e.type === "E-Posta").map(e => e.email).join(',');
    if(list) window.location.href = `mailto:?bcc=${list}&body=${encodeURIComponent(document.getElementById('mailBody').value)}`;
};

document.getElementById('dlBtn').onclick = () => {
  const csv = DH.buildCsv(emails);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  link.download = "DataHunter_v18.csv";
  link.click();
};

chrome.runtime.onMessage.addListener(m => m.type === "REFRESH_UI" && updateUI());
updateUI();