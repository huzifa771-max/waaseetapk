(function(){
 const KEY='waseet-quick-auth-v1';
 function plugin(){return window.Capacitor?.Plugins?.NativeBiometric||null}
 async function available(){try{const p=plugin();return !!p&&(await p.isAvailable()).isAvailable}catch(e){return false}}
 async function db(){const s=await WaseetAuth.session();if(!s)return null;return (await waseetClient.from('account_quick_auth').select('*').eq('user_id',s.user.id).maybeSingle()).data}
 async function rpc(name,args){return await waseetClient.rpc(name,args)}
 async function biometric(){const p=plugin();if(!p)throw Error('البصمة غير متاحة في المتصفح');await p.verifyIdentity({reason:'تأكيد هويتك للدخول السريع إلى وسيط',title:'تسجيل الدخول إلى وسيط',subtitle:'استخدم بصمة أو Face ID',description:'لن يتم تخزين بيانات البصمة داخل وسيط'});return true}
 function overlay(setup){
  let old=document.getElementById('waseetQuickLock');if(old)old.remove();
  const d=document.createElement('div');d.id='waseetQuickLock';d.style='position:fixed;inset:0;background:rgba(3,18,38,.96);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial';
  d.innerHTML='<div style="width:min(430px,100%);background:#fff;border-radius:20px;padding:24px;text-align:center;color:#10243e"><h2>'+ (setup?'تفعيل الدخول السريع':'دخول سريع إلى وسيط') +'</h2><p id="qalMsg" style="color:#64748b">'+(setup?'اختر رمز PIN من 6 أرقام، ويمكنك تفعيل البصمة.':'استخدم البصمة أو رمز PIN من 6 أرقام.')+'</p><input id="qaPin" inputmode="numeric" maxlength="6" type="password" placeholder="••••••" style="font-size:24px;text-align:center;letter-spacing:8px;width:100%;padding:14px;border:1px solid #d5e0ed;border-radius:12px"><input id="qaPin2" inputmode="numeric" maxlength="6" type="password" placeholder="تأكيد الرمز" style="display:'+(setup?'block':'none')+';font-size:24px;text-align:center;letter-spacing:8px;width:100%;padding:14px;border:1px solid #d5e0ed;border-radius:12px;margin-top:10px"><div id="qaBioWrap"></div><button id="qaAction" style="margin-top:14px;width:100%;padding:13px;background:#075fc9;color:#fff;border:0;border-radius:12px;font-weight:700">'+(setup?'حفظ PIN':'دخول بالـ PIN')+'</button><button id="qaLogout" style="margin-top:8px;width:100%;padding:11px;background:#eaf2fb;color:#075fc9;border:0;border-radius:12px">تسجيل الخروج</button></div>';
  document.body.appendChild(d);return d
 }
 async function run(){
  const s=await WaseetAuth.session();if(!s)return;
  const row=await db();const native=await available();
  if(!row||!row.pin_hash){
   const d=overlay(true);if(native)d.querySelector('#qaBioWrap').innerHTML='<label style="display:block;margin-top:12px"><input id="qaBio" type="checkbox" checked> تفعيل البصمة/Face ID على هذا الجهاز</label>';
   d.querySelector('#qaAction').onclick=async()=>{const a=d.querySelector('#qaPin').value,b=d.querySelector('#qaPin2').value;if(!/^\d{6}$/.test(a)||a!==b){d.querySelector('#qalMsg').textContent='يجب أن يكون الرمز 6 أرقام ومتطابقاً.';return}const x=await rpc('set_quick_pin',{p_pin:a});if(x.error){d.querySelector('#qalMsg').textContent=x.error.message;return}if(native&&d.querySelector('#qaBio')?.checked)await rpc('set_biometric_preference',{p_enabled:true});d.remove();};
   d.querySelector('#qaLogout').onclick=()=>WaseetAuth.signOut().then(()=>location.reload());return;
  }
  const d=overlay(false);if(row.biometric_enabled&&native){const b=document.createElement('button');b.textContent='استخدام البصمة / Face ID';b.style='margin-top:12px;width:100%;padding:13px;background:#0b7a4b;color:#fff;border:0;border-radius:12px;font-weight:700';d.querySelector('#qaBioWrap').appendChild(b);b.onclick=async()=>{try{await biometric();d.remove()}catch(e){d.querySelector('#qalMsg').textContent='تعذر التحقق بالبصمة؛ استخدم PIN.'}}}
  d.querySelector('#qaAction').onclick=async()=>{const p=d.querySelector('#qaPin').value;if(!/^\d{6}$/.test(p)){d.querySelector('#qalMsg').textContent='أدخل 6 أرقام.';return}const x=await rpc('verify_quick_pin',{p_pin:p});if(x.error||x.data!==true)d.querySelector('#qalMsg').textContent=x.error?.message||'الرمز غير صحيح أو تم قفل المحاولة مؤقتاً.';else d.remove()};
  d.querySelector('#qaLogout').onclick=()=>WaseetAuth.signOut().then(()=>location.reload());
 }
 window.WaseetQuickAuth={run};
 new MutationObserver(()=>{const app=document.getElementById('app');if(app&&!app.classList.contains('hide')&&!document.getElementById('waseetQuickLock')&&!sessionStorage.getItem(KEY)){sessionStorage.setItem(KEY,'1');run()}}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
})();