<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
window.WASEET_SUPABASE_URL = "https://zwsvlrptnlchajqgqtvm.supabase.co";
window.WASEET_SUPABASE_KEY = "sb_publishable_1S4CCi-cGjyJE7PO87fueg_H8NFkA";
window.waseetClient = window.supabase.createClient(window.WASEET_SUPABASE_URL, window.WASEET_SUPABASE_KEY);
window.WaseetData = {
  async session(){ return (await window.waseetClient.auth.getSession()).data.session; },
  async profile(){ const s=await this.session(); if(!s) return null; return (await window.waseetClient.from("profiles").select("*").eq("id",s.user.id).maybeSingle()).data; },
  async deals(){ return (await window.waseetClient.from("deals").select("*").order("updated_at",{ascending:false})).data||[]; },
  async requests(){ return (await window.waseetClient.from("purchase_requests").select("*").order("created_at",{ascending:false})).data||[]; },
  async messages(dealId){ return (await window.waseetClient.from("messages").select("*").eq("deal_id",dealId).order("created_at",{ascending:true})).data||[]; },
  watchDeals(cb){ return window.waseetClient.channel("waseet-deals").on("postgres_changes",{event:"*",schema:"public",table:"deals"},cb).subscribe(); },
  watchMessages(dealId,cb){ return window.waseetClient.channel("waseet-messages-"+dealId).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"deal_id=eq."+dealId},cb).subscribe(); }
};
</script>