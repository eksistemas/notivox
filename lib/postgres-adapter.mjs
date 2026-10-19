// Compatibility boundary for the existing, internal prepared statements.
// User input is always passed separately as parameters, never SQL text.
export function postgresStatement(source, values=[]) {
 let sql='', index=0, i=0;
 const ignore=/^INSERT OR IGNORE INTO /i.test(source);
 source=source.replace(/^INSERT OR IGNORE INTO /i,'INSERT INTO ');
 while(i<source.length){
  const char=source[i];
  if(char==="'"||char==='"'||char==='`'){
   const quote=char;sql+=quote==='`'?'"':quote;i++;
   let closed=false;
   while(i<source.length){const c=source[i++];sql+=quote==='`'&&c==='`'?'"':c;
    if(c===quote){if(source[i]===quote){sql+=source[i++];}else{closed=true;break;}}
   }
   if(!closed)throw Error('database: declaração incompleta');
  }else if(char==='?'){sql+='$'+(++index);i++;}
  else if(/[A-Za-z_]/.test(char)){
   const word=source.slice(i).match(/^[A-Za-z_][A-Za-z_0-9]*/)[0];i+=word.length;
   sql+=['users','sessions','attempts','app_data'].includes(word)?'notivox.'+word:word==='departmentId'?'"departmentId"':word;
  }else{if(char===';'||source.slice(i,i+2)==='--'||source.slice(i,i+2)==='/*')throw Error('database: declaração não permitida');sql+=char;i++;}
 }
 if(index!==values.length)throw Error('database: parâmetros inválidos');
 sql=sql.replace(/\bIS (\$\d+)/g,'IS NOT DISTINCT FROM $1');
 if(ignore)sql+=' ON CONFLICT DO NOTHING';
 return {sql,values:[...values]};
}

export function postgresAdapter(executor){
 const execute=async(statement,connection=executor)=>{
  try{const {sql,values}=postgresStatement(statement.source,statement.values);return await connection.query(sql,values);}
  catch(error){throw new Error('database: não foi possível concluir a operação',{cause:error});}
 };
 const prepare=(source,values=[])=>({source,values,
  bind(...next){return prepare(source,next);},
  async first(){return (await execute(this)).rows[0]||null;},
  async all(){return {results:(await execute(this)).rows};},
  async run(){const result=await execute(this);return {meta:{changes:result.count}};}
 });
 return {prepare,async batch(statements){
  try{return await executor.transaction(async connection=>{
   // Restore's account snapshot must stay valid through its atomic commit.
   if(statements.some(item=>/^DELETE FROM users|^UPDATE app_data/.test(item.source)))await connection.query('LOCK TABLE notivox.users, notivox.app_data IN SHARE ROW EXCLUSIVE MODE',[]);
   const results=[];for(const statement of statements){const r=await execute(statement,connection);results.push({meta:{changes:r.count}});}return results;
  });}catch(error){throw new Error('database: transação não concluída',{cause:error});}
 }};
}
