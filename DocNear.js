/* DocNear V3 – Complete Production App */
const SURL = "https://avonzvocvonvzamedwvh.supabase.co";
const SKEY = "sb_publishable_wvfdYDM_JGE8q5NrcYl0EQ_tDOTBL2I";
const SK   = "dn_session_v10";

/* ── SHA-256 ── */
async function sha(s){
  try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
  catch{return s;}
}

/* ── Supabase ── */
async function dbq(path,o={}){
  const r=await fetch(SURL+"/rest/v1/"+path,{
    headers:{"apikey":SKEY,"Authorization":"Bearer "+SKEY,"Content-Type":"application/json","Prefer":o.prefer||"return=representation",...o.headers},
    method:o.method||"GET",body:o.body?JSON.stringify(o.body):undefined
  });
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||"DB Error "+r.status);}
  const t=await r.text();return t?JSON.parse(t):[];
}
const DB={
  get:(t,q="")=>dbq(t+"?"+(q?q+"&":"")+"order=created_at.desc"),
  post:(t,d)=>dbq(t,{method:"POST",body:d}),
  patch:(t,f,d)=>dbq(t+"?"+f,{method:"PATCH",body:d,prefer:"return=representation"}),
  del:(t,f)=>dbq(t+"?"+f,{method:"DELETE",prefer:"return=minimal"})
};

/* ── Session ── */
const S={
  save(u,r){try{localStorage.setItem(SK,JSON.stringify({u,r,t:Date.now()}));}catch{}},
  load(){try{const d=JSON.parse(localStorage.getItem(SK)||"null");if(!d||Date.now()-d.t>8*3600000){this.clear();return null;}return d;}catch{return null;}},
  clear(){try{localStorage.removeItem(SK);}catch{}}
};

/* ── State ── */
const A={
  user:null,role:null,lang:localStorage.getItem("dn_lang")||"en",
  doc:null,store:null,lab:null,ambu:null,
  slot:"",type:"inperson",q:"",spec:"",
  cache:{docs:[],pats:[],stores:[],labs:[],ambus:[],appts:[],notifs:[]},
  demo:false
};

/* ── Specializations ── */
const SPECS=[
  {n:"Cardiology",i:"❤️",c:"#FF4757"},{n:"Neurology",i:"🧠",c:"#7C4DFF"},
  {n:"Orthopedics",i:"🦴",c:"#FF6B35"},{n:"Pediatrics",i:"👶",c:"#00BCD4"},
  {n:"Ophthalmology",i:"👁️",c:"#2196F3"},{n:"Dermatology",i:"✨",c:"#E91E8C"},
  {n:"General Medicine",i:"🏥",c:"#009688"},{n:"Gynecology",i:"🌸",c:"#E91E63"}
];

/* ── Subscription Plans ── */
const PLANS={
  doctor:[
    {id:"monthly",name:"Monthly",price:499,period:"/month",popular:false,features:["Unlimited appointments","Patient notifications","Video consult link","Basic analytics"]},
    {id:"yearly",name:"Yearly",price:3999,period:"/year",popular:true,features:["Everything in Monthly","Priority listing","Advanced analytics","WhatsApp alerts","Save ₹2000"]}
  ],
  ambulance:[
    {id:"basic",name:"Basic",price:299,period:"/month",popular:false,features:["Listed on DocNear","Emergency calls","Location display"]},
    {id:"pro",name:"Pro",price:799,period:"/month",popular:true,features:["Priority listing","GPS tracking badge","Response time display","5 star rating system"]}
  ],
  lab:[
    {id:"starter",name:"Starter",price:399,period:"/month",popular:false,features:["List up to 20 tests","Online bookings","Patient notifications"]},
    {id:"growth",name:"Growth",price:999,period:"/month",popular:true,features:["Unlimited tests","Home collection orders","Priority listing","Analytics dashboard"]}
  ]
};

