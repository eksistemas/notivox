import fs from 'node:fs/promises';
import path from 'node:path';
export function localBucket(directory){
 const root=path.resolve(directory);const target=key=>{const resolved=path.resolve(root,key);if(!resolved.startsWith(root+path.sep))throw Error('Arquivo inválido.');return resolved;};
 return {async put(key,value){const file=target(key);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,typeof value==='string'?value:Buffer.from(value));},async head(key){try{const info=await fs.stat(target(key));return {size:info.size};}catch(error){if(error.code==='ENOENT')return null;throw error;}},async get(key,options){try{const data=await fs.readFile(target(key));const body=options?.range?data.subarray(options.range.offset,options.range.offset+options.range.length):data;return {size:data.length,body:new Response(body).body,json:async()=>JSON.parse(data.toString('utf8'))};}catch(error){if(error.code==='ENOENT')return null;throw error;}},async delete(keys){for(const key of Array.isArray(keys)?keys:[keys]){try{await fs.unlink(target(key));}catch(error){if(error.code!=='ENOENT')throw error;}}}};
}
