(function(){
 function start(){
  if(!window.requestShipping||window.__waseetShippingUploadWrapped)return;
  window.__waseetShippingUploadWrapped=true;
  const box=document.getElementById('shippingBox');if(!box)return;
  const old=document.getElementById('shipInvoice');if(old&&old.type!=='hidden'){
    old.type='hidden';
    const file=document.createElement('input');file.id='shipInvoiceFile';file.type='file';file.accept='.pdf,image/*';file.placeholder='فاتورة وسيط';
    old.parentNode.insertBefore(file,old);
  }
  if(!document.getElementById('shipDistance')){
    const d=document.createElement('input');d.id='shipDistance';d.type='number';d.min='0';d.step='0.1';d.placeholder='المسافة بالكيلومتر (للتسعير الآلي)';
    const w=document.getElementById('shipWeight');w?.parentNode.insertBefore(d,w.nextSibling);
  }
  const original=window.requestShipping; const originalRequest=WaseetShipping.request; WaseetShipping.request=async function(dealId,data){data=data||{};data.distance_km=data.distance_km??(+document.getElementById('shipDistance')?.value||null);return originalRequest.call(WaseetShipping,dealId,data)};
  window.requestShipping=async function(){
    const deal=document.getElementById('shipDeal')?.value;
    const file=document.getElementById('shipInvoiceFile')?.files?.[0];
    if(file&&deal){
      const safe=(file.name||'invoice').replace(/[^a-zA-Z0-9._-]/g,'_');
      const path=deal+'/invoice/'+crypto.randomUUID()+'-'+safe;
      const up=await waseetClient.storage.from('waseet-deal-files').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
      if(up.error){const m=document.getElementById('shippingMsg');if(m)m.textContent=up.error.message;return}
      document.getElementById('shipInvoice').value=path;
    }
    return original();
  };
 }
 setTimeout(start,0);setTimeout(start,300);setTimeout(start,1000);
})();