/* ── Demo Data ── */
const DEMO={
  docs:[
    {id:"d1",name:"Dr. Priya Sharma",email:"priya@docnear.com",phone:"+91 98765 43210",specialization:"Cardiology",reg_number:"MCI-2019-45231",hospital:"Apollo Hospitals",city:"Hyderabad",district:"Hyderabad",state_code:"TS",experience:12,fee:800,rating:4.8,reviews:234,approved:true,color:"#FF4757",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"],video_consult:true,about:"Specialist in interventional cardiology with 12 years experience.",qualifications:"MBBS, MD (Cardiology), DM",subscription:"yearly"},
    {id:"d2",name:"Dr. Rajesh Kumar",email:"rajesh@docnear.com",phone:"+91 98765 12345",specialization:"Neurology",reg_number:"MCI-2017-32145",hospital:"KIMS Hospital",city:"Hyderabad",district:"Hyderabad",state_code:"TS",experience:15,fee:1200,rating:4.9,reviews:312,approved:true,color:"#7C4DFF",slots:["10:00 AM","11:00 AM","3:00 PM","4:00 PM"],video_consult:true,about:"Senior Neurologist specializing in epilepsy and stroke.",qualifications:"MBBS, DM (Neurology)",subscription:"yearly"},
    {id:"d3",name:"Dr. Sunita Reddy",email:"sunita@docnear.com",phone:"+91 87654 32109",specialization:"Pediatrics",reg_number:"MCI-2020-67890",hospital:"Rainbow Hospital",city:"Hyderabad",district:"Hyderabad",state_code:"TS",experience:8,fee:600,rating:4.7,reviews:189,approved:true,color:"#00BCD4",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM"],video_consult:false,about:"Dedicated pediatrician.",qualifications:"MBBS, MD (Pediatrics)",subscription:"monthly"},
    {id:"d4",name:"Dr. Vikram Rao",email:"vikram@docnear.com",phone:"+91 95543 21098",specialization:"General Medicine",reg_number:"MCI-2018-55432",hospital:"Medicover Hospital",city:"Hyderabad",district:"Hyderabad",state_code:"TS",experience:10,fee:500,rating:4.7,reviews:560,approved:true,color:"#009688",slots:["8:00 AM","9:00 AM","10:00 AM","11:00 AM"],video_consult:false,about:"General physician with holistic approach.",qualifications:"MBBS, MD",subscription:"monthly"}
  ],
  pats:[
    {id:"p1",name:"Ananya Patel",email:"ananya@gmail.com",phone:"+91 98765 00001",age:28,blood_group:"O+",gender:"Female"},
    {id:"p2",name:"Vikram Singh",email:"vikram@gmail.com",phone:"+91 98765 00002",age:45,blood_group:"A+",gender:"Male"}
  ],
  stores:[
    {id:"s1",store_name:"Apollo Pharmacy",owner_name:"Ravi Kumar",email:"apollo@store.com",phone:"+91 98765 11111",district:"Hyderabad",state_code:"TS",address:"Banjara Hills, Hyderabad",is_24x7:true,delivery_available:true,delivery_radius_km:10,approved:true,color:"#10B981",rating:4.5,opening_time:"00:00",closing_time:"23:59"},
    {id:"s2",store_name:"MedPlus Pharmacy",owner_name:"Suresh Reddy",email:"medplus@store.com",phone:"+91 98765 22222",district:"Hyderabad",state_code:"TS",address:"Jubilee Hills, Hyderabad",is_24x7:false,delivery_available:true,delivery_radius_km:5,approved:true,color:"#059669",rating:4.3,opening_time:"08:00",closing_time:"22:00"}
  ],
  ambus:[
    {id:"a1",operator_name:"Srinivas Rao",email:"ambu1@docnear.com",phone:"+91 99001 11111",alternate_phone:"+91 99001 11112",district:"Hyderabad",state_code:"TS",base_location:"Jubilee Hills",vehicle_type:"Advanced Life Support",vehicle_number:"TS 09 AB 1234",base_fare:500,per_km_rate:20,night_charge_extra:200,service_radius_km:25,has_oxygen:true,has_stretcher:true,has_monitor:true,approved:true,availability_status:"available",color:"#EF4444",rating:4.8,subscription:"pro"},
    {id:"a2",operator_name:"Ramesh Kumar",email:"ambu2@docnear.com",phone:"+91 99002 22222",alternate_phone:"+91 99002 22223",district:"Hyderabad",state_code:"TS",base_location:"Secunderabad",vehicle_type:"Basic Life Support",vehicle_number:"TS 09 CD 5678",base_fare:350,per_km_rate:15,night_charge_extra:150,service_radius_km:30,has_oxygen:true,has_stretcher:true,has_monitor:false,approved:true,availability_status:"available",color:"#DC2626",rating:4.5,subscription:"basic"}
  ],
  labs:[
    {id:"l1",lab_name:"Vijaya Diagnostics",owner_name:"Dr. Vijay Kumar",email:"vijaya@lab.com",phone:"+91 98111 11111",district:"Hyderabad",state_code:"TS",address:"Banjara Hills",lab_type:"full_service",nabl_accredited:true,home_collection:true,home_collection_charge:150,approved:true,color:"#7C4DFF",rating:4.7,subscription:"growth"},
    {id:"l2",lab_name:"Apollo Diagnostics",owner_name:"Raju Sharma",email:"apollo@lab.com",phone:"+91 98111 22222",district:"Hyderabad",state_code:"TS",address:"Jubilee Hills",lab_type:"pathology",nabl_accredited:false,home_collection:true,home_collection_charge:100,approved:true,color:"#8B5CF6",rating:4.4,subscription:"starter"}
  ],
  appts:[
    {id:"ap1",patient_id:"p1",patient_name:"Ananya Patel",doctor_id:"d1",doctor_name:"Dr. Priya Sharma",specialization:"Cardiology",date:new Date(Date.now()+86400000).toISOString().split("T")[0],slot:"10:00 AM",status:"confirmed",fee:800,payment_status:"paid",is_video:false},
    {id:"ap2",patient_id:"p1",patient_name:"Ananya Patel",doctor_id:"d2",doctor_name:"Dr. Rajesh Kumar",specialization:"Neurology",date:new Date(Date.now()+172800000).toISOString().split("T")[0],slot:"3:00 PM",status:"confirmed",fee:1200,payment_status:"paid",is_video:true,meeting_link:"https://meet.jit.si/docnear-demo-001"}
  ],
  labTests:[
    {id:"lt1",lab_id:"l1",test_name:"Complete Blood Count (CBC)",test_name_te:"పూర్తి రక్త పరీక్ష",category:"Blood",price:250,discount:10,home_available:true,report_time:"Same Day",fasting_required:false},
    {id:"lt2",lab_id:"l1",test_name:"Blood Sugar (Fasting)",test_name_te:"చక్కెర పరీక్ష",category:"Blood",price:150,discount:0,home_available:true,report_time:"Same Day",fasting_required:true},
    {id:"lt3",lab_id:"l1",test_name:"Thyroid Profile (T3,T4,TSH)",test_name_te:"థైరాయిడ్",category:"Blood",price:600,discount:15,home_available:true,report_time:"24 Hours",fasting_required:true},
    {id:"lt4",lab_id:"l1",test_name:"Full Body Checkup",test_name_te:"పూర్తి శరీర పరీక్ష",category:"Package",price:2500,discount:20,home_available:true,report_time:"48 Hours",fasting_required:true},
    {id:"lt5",lab_id:"l2",test_name:"HbA1c (Diabetes)",test_name_te:"మధుమేహ పరీక్ష",category:"Blood",price:450,discount:10,home_available:true,report_time:"Same Day",fasting_required:false},
    {id:"lt6",lab_id:"l2",test_name:"Vitamin D",test_name_te:"విటమిన్ డి",category:"Blood",price:800,discount:0,home_available:true,report_time:"48 Hours",fasting_required:false},
    {id:"lt7",lab_id:"l2",test_name:"X-Ray Chest",test_name_te:"ఛాతీ ఎక్స్-రే",category:"Radiology",price:250,discount:0,home_available:false,report_time:"Same Day",fasting_required:false},
    {id:"lt8",lab_id:"l2",test_name:"Ultrasound Abdomen",test_name_te:"అల్ట్రాసౌండ్",category:"Radiology",price:600,discount:0,home_available:false,report_time:"Same Day",fasting_required:false}
  ]
};

/* ════════ UTILS ════════ */
const $=id=>document.getElementById(id);
const gv=id=>($( id)||{}).value?.trim()||"";
const enc=s=>encodeURIComponent(s||"");
const safe=s=>s||"";
const td=()=>new Date().toISOString().split("T")[0];
const ini=n=>safe(n).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

function avt(n,c="#0A7FAF",sz=48){
  return `<div class="avatar" style="width:${sz}px;height:${sz}px;background:${c};font-size:${Math.round(sz*.35)}px">${ini(n)}</div>`;
}
function pill(l,bg="#E3F4FC",c="#0A7FAF"){
  return `<span class="pill" style="background:${bg};color:${c}">${l}</span>`;
}
function sPill(s){
  const m={confirmed:["#D1FAE5","#059669"],pending:["#FEF3C7","#D97706"],cancelled:["#FEE2E2","#DC2626"],completed:["#EDE9FE","#7C4DFF"],available:["#D1FAE5","#059669"],busy:["#FEF3C7","#D97706"],offline:["#F3F4F6","#9CA3AF"]};
  const[bg,c]=m[s]||m.pending;return pill(s.toUpperCase(),bg,c);
}
function toast(msg,err=false){
  const el=$("toast");if(!el)return;
  el.style.background=err?"#EF4444":"#10B981";el.style.color="#fff";
  el.textContent=(err?"❌ ":"✅ ")+msg;el.style.display="block";
  clearTimeout(el._t);el._t=setTimeout(()=>el.style.display="none",4200);
}
function spin(id,msg="Loading..."){const el=$(id);if(el)el.innerHTML=`<div class="loading-box"><div class="spinner"></div>${msg}</div>`;}
function sc(ic,lb,v,bg="#E3F4FC",vc="#0A7FAF"){
  return `<div class="stat-card"><div class="stat-icon" style="background:${bg}">${ic}</div><div><div class="stat-val" style="color:${vc}">${v}</div><div class="stat-lbl">${lb}</div></div></div>`;
}
function empty(ic,msg,btn=""){
  return `<div class="empty"><div class="empty-icon">${ic}</div><div class="empty-msg">${msg}</div>${btn}</div>`;
}

/* ── DB with fallback ── */
async function safeGet(tbl,q="",dk=""){
  try{const r=await DB.get(tbl,q);return r;}
  catch(e){A.demo=true;return dk&&DEMO[dk]?DEMO[dk]:[];}
}
async function safePost(tbl,data,fb=null){
  try{return await DB.post(tbl,data);}
  catch(e){if(A.demo&&fb)return fb(data);throw e;}
}

/* ════════ NAVIGATION ════════ */
function go(pg){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const el=$("page-"+pg);if(!el)return;
  el.classList.add("active");window.scrollTo(0,0);
  const map={
    landing:rLanding,search:rSearch,
    patientDash:rPatientDash,doctorDash:rDoctorDash,
    storeDash:rStoreDash,ambuDash:rAmbuDash,labDash:rLabDash,
    profile:rProfile,book:rBook,
    stores:rStores,storeDetail:rStoreDetail,
    ambulance:rAmbulance,labsPage:rLabsPage,labDetail:rLabDetail,
    prescOrder:rPrescOrder,patientOrders:rPatientOrders
  };
  if(map[pg])map[pg]();
}
function logout(){
  S.clear();A.user=null;A.role=null;
  A.cache={docs:[],pats:[],stores:[],labs:[],ambus:[],appts:[],notifs:[]};
  toast("Logged out.");go("landing");
}
function redirectRole(role){
  const r={patient:"patientDash",doctor:"doctorDash",store:"storeDash",ambulance:"ambuDash",lab:"labDash",admin:null};
  if(role==="admin"){window.location.href="admin.html";return;}
  go(r[role]||"landing");
}

/* ════════ LANGUAGE ════════ */
function setLang(lang){
  A.lang=lang;localStorage.setItem("dn_lang",lang);
  [$("btn-lang-en"),$("btn-lang-te")].forEach((b,i)=>{
    if(!b)return;
    const on=(i===0&&lang==="en")||(i===1&&lang==="te");
    b.style.background=on?"linear-gradient(135deg,#0A7FAF,#074E7A)":"transparent";
    b.style.color=on?"#fff":"#6B7280";
  });
}

/* ════════ SUBSCRIPTION PLANS RENDER ════════ */
function renderPlans(role,formId){
  const plans=PLANS[role];if(!plans)return "";
  return `<div class="form-group">
    <label class="form-label">Choose Subscription Plan <span>*</span></label>
    <div id="plan-cards-${role}" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px">
      ${plans.map(p=>`
      <div class="plan-card ${p.popular?"popular":""}" id="plan-${role}-${p.id}" onclick="selectPlan('${role}','${p.id}')" style="position:relative">
        ${p.popular?`<div style="position:absolute;top:-10px;right:12px;background:#FF6B35;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:12px">⭐ POPULAR</div>`:""}
        <div style="font-size:13px;font-weight:700;color:#1A2B3C;margin-bottom:6px">${p.name}</div>
        <div class="plan-price">₹${p.price}</div>
        <div class="plan-period">${p.period}</div>
        <div style="margin-top:10px">
          ${p.features.map(f=>`<div class="plan-feature">✅ <span>${f}</span></div>`).join("")}
        </div>
      </div>`).join("")}
    </div>
    <div id="plan-note-${role}" style="font-size:12px;color:#6B7280;margin-top:6px;padding:8px 12px;background:#F9FAFB;border-radius:8px">
      💡 Select a plan to continue. Payment via Razorpay (UPI/Card/NetBanking).
    </div>
  </div>`;
}
function selectPlan(role,planId){
  const plans=PLANS[role]||[];
  const plan=plans.find(p=>p.id===planId);
  document.querySelectorAll(`#plan-cards-${role} .plan-card`).forEach(c=>c.classList.remove("selected"));
  $(`plan-${role}-${planId}`)?.classList.add("selected");
  window[`_plan_${role}`]=plan;
  const note=$(`plan-note-${role}`);
  if(note&&plan) note.innerHTML=`✅ Selected: <strong>${plan.name}</strong> — ₹${plan.price}${plan.period}. Payment at next step.`;
}

/* ════════ AUTH — PATIENT ════════ */
async function patientLogin(){
  const email=gv("pl-email"),pw=gv("pl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("pl-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    const hash=await sha(pw);
    let rows=await safeGet("patients",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&A.demo){const d=DEMO.pats.find(p=>p.email===email);if(d&&pw==="patient123")rows=[d];}
    if(!rows.length){toast("Invalid email or password.",true);return;}
    A.user=rows[0];A.role="patient";S.save(rows[0],"patient");
    toast("Welcome, "+rows[0].name+"! 👋");redirectRole("patient");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Sign In";}}
}
async function patientRegister(){
  const name=gv("pr-name"),email=gv("pr-email"),pw=gv("pr-pw"),
    phone=gv("pr-phone"),age=gv("pr-age"),blood=gv("pr-blood"),gender=gv("pr-gender");
  if(!name||!email||!pw||!phone||!age){toast("Fill all required fields.",true);return;}
  if(pw.length<6){toast("Password min 6 characters.",true);return;}
  const btn=$("pr-btn");if(btn){btn.disabled=true;btn.textContent="Creating...";}
  try{
    const hash=await sha(pw);
    const ex=await safeGet("patients",`email=eq.${enc(email)}`);
    if(ex.length){toast("Email already registered.",true);return;}
    const r=await safePost("patients",{name,email,password_hash:hash,phone,age:parseInt(age),blood_group:blood,gender},d=>[{...d,id:"p_"+Date.now()}]);
    A.user=r[0];A.role="patient";S.save(r[0],"patient");
    toast("Welcome to DocNear, "+name+"! 🎉");redirectRole("patient");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Create Account";}}
}

/* ════════ AUTH — DOCTOR ════════ */
async function doctorLogin(){
  const email=gv("dl-email"),pw=gv("dl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("dl-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    const hash=await sha(pw);
    let rows=await safeGet("doctors",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&A.demo){const d=DEMO.docs.find(d=>d.email===email);if(d&&pw==="doctor123")rows=[d];}
    if(!rows.length){toast("Invalid email or password.",true);return;}
    A.user=rows[0];A.role="doctor";S.save(rows[0],"doctor");
    toast("Welcome, "+rows[0].name+"! 👨‍⚕️");redirectRole("doctor");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Sign In";}}
}
async function doctorRegister(){
  const f={name:gv("dr-name"),email:gv("dr-email"),pw:gv("dr-pw"),phone:gv("dr-phone"),
    spec:gv("dr-spec"),reg:gv("dr-reg"),hosp:gv("dr-hosp"),loc:gv("dr-loc"),
    exp:gv("dr-exp"),fee:gv("dr-fee"),about:gv("dr-about"),qual:gv("dr-qual")};
  if(!f.name||!f.email||!f.pw||!f.phone||!f.spec||!f.reg||!f.hosp||!f.loc||!f.exp||!f.fee){
    toast("Fill all required fields.",true);return;}
  const plan=window._plan_doctor;
  if(!plan){toast("Please select a subscription plan.",true);return;}
  const btn=$("dr-btn");if(btn){btn.disabled=true;btn.textContent="Processing...";}
  try{
    const hash=await sha(f.pw);
    const ex=await safeGet("doctors",`email=eq.${enc(f.email)}`);
    if(ex.length){toast("Email already registered.",true);return;}
    // Show payment modal
    btn.disabled=false;btn.textContent="Submit for Review";
    showPaymentModal("doctor",plan,async()=>{
      await safePost("doctors",{
        name:f.name,email:f.email,password_hash:hash,phone:f.phone,
        specialization:f.spec,reg_number:f.reg,hospital:f.hosp,location:f.loc,city:f.loc,
        experience:parseInt(f.exp),fee:parseInt(f.fee),about:f.about,qualifications:f.qual,
        approved:false,color:SPECS.find(s=>s.n===f.spec)?.c||"#0A7FAF",
        slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"],
        subscription:plan.id,subscription_amount:plan.price
      });
      go("doctorPending");toast("Registration submitted! Admin will verify within 24–48 hrs.");
    });
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Submit for Review";}}
}

/* ════════ AUTH — STORE ════════ */
async function storeLogin(){
  const email=gv("sl-email"),pw=gv("sl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("sl-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    const hash=await sha(pw);
    let rows=await safeGet("medical_stores",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&A.demo){const d=DEMO.stores.find(s=>s.email===email);if(d&&pw==="store123")rows=[d];}
    if(!rows.length){toast("Invalid email or password.",true);return;}
    if(!rows[0].approved){toast("Store not yet approved by admin.",true);return;}
    A.user=rows[0];A.role="store";S.save(rows[0],"store");
    toast("Welcome, "+rows[0].store_name+"! 💊");redirectRole("store");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Sign In";}}
}
async function storeRegister(){
  const f={owner:gv("sr-owner"),store:gv("sr-store"),email:gv("sr-email"),pw:gv("sr-pw"),
    phone:gv("sr-phone"),addr:gv("sr-address"),lic:gv("sr-license"),gst:gv("sr-gst")};
  if(!f.owner||!f.store||!f.email||!f.pw||!f.phone||!f.addr){toast("Fill all required fields.",true);return;}
  const btn=$("sr-btn");if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try{
    const hash=await sha(f.pw);
    const ex=await safeGet("medical_stores",`email=eq.${enc(f.email)}`);
    if(ex.length){toast("Email already registered.",true);return;}
    await safePost("medical_stores",{
      owner_name:f.owner,store_name:f.store,email:f.email,password_hash:hash,
      phone:f.phone,address:f.addr,drug_license_no:f.lic,gst_number:f.gst,
      approved:false,is_active:true,color:"#10B981",delivery_available:false,is_24x7:false
    });
    toast("Store registration submitted!");go("storePending");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Submit for Approval";}}
}

/* ════════ AUTH — AMBULANCE ════════ */
async function ambuLogin(){
  const email=gv("al2-email"),pw=gv("al2-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("al2-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    const hash=await sha(pw);
    let rows=await safeGet("ambulances",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&A.demo){const d=DEMO.ambus.find(a=>a.email===email);if(d&&pw==="ambu123")rows=[d];}
    if(!rows.length){toast("Invalid email or password.",true);return;}
    if(!rows[0].approved){toast("Account not yet approved by admin.",true);return;}
    A.user=rows[0];A.role="ambulance";S.save(rows[0],"ambulance");
    toast("Welcome, "+rows[0].operator_name+"! 🚑");redirectRole("ambulance");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Sign In";}}
}
async function ambuRegister(){
  const f={op:gv("ar-operator"),email:gv("ar-email"),pw:gv("ar-pw"),phone:gv("ar-phone"),
    veh:gv("ar-vehicle"),type:gv("ar-type"),base:gv("ar-base"),km:gv("ar-km"),loc:gv("ar-location")};
  if(!f.op||!f.email||!f.pw||!f.phone||!f.veh||!f.type||!f.base||!f.km){toast("Fill all required fields.",true);return;}
  const plan=window._plan_ambulance;
  if(!plan){toast("Please select a subscription plan.",true);return;}
  const btn=$("ar-btn");if(btn){btn.disabled=true;btn.textContent="Processing...";}
  try{
    const hash=await sha(f.pw);
    btn.disabled=false;btn.textContent="Submit for Approval";
    showPaymentModal("ambulance",plan,async()=>{
      await safePost("ambulances",{
        operator_name:f.op,email:f.email,password_hash:hash,phone:f.phone,
        vehicle_number:f.veh,vehicle_type:f.type,base_fare:parseInt(f.base),
        per_km_rate:parseInt(f.km),base_location:f.loc,
        approved:false,availability_status:"offline",color:"#EF4444",
        has_oxygen:true,has_stretcher:true,service_radius_km:20,
        subscription:plan.id,subscription_amount:plan.price
      });
      go("ambuPending");toast("Ambulance registration submitted!");
    });
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Submit for Approval";}}
}

/* ════════ AUTH — LAB ════════ */
async function labLogin(){
  const email=gv("ll-email"),pw=gv("ll-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("ll-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    const hash=await sha(pw);
    let rows=await safeGet("diagnostic_labs",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&A.demo){const d=DEMO.labs.find(l=>l.email===email);if(d&&pw==="lab123")rows=[d];}
    if(!rows.length){toast("Invalid email or password.",true);return;}
    if(!rows[0].approved){toast("Lab not yet approved by admin.",true);return;}
    A.user=rows[0];A.role="lab";S.save(rows[0],"lab");
    toast("Welcome, "+rows[0].lab_name+"! 🔬");redirectRole("lab");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Sign In";}}
}
async function labRegister(){
  const f={lab:gv("lr-lab"),owner:gv("lr-owner"),email:gv("lr-email"),pw:gv("lr-pw"),
    phone:gv("lr-phone"),type:gv("lr-type"),addr:gv("lr-address"),reg:gv("lr-reg")};
  if(!f.lab||!f.owner||!f.email||!f.pw||!f.phone||!f.type){toast("Fill all required fields.",true);return;}
  const plan=window._plan_lab;
  if(!plan){toast("Please select a subscription plan.",true);return;}
  const btn=$("lr-btn");if(btn){btn.disabled=true;btn.textContent="Processing...";}
  try{
    const hash=await sha(f.pw);
    btn.disabled=false;btn.textContent="Submit for Approval";
    showPaymentModal("lab",plan,async()=>{
      await safePost("diagnostic_labs",{
        lab_name:f.lab,owner_name:f.owner,email:f.email,password_hash:hash,
        phone:f.phone,lab_type:f.type,address:f.addr,lab_registration_no:f.reg,
        approved:false,is_active:true,color:"#7C4DFF",
        home_collection:false,nabl_accredited:false,
        subscription:plan.id,subscription_amount:plan.price
      });
      go("labPending");toast("Lab registration submitted!");
    });
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Submit for Approval";}}
}

/* ════════ AUTH — ADMIN ════════ */
async function adminLogin(){
  const email=gv("al-email"),pw=gv("al-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("al-btn");if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try{
    let ok=false;
    const hash=await sha(pw);
    try{const r=await DB.get("admins",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}&is_active=eq.true`);if(r.length){A.user=r[0];ok=true;}}catch{}
    if(!ok&&A.demo&&email==="admin@docnear.com"&&pw==="admin123"){A.user={name:"Admin",email};ok=true;}
    if(!ok){toast("Invalid admin credentials.",true);return;}
    A.role="admin";S.save(A.user,"admin");
    toast("Welcome, Admin! 🛡️");window.location.href="admin.html";
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Admin Sign In";}}
}

/* ════════ PAYMENT MODAL ════════ */
function showPaymentModal(role,plan,onSuccess){
  const existing=$("pay-modal");if(existing)existing.remove();
  const modal=document.createElement("div");
  modal.id="pay-modal";
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeUp .3s ease";
  modal.innerHTML=`
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:44px;margin-bottom:10px">💳</div>
        <h3 style="font-family:'Lora',serif;font-size:20px;color:#1A2B3C;margin-bottom:4px">Complete Payment</h3>
        <p style="font-size:13px;color:#6B7280">Activate your <strong>${plan.name}</strong> subscription</p>
      </div>
      <div style="background:#F0F9FF;border-radius:14px;padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-size:14px;font-weight:600;color:#1A2B3C">${plan.name} Plan</div>
          <div style="font-size:20px;font-weight:800;color:#0A7FAF">₹${plan.price}<span style="font-size:12px;color:#9CA3AF">${plan.period}</span></div>
        </div>
        ${plan.features.map(f=>`<div style="font-size:12px;color:#374151;display:flex;align-items:center;gap:6px;margin-bottom:4px">✅ ${f}</div>`).join("")}
      </div>
      <div style="display:grid;gap:10px;margin-bottom:14px">
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1.5px solid transparent" id="pay-upi" onclick="selectPayMethod('upi')">
          <span style="font-size:20px">📱</span><div><div style="font-size:13px;font-weight:600">UPI / PhonePe / GPay</div><div style="font-size:11px;color:#9CA3AF">Instant transfer</div></div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1.5px solid transparent" id="pay-card" onclick="selectPayMethod('card')">
          <span style="font-size:20px">💳</span><div><div style="font-size:13px;font-weight:600">Credit / Debit Card</div><div style="font-size:11px;color:#9CA3AF">Visa, Mastercard, RuPay</div></div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1.5px solid transparent" id="pay-nb" onclick="selectPayMethod('netbanking')">
          <span style="font-size:20px">🏦</span><div><div style="font-size:13px;font-weight:600">Net Banking</div><div style="font-size:11px;color:#9CA3AF">All major banks</div></div>
        </div>
      </div>
      <div id="pay-err" style="display:none;background:#FEE2E2;color:#DC2626;padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:10px"></div>
      <button id="pay-btn" class="btn btn-primary btn-full" style="font-size:15px;padding:13px" onclick="processPayment('${role}',${plan.price},${JSON.stringify(plan).replace(/'/g,'"')})">
        Pay ₹${plan.price} Securely →
      </button>
      <button onclick="document.getElementById('pay-modal').remove()" class="btn btn-ghost btn-full" style="margin-top:8px">Cancel</button>
      <div style="text-align:center;font-size:11px;color:#D1D5DB;margin-top:8px">🔒 Secured by Razorpay · 256-bit SSL</div>
    </div>`;
  document.body.appendChild(modal);
  window._payCallback=onSuccess;
  selectPayMethod("upi");
}
function selectPayMethod(m){
  ["upi","card","nb"].forEach(id=>{
    const el=$("pay-"+id);
    if(el)el.style.borderColor=id===m||(id==="nb"&&m==="netbanking")?"#0A7FAF":"transparent";
  });
  window._payMethod=m;
}
async function processPayment(role,amount,plan){
  const btn=$("pay-btn");if(btn){btn.disabled=true;btn.textContent="Processing...";}
  // Razorpay integration
  if(typeof Razorpay!=="undefined"){
    const opts={
      key:"rzp_test_YourKeyHere",
      amount:amount*100,currency:"INR",
      name:"DocNear",
      description:`${plan.name} Subscription`,
      image:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='20' font-size='20'>🩺</text></svg>",
      handler:function(resp){
        $("pay-modal")?.remove();
        toast("Payment successful! ₹"+amount+" paid. ✅");
        if(window._payCallback)window._payCallback();
      },
      prefill:{name:A.user?.name||"",email:gv("dr-email")||gv("ar-email")||gv("lr-email")||""},
      theme:{color:"#0A7FAF"},
      modal:{ondismiss:()=>{if(btn){btn.disabled=false;btn.textContent="Pay ₹"+amount+" Securely →";}}}
    };
    new Razorpay(opts).open();
  } else {
    // Demo mode — simulate payment
    setTimeout(()=>{
      $("pay-modal")?.remove();
      toast("Demo: Payment of ₹"+amount+" processed! ✅");
      if(window._payCallback)window._payCallback();
    },1500);
    if(btn) btn.textContent="Processing Demo Payment...";
  }
}

/* ════════ RENDER: LANDING ════════ */
async function rLanding(){
  const ng=$("nav-guest"),nu=$("nav-user");
  if(A.user){
    if(ng)ng.style.display="none";
    if(nu){nu.style.display="flex";if($("nav-user-name"))$("nav-user-name").textContent=A.user.name||A.user.store_name||A.user.operator_name||A.user.lab_name||"";}
  }else{if(ng)ng.style.display="flex";if(nu)nu.style.display="none";}
  setLang(A.lang);
  const sc=$("landing-specs");
  if(sc)sc.innerHTML=SPECS.map(s=>`<div class="spec-card" onclick="A.spec='${s.n}';go('search')" onmouseover="this.style.boxShadow='0 8px 20px ${s.c}33'" onmouseout="this.style.boxShadow=''"><div class="spec-icon">${s.i}</div><div class="spec-name">${s.n}</div></div>`).join("");
  const dc=$("landing-doctors");
  if(dc){
    spin("landing-doctors");
    try{
      let docs=await safeGet("doctors","approved=eq.true&limit=3","docs");
      if(!docs.length)docs=DEMO.docs.slice(0,3);
      A.cache.docs=docs;
      dc.innerHTML=docs.map(d=>docCard(d)).join("");
      if(A.demo)dc.innerHTML+=`<div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;color:#F59E0B;background:#FFFBEB;border-radius:8px;margin-top:8px">⚠️ Demo mode — run DOCNEAR_FINAL.sql + DOCNEAR_V2.sql in Supabase SQL Editor</div>`;
    }catch(e){dc.innerHTML=DEMO.docs.slice(0,3).map(d=>docCard(d)).join("");}
  }
  DB.get("doctors","approved=eq.true&limit=1").then(()=>{A.demo=false;}).catch(()=>{A.demo=true;});
}

/* ════════ DOC CARD ════════ */
function docCard(d){
  const sc=(SPECS.find(s=>s.n===d.specialization)||{}).c||"#0A7FAF";
  const isFav=A.cache.favs?.includes(d.id);
  const sub=d.subscription==="yearly"?pill("⭐ Premium","#FEF3C7","#D97706"):d.subscription==="monthly"?pill("✓ Listed","#D1FAE5","#059669"):"";
  return `<div class="card" onclick="viewDoc('${d.id}')">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      ${avt(d.name,d.color||sc,54)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <div class="doc-name">${safe(d.name)}</div>
          ${d.video_consult?`<span style="font-size:11px" title="Video consult">🎥</span>`:""}
        </div>
        <div class="doc-spec">${safe(d.specialization)}</div>
        <div class="doc-meta">⭐ <strong>${d.rating||"New"}</strong>${d.reviews>0?` <span style="color:#9CA3AF">(${d.reviews})</span>`:""}</div>
        <div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">${sub}${d.district?`<span style="font-size:10px;color:#9CA3AF">📍 ${d.district}</span>`:""}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:18px;font-weight:800;color:#0A7FAF">₹${d.fee||0}</div>
        <div style="font-size:10px;color:#9CA3AF">per visit</div>
        ${A.role==="patient"?`<button onclick="event.stopPropagation();toggleFav('${d.id}')" style="background:none;border:none;cursor:pointer;font-size:15px;margin-top:3px">${isFav?"❤️":"🤍"}</button>`:""}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-size:11px;color:#6B7280">🏥 ${safe(d.hospital)||"—"}</span>
      <span style="font-size:11px;color:#6B7280">🏆 ${d.experience||0}y exp</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewDoc('${d.id}')">Profile</button>
      <button class="btn btn-primary" style="flex:1;padding:7px 0;font-size:12px" onclick="event.stopPropagation();bookDoc('${d.id}')">Book Now</button>
    </div>
  </div>`;
}

/* ════════ APPT CARD ════════ */
function apptCard(a,forDoc=false){
  const bc={confirmed:"#059669",pending:"#D97706",cancelled:"#DC2626",completed:"#7C4DFF"}[a.status]||"#D97706";
  return `<div class="appt-card" style="border-left:4px solid ${bc}">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
      <div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${forDoc?safe(a.patient_name):safe(a.doctor_name)}</div>
      <div style="font-size:12px;color:#6B7280">${safe(a.specialization)}</div></div>
      ${sPill(a.status)}
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;align-items:center">
      <span style="font-size:12px;color:#6B7280">📅 ${a.date}</span>
      <span style="font-size:12px;color:#6B7280">🕐 ${a.slot}</span>
      ${a.is_video?`<span style="font-size:11px;color:#7C4DFF;font-weight:600">🎥 Video</span>`:""}
      <span style="font-size:12px;font-weight:700;color:#0A7FAF;margin-left:auto">₹${a.fee}</span>
    </div>
    ${a.payment_status?`<div style="margin-top:6px">${pill(a.payment_status==="paid"?"💳 Paid":"⏳ Unpaid",a.payment_status==="paid"?"#D1FAE5":"#FEF3C7",a.payment_status==="paid"?"#059669":"#D97706")}</div>`:""}
    ${a.status==="confirmed"&&a.is_video&&a.meeting_link?`<button class="btn btn-purple btn-sm" style="margin-top:10px;width:100%" onclick="window.open('${a.meeting_link}','_blank')">🎥 Join Video Call</button>`:""}
  </div>`;
}

/* ════════ SEARCH ════════ */
async function rSearch(){
  const na=$("search-nav-actions");
  if(na)na.innerHTML=A.user?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${A.user.name||A.user.store_name||"User"}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`:`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login</button>`;
  if($("search-back-btn"))$("search-back-btn").onclick=()=>go(A.role==="patient"?"patientDash":"landing");
  const chips=$("search-chips");
  if(chips)chips.innerHTML=[{n:"All",i:""},...SPECS].map(s=>`<button class="chip ${(!A.spec&&s.n==="All")||A.spec===s.n?"active":""}" onclick="setSpec('${s.n==="All"?"":s.n}')">${s.i} ${s.n}</button>`).join("");
  const qi=$("search-q");if(qi)qi.value=A.q;
  await fetchDocs();
}
function setSpec(s){A.spec=s;rSearch();}
async function filterDoctors(){A.q=($("search-q")||{}).value||"";A.spec=($("search-spec")||{}).value||"";document.querySelectorAll(".chip").forEach(c=>{const isAll=c.textContent.trim().startsWith("All");c.classList.toggle("active",isAll?!A.spec:(!!A.spec&&c.textContent.includes(A.spec)));});await fetchDocs();}
async function fetchDocs(){
  const re=$("search-results"),ce=$("search-count");if(!re)return;
  spin("search-results","Finding doctors...");
  try{
    let q="approved=eq.true";
    if(A.spec)q+=`&specialization=eq.${enc(A.spec)}`;
    let docs=await safeGet("doctors",q,"docs");
    if(!docs.length)docs=DEMO.docs;
    if(A.spec)docs=docs.filter(d=>d.specialization===A.spec);
    if(A.q){const v=A.q.toLowerCase();docs=docs.filter(d=>safe(d.name).toLowerCase().includes(v)||safe(d.specialization).toLowerCase().includes(v)||safe(d.hospital).toLowerCase().includes(v));}
    A.cache.docs=[...A.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
    if(ce)ce.textContent=docs.length+" doctor"+(docs.length!==1?"s":"")+" found";
    re.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("🔍","No doctors found. Try different filters.");
  }catch(e){re.innerHTML=DEMO.docs.map(d=>docCard(d)).join("");}
}

/* ════════ PATIENT DASH ════════ */
async function rPatientDash(){
  if(!A.user){go("patientLogin");return;}
  const u=A.user;
  if($("pd-nav-name"))$("pd-nav-name").textContent=u.name;
  if($("pd-welcome"))$("pd-welcome").textContent="Hello, "+safe(u.name).split(" ")[0]+"! 👋";
  spin("pd-stats");spin("pd-appts","Loading appointments...");spin("pd-doctors","Loading doctors...");
  try{
    const[appts,docs]=await Promise.all([
      safeGet("appointments","patient_id=eq."+u.id),
      safeGet("doctors","approved=eq.true&limit=4","docs")
    ]);
    A.cache.appts=appts.length?appts:DEMO.appts.filter(a=>a.patient_id===u.id);
    A.cache.docs=docs.length?docs:DEMO.docs;
    if($("pd-stats"))$("pd-stats").innerHTML=
      sc("📅","Appointments",A.cache.appts.length)+
      sc("✅","Confirmed",A.cache.appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669")+
      sc("🎥","Video",A.cache.appts.filter(a=>a.is_video).length,"#EDE9FE","#7C4DFF")+
      sc("👨‍⚕️","Doctors",new Set(A.cache.appts.map(a=>a.doctor_id)).size,"#FEE9E1","#FF6B35");
    if($("pd-appts"))$("pd-appts").innerHTML=A.cache.appts.length?A.cache.appts.map(a=>apptCard(a)).join(""):empty("📋","No appointments yet.",`<button class="btn btn-primary btn-sm" onclick="go('search')">Book Now</button>`);
    if($("pd-doctors"))$("pd-doctors").innerHTML=A.cache.docs.map(d=>docCard(d)).join("");
  }catch(e){toast("Error: "+e.message,true);}
}

/* ════════ DOCTOR DASH ════════ */
async function rDoctorDash(){
  if(!A.user){go("doctorLogin");return;}
  const u=A.user;
  if($("dd-nav-name"))$("dd-nav-name").textContent=u.name;
  if($("dd-welcome"))$("dd-welcome").textContent="Welcome, "+safe(u.name)+"! 👨‍⚕️";
  if($("dd-meta"))$("dd-meta").innerHTML=`<span>🩺 ${safe(u.specialization)}</span><span>🏥 ${safe(u.hospital)}</span>`;
  if($("dd-pending-alert"))$("dd-pending-alert").style.display=u.approved?"none":"flex";
  spin("dd-stats");spin("dd-today-appts","Loading...");spin("dd-all-appts","Loading...");
  try{
    const appts=await safeGet("appointments","doctor_id=eq."+u.id);
    const todayA=appts.filter(a=>a.date===td());
    const rev=appts.filter(a=>a.payment_status==="paid").reduce((s,a)=>s+a.fee,0);
    if($("dd-stats"))$("dd-stats").innerHTML=
      sc("📅","Total",appts.length)+sc("🌅","Today",todayA.length,"#FEE9E1","#FF6B35")+
      sc("💰","Revenue","₹"+rev.toLocaleString(),"#EDE9FE","#7C4DFF")+
      sc("✅","Confirmed",appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669");
    if($("dd-today-appts"))$("dd-today-appts").innerHTML=todayA.length?todayA.map(a=>apptCard(a,true)).join(""):empty("🌿","No appointments today.");
    if($("dd-all-appts"))$("dd-all-appts").innerHTML=appts.length?appts.map(a=>apptCard(a,true)).join(""):empty("📭","No appointments yet.");
    if($("dd-status-pill"))$("dd-status-pill").innerHTML=pill(u.approved?"✓ Approved":"⏳ Pending",u.approved?"#D1FAE5":"#FEF3C7",u.approved?"#059669":"#D97706");
    if($("dd-profile-grid"))$("dd-profile-grid").innerHTML=[
      ["🩺","Specialization",u.specialization],["🏥","Hospital",u.hospital],
      ["📍","Location",u.district||u.city||u.location],["📋","Reg. No.",u.reg_number],
      ["💰","Fee","₹"+u.fee],["💼","Experience",(u.experience||0)+" yrs"],
      ["📞","Phone",u.phone],["🎓","Qualifications",u.qualifications],
      ["💎","Subscription",(u.subscription||"—").toUpperCase()]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
    if($("dd-about"))$("dd-about").textContent=u.about||"";
    if($("dd-slots"))$("dd-slots").innerHTML=(u.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("");
  }catch(e){toast("Error: "+e.message,true);}
}

/* ════════ STORE DASH ════════ */
async function rStoreDash(){
  if(!A.user){go("storeLogin");return;}
  const u=A.user;
  if($("sd-nav-name"))$("sd-nav-name").textContent=u.store_name;
  if($("sd-welcome"))$("sd-welcome").textContent="Welcome, "+safe(u.store_name)+"! 💊";
  spin("sd-stats");spin("sd-orders","Loading orders...");
  try{
    const orders=await safeGet("prescription_orders","store_id=eq."+u.id);
    if($("sd-stats"))$("sd-stats").innerHTML=
      sc("📋","Total Orders",orders.length)+
      sc("⏳","Pending",orders.filter(o=>o.status==="pending").length,"#FEF3C7","#D97706")+
      sc("✅","Completed",orders.filter(o=>o.status==="completed").length,"#D1FAE5","#059669")+
      sc("💰","Revenue","₹"+orders.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+(o.total_amount||0),0).toLocaleString(),"#EDE9FE","#7C4DFF");
    if($("sd-orders"))$("sd-orders").innerHTML=orders.length
      ?orders.map(o=>`<div class="appt-card" style="border-left:4px solid ${{"pending":"#D97706","accepted":"#0A7FAF","packed":"#7C4DFF","delivered":"#059669","completed":"#059669","rejected":"#DC2626"}[o.status]||"#9CA3AF"}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div><div style="font-size:14px;font-weight:700">${safe(o.patient_name)||"Patient"}</div><div style="font-size:12px;color:#6B7280">📞 ${safe(o.patient_phone)||"—"}</div></div>
          ${pill((o.status||"pending").toUpperCase())}
        </div>
        ${o.notes?`<div style="font-size:12px;color:#6B7280">📝 ${o.notes}</div>`:""}
        ${o.is_urgent?`<span style="font-size:11px;background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:6px;font-weight:600">🚨 URGENT</span>`:""}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          ${o.status==="pending"?`<button class="btn btn-green btn-sm" onclick="updateOrder('${o.id}','accepted')">✅ Accept</button><button class="btn btn-red btn-sm" onclick="updateOrder('${o.id}','rejected')">❌ Reject</button>`:""}
          ${o.status==="accepted"?`<button class="btn btn-primary btn-sm" onclick="updateOrder('${o.id}','packed')">📦 Packed</button>`:""}
          ${o.status==="packed"?`<button class="btn btn-green btn-sm" onclick="updateOrder('${o.id}','delivered')">🚴 Delivered</button>`:""}
        </div>
      </div>`).join("")
      :empty("📋","No orders yet. Prescription orders from patients will appear here.");
    if($("sd-info"))$("sd-info").innerHTML=[
      ["🏪","Store Name",u.store_name],["👤","Owner",u.owner_name],
      ["📞","Phone",u.phone],["📍","Address",u.address||u.district],
      ["🕐","Hours",u.is_24x7?"24×7":(u.opening_time||"09:00")+" - "+(u.closing_time||"21:00")],
      ["🚴","Delivery",u.delivery_available?u.delivery_radius_km+"km":"Not Available"],
      ["💊","Drug License",u.drug_license_no||"—"],["✅","Status",u.approved?"Approved":"Pending"]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
  }catch(e){toast("Error: "+e.message,true);}
}
async function updateOrder(id,status){
  try{await DB.patch("prescription_orders","id=eq."+id,{status}).catch(()=>{});toast("Order: "+status);rStoreDash();}catch(e){toast(e.message,true);}
}

/* ════════ AMBULANCE DASH ════════ */
async function rAmbuDash(){
  if(!A.user){go("ambuLogin");return;}
  const u=A.user;
  if($("amd-nav-name"))$("amd-nav-name").textContent=u.operator_name;
  if($("amd-welcome"))$("amd-welcome").textContent="Welcome, "+safe(u.operator_name)+"! 🚑";
  if($("amd-stats"))$("amd-stats").innerHTML=
    sc("🚑","Vehicle",safe(u.vehicle_number)||"—")+
    sc("📍","Location",safe(u.base_location||u.district)||"—","#FEE9E1","#FF6B35")+
    sc("💰","Base Fare","₹"+(u.base_fare||0),"#EDE9FE","#7C4DFF")+
    sc("🛣️","Per KM","₹"+(u.per_km_rate||0),"#D1FAE5","#059669");
  if($("amd-avail-btn")){
    const av=u.availability_status||"offline";
    $("amd-avail-btn").textContent=av==="available"?"🟢 Available — Click to go Offline":av==="busy"?"🟡 Busy":"🔴 Offline — Click to go Online";
    $("amd-avail-btn").style.background=av==="available"?"#059669":av==="busy"?"#D97706":"#DC2626";
  }
  if($("amd-info"))$("amd-info").innerHTML=[
    ["🚑","Vehicle No.",u.vehicle_number],["🚗","Type",u.vehicle_type],
    ["📞","Phone",u.phone],["📞","Alt. Phone",u.alternate_phone],
    ["📍","Base Location",u.base_location||u.district],
    ["💰","Base Fare","₹"+(u.base_fare||0)],["🛣️","Per KM","₹"+(u.per_km_rate||0)],
    ["🌙","Night Extra","₹"+(u.night_charge_extra||0)],
    ["📐","Service Radius",(u.service_radius_km||0)+" km"],
    ["💎","Subscription",(u.subscription||"—").toUpperCase()],
    ["✅","Status",u.approved?"Approved":"Pending Review"]
  ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
  if($("amd-equipment"))$("amd-equipment").innerHTML=[
    ["🩸","Oxygen",u.has_oxygen],["🛏️","Stretcher",u.has_stretcher],
    ["📊","Monitor",u.has_monitor],["💨","Ventilator",u.has_ventilator],["⚡","Defibrillator",u.has_defibrillator]
  ].map(([ic,n,has])=>`<span style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:${has?"#D1FAE5":"#F3F4F6"};color:${has?"#059669":"#9CA3AF"}">${ic} ${n}: ${has?"✓":"✗"}</span>`).join("");
}
async function toggleAvailability(){
  if(!A.user)return;
  const cur=A.user.availability_status||"offline";
  const next=cur==="available"?"offline":"available";
  try{await DB.patch("ambulances","id=eq."+A.user.id,{availability_status:next}).catch(()=>{});A.user.availability_status=next;S.save(A.user,"ambulance");toast("Status: "+next);rAmbuDash();}
  catch(e){toast(e.message,true);}
}

/* ════════ LAB DASH ════════ */
async function rLabDash(){
  if(!A.user){go("labLogin");return;}
  const u=A.user;
  if($("ld-nav-name"))$("ld-nav-name").textContent=u.lab_name;
  if($("ld-welcome"))$("ld-welcome").textContent="Welcome, "+safe(u.lab_name)+"! 🔬";
  spin("ld-stats");spin("ld-bookings","Loading...");spin("ld-tests","Loading tests...");
  try{
    const[bk,tests]=await Promise.all([
      safeGet("lab_bookings","lab_id=eq."+u.id),
      safeGet("lab_tests","lab_id=eq."+u.id+"&is_active=eq.true")
    ]);
    if($("ld-stats"))$("ld-stats").innerHTML=
      sc("📅","Bookings",bk.length)+sc("⏳","Pending",bk.filter(b=>b.status==="booked").length,"#FEF3C7","#D97706")+
      sc("✅","Completed",bk.filter(b=>b.status==="completed").length,"#D1FAE5","#059669")+
      sc("🧪","Tests",tests.length,"#EDE9FE","#7C4DFF");
    if($("ld-bookings"))$("ld-bookings").innerHTML=bk.length?bk.map(b=>`<div class="appt-card" style="border-left:4px solid #7C4DFF"><div style="font-size:14px;font-weight:700">${safe(b.patient_name)||"Patient"}</div><div style="font-size:12px;color:#6B7280">📅 ${b.scheduled_date||"—"} · ${safe(b.collection_type)}</div><div style="margin-top:6px">${sPill(b.status)}</div></div>`).join(""):empty("📅","No bookings yet.");
    if($("ld-tests"))$("ld-tests").innerHTML=tests.length?`<div style="display:grid;gap:8px">`+tests.map(t=>`<div style="background:#F9FAFB;border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><div style="font-size:13px;font-weight:600;color:#1A2B3C">${t.test_name}</div><div style="font-size:11px;color:#9CA3AF">${t.category} · ${t.report_time||"Same Day"}</div></div><div style="font-size:16px;font-weight:800;color:#7C4DFF">₹${t.price}</div></div>`).join("")+"</div>":empty("🧪","No tests added yet.",`<button class="btn btn-purple btn-sm" onclick="showAddTestForm()">+ Add Test</button>`);
    if($("ld-info"))$("ld-info").innerHTML=[
      ["🔬","Lab Name",u.lab_name],["👤","Owner",u.owner_name],
      ["📞","Phone",u.phone],["📍","Address",u.address||u.district],
      ["🏷️","Lab Type",(u.lab_type||"").replace("_"," ")],["📋","License No.",u.lab_registration_no],
      ["🏠","Home Collection",u.home_collection?"Yes - ₹"+u.home_collection_charge:"No"],
      ["💎","Subscription",(u.subscription||"—").toUpperCase()],
      ["✅","Status",u.approved?"Approved":"Pending"]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
  }catch(e){toast("Error: "+e.message,true);}
}
function showAddTestForm(){const f=$("add-test-form");if(f)f.style.display=f.style.display==="none"?"block":"none";}
async function addLabTest(){
  if(!A.user)return;
  const name=gv("test-name"),cat=gv("test-cat"),price=gv("test-price"),time=gv("test-time");
  if(!name||!cat||!price){toast("Fill all fields.",true);return;}
  try{await DB.post("lab_tests",{lab_id:A.user.id,test_name:name,category:cat,price:parseInt(price),report_time:time||"Same Day",is_active:true,home_available:A.user.home_collection||false});toast("Test added! 🧪");if($("add-test-form"))$("add-test-form").style.display="none";rLabDash();}catch(e){toast(e.message,true);}
}

/* ════════ VIEWS ════════ */
async function viewDoc(id){
  A.doc=A.cache.docs.find(d=>d.id===id)||DEMO.docs.find(d=>d.id===id);
  if(!A.doc){try{const r=await DB.get("doctors","id=eq."+id);if(r.length)A.doc=r[0];}catch{}}
  go("profile");
}
function bookDoc(id){
  if(!A.user||A.role!=="patient"){toast("Login as patient to book.",true);go("patientLogin");return;}
  A.doc=A.cache.docs.find(d=>d.id===id)||DEMO.docs.find(d=>d.id===id)||A.doc;
  A.slot="";go("book");
}
async function toggleFav(id){
  if(!A.user||A.role!=="patient"){toast("Login to save.",true);return;}
  if(!A.cache.favs)A.cache.favs=[];
  const isFav=A.cache.favs.includes(id);
  if(isFav){await DB.del("favorite_doctors",`patient_id=eq.${A.user.id}&doctor_id=eq.${id}`).catch(()=>{});A.cache.favs=A.cache.favs.filter(x=>x!==id);toast("Removed ✓");}
  else{await DB.post("favorite_doctors",{patient_id:A.user.id,doctor_id:id}).catch(()=>{});A.cache.favs=[...A.cache.favs,id];toast("Saved ❤️");}
  fetchDocs();
}

/* ════════ PROFILE ════════ */
async function rProfile(){
  const d=A.doc;if(!d){go("search");return;}
  const na=$("profile-nav-actions");
  if(na)na.innerHTML=A.user?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${A.user.name||"User"}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`:`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login to Book</button>`;
  let reviews=[];try{reviews=await DB.get("doctor_reviews","doctor_id=eq."+d.id);}catch{}
  const stars=[1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(d.rating||0)?'#F59E0B':'#E5E7EB'};font-size:16px">★</span>`).join("");
  if($("profile-content"))$("profile-content").innerHTML=`
    <div class="profile-header">
      <div style="display:flex;gap:18px;margin-bottom:18px;flex-wrap:wrap">
        ${avt(d.name,d.color||"#0A7FAF",74)}
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:clamp(18px,4vw,24px);font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(d.name)}</h2>
          <div style="font-size:14px;color:#0A7FAF;font-weight:700;margin-bottom:8px">${safe(d.specialization)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${pill((d.experience||0)+" yrs exp")}
            ${d.rating>0?pill("★ "+d.rating,"#FEF3C7","#D97706"):""}
            ${d.reviews>0?pill(d.reviews+" reviews","#F3F4F6","#6B7280"):""}
            ${d.approved?pill("✓ Verified","#D1FAE5","#059669"):""}
            ${d.video_consult?pill("🎥 Video","#EDE9FE","#7C4DFF"):""}
          </div>
        </div>
        <div style="text-align:right"><div style="font-size:28px;font-weight:800;color:#0A7FAF">₹${d.fee}</div><div style="font-size:11px;color:#9CA3AF">per visit</div></div>
      </div>
      <div class="profile-info-grid">
        ${[["🏥","Hospital",d.hospital],["📍","Location",d.district||d.city||d.location],["📋","Reg. No.",d.reg_number],["📞","Phone",d.phone],["🎓","Qualifications",d.qualifications],["🌐","Languages",(d.languages||["Telugu","English"]).join(", ")]].map(([ic,l,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}
      </div>
      ${d.about?`<p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${safe(d.about)}</p>`:""}
      ${d.rating>0?`<div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #F3F4F6;margin-bottom:14px">${stars}<span style="font-size:14px;font-weight:700">${d.rating}</span><span style="font-size:12px;color:#9CA3AF">(${d.reviews})</span></div>`:""}
      <div style="display:grid;grid-template-columns:1fr${d.video_consult?" 1fr":""}; gap:10px">
        <button class="btn btn-primary btn-full" onclick="A.type='inperson';bookDoc('${d.id}')">📅 Book Appointment</button>
        ${d.video_consult?`<button class="btn btn-purple btn-full" onclick="A.type='video';bookDoc('${d.id}')">🎥 Video Consult</button>`:""}
      </div>
    </div>
    <div class="profile-slots-wrap" style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Available Slots</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${(d.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("")}</div>
    </div>
    ${reviews.length?`<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05)"><div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Patient Reviews</div>${reviews.slice(0,3).map(r=>`<div style="padding:10px 0;border-bottom:1px solid #F3F4F6"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px"><div style="font-size:13px;font-weight:700">${safe(r.patient_name)||"Patient"}</div><div>${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.rating?"#F59E0B":"#E5E7EB"};font-size:12px">★</span>`).join("")}</div></div><div style="font-size:13px;color:#374151">${safe(r.comment)}</div></div>`).join("")}</div>`:""}`;
}

/* ════════ BOOK ════════ */
async function rBook(){
  const d=A.doc;if(!d){go("search");return;}
  const c=$("book-content");
  if(!A.user||A.role!=="patient"){c.innerHTML=`<div style="text-align:center;padding:40px 0"><div style="font-size:56px;margin-bottom:14px">🔒</div><h3 style="font-family:'Lora',serif;font-size:22px;color:#1A2B3C;margin-bottom:8px">Login Required</h3><p style="color:#6B7280;font-size:14px;margin-bottom:20px">Patient login చేయండి</p><button class="btn btn-primary" onclick="go('patientLogin')">Patient Login</button></div>`;return;}
  A.slot="";
  let booked=[];try{const av=await DB.get("doctor_availability",`doctor_id=eq.${d.id}&date=eq.${td()}`);if(av.length)booked=av[0].booked_slots||[];}catch{}
  const isV=A.type==="video";
  c.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;display:flex;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${avt(d.name,d.color||"#0A7FAF",48)}
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:#1A2B3C">${safe(d.name)}</div>
      <div style="font-size:12px;color:#0A7FAF;font-weight:600">${safe(d.specialization)}</div>
      <div style="font-size:12px;color:#9CA3AF">🏥 ${safe(d.hospital)}</div></div>
      <div style="font-size:20px;font-weight:800;color:#0A7FAF">₹${d.fee}</div>
    </div>
    ${d.video_consult?`<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-label" style="margin-bottom:10px">Appointment Type</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button id="type-inp" class="slot-btn ${!isV?"active":""}" onclick="A.type='inperson';setBookType()">🏥 In-Person</button>
        <button id="type-vid" class="slot-btn ${isV?"active":""}" onclick="A.type='video';setBookType()">🎥 Video Consult</button>
      </div></div>`:""}
    <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-group"><label class="form-label">Date <span>*</span></label>
        <input type="date" id="book-date" class="form-input" min="${td()}" onchange="onDateChange()"/></div>
      <div class="form-group"><label class="form-label">Time Slot <span>*</span></label>
        <div class="slot-grid" id="slot-grid">
          ${(d.slots||[]).map(s=>{const b=booked.includes(s);return `<button class="slot-btn${b?" slot-blocked":""}" ${b?"disabled":""} onclick="${b?"":"pickSlot('"+s+"')"}">${s}${b?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("")}
        </div></div>
      <div id="book-summary" style="display:none;background:#F0FDF4;border-radius:10px;padding:14px;border:1px solid #A7F3D0;margin-top:12px">
        <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px">📋 Booking Summary</div>
        <div id="bsum" style="font-size:13px;color:#047857;line-height:1.8"></div>
        <div style="font-size:15px;font-weight:800;color:#0A7FAF;margin-top:6px">Total: ₹${d.fee}</div>
      </div>
    </div>
    <button class="btn btn-primary btn-full" id="confirm-btn" onclick="confirmBook()" style="font-size:15px;padding:14px">Confirm Booking — ₹${d.fee}</button>`;
}
function setBookType(){const isV=A.type==="video";[$("type-inp"),$("type-vid")].forEach((b,i)=>b&&b.classList.toggle("active",i===0?!isV:isV));updateBookSum();}
function pickSlot(s){A.slot=s;document.querySelectorAll(".slot-btn:not(.slot-blocked)").forEach(b=>b.classList.toggle("active",b.textContent.trim().startsWith(s)));updateBookSum();}
async function onDateChange(){
  const date=($("book-date")||{}).value;if(!date||!A.doc)return;
  try{const av=await DB.get("doctor_availability",`doctor_id=eq.${A.doc.id}&date=eq.${date}`);const b=av.length?av[0].booked_slots||[]:[];const sg=$("slot-grid");if(sg)sg.innerHTML=(A.doc.slots||[]).map(s=>{const bl=b.includes(s);return `<button class="slot-btn${bl?" slot-blocked":""}" ${bl?"disabled":""} onclick="${bl?"":"pickSlot('"+s+"')"}">${s}${bl?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("");}catch{}
  updateBookSum();
}
function updateBookSum(){
  const date=($("book-date")||{}).value,sb=$("book-summary"),st=$("bsum");
  if(sb&&st&&date&&A.slot){sb.style.display="block";st.innerHTML=`📅 ${date}<br>🕐 ${A.slot}<br>👤 ${A.user.name}<br>${A.type==="video"?"🎥 Video Consultation":"🏥 In-Person"}`;}else if(sb)sb.style.display="none";
}
async function confirmBook(){
  const date=($("book-date")||{}).value;
  if(!date){toast("Date select చేయండి.",true);return;}
  if(!A.slot){toast("Slot select చేయండి.",true);return;}
  const d=A.doc,btn=$("confirm-btn");
  if(btn){btn.disabled=true;btn.textContent="Booking...";}
  try{
    const isV=A.type==="video";
    const ml=isV?"https://meet.jit.si/docnear-"+(crypto.randomUUID?crypto.randomUUID().slice(0,10):Date.now()):null;
    await safePost("appointments",{
      patient_id:A.user.id,patient_name:A.user.name,doctor_id:d.id,doctor_name:d.name,
      specialization:d.specialization,date,slot:A.slot,status:"confirmed",
      fee:d.fee,payment_status:"pending",is_video:isV,meeting_link:ml
    },data=>[{...data,id:"ap_"+Date.now()}]);
    DB.post("notifications",{user_id:d.id,user_type:"doctor",title:"New Appointment 📅",message:`${A.user.name} — ${date} at ${A.slot}${isV?" (Video)":""}`,type:"info"}).catch(()=>{});
    if(isV&&ml){toast("Booking confirmed! 🎥");setTimeout(()=>{if(confirm("Join video call now?\n"+ml))window.open(ml,"_blank");},1200);}
    else toast("Appointment booked! 🎉");
    go("patientDash");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Confirm Booking — ₹"+(A.doc?.fee||0);}}
}

/* ════════ STORES ════════ */
async function rStores(){
  const listEl=$("stores-list");if(!listEl)return;spin("stores-list");
  try{
    let stores=await safeGet("medical_stores","approved=eq.true&is_active=eq.true","stores");
    if(!stores.length)stores=DEMO.stores;
    A.cache.stores=stores;
    listEl.innerHTML=stores.map(s=>storeCard(s)).join("");
  }catch(e){listEl.innerHTML=DEMO.stores.map(s=>storeCard(s)).join("");}
}
function storeCard(s){
  const now=new Date(),cur=now.getHours()*60+now.getMinutes();
  let isOpen=s.is_24x7;
  if(!isOpen&&s.opening_time&&s.closing_time){try{const[oh,om]=s.opening_time.split(":").map(Number);const[ch,cm]=s.closing_time.split(":").map(Number);isOpen=cur>=oh*60+om&&cur<=ch*60+cm;}catch{isOpen=true;}}
  return `<div class="card" onclick="viewStore('${s.id}')">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${s.color||"#10B981"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">💊</div>
      <div style="flex:1;min-width:0">
        <div class="doc-name">${safe(s.store_name)}</div>
        <div style="font-size:12px;color:#6B7280">👤 ${safe(s.owner_name)}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          ${pill(isOpen?"🟢 Open":"🔴 Closed",isOpen?"#D1FAE5":"#FEE2E2",isOpen?"#059669":"#DC2626")}
          ${s.delivery_available?pill("🚴 Delivery","#E3F4FC","#0A7FAF"):pill("Pickup Only","#F3F4F6","#9CA3AF")}
          ${s.is_24x7?pill("24×7","#EDE9FE","#7C4DFF"):""}
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">📍 ${safe(s.address||s.district)||"—"}${s.delivery_available?` · 🚴 ${s.delivery_radius_km}km`:""}</div>
    <div style="display:flex;gap:8px">
      <a href="tel:${s.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">📞 Call</a>
      <button class="btn btn-green" style="flex:1;padding:7px 0;font-size:12px" onclick="event.stopPropagation();prescForStore('${s.id}')">📋 Order Medicines</button>
    </div>
  </div>`;
}
function viewStore(id){A.store=A.cache.stores.find(s=>s.id===id);go("storeDetail");}
function rStoreDetail(){
  const s=A.store;if(!s){go("stores");return;}
  if($("store-detail-content"))$("store-detail-content").innerHTML=`<div class="profile-header">
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
      <div style="width:64px;height:64px;border-radius:16px;background:${s.color||"#10B981"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">💊</div>
      <div style="flex:1;min-width:160px"><h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(s.store_name)}</h2><div style="font-size:13px;color:#6B7280">👤 ${safe(s.owner_name)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${s.approved?pill("✓ Verified","#D1FAE5","#059669"):""}${s.is_24x7?pill("24×7","#EDE9FE","#7C4DFF"):""}${s.delivery_available?pill("🚴 Delivery","#E3F4FC","#0A7FAF"):""}</div>
      </div>
    </div>
    <div class="profile-info-grid">${[["📍","Address",s.address||s.district],["📞","Phone",s.phone],["🕐","Hours",s.is_24x7?"24×7":(s.opening_time||"09:00")+" - "+(s.closing_time||"21:00")],["🚴","Delivery",s.delivery_available?s.delivery_radius_km+"km":"Not Available"],["⭐","Rating",s.rating>0?s.rating+"/5":"New"]].map(([ic,l,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <a href="tel:${s.phone}" class="btn btn-outline btn-full">📞 Call Now</a>
      <button class="btn btn-green btn-full" onclick="prescForStore('${s.id}')">📋 Order Medicines</button>
    </div>
  </div>`;
}
function prescForStore(id){A.store=A.cache.stores.find(s=>s.id===id)||A.store;go("prescOrder");}

/* ════════ PRESCRIPTION ORDER ════════ */
function rPrescOrder(){
  if(!A.user||A.role!=="patient"){toast("Login as patient first.",true);go("patientLogin");return;}
  const c=$("presc-content");if(!c)return;
  c.innerHTML=`<div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
    ${A.store?`<div style="display:flex;gap:12px;align-items:center;padding:12px;background:#F0FDF4;border-radius:12px;margin-bottom:16px"><span style="font-size:24px">💊</span><div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${safe(A.store.store_name)}</div><div style="font-size:12px;color:#059669">Sending to this store</div></div><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="A.store=null;rPrescOrder()">Change</button></div>`:`<div class="alert alert-info" style="margin-bottom:14px">ℹ️ Prescription will be sent to all nearby verified stores</div>`}
    <div class="form-group"><label class="form-label">Doctor's Prescription Photo <span>*</span></label>
      <div class="upload-area" id="presc-area" onclick="$('presc-file').click()"><div style="font-size:40px;margin-bottom:8px">📸</div><div style="font-size:14px;font-weight:600;color:#0A7FAF">Click to upload prescription</div><div style="font-size:12px;color:#9CA3AF;margin-top:4px">JPG, PNG, PDF · Max 5MB</div></div>
      <input type="file" id="presc-file" accept="image/*,.pdf" style="display:none" onchange="onPrescFile(event)"/>
      <div id="presc-prev" style="display:none;margin-top:10px"></div>
    </div>
    <div class="form-group"><label class="form-label">Delivery Address <span>*</span></label><textarea id="presc-addr" class="form-input" rows="2" placeholder="Full delivery address..."></textarea></div>
    <div class="form-group"><label class="form-label">Notes</label><input id="presc-notes" class="form-input" placeholder="e.g. Urgent, substitute medicines ok..."/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px">
      <button id="urg-no" class="slot-btn active" onclick="window._urg=false;$('urg-no').classList.add('active');$('urg-yes').classList.remove('active')">Normal</button>
      <button id="urg-yes" class="slot-btn" onclick="window._urg=true;$('urg-yes').classList.add('active');$('urg-no').classList.remove('active')">🚨 Urgent</button>
    </div>
  </div>
  <button class="btn btn-green btn-full" id="presc-btn" onclick="submitPrescOrder()" style="font-size:15px;padding:14px">📋 Submit Prescription Order</button>`;
  window._urg=false;window._pFile=null;
}
function onPrescFile(e){
  const file=e.target.files[0];if(!file)return;window._pFile=file;
  const prev=$("presc-prev");
  if(file.type.startsWith("image/")){const r=new FileReader();r.onload=ev=>{prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;max-height:200px;object-fit:contain;border-radius:8px;border:1px solid #E5E7EB"/>`;prev.style.display="block";};r.readAsDataURL(file);}
  else{prev.innerHTML=`<div style="padding:10px;background:#F0FDF4;border-radius:8px;color:#059669">📄 ${file.name}</div>`;prev.style.display="block";}
  const a=$("presc-area");if(a){a.style.borderColor="#10B981";a.innerHTML=`<div style="font-size:30px;margin-bottom:6px">✅</div><div style="font-size:13px;font-weight:600;color:#059669">${file.name}</div>`;}
}
async function submitPrescOrder(){
  if(!window._pFile){toast("Upload prescription photo.",true);return;}
  const addr=($("presc-addr")||{}).value?.trim();
  if(!addr){toast("Enter delivery address.",true);return;}
  const btn=$("presc-btn");if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try{
    await safePost("prescription_orders",{
      patient_id:A.user.id,patient_name:A.user.name,patient_phone:A.user.phone,
      store_id:A.store?.id||null,store_name:A.store?.store_name||null,
      prescription_url:"presc_"+Date.now()+".jpg",delivery_address:addr,
      notes:($("presc-notes")||{}).value||"",is_urgent:window._urg||false,
      status:"pending",payment_mode:"cod"
    },d=>[{...d,id:"rx_"+Date.now()}]);
    toast("Prescription submitted! 🎉 Store will contact you soon.");
    window._pFile=null;go("patientOrders");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="📋 Submit Prescription Order";}}
}

/* ════════ PATIENT ORDERS ════════ */
async function rPatientOrders(){
  if(!A.user){go("patientLogin");return;}
  const c=$("orders-content");if(!c)return;spin("orders-content");
  try{
    const orders=await safeGet("prescription_orders","patient_id=eq."+A.user.id);
    const sc2={pending:"#D97706",accepted:"#0A7FAF",packed:"#7C4DFF",delivered:"#059669",completed:"#059669",rejected:"#DC2626"};
    c.innerHTML=orders.length?orders.map(o=>`<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.05);border-left:4px solid ${sc2[o.status]||"#9CA3AF"}">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <div><div style="font-size:13px;font-weight:700">${safe(o.store_name)||"Sent to nearby stores"}</div><div style="font-size:11px;color:#9CA3AF">${new Date(o.created_at||Date.now()).toLocaleDateString()}</div></div>
        ${pill((o.status||"pending").replace("_"," ").toUpperCase(),(sc2[o.status]||"#9CA3AF")+"22",sc2[o.status]||"#9CA3AF")}
      </div>
      ${o.notes?`<div style="font-size:12px;color:#6B7280">📝 ${o.notes}</div>`:""}
      ${o.is_urgent?`<span style="font-size:11px;background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:6px;font-weight:600">🚨 URGENT</span>`:""}
    </div>`).join(""):empty("📋","No orders yet.",`<button class="btn btn-green btn-sm" onclick="go('prescOrder')">Upload Prescription</button>`);
  }catch(e){c.innerHTML=empty("⚠️",e.message);}
}

/* ════════ AMBULANCE ════════ */
async function rAmbulance(){
  const listEl=$("ambu-list");if(!listEl)return;spin("ambu-list");
  try{
    let ambus=await safeGet("ambulances","approved=eq.true","ambus");
    if(!ambus.length)ambus=DEMO.ambus;
    A.cache.ambus=ambus;
    listEl.innerHTML=ambus.map(a=>`<div class="card">
      <div style="display:flex;gap:12px;margin-bottom:10px">
        <div style="width:52px;height:52px;border-radius:12px;background:${a.color||"#EF4444"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🚑</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:700;color:#1A2B3C">${safe(a.operator_name)}</div>
          <div style="font-size:12px;color:#6B7280">${safe(a.vehicle_type)}</div>
          <div style="font-size:11px;color:#9CA3AF">${safe(a.vehicle_number)||""} · 📍 ${safe(a.base_location||a.district)||"—"}</div>
        </div>
        ${sPill(a.availability_status||"offline")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;color:#9CA3AF;margin-bottom:1px">Base Fare</div><div style="font-size:13px;font-weight:700;color:#DC2626">₹${a.base_fare||0}</div></div>
        <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;color:#9CA3AF;margin-bottom:1px">Per KM</div><div style="font-size:13px;font-weight:700;color:#DC2626">₹${a.per_km_rate||0}</div></div>
        <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;color:#9CA3AF;margin-bottom:1px">Radius</div><div style="font-size:13px;font-weight:700;color:#DC2626">${a.service_radius_km||0}km</div></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${a.has_oxygen?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">🩸 Oxygen</span>`:""}
        ${a.has_stretcher?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">🛏️ Stretcher</span>`:""}
        ${a.has_monitor?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">📊 Monitor</span>`:""}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <a href="tel:${a.phone}" class="btn btn-outline btn-full">📞 Call Now</a>
        <a href="tel:${a.alternate_phone||a.phone}" class="btn btn-red btn-full">🚑 Emergency</a>
      </div>
    </div>`).join("");
  }catch(e){listEl.innerHTML=DEMO.ambus.map(a=>`<div class="card"><div style="font-size:15px;font-weight:700;margin-bottom:8px">${safe(a.operator_name)}</div><a href="tel:${a.phone}" class="btn btn-red btn-full">📞 ${a.phone}</a></div>`).join("");}
}

/* ════════ LABS ════════ */
async function rLabsPage(){
  const listEl=$("labs-list");if(!listEl)return;spin("labs-list");
  try{
    let labs=await safeGet("diagnostic_labs","approved=eq.true&is_active=eq.true","labs");
    if(!labs.length)labs=DEMO.labs;
    A.cache.labs=labs;
    const tf=($("labs-type")||{}).value||"";
    const fl=tf?labs.filter(l=>l.lab_type===tf):labs;
    listEl.innerHTML=fl.map(l=>labCard(l)).join("");
  }catch(e){listEl.innerHTML=DEMO.labs.map(l=>labCard(l)).join("");}
}
function labCard(l){
  const ti={pathology:"🧪",radiology:"🩻",home_collection:"🏠",full_service:"🔬"};
  return `<div class="card" onclick="viewLab('${l.id}')">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${ti[l.lab_type]||"🔬"}</div>
      <div style="flex:1;min-width:0">
        <div class="doc-name">${safe(l.lab_name)}</div>
        <div style="font-size:12px;color:#7C4DFF;font-weight:600">${(l.lab_type||"").replace("_"," ").toUpperCase()}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          ${l.nabl_accredited?pill("NABL","#D1FAE5","#059669"):""}
          ${l.home_collection?pill("🏠 Home","#EDE9FE","#7C4DFF"):""}
          ${l.rating>0?pill("⭐"+l.rating,"#FEF3C7","#D97706"):""}
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">📍 ${safe(l.address||l.district)||"—"}${l.home_collection?` · 🏠 ₹${l.home_collection_charge}`:""}</div>
    <div style="display:flex;gap:8px">
      <a href="tel:${l.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">📞 Call</a>
      <button class="btn btn-purple" style="flex:1;padding:7px 0;font-size:12px" onclick="event.stopPropagation();viewLab('${l.id}')">Book Tests</button>
    </div>
  </div>`;
}
async function viewLab(id){
  A.lab=A.cache.labs.find(l=>l.id===id)||DEMO.labs.find(l=>l.id===id);go("labDetail");
}
async function rLabDetail(){
  const l=A.lab;if(!l){go("labsPage");return;}
  const c=$("lab-detail-content");if(!c)return;spin("lab-detail-content");
  let tests=[];try{tests=await DB.get("lab_tests",`lab_id=eq.${l.id}&is_active=eq.true`);}catch{tests=DEMO.labTests?DEMO.labTests.filter(t=>t.lab_id===l.id):[];}
  const groups={};tests.forEach(t=>{groups[t.category]=groups[t.category]||[];groups[t.category].push(t);});
  const cc={Blood:"#FF4757",Urine:"#FF6B35",Radiology:"#2196F3",Package:"#009688",Special:"#F59E0B"};
  c.innerHTML=`<div class="profile-header">
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
      <div style="width:64px;height:64px;border-radius:16px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">🔬</div>
      <div style="flex:1;min-width:160px"><h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(l.lab_name)}</h2>
        <div style="font-size:13px;color:#7C4DFF;font-weight:600">${(l.lab_type||"").replace("_"," ").toUpperCase()}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${l.nabl_accredited?pill("✓ NABL","#D1FAE5","#059669"):""}${l.home_collection?pill("🏠 Home Collection","#EDE9FE","#7C4DFF"):""}</div>
      </div>
    </div>
    <div class="profile-info-grid">${[["📞","Phone",l.phone],["📍","Address",l.address||l.district],["🏠","Home Collection",l.home_collection?"₹"+l.home_collection_charge+" charge":"Not Available"],["📋","License",l.lab_registration_no||"—"],["⭐","Rating",l.rating>0?l.rating+"/5":"New"]].map(([ic,lb,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${lb}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}</div>
    <a href="tel:${l.phone}" class="btn btn-outline btn-full">📞 Call to Book</a>
  </div>
  <div style="font-size:16px;font-weight:700;color:#1A2B3C;margin-bottom:14px">Available Tests (${tests.length})</div>
  ${Object.entries(groups).map(([cat,ct])=>`<div style="background:#fff;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)">
    <div style="padding:12px 16px;background:${cc[cat]||"#0A7FAF"}18;font-size:13px;font-weight:700;color:${cc[cat]||"#0A7FAF"}">${cat} (${ct.length})</div>
    ${ct.map(t=>`<div style="padding:12px 16px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#1A2B3C">${A.lang==="te"&&t.test_name_te?t.test_name_te:t.test_name}</div>
        <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap">
          ${t.fasting_required?`<span style="font-size:10px;color:#D97706;background:#FFFBEB;padding:1px 6px;border-radius:4px">Fasting</span>`:""}
          ${t.home_available?`<span style="font-size:10px;color:#7C4DFF;background:#F5F3FF;padding:1px 6px;border-radius:4px">Home</span>`:""}
          <span style="font-size:10px;color:#6B7280">⏱ ${t.report_time||"Same Day"}</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        ${t.discount>0?`<div style="font-size:10px;color:#9CA3AF;text-decoration:line-through">₹${Math.round(t.price/(1-t.discount/100))}</div>`:""}
        <div style="font-size:16px;font-weight:800;color:#7C4DFF">₹${t.price}</div>
        ${t.discount>0?`<div style="font-size:10px;color:#059669;font-weight:600">${t.discount}% off</div>`:""}
      </div>
    </div>`).join("")}
  </div>`).join("")||`<div class="empty"><div class="empty-icon">🧪</div><div class="empty-msg">No tests added yet. Call the lab.</div></div>`}`;
}

/* ════════ INIT ════════ */
document.addEventListener("DOMContentLoaded",()=>{
  const sess=S.load();
  if(sess){A.user=sess.u;A.role=sess.r;redirectRole(sess.r);}
  else rLanding();
  setLang(A.lang);
  DB.get("doctors","approved=eq.true&limit=1").then(()=>{A.demo=false;}).catch(()=>{A.demo=true;});
});

/* ════════ DOCTOR REVIEWS ════════ */
async function submitReview(doctorId, rating, comment) {
  if(!A.user || A.role!=="patient"){toast("Login as patient to review.",true);return;}
  try{
    // Check if patient had an appointment with this doctor
    const appts = await safeGet("appointments",
      `patient_id=eq.${A.user.id}&doctor_id=eq.${doctorId}&status=eq.completed`);
    if(!appts.length && !A.demo){
      toast("Only patients who completed appointment can review.",true);return;
    }
    await DB.post("doctor_reviews",{
      doctor_id:doctorId, patient_id:A.user.id,
      patient_name:A.user.name, rating:rating, comment:comment
    }).catch(()=>{});
    toast("Review submitted! ⭐");
    viewDoc(doctorId);
  }catch(e){toast(e.message,true);}
}

function renderReviewForm(docId){
  return `
  <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05);margin-top:14px">
    <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Write a Review</div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Rating</div>
      <div id="star-rating" style="display:flex;gap:6px">
        ${[1,2,3,4,5].map(i=>`<button onclick="setStarRating(${i})" id="star-${i}"
          style="font-size:28px;background:none;border:none;cursor:pointer;opacity:.4;transition:all .15s">★</button>`).join("")}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Comment</label>
      <textarea id="review-comment" class="form-input" rows="3"
        placeholder="Share your experience..."></textarea>
    </div>
    <button class="btn btn-primary" onclick="submitReviewForm('${docId}')">Submit Review ⭐</button>
  </div>`;
}
function setStarRating(n){
  window._starRating=n;
  for(let i=1;i<=5;i++){const s=document.getElementById("star-"+i);if(s)s.style.opacity=i<=n?"1":"0.4";}
}
async function submitReviewForm(docId){
  const rating=window._starRating||0;
  const comment=(document.getElementById("review-comment")||{}).value||"";
  if(!rating){toast("Please select a star rating.",true);return;}
  await submitReview(docId,rating,comment);
}

/* ════════ VIDEO CONSULTATION ════════ */
function startVideoCall(meetLink, doctorName){
  if(!meetLink){
    // Generate a Jitsi meet link
    const roomId="docnear-"+(A.user?.id||"").slice(0,8)+"-"+Date.now().toString(36);
    meetLink="https://meet.jit.si/"+roomId;
  }
  // Open Jitsi in new tab
  const win=window.open(meetLink,"_blank","width=1200,height=800");
  if(!win){
    // Fallback: show link
    const msg=`Video call link:\n${meetLink}\n\nCopy and open in browser.`;
    if(confirm(msg+"\n\nClick OK to copy link.")){
      navigator.clipboard?.writeText(meetLink).then(()=>toast("Link copied! 📋"));
    }
  }
  toast("Video call started! 🎥 Joining "+doctorName);
}

/* ════════ ADVANCED SEARCH ════════ */
async function rAdvancedSearch(){
  const qi=document.getElementById("search-q");
  const spec=document.getElementById("search-spec");
  const feeMin=document.getElementById("search-fee-min");
  const feeMax=document.getElementById("search-fee-max");
  const rating=document.getElementById("search-rating");

  let q="approved=eq.true";
  if(spec&&spec.value) q+=`&specialization=eq.${enc(spec.value)}`;

  const re=document.getElementById("search-results");
  const ce=document.getElementById("search-count");
  if(!re) return;
  spin("search-results","Finding doctors...");

  try{
    let docs=await safeGet("doctors",q,"docs");
    if(!docs.length) docs=DEMO.docs;

    // Client-side filters
    if(A.q){const v=A.q.toLowerCase();docs=docs.filter(d=>
      safe(d.name).toLowerCase().includes(v)||
      safe(d.specialization).toLowerCase().includes(v)||
      safe(d.hospital).toLowerCase().includes(v)||
      safe(d.district).toLowerCase().includes(v));}
    if(feeMin&&feeMin.value) docs=docs.filter(d=>d.fee>=parseInt(feeMin.value));
    if(feeMax&&feeMax.value) docs=docs.filter(d=>d.fee<=parseInt(feeMax.value));
    if(rating&&rating.value) docs=docs.filter(d=>d.rating>=parseFloat(rating.value));

    A.cache.docs=[...A.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
    if(ce) ce.textContent=docs.length+" doctor"+(docs.length!==1?"s":"")+" found";
    re.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("🔍","No doctors found. Try different filters.");
  }catch(e){re.innerHTML=DEMO.docs.map(d=>docCard(d)).join("");}
}

/* ════════ NOTIFICATIONS (Database) ════════ */
async function loadNotifications(userId, userType){
  try{
    const notifs=await safeGet("notifications",
      `user_id=eq.${userId}&is_read=eq.false&order=created_at.desc&limit=10`);
    return notifs;
  }catch{return [];}
}
async function markNotifRead(notifId){
  try{await DB.patch("notifications","id=eq."+notifId,{is_read:true}).catch(()=>{});}
  catch{}
}
async function sendNotification(userId, userType, title, message, type="info"){
  try{
    await DB.post("notifications",{
      user_id:userId, user_type:userType,
      title, message, type, is_read:false
    });
  }catch{}
}
