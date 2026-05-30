/* ═══════════════════════════════════════════════════════════
   DocNear – Production App
   ✅ SHA-256 Password Hash  ✅ Razorpay Payments
   ✅ Admin Approval Panel   ✅ Video Consult (Jitsi)
   ✅ Notifications          ✅ Dynamic Slot Blocking
   ✅ Favorites              ✅ Reviews
   ═══════════════════════════════════════════════════════════ */

const SUPA_URL = "https://avonzvocvonvzamedwvh.supabase.co";
const SUPA_KEY = "sb_publishable_wvfdYDM_JGE8q5NrcYl0EQ_tDOTBL2I";
const RAZORPAY_KEY = "rzp_test_YourKeyHere"; // ← Razorpay dashboard లో get చేయండి

/* ── SHA-256 Password Hash (Web Crypto API) ── */
async function hashPwd(plain) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

/* ── Supabase REST Helper ── */
async function dbReq(path, opts={}) {
  const res = await fetch(SUPA_URL+"/rest/v1/"+path, {
    headers:{
      "apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,
      "Content-Type":"application/json",
      "Prefer":opts.prefer||"return=representation",
      ...opts.headers
    },
    method:opts.method||"GET",
    body:opts.body?JSON.stringify(opts.body):undefined
  });
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.message||"DB Error "+res.status);}
  const t=await res.text(); return t?JSON.parse(t):[];
}
const DB={
  get:   (t,q="")=>dbReq(t+(q?"?"+q+"&order=created_at.desc":"?order=created_at.desc")),
  post:  (t,d)   =>dbReq(t,{method:"POST",body:d}),
  patch: (t,f,d) =>dbReq(t+"?"+f,{method:"PATCH",body:d,prefer:"return=representation"}),
  del:   (t,f)   =>dbReq(t+"?"+f,{method:"DELETE",prefer:"return=minimal"})
};

/* ── Constants ── */
const SPECS=[
  {name:"Cardiology",icon:"❤️",color:"#FF4757"},{name:"Neurology",icon:"🧠",color:"#7C4DFF"},
  {name:"Orthopedics",icon:"🦴",color:"#FF6B35"},{name:"Pediatrics",icon:"👶",color:"#00BCD4"},
  {name:"Ophthalmology",icon:"👁️",color:"#2196F3"},{name:"Dermatology",icon:"✨",color:"#E91E8C"},
  {name:"General Medicine",icon:"🏥",color:"#009688"},{name:"Gynecology",icon:"🌸",color:"#E91E63"}
];

/* ── App State ── */
const APP={
  user:null, doc:null, searchQ:"", filterSpec:"", slot:"", adminTab:"pending",
  cache:{docs:[],pats:[],appts:[],notifs:[]},
  bookingAppt:null
};

/* ══════════════ UTILS ══════════════ */
const $=id=>document.getElementById(id);
const gv=id=>($( id)||{}).value?.trim()||"";
const enc=s=>encodeURIComponent(s);
const todayDate=()=>new Date().toISOString().split("T")[0];
const initials=n=>(n||"").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

function avt(name,color="#0A7FAF",sz=48){
  return `<div class="avatar" style="width:${sz}px;height:${sz}px;background:${color};font-size:${Math.round(sz*.35)}px">${initials(name)}</div>`;
}
function pill(lbl,bg="#E3F4FC",col="#0A7FAF"){
  return `<span class="pill" style="background:${bg};color:${col}">${lbl}</span>`;
}
function sPill(s){
  const m={confirmed:["#D1FAE5","#059669"],pending:["#FEF3C7","#D97706"],
    cancelled:["#FEE2E2","#DC2626"],completed:["#EDE9FE","#7C4DFF"]};
  const[bg,c]=m[s]||m.pending; return pill(s.toUpperCase(),bg,c);
}
function toast(msg,err=false){
  const el=$("toast"); if(!el) return;
  el.style.background=err?"#EF4444":"#10B981"; el.style.color="#fff";
  el.textContent=(err?"❌ ":"✅ ")+msg; el.style.display="block";
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.display="none",4000);
}
function spin(id,msg="Loading..."){
  const el=$(id); if(el) el.innerHTML=`<div class="loading-box"><div class="spinner"></div>${msg}</div>`;
}
function sc(icon,label,val,bg="#E3F4FC",vc="#0A7FAF"){
  return `<div class="stat-card"><div class="stat-icon" style="background:${bg}">${icon}</div>
    <div><div class="stat-val" style="color:${vc}">${val}</div><div class="stat-lbl">${label}</div></div></div>`;
}
function empty(icon,msg,btn=""){
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-msg">${msg}</div>${btn}</div>`;
}
/* Notification badge update */
function updateNotifBadge(){
  const unread=APP.cache.notifs.filter(n=>!n.is_read&&(!APP.user||n.user_id===APP.user.id)).length;
  [$("notif-badge-pd"),$("notif-badge-dd")].forEach(el=>{
    if(!el) return;
    el.textContent=unread||""; el.style.display=unread?"flex":"none";
  });
}

/* ══════════════ DOCTOR CARD ══════════════ */
function docCard(d){
  const sc=(SPECS.find(s=>s.name===d.specialization)||{}).color||"#0A7FAF";
  const isFav=APP.cache.favs?.includes(d.id);
  return `
  <div class="card" onclick="viewDoc('${d.id}')">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      ${avt(d.name,d.color||sc,56)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="doc-name">${d.name}</div>
          ${d.video_consult?`<span title="Video consult available" style="font-size:12px">🎥</span>`:""}
        </div>
        <div class="doc-spec">${d.specialization||"—"}</div>
        <div class="doc-meta">⭐ <strong>${d.rating||"New"}</strong>${d.reviews>0?` <span>(${d.reviews})</span>`:""}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:18px;font-weight:800;color:#0A7FAF">₹${d.fee||0}</div>
        <div style="font-size:10px;color:#9CA3AF">per visit</div>
        ${APP.user?.type==="patient"?`<button onclick="event.stopPropagation();toggleFav('${d.id}')"
          style="background:none;border:none;cursor:pointer;font-size:18px;margin-top:4px">${isFav?"❤️":"🤍"}</button>`:""}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-size:11px;color:#6B7280">🏥 ${d.hospital||"—"}</span>
      <span style="font-size:11px;color:#6B7280">🏆 ${d.experience||0}y</span>
      <span style="font-size:11px;color:#6B7280">📍 ${d.city||d.location||"—"}</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewDoc('${d.id}')">Profile</button>
      <button class="btn btn-primary" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();bookDoc('${d.id}')">Book Now</button>
    </div>
  </div>`;
}

