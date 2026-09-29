// Content Script for Scribd PDF Downloader
(() => {
  if (window.__scribdDownloaderLoaded) return;
  window.__scribdDownloaderLoaded = true;

  // Create Floating Control Widget on Scribd Embed page
  function injectFloatingWidget() {
    if (document.getElementById('scribd-dl-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'scribd-dl-widget';
    widget.innerHTML = `
      <div class="sdl-header">
        <div class="sdl-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="12" y2="18"></line>
            <line x1="15" y1="15" x2="12" y2="18"></line>
          </svg>
          <span>Scribd PDF Downloader</span>
        </div>
        <button id="sdl-close-btn" title="Đóng">✕</button>
      </div>
      <div class="sdl-body">
        <div id="sdl-status">Sẵn sàng tải tài liệu</div>
        <div class="sdl-progress-wrapper" id="sdl-progress-container" style="display:none;">
          <div class="sdl-progress-bar" id="sdl-progress-bar"></div>
        </div>
        <div class="sdl-actions">
          <button id="sdl-download-btn" class="sdl-btn sdl-btn-primary">
            🚀 Tải PDF ngay
          </button>
        </div>
        <div class="sdl-note">
          💡 Tự động cuộn qua các trang để nạp dữ liệu, làm sạch giao diện và mở hộp thoại in PDF.
        </div>
      </div>
    `;

    // Inject styles for widget
    const style = document.createElement('style');
    style.id = 'scribd-dl-style';
    style.textContent = `
      #scribd-dl-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999999;
        width: 320px;
        background: #ffffff;
        color: #1a1a1a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }
      .sdl-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1a73e8;
        color: #ffffff;
        padding: 10px 14px;
        font-weight: 600;
        font-size: 14px;
      }
      .sdl-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #sdl-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        opacity: 0.8;
      }
      #sdl-close-btn:hover {
        opacity: 1;
      }
      .sdl-body {
        padding: 14px;
      }
      #sdl-status {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 10px;
      }
      .sdl-progress-wrapper {
        background: #e5e7eb;
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      .sdl-progress-bar {
        background: #1a73e8;
        height: 100%;
        width: 0%;
        transition: width 0.2s ease;
      }
      .sdl-actions {
        margin-bottom: 8px;
      }
      .sdl-btn {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
      }
      .sdl-btn-primary {
        background: #1a73e8;
        color: #ffffff;
      }
      .sdl-btn-primary:hover {
        background: #1557b0;
      }
      .sdl-btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
      .sdl-note {
        font-size: 11px;
        color: #6b7280;
        line-height: 1.4;
      }
      @media print {
        #scribd-dl-widget, .toolbar_top, .toolbar_bottom, .toolbar_drop, .mobile_overlay, #fb-root, .between_page_portal {
          display: none !important;
        }
        @page {
          size: auto;
          margin: 0;
        }
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          height: auto !important;
          overflow: visible !important;
        }
        .document_scroller {
          height: auto !important;
          overflow: visible !important;
          position: static !important;
        }
        .outer_page {
          page-break-after: always !important;
          page-break-inside: avoid !important;
          break-after: page !important;
          break-inside: avoid !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(widget);

    document.getElementById('sdl-close-btn').addEventListener('click', () => {
      widget.remove();
    });

    document.getElementById('sdl-download-btn').addEventListener('click', () => {
      startDownloadProcess();
    });
  }

  // Delay helper
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Main download workflow
  async function startDownloadProcess() {
    const statusEl = document.getElementById('sdl-status');
    const progressBar = document.getElementById('sdl-progress-bar');
    const progressContainer = document.getElementById('sdl-progress-container');
    const downloadBtn = document.getElementById('sdl-download-btn');

    if (downloadBtn) downloadBtn.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';

    const updateStatus = (text, percent = null) => {
      if (statusEl) statusEl.textContent = text;
      if (progressBar && percent !== null) {
        progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      }
    };

    try {
      updateStatus("🔍 Đang tìm các trang tài liệu...", 5);
      await sleep(500);

      // Find all page elements
      let pages = Array.from(document.querySelectorAll('.outer_page, [id^="outer_page_"], [class*="outer_page"]'));

      // If outer_page not found yet, check document_scroller
      const scroller = document.querySelector('.document_scroller') || document.documentElement || document.body;

      if (!pages.length) {
        pages = Array.from(document.querySelectorAll('[class*="page"]')).filter(el => el.offsetWidth > 200 && el.offsetHeight > 200);
      }

      const totalPages = pages.length;

      if (totalPages > 0) {
        updateStatus(`⏳ Đang tải nội dung: 0 / ${totalPages} trang...`, 10);

        for (let i = 0; i < totalPages; i++) {
          const page = pages[i];
          page.scrollIntoView({ behavior: 'auto', block: 'center' });

          const percent = Math.round(((i + 1) / totalPages) * 80) + 10;
          updateStatus(`⏳ Đang tải trang ${i + 1} / ${totalPages} (${percent}%)...`, percent);

          // Wait small interval for lazy loading images & text
          await sleep(400);
        }
      } else {
        // Fallback smooth scroll to bottom of scroller
        updateStatus("⏳ Đang cuộn trang để tải dữ liệu...", 30);
        const maxScroll = scroller.scrollHeight;
        const step = 400;
        for (let y = 0; y < maxScroll; y += step) {
          scroller.scrollTop = y;
          const percent = Math.round((y / maxScroll) * 70) + 10;
          updateStatus(`⏳ Đang cuộn qua tài liệu (${percent}%)...`, percent);
          await sleep(150);
        }
        scroller.scrollTop = scroller.scrollHeight;
      }

      updateStatus("✨ Đang kiểm tra lần cuối...", 92);
      await sleep(1000);

      // Step 2: Clean up elements and styles
      updateStatus("🧹 Đang dọn dẹp các thanh công cụ và định dạng in...", 96);

      // 1. Remove .document_scroller class or unconstrain it
      const scrollers = document.querySelectorAll('.document_scroller');
      scrollers.forEach((el) => {
        el.classList.remove('document_scroller');
        el.style.overflow = 'visible';
        el.style.height = 'auto';
        el.style.position = 'static';
      });

      // Also reset body and html styles
      document.body.style.overflow = 'visible';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'visible';
      document.documentElement.style.height = 'auto';

      // 2. Remove unwanted toolbars and overlays
      const selectorsToRemove = [
        '.toolbar_top',
        '.toolbar_bottom',
        '.toolbar_drop',
        '#toolbar_drop',
        '.mobile_overlay',
        '#mobile_overlay',
        '#fb-root',
        '.between_page_portal',
        '.between_page_ads',
        '.page_blur',
        '.autogen_ad'
      ];

      selectorsToRemove.forEach((sel) => {
        document.querySelectorAll(sel).forEach((node) => {
          node.parentNode && node.parentNode.removeChild(node);
        });
      });

      updateStatus("✅ Đã sẵn sàng! Đang mở hộp thoại in PDF...", 100);
      await sleep(500);

      // Trigger Print
      window.print();

      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "🔄 Mở lại hộp thoại in PDF";
      }
      updateStatus("🎉 Hoàn tất! Chọn 'Save as PDF' (Lưu dưới dạng PDF) để lưu file.");

    } catch (err) {
      console.error(err);
      updateStatus(`❌ Lỗi: ${err.message || 'Không thể tải'}`);
      if (downloadBtn) downloadBtn.disabled = false;
    }
  }

  // Listen to messages from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'start_download') {
        startDownloadProcess();
        sendResponse({ status: 'started' });
      }
    });
  }

  // Auto inject widget if on embed page
  if (window.location.href.includes('/embeds/') && window.location.href.includes('/content')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectFloatingWidget);
    } else {
      injectFloatingWidget();
    }
  }
})();
