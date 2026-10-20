import postgres from 'postgres';
import {createClient} from '@supabase/supabase-js';
import worker from '../dist/server/index.js';
import {postgresAdapter} from './postgres-adapter.mjs';
import {supabaseBucket} from './supabase-bucket.mjs';

let cached;
export function cloudConfigured(env=process.env){return ['NOTIVOX_DATABASE_URL','SUPABASE_URL','SUPABASE_SECRET_KEY'].some(key=>Boolean(env[key]));}
export function getSupabaseBackend(env=process.env){
 if(cached)return cached;
 const {NOTIVOX_DATABASE_URL:databaseURL,SUPABASE_URL:projectURL,SUPABASE_SECRET_KEY:secret}=env;
 if(!databaseURL||!projectURL||!secret)throw Error('Configuração do Supabase incompleta.');
 const dbURL=new URL(databaseURL),url=new URL(projectURL);
 if(!['postgres:','postgresql:'].includes(dbURL.protocol)||!dbURL.password||!/^notivox_app(?:\.[a-z0-9]+)?$/.test(decodeURIComponent(dbURL.username)))throw Error('Use a conexão privada do usuário notivox_app.');
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('URL do Supabase inválida.');
 const ssl={rejectUnauthorized:true};
 if(env.NOTIVOX_DATABASE_CA)ssl.ca=env.NOTIVOX_DATABASE_CA;
 const sql=postgres(databaseURL,{ssl,max:2,prepare:false,idle_timeout:20,connect_timeout:10});
 const wrap=connection=>({async query(text,args){const rows=await connection.unsafe(text,args);return {rows:[...rows],count:rows.count};},transaction:fn=>connection.begin(tx=>fn(wrap(tx)))});
 const DB=postgresAdapter(wrap(sql));
 const client=createClient(url.origin,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const BUCKET=supabaseBucket(client.storage.from(env.NOTIVOX_STORAGE_BUCKET||'notivox-private'));
  cached={async fetch(request){
  // No caller can impersonate the owner's trusted hosting identity.
  const headers=new Headers(request.headers);headers.delete('oai-authenticated-user-id');headers.delete('cf-connecting-ip');
  const safe=new Request(request,{headers});
  return worker.fetch(safe,{DB,BUCKET,REQUIRE_LOGIN:true,INITIAL_ADMIN_HASH:env.NOTIVOX_INITIAL_ADMIN_HASH,INITIAL_ADMIN_SALT:env.NOTIVOX_INITIAL_ADMIN_SALT,INITIAL_ADMIN_USERNAME:env.NOTIVOX_INITIAL_ADMIN_USERNAME});
 }};
 return cached;
}
