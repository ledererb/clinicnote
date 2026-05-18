async function test() {
  const r = await fetch('https://finanszirozas.neak.gov.hu/szabalykonyv/index.asp?mid=1&pid=35');
  const t = new TextDecoder('iso-8859-2').decode(await r.arrayBuffer());
  console.log('Page 35 has codes:', t.includes('kod='));
}
test().catch(console.error);
