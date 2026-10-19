// Run privately in your terminal. Never prints a password or hash in chat/logs.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import {Writable} from 'node:stream';
import {randomBytes,webcrypto} from 'node:crypto';

if(!process.stdin.isTTY){console.error('Execute este comando no seu terminal interativo, para informar a senha com a digitação oculta.');process.exit(1);}
const silent=new Writable({write(chunk,encoding,callback){callback();}});
const reader=readline.createInterface({input:process.stdin,output:silent,terminal:true});
try{
 process.stdout.write('Senha nova do administrador admin (mínimo 12 caracteres; digitação oculta): ');
 const password=await reader.question('');process.stdout.write('\nConfirme a senha: ');
 const confirmation=await reader.question('');process.stdout.write('\n');
 if(password!==confirmation||password.length<12||password.length>128)throw Error('Confirmação diferente ou tamanho inválido. Nenhum arquivo foi criado.');
 const salt=randomBytes(32).toString('hex'),encoder=new TextEncoder();
 const key=await webcrypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const hash=Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-512'},key,256)).toString('hex');
 const folder=path.resolve('.runtime');fs.mkdirSync(folder,{recursive:true});
 const file=path.join(folder,'notivox-admin-'+Date.now()+'.env');
 fs.writeFileSync(file,'NOTIVOX_INITIAL_ADMIN_HASH='+hash+'\nNOTIVOX_INITIAL_ADMIN_SALT='+salt+'\n',{flag:'wx',mode:0o600});
 console.log('Arquivo privado criado em '+file+'. Cadastre os dois valores somente nas variáveis privadas da Vercel. A senha não foi gravada. Não compartilhe o arquivo nem envie ao Git.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{reader.close();}