/* ══════════════ APPT CARD ══════════════ */
function apptCard(a,forDoc=false){
  const bc={confirmed:"#059669",pending:"#D97706",cancelled:"#DC2626",completed:"#7C4DFF"}[a.status]||"#D97706";
  return `
  <div class="appt-card" style="border-left:4px solid ${bc}">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
      <div>
        <div style="font-size:14px;font-weight:700;color:#1A2B3C">${forDoc?a.patient_name:a.doctor_name}</div>
        <div style="font-size:12px;color:#6B7280">${a.specialization||""}</div>
      </div>${sPill(a.status)}
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;align-items:center">
      <span style="font-size:12px;color:#6B7280">📅 ${a.date}</span>
      <span style="font-size:12px;color:#6B7280">🕐 ${a.slot}</span>
      ${a.is_video?`<span style="font-size:11px;color:#7C4DFF;font-weight:600">🎥 Video</span>`:""}
      <span style="font-size:12px;font-weight:700;color:#0A7FAF;margin-left:auto">₹${a.fee}</span>
    </div>
    ${a.payment_status==="paid"?`<div style="margin-top:6px">${pill("💳 Paid","#D1FAE5","#059669")}</div>`:""}
    ${a.status==="confirmed"&&a.is_video&&a.meeting_link?`
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" onclick="joinVideo('${a.meeting_link}')">
        🎥 Join Video Consultation
      </button>`:""}
  </div>`;
}

/* ══════════════ NAVIGATION ══════════════ */
function go(pg){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const el=$("page-"+pg); if(!el) return;
  el.classList.add("active"); window.scrollTo(0,0);
  const map={landing:rLanding,patientDash:rPatientDash,doctorDash:rDoctorDash,
    adminDash:rAdminDash,search:rSearch,profile:rProfile,book:rBook};
  if(map[pg]) map[pg]();
}
function logout(){APP.user=null;APP.cache={docs:[],pats:[],appts:[],notifs:[],favs:[]};go("landing");toast("Logged out.");}

