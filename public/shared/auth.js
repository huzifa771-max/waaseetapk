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
 async sendMessage(id,body){const s=await this.session();return c.from("messages").insert({deal_id:id,sender_id:s.user.id,body})},
 watchDeals(cb){return c.channel("waseet-deals").on("postgres_changes",{event:"*",schema:"public",table:"deals"},cb).subscribe()},
 watchMessages(id,cb){return c.channel("waseet-messages-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"deal_id=eq."+id},cb).subscribe()}
};
function loadOnce(src,id){if(document.getElementById(id))return;const s=document.createElement("script");s.src=src;s.id=id;document.head.appendChild(s)}
window.WaseetAuthReady=(async()=>{
 loadOnce("/shared/voice-calls.js","waseet-voice-script");
 loadOnce("/shared/quick-auth.js","waseet-quick-script");
 loadOnce("/shared/shipping-upload.js","waseet-shipping-upload-script");
 await new Promise(r=>setTimeout(r,300));
 const s=await WaseetAuth.session();
 if(s&&window.WaseetVoice?.enableIncoming)window.WaseetVoice.enableIncoming().catch(()=>{}); if(s&&window.WaseetQuickAuth?.run&&document.getElementById('app')&&!document.getElementById('app').classList.contains('hide'))window.WaseetQuickAuth.run().catch(()=>{});
})();
})();