import fs from 'fs';

async function testScrape() {
  const res = await fetch("https://finanszirozas.neak.gov.hu/szabalykonyv/index.asp?mid=1&pid=1");
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-2"); 
  const text = decoder.decode(buffer);
  
  const regex = /<tr[^>]*>\s*<td[^>]*><a[^>]*kod=(\w+)[^>]*>\s*\1\s*<\/a><\/td>\s*<td[^>]*>(.*?)<\/td>/gi;
  
  let match;
  const results = [];
  while ((match = regex.exec(text)) !== null) {
    results.push({ code: match[1], name: match[2].trim() });
  }
  
  fs.writeFileSync("oeno_test.json", JSON.stringify(results, null, 2));
  console.log(`Found ${results.length} OENO codes on page 1`);
}

testScrape().catch(console.error);
