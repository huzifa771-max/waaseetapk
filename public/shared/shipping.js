window.WaseetShipping={
 async request(dealId,data){
  const s=await WaseetAuth.session();
  return waseetClient.from("shipments").upsert({
   deal_id:dealId,requested_by:s.user.id,status:"requested",quote_status:"pending",
   invoice_url:data.invoice_url||null,loading_address:data.loading_address||null,delivery_address:data.delivery_address||null,
   loading_lat:data.loading_lat||null,loading_lng:data.loading_lng||null,delivery_lat:data.delivery_lat||null,delivery_lng:data.delivery_lng||null,
   weight_kg:data.weight_kg||null,vehicle_type:data.vehicle_type||null,refrigerated:!!data.refrigerated,
   pricing_mode:"manual",requested_at:new Date().toISOString()
  },{onConflict:"deal_id"});
 },
 async mine(){const p=await WaseetAuth.profile();if(!p)return[];let q=waseetClient.from("shipments").select("*").order("updated_at",{ascending:false});if(p.role!=="admin")q=q.or("requested_by.eq."+p.id+",driver_id.eq."+p.id);return (await q).data||[]},
 async adminList(){return (await waseetClient.from("shipments").select("*").order("updated_at",{ascending:false})).data||[]},
 async settings(){return (await waseetClient.from("shipping_settings").select("*").eq("id",true).maybeSingle()).data},
 async setMode(mode){return waseetClient.from("shipping_settings").update({pricing_mode:mode,updated_at:new Date().toISOString()}).eq("id",true)},
 async rules(){return (await waseetClient.from("shipping_rate_rules").select("*").eq("active",true).order("priority").order("min_value")).data||[]},
 async addRule(rule){const s=await WaseetAuth.session();return waseetClient.from("shipping_rate_rules").insert({...rule,created_by:s.user.id})},
 async priceShipment(id,price,breakdown={}){
  return waseetClient.from("shipments").update({manual_price:price,approved_price:price,calculated_price:price,pricing_mode:"manual",quote_status:"quoted",status:"quoted",pricing_breakdown:breakdown,priced_at:new Date().toISOString()}).eq("id",id);
 },
 async approveQuote(id){return waseetClient.from("shipments").update({quote_status:"approved",status:"approved",approved_at:new Date().toISOString()}).eq("id",id)},
 async assignDriver(id,driverId){
  const s=await WaseetAuth.session();
  return waseetClient.from("shipments").update({driver_id:driverId,assigned_by:s.user.id,assigned_by_role:"admin",status:"assigned"}).eq("id",id);
 }
};