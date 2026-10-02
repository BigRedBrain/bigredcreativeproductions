import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'bigred-shipping-'));
try {
  const bundled = await build({ entryPoints: ['src/server/shipping-rates.ts','src/data/shipping.ts'], bundle: true, platform: 'node', format: 'esm', outdir: dir, write: false,
    plugins: [{ name: 'server-marker', setup(b) { b.onResolve({filter:/^server-only$/}, () => ({path:'marker',namespace:'test'})); b.onLoad({filter:/.*/,namespace:'test'}, () => ({contents:''})); } }] });
  for (const file of bundled.outputFiles) { await mkdir(dirname(file.path), {recursive:true}); await writeFile(file.path, file.contents); }
  const { getShippingRates } = await import(pathToFileURL(join(dir,'server/shipping-rates.js')));
  const { packingKey } = await import(pathToFileURL(join(dir,'data/shipping.js')));
  const line = {productId:'test-product',quantity:1,selectedOptionValues:{size:'4x6',finish:'matte'},selectedAddOnSlugs:[]};
  const reversed = {...line,selectedOptionValues:{finish:'matte',size:'4x6'}};
  assert.equal(packingKey([line]),packingKey([reversed]));
  assert.notEqual(packingKey([line]),packingKey([{...line,quantity:2}]));
  assert.notEqual(packingKey([line]),packingKey([{...line,selectedAddOnSlugs:['stand']}]));
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url,'https://api.easypost.com/v2/shipments');
    const body=JSON.parse(options.body).shipment;
    assert.equal(options.headers.Authorization, `Basic ${Buffer.from("mock-key:").toString("base64")}`);
    assert.ok(body.parcel); assert.equal(body.service,undefined);
    assert.deepEqual(body.to_address,{zip:'12345',country:'US',residential:true});
    assert.equal(body.parcel.weight,20);
    return new Response(JSON.stringify({mode:"production",rates:[
      {carrier:'Carrier',service:'Ground',rate:'12.34',currency:'USD',mode:'production',delivery_days:3},
      {carrier:'Carrier',service:'Economy',rate:'8.90',currency:'USD',mode:'production'},
      {carrier:'Test',service:'Test',rate:'1.00',currency:'USD',mode:'test'},
      {carrier:'Other',service:'Euro',rate:'2.00',currency:'EUR',mode:'production'},
    ]}),{status:200});
  };
  delete process.env.EASYPOST_API_KEY;
  assert.equal(await getShippingRates([line],'12345'),null); assert.equal(calls,0);
  process.env.EASYPOST_API_KEY='mock-key';
  process.env.EASYPOST_MODE='test';
  assert.equal(await getShippingRates([line],'12345'),null); assert.equal(calls,0);
  process.env.EASYPOST_MODE='production';
  process.env.SHIPPING_ORIGIN_JSON=JSON.stringify({name:'Test',street1:'Example',city:'Example',state:'NY',zip:'12345',country:'US',phone:'5555555555',email:'test@example.com'});
  process.env.SHIPPING_PACKING_PROFILES_JSON='{}';
  assert.equal(await getShippingRates([line],'12345'),null); assert.equal(calls,0);
  const profile={length:8,width:6,height:3,weight:1.25,distance_unit:'in',mass_unit:'lb'};
  process.env.SHIPPING_PACKING_PROFILES_JSON=JSON.stringify({[packingKey([line])]:profile});
  assert.equal(await getShippingRates([{...line,quantity:2}],'12345'),null);
  const rates=await getShippingRates([line],'12345');
  assert.deepEqual(rates.map(r=>r.cents),[890,1234]); assert.equal(rates[1].estimatedDays,3);
  globalThis.fetch=async()=>new Response(JSON.stringify({mode:'test',rates:[]}),{status:200});
  assert.equal(await getShippingRates([line],'12345'),null);
  globalThis.fetch=async()=>new Response('Unavailable',{status:503});
  await assert.rejects(getShippingRates([line],'12345'));
  console.log('Shipping verification passed: exact packing, missing/test configuration, no guessed rates, provider filtering/sorting, carrier failure. No live API called.');
} finally { await rm(dir,{recursive:true,force:true}); }
