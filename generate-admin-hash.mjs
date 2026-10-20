import {randomBytes,pbkdf2Sync} from 'node:crypto';

if(!process.stdin.isTTY||typeof process.stdin.setRawMode!=='function'){
 console.error('Execute este script em um terminal interativo para ocultar a senha digitada.');
 process.exit(1);
}
const stdin=process.stdin;
let password='';
process.stdout.write('Senha inicial do administrador (mínimo 12 caracteres): ');
stdin.setRawMode(true);stdin.resume();stdin.setEncoding('utf8');
stdin.on('data',chunk=>{
 for(const character of chunk){
  if(character==='\u0003'){stdin.setRawMode(false);process.stdout.write('\nCancelado.\n');process.exit(130);}
  if(character==='\r'||character==='\n'){
   stdin.setRawMode(false);stdin.pause();process.stdout.write('\n');
   if(password.length<12||password.length>128){password='';console.error('Use uma senha de 12 a 128 caracteres.');process.exitCode=1;return;}
   const salt=randomBytes(32).toString('hex'),hash=pbkdf2Sync(password,salt,100000,32,'sha512').toString('hex');
   password='';process.stdout.write('NOTIVOX_INITIAL_ADMIN_SALT='+salt+'\nNOTIVOX_INITIAL_ADMIN_HASH='+hash+'\n');return;
  }
  if(character==='\b'||character==='\x7f')password=password.slice(0,-1);else if(character>=' ')password+=character;
 }
});
