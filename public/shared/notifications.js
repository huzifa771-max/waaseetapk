(function(){
 const c=window.waseetClient;
 async function list(){const r=await c.from('notifications').select('*').order('created_at',{ascending:false}).limit(50);return r.data||[]}
 async function unread(){const r=await c.from('notifications').select('id',{count:'exact',head:true}).is('read_at',null);return r.count||0}
 async function read(id){return c.rpc('mark_notification_read',{p_id:id})}
 async function markAll(){const s=await WaseetAuth.session();if(!s)return;return c.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',s.user.id).is('read_at',null)}
 function render(container,items){container.innerHTML=items.map(n=>'<div class="item" data-id="'+n.id+'"><b>'+esc(n.title)+'</b><br><span>'+esc(n.body||'')+'</span><small class="muted">'+new Date(n.created_at).toLocaleString()+'</small></div>').join('')||'<span class="muted">لا توجد إشعارات</span>';container.querySelectorAll('[data-id]').forEach(el=>el.onclick=async()=>{await read(el.dataset.id);el.style.opacity='.55'})}
 const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 window.WaseetNotifications={list,unread,read,markAll,render};
})();