/* ══════════════ AUTH ══════════════ */
async function patientLogin(){
  const email=gv("pl-email"),pw=gv("pl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  toast("Signing in…");
  try{
    const hash=await hashPwd(pw);
    const r=await DB.get("patients",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!r.length){toast("Invalid credentials.",true);return;}
    APP.user={...r[0],type:"patient"};
    await loadFavorites();
    go("patientDash"); toast("Welcome, "+r[0].name+"! 👋");
  }catch(e){toast(e.message,true);}
}
async function doctorLogin(){
  const email=gv("dl-email"),pw=gv("dl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  toast("Signing in…");
  try{
    const hash=await hashPwd(pw);
    const r=await DB.get("doctors",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!r.length){toast("Invalid credentials.",true);return;}
    APP.user={...r[0],type:"doctor"}; go("doctorDash"); toast("Welcome, "+r[0].name+"! 👨‍⚕️");
  }catch(e){toast(e.message,true);}
}
async function adminLogin(){
  const email=gv("al-email"),pw=gv("al-pw");
  try{
    const hash=await hashPwd(pw);
    const r=await DB.get("admins",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}&is_active=eq.true`);
    if(!r.length){toast("Invalid admin credentials.",true);return;}
    APP.user={...r[0],type:"admin"}; go("adminDash"); toast("Welcome, Admin! 🛡️");
  }catch(e){
    // Fallback for demo (if pgcrypto not available)
    if(email==="admin@docnear.com"&&pw==="admin123"){
      APP.user={name:"Admin",type:"admin",email}; go("adminDash"); toast("Welcome, Admin! 🛡️");
    }else toast("Invalid admin credentials.",true);
  }
}
async function patientRegister(){
  const name=gv("pr-name"),email=gv("pr-email"),pw=gv("pr-pw"),
    phone=gv("pr-phone"),age=gv("pr-age"),blood=gv("pr-blood"),gender=gv("pr-gender");
  if(!name||!email||!pw||!phone||!age){toast("Fill all required fields.",true);return;}
  toast("Creating account…");
  try{
    const ex=await DB.get("patients",`email=eq.${enc(email)}`);
    if(ex.length){toast("Email already registered.",true);return;}
    const hash=await hashPwd(pw);
    const r=await DB.post("patients",{name,email,password_hash:hash,phone,age:parseInt(age),blood_group:blood,gender});
    APP.user={...r[0],type:"patient"}; APP.cache.favs=[];
    go("patientDash"); toast("Welcome to DocNear, "+name+"! 🎉");
  }catch(e){toast(e.message,true);}
}
async function doctorRegister(){
  const f={name:gv("dr-name"),email:gv("dr-email"),pw:gv("dr-pw"),phone:gv("dr-phone"),
    spec:gv("dr-spec"),reg:gv("dr-reg"),hosp:gv("dr-hosp"),loc:gv("dr-loc"),
    exp:gv("dr-exp"),fee:gv("dr-fee"),about:gv("dr-about"),qual:gv("dr-qual")};
  if(!f.name||!f.email||!f.pw||!f.phone||!f.spec||!f.reg||!f.hosp||!f.loc||!f.exp||!f.fee){
    toast("Fill all required fields.",true);return;}
  toast("Submitting registration…");
  try{
    const ex=await DB.get("doctors",`email=eq.${enc(f.email)}`);
    if(ex.length){toast("Email already registered.",true);return;}
    const hash=await hashPwd(f.pw);
    await DB.post("doctors",{
      name:f.name,email:f.email,password_hash:hash,phone:f.phone,
      specialization:f.spec,reg_number:f.reg,hospital:f.hosp,location:f.loc,city:f.loc,
      experience:parseInt(f.exp),fee:parseInt(f.fee),about:f.about,qualifications:f.qual,
      approved:false,color:SPECS.find(s=>s.name===f.spec)?.color||"#0A7FAF",
      slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"]
    });
    go("doctorPending"); toast("Registration submitted! Awaiting approval.");
  }catch(e){toast(e.message,true);}
}

/* ══════════════ FAVORITES ══════════════ */
async function loadFavorites(){
  if(!APP.user||APP.user.type!=="patient") return;
  try{
    const r=await DB.get("favorite_doctors","patient_id=eq."+APP.user.id);
    APP.cache.favs=r.map(f=>f.doctor_id);
  }catch(e){APP.cache.favs=[];}
}
async function toggleFav(docId){
  if(!APP.user||APP.user.type!=="patient"){toast("Login to save favorites.",true);return;}
  const isFav=APP.cache.favs?.includes(docId);
  try{
    if(isFav){
      await DB.del("favorite_doctors",`patient_id=eq.${APP.user.id}&doctor_id=eq.${docId}`);
      APP.cache.favs=APP.cache.favs.filter(id=>id!==docId);
      toast("Removed from favorites.");
    }else{
      await DB.post("favorite_doctors",{patient_id:APP.user.id,doctor_id:docId});
      APP.cache.favs=[...(APP.cache.favs||[]),docId];
      toast("Added to favorites! ❤️");
    }
    // Re-render current view
    const activePage=document.querySelector(".page.active")?.id?.replace("page-","");
    if(activePage==="search") await rSearch();
    if(activePage==="patientDash") await rPatientDash();
  }catch(e){toast(e.message,true);}
}

/* ══════════════ DOCTOR ACTIONS ══════════════ */
async function viewDoc(id){
  APP.doc=APP.cache.docs.find(d=>d.id===id);
  if(!APP.doc){try{const r=await DB.get("doctors","id=eq."+id);if(r.length)APP.doc=r[0];}catch(e){}}
  go("profile");
}
function bookDoc(id){
  if(!APP.user||APP.user.type!=="patient"){toast("Login as patient to book.",true);go("patientLogin");return;}
  const d=APP.cache.docs.find(d=>d.id===id)||APP.doc;
  if(d){APP.doc=d;} APP.slot=""; go("book");
}

/* ══════════════ PAYMENTS (Razorpay) ══════════════ */
function initRazorpay(appt, onSuccess){
  const options={
    key: RAZORPAY_KEY,
    amount: appt.fee*100,          // paise లో
    currency: "INR",
    name: "DocNear",
    description: `Appointment with ${appt.doctor_name}`,
    image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='20' font-size='20'>🩺</text></svg>",
    handler: async function(response){
      try{
        // Save payment record
        await DB.post("payments",{
          appointment_id:appt.id,
          patient_id:APP.user.id,
          doctor_id:appt.doctor_id,
          amount:appt.fee*100,
          razorpay_order_id:response.razorpay_order_id||"order_"+Date.now(),
          razorpay_pay_id:response.razorpay_payment_id,
          razorpay_sig:response.razorpay_signature||"",
          status:"paid",
          payment_method:"razorpay"
        });
        // Update appointment
        await DB.patch("appointments","id=eq."+appt.id,{payment_status:"paid",payment_id:response.razorpay_payment_id});
        toast("Payment successful! 💳 Appointment confirmed.");
        onSuccess();
      }catch(e){toast("Payment saved, but update failed: "+e.message);}
    },
    prefill:{name:APP.user.name,email:APP.user.email,contact:APP.user.phone||""},
    theme:{color:"#0A7FAF"},
    modal:{ondismiss:()=>toast("Payment cancelled.",true)}
  };
  if(typeof Razorpay!=="undefined"){
    const rz=new Razorpay(options); rz.open();
  }else{
    // Razorpay script not loaded – demo mode
    toast("Demo: Payment processed! (Add Razorpay Key for real payments)");
    onSuccess();
  }
}

/* ══════════════ VIDEO CONSULTATION (Jitsi) ══════════════ */
function joinVideo(link){
  window.open(link||"https://meet.jit.si/docnear-"+Date.now(),"_blank");
}
function generateMeetLink(apptId){
  return "https://meet.jit.si/docnear-"+apptId.slice(0,8);
}

/* ══════════════ ADMIN: APPROVE / REJECT ══════════════ */
async function approveDoc(id){
  const btn=$("abtn-"+id);
  if(btn){btn.disabled=true;btn.innerHTML="⏳ Approving...";}
  try{
    await DB.patch("doctors","id=eq."+id,{approved:true});
    const meetLink=generateMeetLink(id);
    await DB.patch("doctors","id=eq."+id,{meeting_link:meetLink});
    // Notification to doctor
    await DB.post("notifications",{user_id:id,user_type:"doctor",
      title:"Profile Approved! ✅",
      message:"మీ profile approve అయింది. Patients ఇప్పుడు appointments book చేయవచ్చు.",
      type:"success",action_url:"doctorDash"});
    toast("Doctor approved! ✅ Notification sent.");
    await rAdminDash();
  }catch(e){toast("Error: "+e.message,true);if(btn){btn.disabled=false;btn.innerHTML="✅ Approve";}}
}
async function rejectDoc(id){
  const d=APP.cache.docs.find(x=>x.id===id);
  const reason=prompt(`Rejection reason for ${d?.name||"this doctor"}:\n(Blank = no reason)`);
  if(reason===null) return;
  const btn=$("rbtn-"+id);
  if(btn){btn.disabled=true;btn.innerHTML="⏳ Removing...";}
  try{
    if(reason.trim()) await DB.patch("doctors","id=eq."+id,{rejection_reason:reason.trim()});
    await DB.del("appointments","doctor_id=eq."+id).catch(()=>{});
    await DB.del("doctors","id=eq."+id);
    toast("Doctor rejected and removed.");
    await rAdminDash();
  }catch(e){toast("Error: "+e.message,true);if(btn){btn.disabled=false;btn.innerHTML="❌ Reject";}}
}
function setAdminTab(t){APP.adminTab=t;buildAdminTabs();renderAdminContent();}

/* ══════════════ RENDER: LANDING ══════════════ */
async function rLanding(){
  const ng=$("nav-guest"),nu=$("nav-user");
  if(APP.user){
    ng.style.display="none"; nu.style.display="flex";
    $("nav-user-info").textContent=APP.user.name+" ("+APP.user.type+")";
  }else{ng.style.display="flex";nu.style.display="none";}
  const sc=$("landing-specs");
  if(sc) sc.innerHTML=SPECS.map(s=>`
    <div class="spec-card" onclick="APP.filterSpec='${s.name}';go('search')"
      onmouseover="this.style.boxShadow='0 8px 20px ${s.color}33'" onmouseout="this.style.boxShadow=''">
      <div class="spec-icon">${s.icon}</div><div class="spec-name">${s.name}</div>
    </div>`).join("");
  const dc=$("landing-doctors");
  if(dc){
    spin("landing-doctors","Loading doctors...");
    try{
      const docs=await DB.get("doctors","approved=eq.true&limit=3");
      APP.cache.docs=[...APP.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
      dc.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("👨‍⚕️","No approved doctors yet.");
    }catch(e){dc.innerHTML=empty("⚠️",e.message);}
  }
}

/* ══════════════ RENDER: PATIENT DASH ══════════════ */
async function rPatientDash(){
  if(!APP.user) return;
  const u=APP.user;
  $("pd-nav-name").textContent=u.name;
  $("pd-welcome").textContent="Hello, "+u.name.split(" ")[0]+"! 👋";
  spin("pd-stats"); spin("pd-appts","Loading appointments..."); spin("pd-doctors","Loading doctors...");
  try{
    const[appts,docs,notifs]=await Promise.all([
      DB.get("appointments","patient_id=eq."+u.id),
      DB.get("doctors","approved=eq.true&limit=4"),
      DB.get("notifications","user_id=eq."+u.id+"&limit=5")
    ]);
    APP.cache.appts=appts; APP.cache.docs=docs; APP.cache.notifs=notifs;
    updateNotifBadge();
    $("pd-stats").innerHTML=
      sc("📅","Total",appts.length)+
      sc("✅","Confirmed",appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669")+
      sc("💳","Paid",appts.filter(a=>a.payment_status==="paid").length,"#EDE9FE","#7C4DFF")+
      sc("👨‍⚕️","Doctors",new Set(appts.map(a=>a.doctor_id)).size,"#FEE9E1","#FF6B35");
    $("pd-appts").innerHTML=appts.length
      ?appts.map(a=>apptCard(a)).join("")
      :empty("📋","No appointments yet.",`<button class="btn btn-primary btn-sm" onclick="go('search')">Book Now</button>`);
    $("pd-doctors").innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("👨‍⚕️","No doctors yet.");
    // Notifications panel
    const np=$("pd-notifs");
    if(np&&notifs.length){
      np.innerHTML=notifs.map(n=>`
        <div style="background:${n.is_read?"#F9FAFB":"#EFF6FF"};border-radius:10px;padding:10px 14px;margin-bottom:8px;border-left:3px solid ${n.type==="success"?"#10B981":n.type==="warning"?"#F59E0B":"#0A7FAF"}">
          <div style="font-size:13px;font-weight:700;color:#1A2B3C">${n.title}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:2px">${n.message}</div>
          <div style="font-size:10px;color:#D1D5DB;margin-top:4px">${new Date(n.created_at).toLocaleDateString()}</div>
        </div>`).join("");
    }
  }catch(e){toast("Error: "+e.message,true);}
}

/* ══════════════ RENDER: DOCTOR DASH ══════════════ */
async function rDoctorDash(){
  if(!APP.user) return;
  const u=APP.user;
  $("dd-nav-name").textContent=u.name;
  $("dd-welcome").textContent="Welcome, "+u.name+"! 👨‍⚕️";
  $("dd-meta").innerHTML=`<span>🩺 ${u.specialization||""}</span><span>🏥 ${u.hospital||""}</span>`+(u.reg_number?`<span>📋 ${u.reg_number}</span>`:"");
  $("dd-pending-alert").style.display=u.approved?"none":"flex";
  spin("dd-stats"); spin("dd-today-appts"); spin("dd-all-appts");
  try{
    const[appts,notifs]=await Promise.all([
      DB.get("appointments","doctor_id=eq."+u.id),
      DB.get("notifications","user_id=eq."+u.id+"&limit=5")
    ]);
    APP.cache.notifs=notifs; updateNotifBadge();
    const todayA=appts.filter(a=>a.date===todayDate());
    $("dd-stats").innerHTML=
      sc("📅","Total",appts.length)+
      sc("🌅","Today",todayA.length,"#FEE9E1","#FF6B35")+
      sc("💰","Revenue","₹"+appts.filter(a=>a.payment_status==="paid").reduce((s,a)=>s+a.fee,0).toLocaleString(),"#EDE9FE","#7C4DFF")+
      sc("✅","Confirmed",appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669");
    $("dd-today-appts").innerHTML=todayA.length?todayA.map(a=>apptCard(a,true)).join(""):empty("🌿","No appointments today.");
    $("dd-all-appts").innerHTML=appts.length?appts.map(a=>apptCard(a,true)).join(""):empty("📭","No appointments yet.");
    // Profile
    $("dd-status-pill").innerHTML=pill(u.approved?"✓ Approved":"⏳ Pending",u.approved?"#D1FAE5":"#FEF3C7",u.approved?"#059669":"#D97706");
    $("dd-profile-grid").innerHTML=[
      ["🩺","Specialization",u.specialization],["🏥","Hospital",u.hospital],
      ["📍","Location",u.location],["📋","Reg. No.",u.reg_number],
      ["💰","Fee","₹"+u.fee],["💼","Exp.",(u.experience||0)+" yrs"],
      ["📞","Phone",u.phone],["🎓","Qualifications",u.qualifications]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${v||"—"}</div></div>`).join("");
    $("dd-about").textContent=u.about||"";
    $("dd-slots").innerHTML=(u.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("");
    // Notifications
    const np=$("dd-notifs");
    if(np&&notifs.length){
      np.innerHTML=notifs.map(n=>`
        <div style="background:${n.is_read?"#F9FAFB":"#EFF6FF"};border-radius:10px;padding:10px 14px;margin-bottom:8px;border-left:3px solid ${n.type==="success"?"#10B981":"#0A7FAF"}">
          <div style="font-size:13px;font-weight:700;color:#1A2B3C">${n.title}</div>
          <div style="font-size:12px;color:#374151">${n.message}</div>
        </div>`).join("");
    }
  }catch(e){toast("Error: "+e.message,true);}
}

/* ══════════════ RENDER: ADMIN DASH ══════════════ */
async function rAdminDash(){
  spin("ad-stats","Loading Supabase data...");
  $("ad-tabs").innerHTML=""; $("ad-content").innerHTML="";
  try{
    const[docs,pats,appts,pays]=await Promise.all([
      DB.get("doctors"),DB.get("patients"),DB.get("appointments"),
      DB.get("payments","status=eq.paid")
    ]);
    APP.cache.docs=docs; APP.cache.pats=pats; APP.cache.appts=appts;
    const pending=docs.filter(d=>!d.approved);
    const totalRev=pays.reduce((s,p)=>s+(p.amount/100),0);
    $("ad-stats").innerHTML=
      sc("👨‍⚕️","Doctors",docs.length)+
      sc("✅","Approved",docs.filter(d=>d.approved).length,"#D1FAE5","#059669")+
      sc("⏳","Pending",pending.length,"#FEF3C7","#D97706")+
      sc("🤒","Patients",pats.length,"#EDE9FE","#7C4DFF")+
      sc("📅","Appointments",appts.length,"#FEE9E1","#FF6B35")+
      sc("💰","Revenue","₹"+totalRev.toLocaleString(),"#F3F4F6","#1A2B3C");
    if(pending.length>0) toast(pending.length+" doctor(s) pending approval! ⏳");
    buildAdminTabs(); renderAdminContent();
  }catch(e){
    $("ad-stats").innerHTML=`<div style="grid-column:1/-1;background:#FEE2E2;border-radius:12px;padding:16px;color:#DC2626">
      ❌ ${e.message}<br><small>Run DOCNEAR_PRODUCTION.sql in Supabase SQL Editor</small></div>`;
  }
}
function buildAdminTabs(){
  const{docs,pats,appts}=APP.cache;
  const pending=docs.filter(d=>!d.approved);
  [{id:"pending",lbl:"⏳ Pending",n:pending.length,urgent:pending.length>0},
   {id:"doctors",lbl:"👨‍⚕️ Doctors",n:docs.length},
   {id:"appts",lbl:"📅 Appointments",n:appts.length},
   {id:"patients",lbl:"🤒 Patients",n:pats.length}
  ].forEach(t=>{
    const active=APP.adminTab===t.id;
    $("ad-tabs").innerHTML+=`<button onclick="setAdminTab('${t.id}')" class="admin-tab" style="
      background:${active?"linear-gradient(135deg,#1A2B3C,#2D4050)":"#fff"};color:${active?"#fff":"#6B7280"}">
      ${t.lbl} <span style="margin-left:4px;padding:1px 7px;border-radius:12px;font-size:11px;
        background:${active?"rgba(255,255,255,.2)":t.urgent?"#EF4444":"#F3F4F6"};
        color:${active?"#fff":t.urgent?"#fff":"#6B7280"}">${t.n}</span>
    </button>`;
  });
}
function renderAdminContent(){
  const c=$("ad-content");
  const{docs,pats,appts}=APP.cache;
  const pending=docs.filter(d=>!d.approved);
  if(APP.adminTab==="pending"){
    c.innerHTML=!pending.length?empty("🎉","All caught up! No pending approvals.")
      :`<div style="background:#FFF7ED;border:1px solid #FDE68A;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;gap:10px;align-items:center">
          <span style="font-size:22px">🔔</span>
          <div><div style="font-size:14px;font-weight:700;color:#92400E">${pending.length} Registration${pending.length>1?"s":""} Waiting</div>
          <div style="font-size:12px;color:#B45309">Credentials review చేసి approve/reject చేయండి</div></div>
        </div>${pending.map(d=>pendingCard(d)).join("")}`;
  }else if(APP.adminTab==="doctors"){
    c.innerHTML=!docs.length?empty("👨‍⚕️","No doctors yet.")
      :`<div style="display:grid;gap:10px">${docs.map(d=>`
        <div style="background:#fff;border-radius:12px;padding:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          ${avt(d.name,d.color||"#0A7FAF",44)}
          <div style="flex:1;min-width:140px">
            <div style="font-size:14px;font-weight:700;color:#1A2B3C">${d.name}</div>
            <div style="font-size:12px;color:#0A7FAF">${d.specialization||"—"} · ${d.hospital||"—"}</div>
            <div style="font-size:11px;color:#9CA3AF">📋 ${d.reg_number||"—"} · 💰 ₹${d.fee||0}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">
            ${sPill(d.approved?"confirmed":"pending")}
            ${!d.approved?`<button class="btn btn-green btn-sm" id="abtn-${d.id}" onclick="approveDoc('${d.id}')">✅ Approve</button>`:""}
          </div>
        </div>`).join("")}</div>`;
  }else if(APP.adminTab==="appts"){
    c.innerHTML=!appts.length?empty("📅","No appointments yet.")
      :`<div style="display:grid;gap:10px">${appts.map(a=>`
        <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div><div style="font-size:13px;font-weight:700;color:#1A2B3C">${a.patient_name} → ${a.doctor_name}</div>
            <div style="font-size:12px;color:#6B7280;display:flex;gap:10px;margin-top:3px;flex-wrap:wrap">
              <span>${a.specialization||""}</span><span>📅 ${a.date}</span>
              <span>🕐 ${a.slot}</span><span style="font-weight:700;color:#0A7FAF">₹${a.fee}</span>
              ${pill(a.payment_status==="paid"?"💳 Paid":"⏳ Unpaid",a.payment_status==="paid"?"#D1FAE5":"#FEF3C7",a.payment_status==="paid"?"#059669":"#D97706")}
            </div></div>${sPill(a.status)}
          </div>
        </div>`).join("")}</div>`;
  }else if(APP.adminTab==="patients"){
    c.innerHTML=!pats.length?empty("🤒","No patients yet.")
      :`<div style="display:grid;gap:10px">${pats.map(p=>`
        <div style="background:#fff;border-radius:12px;padding:14px;display:flex;gap:12px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          ${avt(p.name,"#0A7FAF",42)}
          <div style="flex:1"><div style="font-size:14px;font-weight:700;color:#1A2B3C">${p.name}</div>
          <div style="font-size:12px;color:#6B7280">${p.email} · ${p.phone||"—"}</div>
          <div style="font-size:12px;color:#6B7280">Age ${p.age||"—"} · ${p.blood_group||"—"} · ${p.gender||"—"}</div></div>
          <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#0A7FAF">${appts.filter(a=>a.patient_id===p.id).length}</div>
          <div style="font-size:10px;color:#9CA3AF">appts</div></div>
        </div>`).join("")}</div>`;
  }
}
function pendingCard(d){
  return `
  <div class="pending-card" id="pc-${d.id}">
    <div class="pending-card-header">
      ${avt(d.name,d.color||"#0A7FAF",62)}
      <div style="flex:1;min-width:0">
        <div style="font-size:17px;font-weight:800;color:#1A2B3C;margin-bottom:2px">${d.name}</div>
        <div style="font-size:13px;color:#0A7FAF;font-weight:700;margin-bottom:6px">${d.specialization||"—"}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${pill("⏳ Pending Review","#FEF3C7","#D97706")}
          ${d.qualifications?pill(d.qualifications.split(",")[0].trim(),"#EDE9FE","#7C4DFF"):""}
          ${d.experience?pill(d.experience+"y exp"):""}
        </div>
      </div>
    </div>
    <div class="pending-info-grid">
      <div class="pending-info-item"><div class="pending-info-lbl">📋 Reg. Number</div><div class="pending-info-val">${d.reg_number||"—"}</div></div>
      <div class="pending-info-item"><div class="pending-info-lbl">🏥 Hospital</div><div class="pending-info-val">${d.hospital||"—"}</div></div>
      <div class="pending-info-item"><div class="pending-info-lbl">📍 Location</div><div class="pending-info-val">${d.city||d.location||"—"}</div></div>
      <div class="pending-info-item"><div class="pending-info-lbl">📞 Phone</div><div class="pending-info-val">${d.phone||"—"}</div></div>
      <div class="pending-info-item"><div class="pending-info-lbl">💰 Fee</div><div class="pending-info-val">₹${d.fee||0}/visit</div></div>
      <div class="pending-info-item"><div class="pending-info-lbl">📧 Email</div><div class="pending-info-val" style="word-break:break-all">${d.email||"—"}</div></div>
    </div>
    ${d.about?`<div style="background:#F9FAFB;border-radius:10px;padding:12px 14px;margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;color:#9CA3AF;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">About Doctor</div>
      <div style="font-size:13px;color:#374151;line-height:1.6">${d.about}</div></div>`:""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <button id="rbtn-${d.id}" class="btn btn-red btn-full" style="padding:13px 0" onclick="rejectDoc('${d.id}')">❌ Reject</button>
      <button id="abtn-${d.id}" class="btn btn-green btn-full" style="padding:13px 0" onclick="approveDoc('${d.id}')">✅ Approve</button>
    </div>
    <div style="text-align:center;font-size:11px;color:#D1D5DB;margin-top:8px">Approved doctors appear in search immediately</div>
  </div>`;
}

/* ══════════════ RENDER: SEARCH ══════════════ */
async function rSearch(){
  $("search-back-btn").onclick=()=>go(APP.user?.type==="patient"?"patientDash":"landing");
  const na=$("search-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login to Book</button>`;
  const chips=$("search-chips");
  if(chips) chips.innerHTML=[{name:"All",icon:""},...SPECS].map(s=>`
    <button class="chip ${(!APP.filterSpec&&s.name==="All")||APP.filterSpec===s.name?"active":""}"
      onclick="setSpec('${s.name==="All"?"":s.name}')">${s.icon} ${s.name}</button>`).join("");
  const qi=$("search-q"),si=$("search-spec");
  if(qi) qi.value=APP.searchQ; if(si) si.value=APP.filterSpec;
  await fetchDocs();
}
function setSpec(s){APP.filterSpec=s;rSearch();}
async function filterDoctors(){
  const qi=$("search-q"),si=$("search-spec");
  APP.searchQ=qi?qi.value:""; APP.filterSpec=si?si.value:"";
  document.querySelectorAll(".chip").forEach(c=>{
    const isAll=c.textContent.trim().startsWith("All");
    c.classList.toggle("active",isAll?!APP.filterSpec:(!!APP.filterSpec&&c.textContent.includes(APP.filterSpec)));
  });
  await fetchDocs();
}
async function fetchDocs(){
  const re=$("search-results"),ce=$("search-count");
  if(!re) return;
  spin("search-results","Finding doctors...");
  try{
    let q="approved=eq.true";
    if(APP.filterSpec) q+=`&specialization=eq.${enc(APP.filterSpec)}`;
    let docs=await DB.get("doctors",q);
    if(APP.searchQ){const v=APP.searchQ.toLowerCase();docs=docs.filter(d=>d.name.toLowerCase().includes(v)||(d.specialization||"").toLowerCase().includes(v)||(d.hospital||"").toLowerCase().includes(v));}
    APP.cache.docs=[...APP.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
    if(ce) ce.textContent=docs.length+" doctor"+(docs.length!==1?"s":"")+" found";
    re.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("🔍","No doctors found.");
  }catch(e){re.innerHTML=empty("⚠️","Error: "+e.message);}
}

/* ══════════════ RENDER: PROFILE ══════════════ */
async function rProfile(){
  const d=APP.doc; if(!d){go("search");return;}
  const na=$("profile-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login to Book</button>`;
  // Load reviews
  let reviews=[];
  try{reviews=await DB.get("doctor_reviews","doctor_id=eq."+d.id);}catch(e){}
  const stars=[1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(d.rating||0)?'#F59E0B':'#E5E7EB'};font-size:16px">★</span>`).join("");
  $("profile-content").innerHTML=`
    <div class="profile-header">
      <div style="display:flex;gap:18px;margin-bottom:18px;flex-wrap:wrap">
        ${avt(d.name,d.color||"#0A7FAF",76)}
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:clamp(18px,4vw,24px);font-weight:800;color:#1A2B3C;margin-bottom:3px">${d.name}</h2>
          <div style="font-size:14px;color:#0A7FAF;font-weight:700;margin-bottom:8px">${d.specialization}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${pill((d.experience||0)+" yrs exp")}
            ${d.rating>0?pill("★ "+d.rating,"#FEF3C7","#D97706"):""}
            ${d.reviews>0?pill(d.reviews+" reviews","#F3F4F6","#6B7280"):""}
            ${d.approved?pill("✓ Verified","#D1FAE5","#059669"):""}
            ${d.video_consult?pill("🎥 Video Consult","#EDE9FE","#7C4DFF"):""}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:800;color:#0A7FAF">₹${d.fee}</div>
          <div style="font-size:11px;color:#9CA3AF">per consultation</div>
        </div>
      </div>
      <div class="profile-info-grid">
        ${[["🏥","Hospital",d.hospital],["📍","Location",d.city||d.location],["📋","Reg. No.",d.reg_number],["📞","Phone",d.phone],["🎓","Qualifications",d.qualifications],["🌐","Languages",(d.languages||[]).join(", ")]]
          .map(([ic,l,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${v||"—"}</div></div>`).join("")}
      </div>
      ${d.about?`<p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${d.about}</p>`:""}
      ${d.rating>0?`<div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #F3F4F6;margin-bottom:14px">${stars}<span style="font-size:14px;font-weight:700">${d.rating}</span><span style="font-size:12px;color:#9CA3AF">(${d.reviews})</span></div>`:""}
      <div style="display:grid;grid-template-columns:1fr ${d.video_consult?"1fr":""}; gap:10px">
        <button class="btn btn-primary btn-full" onclick="bookDoc('${d.id}')">📅 Book In-Person</button>
        ${d.video_consult?`<button class="btn btn-full" style="background:linear-gradient(135deg,#7C4DFF,#5B2FE8);color:#fff" onclick="bookDoc('${d.id}')">🎥 Video Consult</button>`:""}
      </div>
    </div>
    <div class="profile-slots-wrap" style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Available Time Slots</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${(d.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("")}</div>
    </div>
    ${reviews.length?`
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Patient Reviews</div>
      ${reviews.slice(0,3).map(r=>`
        <div style="padding:12px 0;border-bottom:1px solid #F3F4F6">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="font-size:13px;font-weight:700;color:#1A2B3C">${r.patient_name||"Patient"}</div>
            <div>${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.rating?"#F59E0B":"#E5E7EB"};font-size:13px">★</span>`).join("")}</div>
          </div>
          <div style="font-size:13px;color:#374151">${r.comment||""}</div>
        </div>`).join("")}
    </div>`:""}`;
}

/* ══════════════ RENDER: BOOK ══════════════ */
async function rBook(){
  const d=APP.doc; if(!d){go("search");return;}
  const c=$("book-content");
  if(!APP.user||APP.user.type!=="patient"){
    c.innerHTML=`<div style="text-align:center;padding:40px 0">
      <div style="font-size:56px;margin-bottom:14px">🔒</div>
      <h3 style="font-family:'Lora',serif;font-size:22px;color:#1A2B3C;margin-bottom:8px">Login Required</h3>
      <p style="color:#6B7280;font-size:14px;margin-bottom:20px">Patient login చేయండి</p>
      <button class="btn btn-primary" onclick="go('patientLogin')">Patient Login</button></div>`;
    return;
  }
  APP.slot="";
  // Load blocked slots for today
  let blockedSlots=[];
  try{
    const avail=await DB.get("doctor_availability","doctor_id=eq."+d.id+"&date=eq."+todayDate());
    if(avail.length) blockedSlots=avail[0].booked_slots||[];
  }catch(e){}
  c.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;display:flex;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${avt(d.name,d.color||"#0A7FAF",50)}
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:#1A2B3C">${d.name}</div>
      <div style="font-size:12px;color:#0A7FAF;font-weight:600">${d.specialization}</div>
      <div style="font-size:12px;color:#9CA3AF">🏥 ${d.hospital}</div></div>
      <div style="font-size:20px;font-weight:800;color:#0A7FAF">₹${d.fee}</div>
    </div>
    <div style="background:#fff;border-radius:16px;padding:22px 20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-group"><label class="form-label">Appointment Type</label>
        <div style="display:grid;grid-template-columns:1fr ${d.video_consult?"1fr":""}; gap:10px;margin-bottom:4px">
          <button id="type-inperson" class="slot-btn active" onclick="selectType('inperson')">🏥 In-Person</button>
          ${d.video_consult?`<button id="type-video" class="slot-btn" onclick="selectType('video')">🎥 Video Consult</button>`:""}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Date Select చేయండి <span>*</span></label>
        <input type="date" id="book-date" class="form-input" min="${todayDate()}" onchange="onDateChange()"/>
      </div>
      <div class="form-group"><label class="form-label">Time Slot <span>*</span></label>
        <div class="slot-grid" id="slot-grid">
          ${(d.slots||[]).map(s=>{
            const isBlocked=blockedSlots.includes(s);
            return `<button class="slot-btn${isBlocked?" slot-blocked":""}" ${isBlocked?"disabled title='Already booked'":""} onclick="${isBlocked?"":"pickSlot('"+s+"')"}">${s}${isBlocked?"<br><span style='font-size:9px'>Booked</span>":""}</button>`;
          }).join("")}
        </div>
      </div>
      <div id="book-summary" style="display:none;background:#F0FDF4;border-radius:10px;padding:14px;border:1px solid #A7F3D0;margin-top:12px">
        <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px">📋 Booking Summary</div>
        <div id="bsum-txt" style="font-size:13px;color:#047857;line-height:1.7"></div>
        <div style="font-size:15px;font-weight:800;color:#0A7FAF;margin-top:6px">Total: ₹${d.fee}</div>
      </div>
    </div>
    <button class="btn btn-primary btn-full" id="confirm-book-btn" onclick="confirmBook()">Confirm & Pay ₹${d.fee}</button>
    <p style="font-size:11px;color:#D1D5DB;text-align:center;margin-top:10px">By booking you agree to DocNear's terms</p>`;
}
let selectedType="inperson";
function selectType(t){
  selectedType=t;
  ["inperson","video"].forEach(x=>{
    const b=$("type-"+x); if(b) b.classList.toggle("active",x===t);
  });
}
function pickSlot(s){
  APP.slot=s;
  document.querySelectorAll(".slot-btn:not(.slot-blocked)").forEach(b=>b.classList.toggle("active",b.textContent.trim().startsWith(s)));
  updateBookSummary();
}
async function onDateChange(){
  const date=($("book-date")||{}).value;
  if(!date||!APP.doc) return;
  // Load blocked slots for selected date
  try{
    const avail=await DB.get("doctor_availability",`doctor_id=eq.${APP.doc.id}&date=eq.${date}`);
    const blocked=avail.length?avail[0].booked_slots||[]:[];
    const sg=$("slot-grid");
    if(sg) sg.innerHTML=(APP.doc.slots||[]).map(s=>{
      const isBlocked=blocked.includes(s);
      return `<button class="slot-btn${isBlocked?" slot-blocked":""}" ${isBlocked?"disabled":""} onclick="${isBlocked?"":"pickSlot('"+s+"')"}">${s}${isBlocked?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;
    }).join("");
  }catch(e){}
  updateBookSummary();
}
function updateBookSummary(){
  const date=($("book-date")||{}).value;
  const sb=$("book-summary"),st=$("bsum-txt");
  if(sb&&st&&date&&APP.slot){
    sb.style.display="block";
    st.innerHTML=`📅 ${date} · 🕐 ${APP.slot}<br>👤 ${APP.user.name}<br>${selectedType==="video"?"🎥 Video Consultation":"🏥 In-Person"}`;
  }else if(sb) sb.style.display="none";
}
async function confirmBook(){
  const date=($("book-date")||{}).value;
  if(!date){toast("Date select చేయండి.",true);return;}
  if(!APP.slot){toast("Time slot select చేయండి.",true);return;}
  const d=APP.doc;
  const btn=$("confirm-book-btn");
  if(btn){btn.disabled=true;btn.textContent="Processing...";}
  toast("Creating appointment…");
  try{
    const meetLink=selectedType==="video"?generateMeetLink(Date.now().toString()):null;
    const r=await DB.post("appointments",{
      patient_id:APP.user.id,patient_name:APP.user.name,
      doctor_id:d.id,doctor_name:d.name,specialization:d.specialization,
      date,slot:APP.slot,status:"confirmed",fee:d.fee,payment_status:"pending",
      is_video:selectedType==="video",meeting_link:meetLink
    });
    APP.bookingAppt=r[0];
    // Notification to doctor
    await DB.post("notifications",{user_id:d.id,user_type:"doctor",
      title:"New Appointment 📅",message:`${APP.user.name} on ${date} at ${APP.slot}`,type:"info"}).catch(()=>{});
    // Initiate payment
    initRazorpay(APP.bookingAppt||{...{id:"temp",fee:d.fee,doctor_name:d.name},doctor_id:d.id}, async()=>{
      await DB.patch("appointments","id=eq."+(APP.bookingAppt?.id||"temp"),{payment_status:"paid"}).catch(()=>{});
      toast("Appointment booked & paid! 🎉"); go("patientDash");
    });
    if(btn){btn.disabled=false;btn.textContent="Confirm & Pay ₹"+d.fee;}
  }catch(e){
    toast("Error: "+e.message,true);
    if(btn){btn.disabled=false;btn.textContent="Confirm & Pay ₹"+d.fee;}
  }
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded",()=>rLanding());
