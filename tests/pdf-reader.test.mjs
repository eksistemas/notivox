import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const context=vm.createContext({document:{addEventListener(){}}});vm.runInContext(fs.readFileSync('src/transpose.js','utf8'),context);vm.runInContext(fs.readFileSync('src/pdf-reader.js','utf8'),context);
const run=expression=>vm.runInContext(expression,context);
function samplePDF(){
 const stream='BT /F1 12 Tf 50 760 Td (Tom: C) Tj 0 -22 Td (C    G/B    Am7    F) Tj 0 -22 Td (Texto original de teste) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let pdf='%PDF-1.4\n';const offsets=[0];for(const [index,object]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;}
 const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Uint8Array(Buffer.from(pdf));
}
test('extrai um PDF real e transpõe acordes mantendo a letra',async()=>{
 const doc=await getDocument({data:samplePDF(),useSystemFonts:true}).promise;
 try{const page=await doc.getPage(1),content=await page.getTextContent();context.items=content.items;const text=run('PdfCifra.lines(items)');assert(text.includes('C    G/B    Am7    F'));assert(text.includes('Texto original de teste'));context.text=text;assert.equal(run('PdfCifra.inspect(text).key'),'C');assert.equal(run('PdfCifra.inspect(text).count'),4);const shifted=run('MusicTranspose.text(text,2)');assert(shifted.includes('D    A/C#    Bm7    G'));assert(shifted.includes('Texto original de teste'));}finally{await doc.loadingTask.destroy();}
});
test('recompõe linhas por posição sem juntar acordes e palavras',()=>{
 context.items=[{str:'letra de teste',width:70,height:12,transform:[12,0,0,12,50,700]},{str:'G/B',width:18,height:12,transform:[12,0,0,12,100,720]},{str:'C',width:6,height:12,transform:[12,0,0,12,50,720]}];const text=run('PdfCifra.lines(items)');assert.equal(text.split('\n').length,2);assert(text.startsWith('C'));assert(text.split('\n')[0].includes('G/B'));assert.equal(text.split('\n')[1],'letra de teste');assert.equal(run("PdfCifra.inspect('').count"),0);assert.equal(run("PdfCifra.inspect('Texto sem acordes').count"),0);
 assert.equal(run("MusicTranspose.text('[Intro] C G/B Am F',2)"),'[Intro] D A/C# Bm G');
 assert.equal(run("MusicTranspose.text('Intro: C G/B Am F\\n( C G Am F )',2)"),'Intro: D A/C# Bm G\n( D A Bm G )');
});

test('PDF inválido produz rejeição controlada, sem documento nem cifra inventada',async()=>{
 const loading=getDocument({data:new Uint8Array(Buffer.from('Arquivo de teste inválido')),useSystemFonts:true});
 try{await assert.rejects(loading.promise,error=>error.name==='InvalidPDFException');}finally{await loading.destroy();}
});
