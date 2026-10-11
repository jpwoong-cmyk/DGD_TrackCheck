import { NextRequest, NextResponse } from 'next/server';
import { authorized } from '../../../lib/security';
import { compareEntries } from '../../../lib/compare';
import { parseDgdText, readNotoc, completeness } from '../../../lib/extract';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(!authorized(req.headers.get('cookie')))return NextResponse.json({error:'Unauthorized'},{status:401});
 const data=await req.formData().catch(()=>null);
 const pdf=data?.get('dgd'),xlsx=data?.get('notoc');
 if(!(pdf instanceof File)||!(xlsx instanceof File))return NextResponse.json({error:'Provide a DGD PDF and NOTOC XLSX.'},{status:400});
 if(pdf.size>8_000_000||xlsx.size>8_000_000)return NextResponse.json({error:'8 MB maximum per file.'},{status:413});
 if(!pdf.name.toLowerCase().endsWith('.pdf')||!xlsx.name.toLowerCase().endsWith('.xlsx'))return NextResponse.json({error:'Only PDF and XLSX are supported.'},{status:400});
 try {
  const pdfBuf=Buffer.from(await pdf.arrayBuffer()), excelBuf=Buffer.from(await xlsx.arrayBuffer());
  if(pdfBuf.subarray(0,4).toString()!=='%PDF'||excelBuf.subarray(0,2).toString()!=='PK')return NextResponse.json({error:'Invalid file signature.'},{status:400});
  // pdf-parse v1 CommonJS API; extracted text is not trusted as complete DGD data.
  const pdfParse=require('pdf-parse');const parsed=await pdfParse(pdfBuf);
  const source=parseDgdText(parsed.text||'');const notoc=await readNotoc(excelBuf);
  return NextResponse.json({source,notoc:notoc.entries,results:compareEntries(source,notoc.entries),completeness:completeness(source),warnings:[notoc.warning,'PDF extraction is preliminary. Scanned PDFs and multiple DG lines per AWB require manual verification.','Do not use this prototype as a final operational NOTOC approval.'].filter(Boolean)});
 }catch(e){return NextResponse.json({error:'Could not parse the documents. Check PDF text accessibility and XLSX format.'},{status:422})}
}
