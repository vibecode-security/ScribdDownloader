document.addEventListener('DOMContentLoaded', async () => {
  const tabInfoEl = document.getElementById('tab-info');
  const btnPrimary = document.getElementById('btn-primary-action');
  const customUrlInput = document.getElementById('custom-url');
  const btnCustomDownload = document.getElementById('btn-custom-download');

  // Extract ID from Scribd URL
  function extractScribdId(url) {
    if (!url) return null;
    const match = url.match(/scribd\.com\/(?:document|embeds)\/(\d+)/i);
    return match ? match[1] : null;
  }

  // Get active tab
  let currentTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs && tabs[0] ? tabs[0] : null;
  } catch (err) {
    console.error(err);
  }

  const currentUrl = currentTab ? currentTab.url || '' : '';
  const isEmbed = currentUrl.includes('/embeds/') && currentUrl.includes('/content');
  const docId = extractScribdId(currentUrl);

  if (isEmbed && docId) {
    tabInfoEl.innerHTML = `<span style="color:#16a34a; font-weight:600;">✓ Đang ở trang Embed (ID: ${docId})</span>`;
    btnPrimary.disabled = false;
    btnPrimary.textContent = "⚡ Bắt đầu cuộn & Xuất PDF";
    btnPrimary.onclick = () => {
      chrome.tabs.sendMessage(currentTab.id, { action: 'start_download' }, (response) => {
        if (chrome.runtime.lastError) {
          // If content script not injected yet, execute directly
          chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
          }, () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(currentTab.id, { action: 'start_download' });
            }, 300);
          });
        }
        window.close();
      });
    };
  } else if (docId) {
    tabInfoEl.innerHTML = `<span>Phát hiện tài liệu ID: <strong>${docId}</strong></span>`;
    btnPrimary.disabled = false;
    btnPrimary.textContent = "🚀 Mở Embed & Chuẩn bị tải";
    btnPrimary.onclick = () => {
      const embedUrl = `https://www.scribd.com/embeds/${docId}/content`;
      chrome.tabs.update(currentTab.id, { url: embedUrl });
      window.close();
    };
  } else {
    tabInfoEl.innerHTML = `<span style="color:#64748b;">Chưa mở tài liệu Scribd trên tab này.</span>`;
    btnPrimary.disabled = true;
    btnPrimary.textContent = "Không tìm thấy tài liệu";
  }

  // Handle custom URL input
  btnCustomDownload.onclick = () => {
    const inputVal = customUrlInput.value.trim();
    const id = extractScribdId(inputVal);
    if (!id) {
      alert("Vui lòng dán đúng đường dẫn Scribd hợp lệ (chứa ID tài liệu, ví dụ: https://www.scribd.com/document/351653227/...)");
      return;
    }
    const embedUrl = `https://www.scribd.com/embeds/${id}/content`;
    chrome.tabs.create({ url: embedUrl });
    window.close();
  };

  // Support pressing Enter in input
  customUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnCustomDownload.click();
    }
  });
});
