(function(){
 const c=window.waseetClient;
 const required={merchant:['national_id','commercial_registration','business_activity','bank_account'],supplier:['national_id','commercial_registration','business_activity','bank_account'],driver:['national_id','driving_license','vehicle_registration','insurance']};
 async function upload(type,file){
  const s=await WaseetAuth.session(); if(!s) throw Error('يجب تسجيل الدخول');
  if(!file) throw Error('اختر ملفاً');
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const path=s.user.id+'/'+type+'-'+Date.now()+'.'+ext;
  const up=await c.storage.from('waseet-documents').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
  if(up.error) throw up.error;
  const row=await c.from('profile_documents').insert({user_id:s.user.id,document_type:type,file_url:path,status:'pending'}).select().single();
  if(row.error) throw row.error;
  return row.data;
 }
 async function mine(){const r=await c.from('profile_documents').select('*').order('created_at',{ascending:false});return r.data||[]}
 async function requirements(role){return required[role]||[]}
 window.WaseetDocuments={upload,mine,requirements,required};
})();