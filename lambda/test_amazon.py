"""Quick test script: scrape one Amazon.com.br page and print what we get."""
import asyncio
import random
from playwright.async_api import async_playwright

URL = "https://www.amazon.com.br/dp/B0FY6X2XXY"
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            locale="pt-BR",
            timezone_id="America/Sao_Paulo",
            extra_http_headers={
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            },
        )
        page = await context.new_page()

        print(f"Navigating to {URL} ...")
        await page.goto(URL, wait_until="domcontentloaded", timeout=30000)

        # Wait a bit for JS to settle
        await asyncio.sleep(5)

        title = await page.title()
        print(f"Page title: {title}")

        # Print first 2000 chars of HTML for debugging
        content = await page.content()
        print(f"\n=== HTML snippet (first 2000 chars) ===")
        print(content[:2000])
        print(f"=== End snippet ===")

        # Check for bot challenge indicators
        if "captcha" in content.lower() or "robot" in content.lower() or "continue shopping" in content.lower():
            print("\n*** BOT CHALLENGE DETECTED ***")
        elif "encontrar esta página" in content.lower() or "page not found" in content.lower():
            print("\n*** PAGE NOT FOUND ***")
        else:
            print("\nNo obvious bot challenge detected.")

        await browser.close()
        print("Done.")


asyncio.run(main())
