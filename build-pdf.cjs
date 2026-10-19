const fs=require('node:fs'),esbuild=require('esbuild');fs.mkdirSync('dist/assets/pdf',{recursive:true});
for(const [source,name]of [['pdf','pdfjsLib'],['pdf.worker','pdfjsWorker']])esbuild.buildSync({entryPoints:['node_modules/pdfjs-dist/legacy/build/'+source+'.mjs'],bundle:true,format:'iife',globalName:name,platform:'browser',target:'es2022',minify:true,outfile:'dist/assets/pdf/'+source+'.js',logLevel:'error'});
fs.copyFileSync('node_modules/pdfjs-dist/LICENSE','dist/assets/pdf/LICENSE.txt');
console.log('Leitor PDF preparado para uso dentro do app.');
