(function(){
  const state={pc:null,callId:null,channel:null,startedAt:null,remote:null,local:null};
  const ICE_FALLBACK=[{urls:['stun:stun.l.google.com:19302']}];

  async function iceServers(){
    try{
      const r=await fetch((window.WASEET_SUPABASE_URL||'https://zwsvlrptnlchajqgqtvm.supabase.co')+'/functions/v1/turn-credentials',{headers:{Authorization:'Bearer '+(await waseetClient.auth.getSession()).data.session?.access_token}});
      if(r.ok){const j=await r.json();if(Array.isArray(j.iceServers)&&j.iceServers.length)return j.iceServers;}
    }catch(e){}
    return ICE_FALLBACK;
  }
  function ui(){
    let d=document.getElementById('waseetVoiceCall');if(d)return d;
    d=document.createElement('div');d.id='waseetVoiceCall';d.style='position:fixed;inset:0;background:rgba(3,18,38,.92);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial';
    d.innerHTML='<div style="width:min(420px,100%);background:#fff;border-radius:22px;padding:24px;text-align:center"><h2 id="vcTitle">اتصال صوتي</h2><p id="vcState">جاري الاتصال...</p><div style="font-size:46px;margin:22px">☎</div><button id="vcAccept" style="display:none;width:100%;padding:14px;border:0;border-radius:12px;background:#075fc9;color:#fff;font-weight:700">قبول المكالمة</button><button id="vcEnd" style="width:100%;padding:14px;border:0;border-radius:12px;background:#b42318;color:#fff;font-weight:700;margin-top:10px">إنهاء</button><audio id="vcRemote" autoplay></audio></div>';
    document.body.appendChild(d);return d;
  }
  async function rpc(name,args){return await waseetClient.rpc(name,args)}
  async function cleanup(status='ended',reason=null){
    if(state.callId)await rpc('update_voice_call',{p_call_id:state.callId,p_status:status,p_ended_reason:reason,p_duration_seconds:state.startedAt?Math.max(0,Math.floor((Date.now()-state.startedAt)/1000)):null}).catch(()=>{});
    if(state.channel){try{await state.channel.unsubscribe()}catch(e){}}
    if(state.pc)state.pc.close();
    if(state.local)state.local.getTracks().forEach(t=>t.stop());
    state.pc=null;state.channel=null;state.local=null;state.callId=null;state.startedAt=null;
    document.getElementById('waseetVoiceCall')?.remove();
  }
  async function start(dealId,calleeId){
    const x=await rpc('start_voice_call',{p_deal_id:dealId,p_callee_id:calleeId});if(x.error)throw x.error;
    state.callId=x.data;state.startedAt=Date.now();
    const d=ui();d.querySelector('#vcState').textContent='جاري الاتصال بالطرف الآخر...';
    state.pc=new RTCPeerConnection({iceServers:await iceServers()});
    state.local=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    state.local.getTracks().forEach(t=>state.pc.addTrack(t,state.local));
    state.pc.ontrack=e=>{d.querySelector('#vcRemote').srcObject=e.streams[0]};
    state.channel=waseetClient.channel('waseet-call-'+state.callId);
    state.pc.onicecandidate=e=>{if(e.candidate)state.channel.send({type:'broadcast',event:'signal',payload:{kind:'ice',candidate:e.candidate}})};
    await state.channel.subscribe();
    state.channel.on('broadcast',{event:'signal'},async({payload})=>{
      if(payload.kind==='answer'&&state.pc.signalingState!=='stable')await state.pc.setRemoteDescription(payload.sdp);
      if(payload.kind==='ice'&&payload.candidate)try{await state.pc.addIceCandidate(payload.candidate)}catch(e){}
    });
    const offer=await state.pc.createOffer();await state.pc.setLocalDescription(offer);
    await state.channel.send({type:'broadcast',event:'signal',payload:{kind:'offer',sdp:offer}});
    d.querySelector('#vcEnd').onclick=()=>cleanup('ended','caller_ended');
    return state.callId;
  }
  async function answer(callId){
    const row=(await waseetClient.from('voice_calls').select('*').eq('id',callId).single()).data;if(!row)throw Error('المكالمة غير موجودة');
    state.callId=callId;state.startedAt=Date.now();const d=ui();d.querySelector('#vcState').textContent='متصل';
    state.pc=new RTCPeerConnection({iceServers:await iceServers()});
    state.local=await navigator.mediaDevices.getUserMedia({audio:true,video:false});state.local.getTracks().forEach(t=>state.pc.addTrack(t,state.local));
    state.pc.ontrack=e=>{d.querySelector('#vcRemote').srcObject=e.streams[0]};
    state.channel=waseetClient.channel('waseet-call-'+callId);
    state.pc.onicecandidate=e=>{if(e.candidate)state.channel.send({type:'broadcast',event:'signal',payload:{kind:'ice',candidate:e.candidate}})};
    await state.channel.subscribe();
    state.channel.on('broadcast',{event:'signal'},async({payload})=>{
      if(payload.kind==='offer'){
        await state.pc.setRemoteDescription(payload.sdp);
        const ans=await state.pc.createAnswer();await state.pc.setLocalDescription(ans);
        await state.channel.send({type:'broadcast',event:'signal',payload:{kind:'answer',sdp:ans}});
        await rpc('update_voice_call',{p_call_id:callId,p_status:'accepted'});
      }
      if(payload.kind==='ice'&&payload.candidate)try{await state.pc.addIceCandidate(payload.candidate)}catch(e){}
    });
    d.querySelector('#vcEnd').onclick=()=>cleanup('ended','callee_ended');
  }
  async function listen(callId){
    const channel=waseetClient.channel('waseet-call-incoming-'+callId);
    await channel.subscribe();
    channel.on('broadcast',{event:'ring'},()=>{});
    return channel;
  }
  window.WaseetVoice={start,answer,end:()=>cleanup(),listen};
})();