// The existing upload/backup readers keep their bucket API and ownership checks.
export function supabaseBucket(storage){
 const check=key=>{if(typeof key!=='string'||!key||key.startsWith('/')||key.split('/').some(p=>!p||p==='.'||p==='..')||key.includes('\\'))throw Error('Caminho de arquivo inválido.');return key;};
 const missing=error=>['404','not_found','NoSuchKey'].includes(String(error?.statusCode||error?.code||''));
 const failure=()=>Object.assign(Error('O armazenamento de arquivos está indisponível.'),{status:503});
 return {
  async put(key,value){check(key);const body=typeof value==='string'?new Blob([value],{type:'application/json'}):value;const {error}=await storage.upload(key,body,{upsert:true,contentType:typeof value==='string'?'application/json':'application/octet-stream'});if(error)throw failure();},
  async get(key,options={}){check(key);const {data,error}=await storage.download(key);if(error){if(missing(error))return null;throw failure();}if(!data)return null;
   const range=options.range;const blob=range?data.slice(range.offset,range.offset+range.length):data;
   return {size:blob.size,body:blob.stream(),json:()=>blob.text().then(JSON.parse)};
  },
  async head(key){check(key);const {data,error}=await storage.info(key);if(error){if(missing(error))return null;throw failure();}return data?{size:data.size}:null;},
  async delete(keys){const names=Array.isArray(keys)?keys:[keys];names.forEach(check);if(!names.length)return;const {error}=await storage.remove(names);if(error)throw failure();}
 };
}
