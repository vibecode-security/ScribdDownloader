import os
import re
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By


def convert_scribd_link(url):
    """
    Trích xuất Document ID từ URL Scribd và chuyển thành link Embed.
    Hỗ trợ:
      - https://www.scribd.com/document/12345678/ten-tai-lieu
      - https://www.scribd.com/embeds/12345678/content
      - Chỉ nhập ID (12345678)
    """
    url = url.strip()
    match = re.search(r'(?:document|embeds)/(\d+)', url)
    if match:
        doc_id = match.group(1)
        return doc_id, f'https://www.scribd.com/embeds/{doc_id}/content'
    
    if url.isdigit():
        return url, f'https://www.scribd.com/embeds/{url}/content'
        
    return None, None


def download_scribd_pdf(url_or_id, output_path=None, headless=False):
    doc_id, embed_url = convert_scribd_link(url_or_id)
    if not embed_url:
        print("❌ Lỗi: Đường dẫn hoặc ID Scribd không hợp lệ!")
        return False

    print(f"📄 Document ID: {doc_id}")
    print(f"🔗 Link Embed: {embed_url}")

    # Cấu hình Chrome
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_argument("window-size=1200,1000")

    print("\n⏳ Đang khởi động trình duyệt Chrome...")
    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(embed_url)
        time.sleep(3)

        # Lấy tiêu đề trang để đặt tên file nếu chưa có output_path
        page_title = driver.title.replace(" - Scribd", "").replace("Scribd", "").strip()
        page_title = re.sub(r'[\\/*?:"<>|]', "", page_title) or f"scribd_{doc_id}"
        
        if not output_path:
            output_path = f"{page_title}.pdf"

        print(f"📖 Tên tài liệu: {page_title}")
        print("⏳ Đang quét và cuộn qua các trang để nạp toàn bộ dữ liệu...")

        # Tìm các trang
        pages = driver.find_elements(By.CSS_SELECTOR, ".outer_page, [id^='outer_page_'], [class*='outer_page']")
        if not pages:
            pages = driver.find_elements(By.CSS_SELECTOR, "[class*='page']")

        total_pages = len(pages)
        print(f"📑 Tìm thấy {total_pages} trang.")

        if total_pages > 0:
            for idx, page in enumerate(pages):
                driver.execute_script("arguments[0].scrollIntoView({behavior: 'auto', block: 'center'});", page)
                time.sleep(0.4)
                if (idx + 1) % 5 == 0 or (idx + 1) == total_pages:
                    print(f"   -> Đã nạp trang {idx + 1}/{total_pages} ({(idx + 1) * 100 // total_pages}%)")
        else:
            # Fallback cuộn từng phần
            max_scroll = driver.execute_script("return document.body.scrollHeight;")
            for y in range(0, max_scroll, 600):
                driver.execute_script(f"window.scrollTo(0, {y});")
                time.sleep(0.2)

        time.sleep(1.5)
        print("\n🧹 Đang làm sạch giao diện và định dạng bố cục in...")

        # Dọn dẹp DOM
        cleanup_script = """
            // Gỡ bỏ class và giới hạn chiều cao của document_scroller
            var scrollers = document.querySelectorAll('.document_scroller');
            scrollers.forEach(function(el) {
                el.classList.remove('document_scroller');
                el.style.overflow = 'visible';
                el.style.height = 'auto';
                el.style.position = 'static';
            });

            document.body.style.overflow = 'visible';
            document.body.style.height = 'auto';
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.height = 'auto';

            // Xóa bỏ các thanh điều hướng và overlay
            var selectors = [
                '.toolbar_top', '.toolbar_bottom', '.toolbar_drop', '#toolbar_drop',
                '.mobile_overlay', '#mobile_overlay', '#fb-root', '.between_page_portal',
                '.between_page_ads', '.autogen_ad'
            ];
            selectors.forEach(function(sel) {
                document.querySelectorAll(sel).forEach(function(el) {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                });
            });

            // Tiêm CSS in tối ưu
            var style = document.createElement('style');
            style.textContent = `
                @page { size: auto; margin: 0; }
                body { margin: 0 !important; background: #fff !important; }
                .outer_page {
                    page-break-after: always !important;
                    break-after: page !important;
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 auto !important;
                }
            `;
            document.head.appendChild(style);
        """
        driver.execute_script(cleanup_script)
        time.sleep(1)

        print("🖨️ Đang xuất file PDF qua Chrome DevTools Protocol (CDP)...")
        # Sử dụng Chrome DevTools Protocol xuất trực tiếp sang file PDF (không cần bấm Print Dialog)
        pdf_options = {
            "landscape": False,
            "displayHeaderFooter": False,
            "printBackground": True,
            "preferCSSPageSize": True,
            "marginTop": 0,
            "marginBottom": 0,
            "marginLeft": 0,
            "marginRight": 0
        }
        result = driver.execute_cdp_cmd("Page.printToPDF", pdf_options)
        pdf_bytes = base64.b64decode(result['data'])

        with open(output_path, "wb") as f:
            f.write(pdf_bytes)

        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"\n🎉 THÀNH CÔNG! Đã lưu file PDF tại:")
        print(f"👉 {os.path.abspath(output_path)} ({file_size_mb:.2f} MB)")
        return True

    except Exception as e:
        print(f"\n❌ Đã xảy ra lỗi: {e}")
        return False
    finally:
        driver.quit()


if __name__ == "__main__":
    print("=" * 60)
    print("    SCRIBD PDF AUTO DOWNLOADER (CHROME CDP)")
    print("=" * 60)
    url_input = input("Nhập URL Scribd hoặc Document ID: ").strip()
    if url_input:
        download_scribd_pdf(url_input, headless=False)
