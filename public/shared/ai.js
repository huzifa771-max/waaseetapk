window.WaseetAI={
  async merchantMatch(requestId){
    const {data,error}=await waseetClient.rpc('waseet_ai_merchant_match',{p_request_id:requestId});
    return {data,error};
  },
  async supplierMarket(productName){
    const {data,error}=await waseetClient.rpc('waseet_ai_supplier_market',{p_product_name:productName});
    return {data,error};
  },
  async adminOverview(){
    const {data,error}=await waseetClient.rpc('waseet_ai_admin_overview');
    return {data,error};
  },
  esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))},
  merchantCardHtml(data){
    const rows=data?.recommendations||[];
    return '<div class="item"><b>Waseet AI · أفضل المطابقات</b><div class="muted">تحليل مباشر من المنتجات والعروض المسجلة في وسيط.</div>'+
      (rows.length?rows.map((x,i)=>'<div class="item"><b>#'+(i+1)+' '+this.esc(x.product)+'</b> · '+this.esc(x.price)+' · متوفر '+this.esc(x.quantity_available)+' · تطابق '+Math.round(Number(x.match_score||0)*100)+'%<br><small>المورد: '+this.esc(x.supplier_id)+'</small></div>').join(''):'لا توجد مطابقة كافية حالياً')+'</div>';
  },
  supplierCardHtml(d){
    if(!d)return '<div class="item">لا توجد بيانات سعرية كافية لهذا المنتج.</div>';
    return '<div class="item"><b>Waseet AI · تحليل السوق</b><br>عدد الملاحظات: '+this.esc(d.sample_count)+'<br>أقل سعر: '+this.esc(d.min_price??'—')+'<br>المتوسط: '+this.esc(d.average_price??'—')+'<br>الوسيط: '+this.esc(d.median_price??'—')+'<br>أعلى سعر: '+this.esc(d.max_price??'—')+'</div>';
  },
  adminCardHtml(d){
    return '<div class="grid">'+Object.entries(d||{}).map(([k,v])=>'<div class="card"><b>'+this.esc(v)+'</b><br>'+this.esc(k)+'</div>').join('')+'</div>';
  }
};