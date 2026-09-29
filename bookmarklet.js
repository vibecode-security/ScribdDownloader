// ==============================================================================
// SCRIBD PDF DOWNLOADER - BOOKMARKLET (1-CLICK KHÔNG CẦN CÀI EXTENSION)
// ==============================================================================
// CÁCH SỬ DỤNG:
// 1. Tạo 1 Bookmark mới trên trình duyệt (Ctrl + D hoặc chuột phải trên Bookmark bar -> Add page).
// 2. Đặt tên bookmark: "📥 Tải Scribd PDF"
// 3. Dán toàn bộ đoạn mã bên dưới (bắt đầu bằng javascript:) vào ô URL.
// 4. Khi đang ở trang tài liệu Scribd bất kỳ, bấm vào Bookmark này 1 cái là xong!
// ==============================================================================

javascript:(async function(){
  const url = window.location.href;
  const match = url.match(/scribd\.com\/(?:document|embeds)\/(\d+)/i);
  if (!match) {
    alert("Vui lòng mở một trang tài liệu Scribd trước khi bấm Bookmarklet này!");
    return;
  }
  const docId = match[1];
  if (!url.includes('/embeds/') || !url.includes('/content')) {
    window.location.href = 'https://www.scribd.com/embeds/' + docId + '/content';
    return;
  }

  let banner = document.getElementById('scribd-bm-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'scribd-bm-banner';
    banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999999;background:#1a73e8;color:#fff;padding:12px 24px;border-radius:30px;font-family:-apple-system,sans-serif;font-weight:600;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,0.35);transition:all 0.3s;';
    document.body.appendChild(banner);
  }
  const setMsg = (msg) => { banner.innerText = msg; };
  setMsg("⏳ Đang quét danh sách các trang...");

  let pages = Array.from(document.querySelectorAll('.outer_page, [id^="outer_page_"], [class*="outer_page"]'));
  const scroller = document.querySelector('.document_scroller') || document.documentElement || document.body;
  if (!pages.length) {
    pages = Array.from(document.querySelectorAll('[class*="page"]')).filter(el => el.offsetWidth > 200 && el.offsetHeight > 200);
  }

  const total = pages.length;
  if (total > 0) {
    for (let i = 0; i < total; i++) {
      pages[i].scrollIntoView({ behavior: 'auto', block: 'center' });
      setMsg(`⏳ Đang nạp trang ${i + 1}/${total} (${Math.round((i+1)*100/total)}%)...`);
      await new Promise(r => setTimeout(r, 380));
    }
  } else {
    const maxScroll = scroller.scrollHeight;
    for (let y = 0; y < maxScroll; y += 400) {
      scroller.scrollTop = y;
      setMsg(`⏳ Đang cuộn nạp dữ liệu (${Math.round(y * 100 / maxScroll)}%)...`);
      await new Promise(r => setTimeout(r, 150));
    }
    scroller.scrollTop = scroller.scrollHeight;
  }

  setMsg("🧹 Đang dọn dẹp các thanh công cụ & chuẩn bị in...");
  await new Promise(r => setTimeout(r, 800));

  document.querySelectorAll('.document_scroller').forEach(el => {
    el.classList.remove('document_scroller');
    el.style.overflow = 'visible';
    el.style.height = 'auto';
    el.style.position = 'static';
  });
  document.body.style.overflow = 'visible';
  document.body.style.height = 'auto';
  document.documentElement.style.overflow = 'visible';
  document.documentElement.style.height = 'auto';

  const removeSelectors = [
    '.toolbar_top', '.toolbar_bottom', '.toolbar_drop', '#toolbar_drop',
    '.mobile_overlay', '#mobile_overlay', '#fb-root', '.between_page_portal',
    '.between_page_ads', '.autogen_ad'
  ];
  removeSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(n => n.parentNode && n.parentNode.removeChild(n));
  });

  const printStyle = document.createElement('style');
  printStyle.textContent = '@media print { #scribd-bm-banner { display:none !important; } @page { size: auto; margin: 0; } body, html { overflow: visible !important; height: auto !important; background: #fff !important; } .outer_page { page-break-after: always !important; break-after: page !important; box-shadow: none !important; border: none !important; margin: 0 auto !important; } }';
  document.head.appendChild(printStyle);

  setMsg("✅ Sẵn sàng! Đang mở hộp thoại in...");
  await new Promise(r => setTimeout(r, 500));
  window.print();
  setMsg("🎉 Hoàn tất! Chọn 'Save as PDF' để lưu file.");
})();
