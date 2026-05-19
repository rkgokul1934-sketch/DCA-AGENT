import asyncio
# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from playwright.async_api import async_playwright
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
from app.database import get_mongo_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CrawlerService:
    async def crawl_url(self, url: str, company_name: str) -> str:
        """
        Crawls a URL. Uses HTTPX by default to avoid browser crashes in restricted environments.
        """
        logger.info(f"Crawling {url} using HTTPX...")
        text = await self._crawl_with_httpx(url)
        
        # If HTTPX returns very little content, it might be a SPA, try Playwright if needed
        if len(text) < 500:
            logger.info(f"HTTPX returned low content ({len(text)} chars), attempting Playwright...")
            pw_text = await self._crawl_with_playwright(url)
            if pw_text:
                text = pw_text
        
        if text:
            await self._save_to_mongo(company_name, url, text)
            
        return text

    async def _crawl_with_playwright(self, url: str) -> str:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-dev-shm-usage", "--single-process"]
                )
                page = await browser.new_page()
                # Use a shorter timeout and wait for load
                await page.goto(url, wait_until="load", timeout=15000)
                content = await page.content()
                text = self._extract_text(content)
                await browser.close()
                return text
        except Exception as e:
            logger.error(f"Playwright crash/error for {url}: {e}")
            return ""

    async def _crawl_with_httpx(self, url: str) -> str:
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, 
                timeout=15.0,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"}
            ) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return self._extract_text(response.text)
                logger.warning(f"HTTPX failed for {url} with status {response.status_code}")
                return ""
        except Exception as e:
            logger.error(f"HTTPX request error for {url}: {e}")
            return ""

    def _extract_text(self, html_content: str) -> str:
        soup = BeautifulSoup(html_content, 'html.parser')
        # Remove navigation, footer, script, style to get clean content
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.extract()
        
        # Focus on main content if possible
        main = soup.find('main') or soup.find('article') or soup.body
        if main:
            return main.get_text(separator=' ', strip=True)
        return soup.get_text(separator=' ', strip=True)

    async def _save_to_mongo(self, company_name: str, url: str, text: str):
        db = get_mongo_db()
        if db is not None:
            try:
                await db.raw_crawls.insert_one({
                    "company_name": company_name,
                    "url": url,
                    "extracted_text": text[:50000], # Cap size
                    "crawled_at": datetime.utcnow()
                })
            except Exception:
                pass

crawler_service = CrawlerService()
