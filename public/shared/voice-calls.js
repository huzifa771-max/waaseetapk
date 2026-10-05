(function(){
  const state={pc:null,callId:null,channel:null,startedAt:null,local:null,role:null};
  const stun=[{urls:['stun:stun.l.google.com:19302']}];

  async function iceServers(){
    try{
      const s=await waseetClient.auth.getSession(), token=s.data.session?.access_token;
      const r=await fetch((window.WASEET_SUPABASE_URL||'https://zwsvlrptnlchajqgqtvm.supabase.co')+'/functions/v1/turn-credentials',{headers:{Authorization:'Bearer '+token}});
      if(r.ok){const j=await r.json();if(Array.isArray(j.iceServers)&&j.iceServers.length)return j.iceServers;}
    }catch(e){}
    return stun;
  }
  function panel(incoming){
    let d=document.getElementById('waseetVoiceCall');if(d)return d;
    d=document.createElement('div');d.id='waseetVoiceCall';
    d.style='position:fixed;inset:0;background:rgba(3,18,38,.94);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial';
    d.innerHTML='<div style="width:min(430px,100%);background:#fff;border-radius:22px;padding:24px;text-align:center;color:#10243e"><h2 id="vcTitle">اتصال صوتي</h2><p id="vcState">'+(incoming?'مكالمة واردة':'جاري الاتصال بالطرف الآخر...')+'</p><div style="font-size:46px;margin:20px">☎</div><button id="vcAccept" style="display:'+(incoming?'block':'none')+';width:100%;padding:14px;border:0;border-radius:12px;background:#075fc9;color:#fff;font-weight:700">قبول المكالمة</button><button id="vcReject" style="display:'+(incoming?'block':'none')+';width:100%;padding:12px;border:0;border-radius:12px;background:#eaf2fb;color:#075fc9;font-weight:700;margin-top:8px">رفض</button><button id="vcEnd" style="display:'+(incoming?'none':'block')+';width:100%;padding:14px;border:0;border-radius:12px;background:#b42318;color:#fff;font-weight:700;margin-top:10px">إنهاء</button><audio id="vcRemote" autoplay></audio></div>';
    document.body.appendChild(d);return d;
  }
  async function rpc(name,args){return waseetClient.rpc(name,args)}
  async function signal(callId,kind,payload){return waseetClient.from('voice_call_signals').insert({call_id:callId,sender_id:(await waseetClient.auth.getUser()).data.user.id,kind,payload})}
  async function finish(status='ended',reason=null){
    if(state.callId){await rpc('update_voice_call',{p_call_id:state.callId,p_status:status,p_ended_reason:reason,p_duration_seconds:state.startedAt?Math.floor((Date.now()-state.startedAt)/1000):null}).catch(()=>{});}
    if(state.channel){try{await state.channel.unsubscribe()}catch(e){}} if(state.answerChannel){try{await state.answerChannel.unsubscribe()}catch(e){}} if(state.iceChannel){try{await state.iceChannel.unsubscribe()}catch(e){}}
    if(state.pc)state.pc.close();
    if(state.local)state.local.getTracks().forEach(t=>t.stop());
    Object.assign(state,{pc:null,callId:null,channel:null,startedAt:null,local:null,role:null});
    document.getElementById('waseetVoiceCall')?.remove();
  }
  async function makePeer(callId){
    const pc=new RTCPeerConnection({iceServers:await iceServers()});
    const d=panel(false);
    state.pc=pc;state.channel=waseetClient.channel('waseet-call-'+callId);
    pc.ontrack=e=>{const a=d.querySelector('#vcRemote');a.srcObject=e.streams[0];a.play?.().catch(()=>{})};
    pc.onconnectionstatechange=()=>{if(['failed','disconnected'].includes(pc.connectionState))finish('network_failed','peer_connection_'+pc.connectionState)};
    state.local=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    state.local.getTracks().forEach(t=>pc.addTrack(t,state.local));
    await state.channel.subscribe();
    state.channel.on('broadcast',{event:'signal'},async({payload})=>{
      if(payload?.callId!==callId)return;
      if(payload.kind==='ice'&&payload.candidate)try{await pc.addIceCandidate(payload.candidate)}catch(e){}
    });
    return pc;
  }
  async function start(dealId,calleeId){
    if(state.pc)await finish();
    const x=await rpc('start_voice_call',{p_deal_id:dealId,p_callee_id:calleeId});if(x.error)throw x.error;
    state.callId=x.data;state.role='caller';state.startedAt=Date.now();
    const d=panel(false),pc=await makePeer(state.callId);
    d.querySelector('#vcEnd').onclick=()=>finish('ended','caller_ended');
    pc.onicecandidate=e=>{if(e.candidate){signal(state.callId,'ice',{candidate:e.candidate}).catch(()=>{});}};
    const offer=await pc.createOffer();await pc.setLocalDescription(offer);
    await signal(state.callId,'offer',{sdp:offer});
    const sub=waseetClient.channel('waseet-call-answer-'+state.callId);
    await sub.subscribe();
    sub.on('postgres_changes',{event:'INSERT',schema:'public',table:'voice_call_signals',filter:'call_id=eq.'+state.callId},async(payload)=>{
      const row=payload.new;if(row.sender_id=== (await waseetClient.auth.getUser()).data.user.id) return;
      if(row.kind==='answer'){await pc.setRemoteDescription(row.payload.sdp);await rpc('update_voice_call',{p_call_id:state.callId,p_status:'ongoing'});d.querySelector('#vcState').textContent='المكالمة متصلة';}
      if(row.kind==='ice'&&row.payload?.candidate)try{await pc.addIceCandidate(row.payload.candidate)}catch(e){}
    });
    state.answerChannel=sub;
    return state.callId;
  }
  async function answer(callId){
    const row=(await waseetClient.from('voice_calls').select('*').eq('id',callId).single()).data;if(!row)throw Error('المكالمة غير موجودة');
    if(state.pc)await finish();
    state.callId=callId;state.role='callee';state.startedAt=Date.now();
    const d=panel(false),pc=await makePeer(callId);d.querySelector('#vcState').textContent='جاري الاتصال...';d.querySelector('#vcEnd').onclick=()=>finish('ended','callee_ended');
    pc.onicecandidate=e=>{if(e.candidate)signal(callId,'ice',{candidate:e.candidate}).catch(()=>{});};
    const sigs=(await waseetClient.from('voice_call_signals').select('*').eq('call_id',callId).order('created_at',{ascending:true})).data||[];
    const offer=sigs.find(x=>x.kind==='offer');
    if(!offer)throw Error('عرض المكالمة غير متاح');
    await pc.setRemoteDescription(offer.payload.sdp);
    const ans=await pc.createAnswer();await pc.setLocalDescription(ans);
    await signal(callId,'answer',{sdp:ans});
    await rpc('update_voice_call',{p_call_id:callId,p_status:'accepted'});
    for(const x of sigs.filter(x=>x.kind==='ice'&&x.sender_id!==(await waseetClient.auth.getUser()).data.user.id)){try{await pc.addIceCandidate(x.payload.candidate)}catch(e){}}
    const iceSub=waseetClient.channel('waseet-call-ice-'+callId);await iceSub.subscribe();iceSub.on('postgres_changes',{event:'INSERT',schema:'public',table:'voice_call_signals',filter:'call_id=eq.'+callId},async p=>{if(p.new.kind==='ice'&&p.new.sender_id!==(await waseetClient.auth.getUser()).data.user.id)try{await pc.addIceCandidate(p.new.payload.candidate)}catch(e){}});state.iceChannel=iceSub;
  }
  async function reject(callId){await rpc('update_voice_call',{p_call_id:callId,p_status:'rejected',p_ended_reason:'callee_rejected'});document.getElementById('waseetVoiceCall')?.remove()}
  async function enableIncoming(){
    const s=await WaseetAuth.session();if(!s)return;
    const uid=s.user.id;
    const ch=waseetClient.channel('waseet-incoming-calls-'+uid);
    await ch.subscribe();
    ch.on('postgres_changes',{event:'INSERT',schema:'public',table:'voice_calls',filter:'callee_id=eq.'+uid},async(payload)=>{
      const row=payload.new;if(row.status!=='ringing'||state.pc)return;
      const d=panel(true);
      d.querySelector('#vcAccept').onclick=async()=>{d.remove();try{await answer(row.id)}catch(e){await reject(row.id)}};
      d.querySelector('#vcReject').onclick=()=>reject(row.id);
    });
    window.WaseetVoiceIncoming=ch;
  }
  window.WaseetVoice={start,answer,finish,reject,enableIncoming};
})();