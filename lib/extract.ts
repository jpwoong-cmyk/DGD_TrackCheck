import ExcelJS from 'exceljs';
import type { Entry, FieldKey } from './compare';
import { FIELDS, normalize } from './compare';
const ALIASES: Record<string,FieldKey> = {
 'AWB':'awb','AIR WAYBILL':'awb','AIR WAYBILL NUMBER':'awb','AWB NUMBER':'awb',
 'STATION OF UNLOADING':'destination','DESTINATION':'destination','DEST':'destination',
 'PROPER SHIPPING NAME':'properShippingName','PSN':'properShippingName','TECHNICAL NAME':'technicalName',
 'UN NUMBER':'unNumber','UN/ID NUMBER':'unNumber','UN / ID NUMBER':'unNumber','UN/ID':'unNumber',
 'CLASS':'classDivision','CLASS/DIVISION':'classDivision','DIVISION':'classDivision',
 'SUBSIDIARY HAZARD':'subsidiaryHazard','SUB RISK':'subsidiaryHazard',
 'PACKING GROUP':'packingGroup','PG':'packingGroup','PACKAGES':'packages','NUMBER OF PACKAGES':'packages','NO OF PACKAGES':'packages',
 'QUANTITY':'quantity','DG QUANTITY':'quantity','UNIT':'unit','UNIT OF MEASUREMENT':'unit',
 'NET/GROSS':'quantityDesignation','NET/GROSS DESIGNATION':'quantityDesignation',
 'OVERPACK':'overpack','RADIOACTIVE CATEGORY':'radioactiveCategory','RADIOACTIVE MATERIAL CATEGORY':'radioactiveCategory',
 'CAO':'cao','DG/IMP':'dgImp','DG/IMP CODE':'dgImp','IMP CODE':'dgImp','ERG':'erg','ERG DRILL CODE':'erg','ULD':'uld','ULD ID':'uld','POSITION':'position','LOADING POSITION':'position'
};
export async function readNotoc(buffer:Buffer):Promise<{entries:Entry[];headers:string[];warning?:string}> {
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer as never);
 const entries:Entry[]=[]; const allHeaders:string[]=[];
 workbook.eachSheet(sheet=>{
  const scanLimit=Math.min(sheet.rowCount,30);let headerRow=0;let mapping=new Map<number,FieldKey>();
  for(let r=1;r<=scanLimit;r++){
   const trial=new Map<number,FieldKey>();sheet.getRow(r).eachCell((cell,col)=>{const title=normalize(cell.text).replace(/\s+/g,' ');const key=ALIASES[title];if(key)trial.set(col,key)});
   if(trial.size>mapping.size){mapping=trial;headerRow=r;}
  }
  if(![...mapping.values()].includes('awb'))return;
  allHeaders.push(...[...mapping.values()]);
  for(let r=headerRow+1;r<=sheet.rowCount;r++){
   const row=sheet.getRow(r);const entry:Entry={};mapping.forEach((key,col)=>{const value=row.getCell(col).text.trim();if(value)entry[key]=value});
   if(entry.awb)entries.push(entry);
  }
 });
 return {entries,headers:[...new Set(allHeaders)],warning:entries.length?'Review extracted NOTOC rows, especially merged cells and quantity designations.':'No AWB column/entries detected. Map headers manually or use a flattened NOTOC spreadsheet.'};
}
// Conservative PDF extraction: only reliably recognizable fields are extracted automatically.
// Unrecognized values remain blank rather than hallucinated.
export function parseDgdText(text:string):Entry[] {
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const awbMatches=[...text.matchAll(/\b\d{3}[\s-]?\d{8}\b/g)].map(m=>m[0]);
 const unique=[...new Set(awbMatches.map(x=>x.replace(/\s/g,'')))];
 if(!unique.length) return [];
 return unique.map(awb=>{
  const entry:Entry={awb};
  const un=[...text.matchAll(/\b(?:UN\s?\d{4}|ID\s?\d{4})\b/gi)].map(m=>m[0]);
  if(un.length===1)entry.unNumber=un[0].replace(/\s/g,'').toUpperCase();
  const pg=text.match(/\bPACKING\s+GROUP\s*[:\-]?\s*(I{1,3})\b/i);if(pg)entry.packingGroup=pg[1].toUpperCase();
  const over=text.match(/\bOVERPACK\s+USED(?:\s+PACK\s*#?\d+)?\b/i);if(over)entry.overpack=over[0];
  const cao=text.match(/\bCARGO\s+AIRCRAFT\s+ONLY\b/i);if(cao)entry.cao='CAO';
  const maybeQty=lines.filter(l=>/\b(?:KGG|KGN|KG|LITRES|LITERS|\bL\b)\b/i.test(l));
  if(maybeQty.length===1){const found=maybeQty[0].match(/\d+(?:\.\d+)?\s*(?:KgG|KgN|KG\s*[GN]?|L)\b/i);if(found)entry.quantity=found[0];}
  return entry;
 });
}
export function completeness(entries:Entry[]) {return entries.map(e=>({awb:e.awb,missing:FIELDS.filter(([k])=>!e[k]).map(([,label])=>label)}));}
