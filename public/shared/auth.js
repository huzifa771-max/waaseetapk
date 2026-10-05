<script>
(function(){
const c=window.waseetClient;
window.WaseetAuth={
 async session(){return (await c.auth.getSession()).data.session;},
 async profile(){const s=await this.session();if(!s)return null;return (await c.from("profiles").select("*").eq("id",s.user.id).maybeSingle()).data;},
 async sendEmail(email,redirect){return await c.auth.signInWithOtp({email,options:{emailRedirectTo:redirect||location.href,shouldCreateUser:true}});},
 async sendPhone(phone){return await c.auth.signInWithOtp({phone,options:{shouldCreateUser:true}});},
 async verifyPhone(phone,token){return await c.auth.verifyOtp({phone,token,type:"sms"});},
 async saveProfile(p){const s=await this.session();if(!s)throw Error("لم يتم تسجيل الدخول");return await c.from("profiles").upsert({id:s.user.id,...p},{onConflict:"id"});},
 async signOut(){return c.auth.signOut();},
 async requireRole(roles){const p=await this.profile();if(!p||!roles.includes(p.role)){location.href="/";return null}return p;}
};
window.WaseetData={
 async deals(){const p=await WaseetAuth.profile();if(!p)return[];let q=c.from("deals").select("*").order("updated_at",{ascending:false});if(p.role==="merchant")q=q.eq("merchant_id",p.id);if(p.role==="supplier")q=q.eq("supplier_id",p.id);if(p.role==="driver")q=q.eq("driver_id",p.id);return (await q).data||[]},
 async requests(){return (await c.from("purchase_requests").select("*").order("created_at",{ascending:false})).data||[]},
 async products(){return (await c.from("products").select("*").eq("status","active").order("created_at",{ascending:false})).data||[]},
 async messages(id){return (await c.from("messages").select("*").eq("deal_id",id).order("created_at",{ascending:true})).data||[]},
 async shipment(id){return (await c.from("shipments").select("*").eq("deal_id",id).maybeSingle()).data},
 async inspection(id){return (await c.from("inspections").select("*").eq("deal_id",id).maybeSingle()).data},
 async events(id){return (await c.from("deal_events").select("*").eq("deal_id",id).order("created_at",{ascending:true})).data||[]},
 async payment(id){return (await c.from("payments").select("*").eq("deal_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle()).data},
 async recordEvent(id,type,details={}){const s=await this.session();return c.from("deal_events").insert({deal_id:id,actor_id:s?.user?.id,event_type:type,details})},
 async sendMessage(id,body){const s=await WaseetAuth.session();return c.from("messages").insert({deal_id:id,sender_id:s.user.id,body})},
 watchDeals(cb){return c.channel("waseet-deals").on("postgres_changes",{event:"*",schema:"public",table:"deals"},cb).subscribe()},
 watchMessages(id,cb){return c.channel("waseet-messages-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"deal_id=eq."+id},cb).subscribe()}
};
})();
</script>
(function(){if(!document.querySelector('script[data-waseet-quick-auth]')){const s=document.createElement('script');s.src='/shared/quick-auth.js';s.dataset.waseetQuickAuth='1';document.head.appendChild(s)}})();

(function(){const s=document.createElement('script');s.src='/shared/shipping-upload.js';document.head.appendChild(s)})();

setTimeout(function(){if(window.quoteShipping&&!window.__waseetAutoQuoteHook){window.__waseetAutoQuoteHook=true;const old=window.quoteShipping;window.quoteShipping=async function(id){const s=await WaseetShipping.settings();if(s&&s.pricing_mode==='automatic'){const r=await WaseetShipping.quoteAutomatic(id);alert(r.error?r.error.message:'تم حساب السعر آلياً');if(window.loadShippingAdmin)window.loadShippingAdmin();return}return old(id)}}},800);

setTimeout(function(){if(window.loadShippingAdmin&&!window.__waseetShippingAdminHook){window.__waseetShippingAdminHook=true;const old=window.loadShippingAdmin;window.loadShippingAdmin=async function(){await old();const box=document.getElementById('shippingAdmin');if(!box)return;const ships=await WaseetShipping.adminList();const drivers=(await waseetClient.from('profiles').select('id,full_name').eq('role','driver').eq('verification_status','approved')).data||[];ships.forEach(function(s){const items=box.querySelectorAll('.item');let target=null;for(const el of items)if(el.textContent.includes(s.id.slice(0,8))){target=el;break}if(!target)return;if(['requested','quoted','approved'].includes(s.status)&&!target.querySelector('[data-assign]')){const sel=document.createElement('select');sel.setAttribute('data-assign','1');sel.innerHTML='<option value="">اختر السائق</option>'+drivers.map(d=>'<option value="'+d.id+'">'+String(d.full_name||d.id.slice(0,8)).replace(/[<>&"]/g,'')+'</option>').join('');const b=document.createElement('button');b.textContent='تعيين السائق';b.onclick=async function(){if(!sel.value)return;const r=await WaseetShipping.assignDriver(s.id,sel.value);alert(r.error?r.error.message:'تم تعيين السائق');window.loadShippingAdmin()};target.appendChild(sel);target.appendChild(b)}if(['assigned','loading'].includes(s.status)&&!target.querySelector('[data-load-otp]')){const b=document.createElement('button');b.setAttribute('data-load-otp','1');b.textContent='OTP التحميل';b.onclick=async function(){const r=await WaseetShipping.issueOtp(s.id,'loading');alert(r.error?r.error.message:'رمز التحميل: '+r.data)};target.appendChild(b)}if(['in_transit','delivered'].includes(s.status)&&!target.querySelector('[data-delivery-otp]')){const b=document.createElement('button');b.setAttribute('data-delivery-otp','1');b.textContent='OTP التسليم';b.onclick=async function(){const r=await WaseetShipping.issueOtp(s.id,'delivery');alert(r.error?r.error.message:'رمز التسليم: '+r.data)};target.appendChild(b)}})}}},1000);
