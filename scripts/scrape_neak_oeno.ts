import { chromium, Page } from 'playwright';
import * as fs from 'fs';

/**
 * NEAK OENO Web Scraper
 * 
 * Ez a script a Playwright használatával végigkattintja a NEAK OENO kereső lapozóját,
 * és kimenti az adatokat (Kód és Megnevezés) egy JSON fájlba, így nem fagyasztja le a böngészőt.
 * 
 * Használat:
 * 1. Telepítsd a függőségeket, ha még nincsenek: npm i -D playwright tsx
 * 2. Cseréld ki a `TARGET_URL` változót arra az URL-re, ahol a NEAK OENO találatok vannak.
 * 3. Futtasd a scriptet: npx tsx scripts/scrape_neak_oeno.ts
 */

const TARGET_URL = 'IDE_MASOLD_BE_AZ_OENO_KERESO_URL_JET'; // Cseréld ki a pontos URL-re
const OUTPUT_FILE = 'oeno_codes.json';

// CSS Szelektorok (Ezeket esetleg frissíteni kell a NEAK oldalának felépítésétől függően)
const SELECTORS = {
  // A táblázat sorai, amelyek az adatokat tartalmazzák
  TABLE_ROWS: 'table tbody tr', 
  // A "Következő" gomb a lapozóban (lehet pl. '.next', 'a:text("Következő")', stb.)
  NEXT_BUTTON: 'a:has-text("Következő"), a.next_page',
};

async function scrapeNeakOeno() {
  console.log('🚀 Böngésző indítása...');
  // A headless: true biztosítja, hogy a háttérben fusson és ne fagyassza ki a gépet
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Növeljük meg a timeoutot, a NEAK oldal néha lassú lehet
  page.setDefaultTimeout(60000); 

  try {
    console.log(`🌐 Navigálás ide: ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    
    let hasNextPage = true;
    let pageNum = 1;
    const allData: Array<{ code: string, description: string }> = [];

    while (hasNextPage) {
      console.log(`📄 Oldal feldolgozása: ${pageNum}...`);
      
      // Várjuk meg, amíg a táblázat betöltődik
      await page.waitForSelector(SELECTORS.TABLE_ROWS).catch(() => console.log('Nem található táblázat ezen az oldalon.'));

      // Adatok kinyerése az aktuális oldalról
      const pageData = await page.evaluate((sel) => {
        const rows = document.querySelectorAll(sel.TABLE_ROWS);
        const data = [];
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          // Feltételezzük, hogy az 1. oszlop a kód, a 2. a megnevezés.
          // Ha ez a NEAK oldalon eltér, itt kell módosítani az indexeket (0 és 1).
          if (cells.length >= 2) {
            data.push({
              code: cells[0]?.textContent?.trim() || '',
              description: cells[1]?.textContent?.trim() || ''
            });
          }
        });
        
        return data;
      }, SELECTORS);

      allData.push(...pageData);
      console.log(`✅ ${pageData.length} kód kinyerve erről az oldalról.`);

      // Ellenőrizzük, hogy van-e következő oldal gomb
      const nextButton = await page.$(SELECTORS.NEXT_BUTTON);
      
      if (nextButton) {
        // Kattintás és várakozás a következő oldal betöltésére
        console.log('➡️ Ugrás a következő oldalra...');
        
        // Fontos: Várjuk meg a navigációt a kattintás után
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
          nextButton.click()
        ]);
        
        // Várjunk egy picit, hogy a JS-renderelt táblázatok is befrissüljenek
        await page.waitForTimeout(2000); 
        pageNum++;
      } else {
        console.log('🛑 Nincs több oldal. Adatgyűjtés befejezve.');
        hasNextPage = false;
      }
    }

    // Eredmények mentése
    console.log(`💾 Összesen ${allData.length} rekord mentése ide: ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2), 'utf-8');
    console.log('🎉 Sikeres mentés!');

  } catch (error) {
    console.error('❌ Hiba történt a webkaparás (scraping) közben:', error);
  } finally {
    console.log('🧹 Böngésző bezárása...');
    await browser.close();
  }
}

// Ha a fájlt közvetlenül futtatják
if (require.main === module || import.meta.url) {
  if (TARGET_URL === 'IDE_MASOLD_BE_AZ_OENO_KERESO_URL_JET') {
    console.error('⚠️ Kérlek előbb nyisd meg a scriptet és állítsd be a TARGET_URL változót!');
    process.exit(1);
  }
  scrapeNeakOeno();
}
