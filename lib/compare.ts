export const FIELDS = [
 ['awb','Air Waybill Number'],['destination','Station of Unloading / Destination'],['properShippingName','Proper Shipping Name'],['technicalName','Technical Name'],['unNumber','UN / ID Number'],['classDivision','Class / Division'],['subsidiaryHazard','Subsidiary Hazard'],['packingGroup','Packing Group'],['packages','Number of Packages'],['quantity','Quantity'],['unit','Unit of Measurement'],['quantityDesignation','Net / Gross Designation'],['overpack','Overpack'],['radioactiveCategory','Radioactive Material Category'],['cao','CAO'],['dgImp','DG/IMP Code'],['erg','ERG Drill Code'],['uld','ULD ID'],['position','Loading Position']
] as const;
export type FieldKey = (typeof FIELDS)[number][0];
export type Entry = Partial<Record<FieldKey,string>>;
export type Result = {awb:string;field:string;source:string;notoc:string;status:'correct'|'warning'|'incorrect'|'unverified';remark:string};
const OPERATIONAL = new Set<FieldKey>(['uld','position','dgImp','erg']);
export const normalize = (v: unknown) => String(v ?? '').trim().replace(/\s+/g,' ').toUpperCase();
function compact(v:string){ return normalize(v).replace(/[\s.-]/g,''); }
function qty(v:string) { const t=normalize(v).replace(/,/g,''); const m=t.match(/\d+(?:\.\d+)?/); return m?Number(m[0]):null; }
function designation(v:string) { const s=compact(v); if (/(?:KGG|KGGROSS|GROSS|KG G$)/.test(s)) return 'G'; if (/(?:KGN|KGNET|NET)/.test(s)) return 'N'; return ''; }
export function compareEntries(source:Entry[],notoc:Entry[]):Result[] {
 const output:Result[]=[]; const used=new Set<number>();
 for (const d of source) {
  const awb=normalize(d.awb); if(!awb) continue;
  const idx=notoc.findIndex((n,i)=>!used.has(i)&&compact(n.awb||'')===compact(awb));
  if(idx<0){ output.push({awb,field:'Shipment / AWB',source:awb,notoc:'Not found',status:'incorrect',remark:'DGD AWB has no matching NOTOC entry.'});continue; }
  used.add(idx);const n=notoc[idx];
  for(const [key,label] of FIELDS){
   const a=String(d[key]||'').trim(), b=String(n[key]||'').trim();
   let status:Result['status']='correct'; let remark='Matches source.';
   if (!a){status='unverified';remark=OPERATIONAL.has(key)?'Cannot verify this field from the DGD. Requires loading information / operational reference.':'Cannot verify from supplied source.';}
   else if (!b){status='incorrect';remark='Missing in NOTOC although specified in DGD.';}
   else if (key==='quantity' && qty(a)!==null && qty(b)!==null && qty(a)===qty(b)){
     if(designation(a)&&designation(a)!==designation(b)){status='warning';remark='Numeric quantity matches, but gross/net indicator is missing or differs.';}
   } else if (key==='quantityDesignation') {
     if((designation(a)||compact(a))!==(designation(b)||compact(b))) {status='warning';remark='Gross/net designation differs or is missing.';}
   } else if(compact(a)!==compact(b)){
     status = key==='properShippingName' || key==='technicalName' ? 'warning':'incorrect';
     remark = 'Difference from DGD. Check the precise source wording and DG meaning.';
   }
   output.push({awb,field:label,source:a||'Not stated',notoc:b||'Not stated',status,remark});
  }
 }
 notoc.forEach((n,i)=>{if(!used.has(i)&&n.awb)output.push({awb:n.awb,field:'Shipment / AWB',source:'Not found',notoc:n.awb,status:'warning',remark:'NOTOC AWB has no matching extracted DGD entry; check source extraction.'})});
 return output;
}
