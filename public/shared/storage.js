window.WaseetStorage={
 async uploadDealFile(dealId,file,folder="files"){
  if(!file||!dealId) return {path:null,error:null};
  const safe=(file.name||"file").replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=dealId+"/"+folder+"/"+crypto.randomUUID()+"-"+safe;
  const r=await waseetClient.storage.from("waseet-deal-files").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
  return {path:r.error?null:path,error:r.error};
 },
 async uploadProfileFile(userId,file,folder="documents"){
  if(!file||!userId)return {path:null,error:null};
  const safe=(file.name||"file").replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=userId+"/"+folder+"/"+crypto.randomUUID()+"-"+safe;
  const r=await waseetClient.storage.from("waseet-documents").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
  return {path:r.error?null:path,error:r.error};
 },
 async signedDealFile(path,seconds=900){
  if(!path)return null;
  const r=await waseetClient.storage.from("waseet-deal-files").createSignedUrl(path,seconds);
  return r.data?.signedUrl||null;
 }
};