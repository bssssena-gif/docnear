/* ═══════════════════════════════════════════════════════════════
   DocNear V3 – Production Ready
   ✅ All 5 Role Auth  ✅ Session Management  ✅ Role Redirects
   ✅ Error Handling   ✅ Supabase Connected  ✅ Dashboards
   ═══════════════════════════════════════════════════════════════ */

const SUPA_URL = "https://avonzvocvonvzamedwvh.supabase.co";
const SUPA_KEY = "sb_publishable_wvfdYDM_JGE8q5NrcYl0EQ_tDOTBL2I";
const SESSION_KEY = "docnear_session_v3";

/* ═══ SHA-256 Password Hash ═══ */
async function hashPwd(plain) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  } catch { return plain; }
}

/* ═══ Supabase REST Helper ═══ */
async function dbReq(path, opts = {}) {
  try {
    const res = await fetch(SUPA_URL + "/rest/v1/" + path, {
      headers: {
        "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY,
        "Content-Type": "application/json",
        "Prefer": opts.prefer || "return=representation",
        ...opts.headers
      },
      method: opts.method || "GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || "DB Error " + res.status);
    }
    const t = await res.text(); return t ? JSON.parse(t) : [];
  } catch(err) {
    if (err.name === "TypeError") throw new Error("Network error — internet connection check చేయండి");
    throw err;
  }
}
const DB = {
  get:   (t,q="")  => dbReq(t + "?" + (q ? q+"&" : "") + "order=created_at.desc"),
  post:  (t,d)     => dbReq(t, { method:"POST", body:d }),
  patch: (t,f,d)   => dbReq(t+"?"+f, { method:"PATCH", body:d, prefer:"return=representation" }),
  del:   (t,f)     => dbReq(t+"?"+f, { method:"DELETE", prefer:"return=minimal" })
};

/* ═══ Session Management ═══ */
const Session = {
  save(user, role) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role, savedAt: Date.now() }));
    } catch(e) {}
  },
  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!data) return null;
      // 8 hour session timeout
      if (Date.now() - data.savedAt > 8 * 60 * 60 * 1000) { this.clear(); return null; }
      return data;
    } catch { return null; }
  },
  clear() { try { localStorage.removeItem(SESSION_KEY); } catch(e) {} }
};

/* ═══ App State ═══ */
const APP = {
  user:       null,
  role:       null,   // patient | doctor | store | ambulance | lab | admin
  lang:       localStorage.getItem("docnear_lang") || "en",
  selectedDoc: null,
  selectedStore: null,
  selectedLab: null,
  selectedAmbu: null,
  selectedSlot: "",
  selectedType: "inperson",
  searchQ: "", filterSpec: "", filterState: "", filterDistrict: "",
  cache: { docs:[], pats:[], stores:[], labs:[], ambus:[], appts:[], notifs:[], favs:[] },
  isDemo: false
};

/* ═══ Specializations ═══ */
const SPECS = [
  {name:"Cardiology",icon:"❤️",color:"#FF4757"},{name:"Neurology",icon:"🧠",color:"#7C4DFF"},
  {name:"Orthopedics",icon:"🦴",color:"#FF6B35"},{name:"Pediatrics",icon:"👶",color:"#00BCD4"},
  {name:"Ophthalmology",icon:"👁️",color:"#2196F3"},{name:"Dermatology",icon:"✨",color:"#E91E8C"},
  {name:"General Medicine",icon:"🏥",color:"#009688"},{name:"Gynecology",icon:"🌸",color:"#E91E63"}
];

/* ═══ DEMO DATA ═══ */
const DEMO = {
  doctors: [
    {id:"d1",name:"Dr. Priya Sharma",email:"priya@docnear.com",phone:"+91 98765 43210",specialization:"Cardiology",reg_number:"MCI-2019-45231",hospital:"Apollo Hospitals",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:12,fee:800,rating:4.8,reviews:234,approved:true,color:"#FF4757",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"],video_consult:true,about:"Specialist in interventional cardiology.",qualifications:"MBBS, MD (Cardiology), DM"},
    {id:"d2",name:"Dr. Rajesh Kumar",email:"rajesh@docnear.com",phone:"+91 98765 12345",specialization:"Neurology",reg_number:"MCI-2017-32145",hospital:"KIMS Hospital",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:15,fee:1200,rating:4.9,reviews:312,approved:true,color:"#7C4DFF",slots:["10:00 AM","11:00 AM","3:00 PM","4:00 PM"],video_consult:true,about:"Senior Neurologist.",qualifications:"MBBS, DM (Neurology)"},
    {id:"d3",name:"Dr. Sunita Reddy",email:"sunita@docnear.com",phone:"+91 87654 32109",specialization:"Pediatrics",reg_number:"MCI-2020-67890",hospital:"Rainbow Hospital",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:8,fee:600,rating:4.7,reviews:189,approved:true,color:"#00BCD4",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM"],video_consult:false,about:"Pediatrician.",qualifications:"MBBS, MD (Pediatrics)"},
    {id:"d4",name:"Dr. Vikram Rao",email:"vikram@docnear.com",phone:"+91 95543 21098",specialization:"General Medicine",reg_number:"MCI-2018-55432",hospital:"Medicover Hospital",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:10,fee:500,rating:4.7,reviews:560,approved:true,color:"#009688",slots:["8:00 AM","9:00 AM","10:00 AM","11:00 AM"],video_consult:false,about:"General physician.",qualifications:"MBBS, MD"}
  ],
  patients: [
    {id:"p1",name:"Ananya Patel",email:"ananya@gmail.com",phone:"+91 98765 00001",age:28,blood_group:"O+",gender:"Female"},
    {id:"p2",name:"Vikram Singh",email:"vikram@gmail.com",phone:"+91 98765 00002",age:45,blood_group:"A+",gender:"Male"}
  ],
  stores: [
    {id:"s1",store_name:"Apollo Pharmacy",owner_name:"Ravi Kumar",email:"apollo@store.com",phone:"+91 98765 11111",state_code:"TS",district:"Hyderabad",address:"Banjara Hills, Hyderabad",is_24x7:true,delivery_available:true,delivery_radius_km:10,approved:true,is_active:true,color:"#10B981",rating:4.5,opening_time:"00:00",closing_time:"23:59"}
  ],
  ambulances: [
    {id:"a1",operator_name:"Srinivas Rao",email:"ambu1@docnear.com",phone:"+91 99001 11111",alternate_phone:"+91 99001 11112",state_code:"TS",district:"Hyderabad",base_location:"Jubilee Hills",vehicle_type:"Advanced Life Support",vehicle_number:"TS 09 AB 1234",base_fare:500,per_km_rate:20,night_charge_extra:200,service_radius_km:25,has_oxygen:true,has_stretcher:true,has_monitor:true,approved:true,availability_status:"available",color:"#EF4444",rating:4.8}
  ],
  labs: [
    {id:"l1",lab_name:"Vijaya Diagnostics",owner_name:"Dr. Vijay Kumar",email:"vijaya@lab.com",phone:"+91 98111 11111",state_code:"TS",district:"Hyderabad",address:"Banjara Hills",lab_type:"full_service",nabl_accredited:true,home_collection:true,home_collection_charge:150,approved:true,is_active:true,color:"#7C4DFF",rating:4.7}
  ],
  appointments: [
    {id:"ap1",patient_id:"p1",patient_name:"Ananya Patel",doctor_id:"d1",doctor_name:"Dr. Priya Sharma",specialization:"Cardiology",date:new Date(Date.now()+86400000).toISOString().split("T")[0],slot:"10:00 AM",status:"confirmed",fee:800,payment_status:"paid",is_video:false}
  ]
};

/* ════════════════════ UTILS ════════════════════ */
const $    = id => document.getElementById(id);
const gv   = id => ($( id)||{}).value?.trim()||"";
const enc  = s  => encodeURIComponent(s||"");
const safe = s  => s||"";
const td   = () => new Date().toISOString().split("T")[0];
const ini  = n  => safe(n).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

function avt(name, color="#0A7FAF", sz=48) {
  return `<div class="avatar" style="width:${sz}px;height:${sz}px;background:${color};font-size:${Math.round(sz*.35)}px">${ini(name)}</div>`;
}
function pill(lbl, bg="#E3F4FC", col="#0A7FAF") {
  return `<span class="pill" style="background:${bg};color:${col}">${lbl}</span>`;
}
function sPill(s) {
  const m = {confirmed:["#D1FAE5","#059669"],pending:["#FEF3C7","#D97706"],cancelled:["#FEE2E2","#DC2626"],completed:["#EDE9FE","#7C4DFF"],available:["#D1FAE5","#059669"],busy:["#FEF3C7","#D97706"],offline:["#F3F4F6","#9CA3AF"]};
  const[bg,c] = m[s]||m.pending; return pill(s.toUpperCase(),bg,c);
}
function toast(msg, err=false) {
  const el=$("toast"); if(!el) return;
  el.style.background = err?"#EF4444":"#10B981"; el.style.color="#fff";
  el.textContent = (err?"❌ ":"✅ ") + msg; el.style.display="block";
  clearTimeout(el._t); el._t = setTimeout(()=>el.style.display="none", 4000);
}
function spin(id, msg="Loading...") { const el=$(id); if(el) el.innerHTML=`<div class="loading-box"><div class="spinner"></div>${msg}</div>`; }
function sc(icon,label,val,bg="#E3F4FC",vc="#0A7FAF") {
  return `<div class="stat-card"><div class="stat-icon" style="background:${bg}">${icon}</div><div><div class="stat-val" style="color:${vc}">${val}</div><div class="stat-lbl">${label}</div></div></div>`;
}
function empty(icon, msg, btn="") { return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-msg">${msg}</div>${btn}</div>`; }

/* ═══ DB with Demo Fallback ═══ */
async function safeGet(table, query="", demoKey="") {
  try { const r = await DB.get(table, query); return r; }
  catch(e) { APP.isDemo=true; return demoKey&&DEMO[demoKey]?DEMO[demoKey]:[]; }
}
async function safePost(table, data, demoFn=null) {
  try { return await DB.post(table, data); }
  catch(e) { if(APP.isDemo&&demoFn) return demoFn(data); throw e; }
}

/* ════════════════════ NAVIGATION ════════════════════ */
function go(page) {
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const el=$("page-"+page); if(!el) return;
  el.classList.add("active"); window.scrollTo(0,0);
  const map = {
    landing:rLanding, search:rSearch,
    patientDash:rPatientDash, doctorDash:rDoctorDash,
    storeDash:rStoreDash, ambuDash:rAmbuDash, labDash:rLabDash,
    profile:rProfile, book:rBook,
    stores:rStores, storeDetail:rStoreDetail,
    ambulance:rAmbulance, labsPage:rLabsPage,
    labDetail:rLabDetail, prescOrder:rPrescOrder,
    patientOrders:rPatientOrders
  };
  if(map[page]) map[page]();
}

function logout() {
  Session.clear();
  APP.user=null; APP.role=null;
  APP.cache={docs:[],pats:[],stores:[],labs:[],ambus:[],appts:[],notifs:[],favs:[]};
  toast("Logged out successfully.");
  go("landing");
}

/* ═══ Role-based redirect after login ═══ */
function redirectByRole(role) {
  const routes = {
    patient:   "patientDash",
    doctor:    "doctorDash",
    store:     "storeDash",
    ambulance: "ambuDash",
    lab:       "labDash",
    admin:     null  // Opens admin.html
  };
  if(role==="admin") { window.location.href="admin.html"; return; }
  const page = routes[role];
  if(page) go(page);
  else go("landing");
}

/* ════════════════════ AUTH — PATIENT ════════════════════ */
async function patientLogin() {
  const email=gv("pl-email"), pw=gv("pl-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("pl-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let rows = await safeGet("patients", `email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length && APP.isDemo) {
      const d=DEMO.patients.find(p=>p.email===email);
      if(d && pw==="patient123") rows=[d];
    }
    if(!rows.length) { toast("Invalid email or password.",true); return; }
    APP.user=rows[0]; APP.role="patient";
    Session.save(rows[0], "patient");
    toast("Welcome, "+rows[0].name+"! 👋");
    redirectByRole("patient");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Sign In";} }
}

async function patientRegister() {
  const name=gv("pr-name"),email=gv("pr-email"),pw=gv("pr-pw"),
    phone=gv("pr-phone"),age=gv("pr-age"),blood=gv("pr-blood"),gender=gv("pr-gender");
  if(!name||!email||!pw||!phone||!age) { toast("Fill all required fields.",true); return; }
  if(pw.length<6) { toast("Password must be at least 6 characters.",true); return; }
  const btn=$("pr-btn"); if(btn){btn.disabled=true;btn.textContent="Creating...";}
  try {
    const hash = await hashPwd(pw);
    const ex = await safeGet("patients",`email=eq.${enc(email)}`);
    if(ex.length) { toast("Email already registered.",true); return; }
    const r = await safePost("patients",
      {name,email,password_hash:hash,phone,age:parseInt(age),blood_group:blood,gender},
      d=>[{...d,id:"p_"+Date.now()}]
    );
    APP.user=r[0]; APP.role="patient";
    Session.save(r[0],"patient");
    toast("Welcome to DocNear, "+name+"! 🎉");
    redirectByRole("patient");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Create Account";} }
}

/* ════════════════════ AUTH — DOCTOR ════════════════════ */
async function doctorLogin() {
  const email=gv("dl-email"), pw=gv("dl-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("dl-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let rows = await safeGet("doctors",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length && APP.isDemo) {
      const d=DEMO.doctors.find(d=>d.email===email);
      if(d && pw==="doctor123") rows=[d];
    }
    if(!rows.length) { toast("Invalid email or password.",true); return; }
    APP.user=rows[0]; APP.role="doctor";
    Session.save(rows[0],"doctor");
    toast("Welcome, "+rows[0].name+"! 👨‍⚕️");
    redirectByRole("doctor");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Sign In";} }
}

async function doctorRegister() {
  const f={
    name:gv("dr-name"),email:gv("dr-email"),pw:gv("dr-pw"),phone:gv("dr-phone"),
    spec:gv("dr-spec"),reg:gv("dr-reg"),hosp:gv("dr-hosp"),loc:gv("dr-loc"),
    exp:gv("dr-exp"),fee:gv("dr-fee"),about:gv("dr-about"),qual:gv("dr-qual")
  };
  if(!f.name||!f.email||!f.pw||!f.phone||!f.spec||!f.reg||!f.hosp||!f.loc||!f.exp||!f.fee) {
    toast("Fill all required fields.",true); return;
  }
  const btn=$("dr-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try {
    const hash = await hashPwd(f.pw);
    const ex = await safeGet("doctors",`email=eq.${enc(f.email)}`);
    if(ex.length) { toast("Email already registered.",true); return; }
    await safePost("doctors",{
      name:f.name,email:f.email,password_hash:hash,phone:f.phone,
      specialization:f.spec,reg_number:f.reg,hospital:f.hosp,location:f.loc,city:f.loc,
      experience:parseInt(f.exp),fee:parseInt(f.fee),about:f.about,qualifications:f.qual,
      approved:false,color:SPECS.find(s=>s.name===f.spec)?.color||"#0A7FAF",
      slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"]
    });
    go("doctorPending"); toast("Registration submitted! Admin will review within 24–48 hours.");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Submit for Review";} }
}

/* ════════════════════ AUTH — STORE ════════════════════ */
async function storeLogin() {
  const email=gv("sl-email"), pw=gv("sl-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("sl-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let rows = await safeGet("medical_stores",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&APP.isDemo){const d=DEMO.stores.find(s=>s.email===email);if(d&&pw==="store123")rows=[d];}
    if(!rows.length) { toast("Invalid email or password.",true); return; }
    if(!rows[0].approved) { toast("Store not yet approved. Admin will verify your account.",true); return; }
    APP.user=rows[0]; APP.role="store";
    Session.save(rows[0],"store");
    toast("Welcome, "+rows[0].store_name+"! 💊");
    redirectByRole("store");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Sign In";} }
}

async function storeRegister() {
  const f={
    owner:gv("sr-owner"),store:gv("sr-store"),email:gv("sr-email"),pw:gv("sr-pw"),
    phone:gv("sr-phone"),address:gv("sr-address"),license:gv("sr-license"),gst:gv("sr-gst")
  };
  if(!f.owner||!f.store||!f.email||!f.pw||!f.phone||!f.address) {
    toast("Fill all required fields.",true); return;
  }
  const btn=$("sr-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try {
    const hash = await hashPwd(f.pw);
    const ex = await safeGet("medical_stores",`email=eq.${enc(f.email)}`);
    if(ex.length) { toast("Email already registered.",true); return; }
    await safePost("medical_stores",{
      owner_name:f.owner,store_name:f.store,email:f.email,password_hash:hash,phone:f.phone,
      address:f.address,drug_license_no:f.license,gst_number:f.gst,
      approved:false,is_active:true,color:"#10B981",
      delivery_available:false,is_24x7:false
    });
    toast("Store registration submitted! Admin will verify your documents.");
    go("storePending");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Submit for Approval";} }
}

/* ════════════════════ AUTH — AMBULANCE ════════════════════ */
async function ambuLogin() {
  const email=gv("al2-email"), pw=gv("al2-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("al2-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let rows = await safeGet("ambulances",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&APP.isDemo){const d=DEMO.ambulances.find(a=>a.email===email);if(d&&pw==="ambu123")rows=[d];}
    if(!rows.length) { toast("Invalid email or password.",true); return; }
    if(!rows[0].approved) { toast("Account not yet approved by admin.",true); return; }
    APP.user=rows[0]; APP.role="ambulance";
    Session.save(rows[0],"ambulance");
    toast("Welcome, "+rows[0].operator_name+"! 🚑");
    redirectByRole("ambulance");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Sign In";} }
}

async function ambuRegister() {
  const f={
    operator:gv("ar-operator"),email:gv("ar-email"),pw:gv("ar-pw"),phone:gv("ar-phone"),
    vehicle:gv("ar-vehicle"),type:gv("ar-type"),base:gv("ar-base"),km:gv("ar-km"),location:gv("ar-location")
  };
  if(!f.operator||!f.email||!f.pw||!f.phone||!f.vehicle||!f.type||!f.base||!f.km) {
    toast("Fill all required fields.",true); return;
  }
  const btn=$("ar-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try {
    const hash = await hashPwd(f.pw);
    await safePost("ambulances",{
      operator_name:f.operator,email:f.email,password_hash:hash,phone:f.phone,
      vehicle_number:f.vehicle,vehicle_type:f.type,base_fare:parseInt(f.base),
      per_km_rate:parseInt(f.km),base_location:f.location,
      approved:false,availability_status:"offline",color:"#EF4444",
      has_oxygen:true,has_stretcher:true,service_radius_km:20
    });
    toast("Registration submitted! Admin will verify your documents.");
    go("ambuPending");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Submit for Approval";} }
}

/* ════════════════════ AUTH — LAB ════════════════════ */
async function labLogin() {
  const email=gv("ll-email"), pw=gv("ll-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("ll-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let rows = await safeGet("diagnostic_labs",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&APP.isDemo){const d=DEMO.labs.find(l=>l.email===email);if(d&&pw==="lab123")rows=[d];}
    if(!rows.length) { toast("Invalid email or password.",true); return; }
    if(!rows[0].approved) { toast("Lab not yet approved by admin.",true); return; }
    APP.user=rows[0]; APP.role="lab";
    Session.save(rows[0],"lab");
    toast("Welcome, "+rows[0].lab_name+"! 🔬");
    redirectByRole("lab");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Sign In";} }
}

async function labRegister() {
  const f={
    lab:gv("lr-lab"),owner:gv("lr-owner"),email:gv("lr-email"),pw:gv("lr-pw"),
    phone:gv("lr-phone"),type:gv("lr-type"),address:gv("lr-address"),reg:gv("lr-reg")
  };
  if(!f.lab||!f.owner||!f.email||!f.pw||!f.phone||!f.type) {
    toast("Fill all required fields.",true); return;
  }
  const btn=$("lr-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try {
    const hash = await hashPwd(f.pw);
    await safePost("diagnostic_labs",{
      lab_name:f.lab,owner_name:f.owner,email:f.email,password_hash:hash,phone:f.phone,
      lab_type:f.type,address:f.address,lab_registration_no:f.reg,
      approved:false,is_active:true,color:"#7C4DFF",
      home_collection:false,nabl_accredited:false
    });
    toast("Registration submitted! Admin will verify.");
    go("labPending");
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Submit for Approval";} }
}

/* ════════════════════ AUTH — ADMIN ════════════════════ */
async function adminLogin() {
  const email=gv("al-email"), pw=gv("al-pw");
  if(!email||!pw) { toast("Email & password required.",true); return; }
  const btn=$("al-btn"); if(btn){btn.disabled=true;btn.textContent="Signing in...";}
  try {
    const hash = await hashPwd(pw);
    let ok=false;
    try {
      const rows = await DB.get("admins",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}&is_active=eq.true`);
      if(rows.length){ APP.user=rows[0]; ok=true; }
    } catch {}
    // Demo fallback only if Supabase unreachable
    if(!ok && APP.isDemo && email==="admin@docnear.com" && pw==="admin123") {
      APP.user={name:"Admin",email}; ok=true;
    }
    if(!ok) { toast("Invalid admin credentials.",true); return; }
    APP.role="admin"; Session.save(APP.user,"admin");
    toast("Welcome, Admin! 🛡️");
    window.location.href="admin.html";
  } catch(e) { toast(e.message,true); }
  finally { if(btn){btn.disabled=false;btn.textContent="Admin Sign In";} }
}

/* ════════════════════ GUARD: Role Protection ════════════════════ */
function requireRole(role) {
  if(!APP.user || APP.role !== role) {
    toast("Access denied. Please login as "+role+".",true);
    go("landing");
    return false;
  }
  return true;
}

/* ════════════════════ LANDING ════════════════════ */
async function rLanding() {
  // Nav update
  const ng=$("nav-guest"), nu=$("nav-user");
  if(APP.user) {
    if(ng) ng.style.display="none";
    if(nu) { nu.style.display="flex"; if($("nav-user-name")) $("nav-user-name").textContent=APP.user.name||APP.user.store_name||APP.user.operator_name||APP.user.lab_name; }
  } else {
    if(ng) ng.style.display="flex"; if(nu) nu.style.display="none";
  }
  // Specs
  const sc=$("landing-specs");
  if(sc) sc.innerHTML=SPECS.map(s=>`
    <div class="spec-card" onclick="APP.filterSpec='${s.name}';go('search')"
      onmouseover="this.style.boxShadow='0 8px 20px ${s.color}33'" onmouseout="this.style.boxShadow=''">
      <div class="spec-icon">${s.icon}</div><div class="spec-name">${s.name}</div>
    </div>`).join("");
  // Top Doctors
  const dc=$("landing-doctors");
  if(dc) {
    spin("landing-doctors");
    try {
      let docs=await safeGet("doctors","approved=eq.true&limit=3","doctors");
      if(!docs.length) docs=DEMO.doctors.slice(0,3);
      APP.cache.docs=docs;
      dc.innerHTML=docs.map(d=>docCard(d)).join("");
    } catch(e) { dc.innerHTML=DEMO.doctors.slice(0,3).map(d=>docCard(d)).join(""); }
  }
  // Test Supabase
  DB.get("doctors","approved=eq.true&limit=1").then(()=>{APP.isDemo=false;}).catch(()=>{APP.isDemo=true;});
}

/* ════════════════════ DOCTOR CARD ════════════════════ */
function docCard(d) {
  const sc=(SPECS.find(s=>s.name===d.specialization)||{}).color||"#0A7FAF";
  const isFav=APP.cache.favs?.includes(d.id);
  return `
  <div class="card" onclick="viewDoc('${d.id}')">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      ${avt(d.name,d.color||sc,56)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px">
          <div class="doc-name">${safe(d.name)}</div>
          ${d.video_consult?`<span style="font-size:11px">🎥</span>`:""}
        </div>
        <div class="doc-spec">${safe(d.specialization)}</div>
        <div class="doc-meta">⭐ <strong>${d.rating||"New"}</strong>${d.reviews>0?` <span style="color:#9CA3AF">(${d.reviews})</span>`:""}</div>
        ${d.district?`<div style="font-size:11px;color:#9CA3AF">📍 ${safe(d.district)}</div>`:""}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:18px;font-weight:800;color:#0A7FAF">₹${d.fee||0}</div>
        <div style="font-size:10px;color:#9CA3AF">per visit</div>
        ${APP.role==="patient"?`<button onclick="event.stopPropagation();toggleFav('${d.id}')" style="background:none;border:none;cursor:pointer;font-size:15px;margin-top:3px">${isFav?"❤️":"🤍"}</button>`:""}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-size:11px;color:#6B7280">🏥 ${safe(d.hospital)||"—"}</span>
      <span style="font-size:11px;color:#6B7280">🏆 ${d.experience||0}y exp</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewDoc('${d.id}')">Profile</button>
      <button class="btn btn-primary" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();bookDoc('${d.id}')">Book Now</button>
    </div>
  </div>`;
}

function apptCard(a, forDoc=false) {
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
    ${a.status==="confirmed"&&a.is_video&&a.meeting_link?
      `<button class="btn btn-purple btn-sm" style="margin-top:10px;width:100%" onclick="window.open('${a.meeting_link}','_blank')">🎥 Join Video Call</button>`:""}
    ${a.payment_status?`<div style="margin-top:6px">${pill(a.payment_status==="paid"?"💳 Paid":"⏳ Unpaid",a.payment_status==="paid"?"#D1FAE5":"#FEF3C7",a.payment_status==="paid"?"#059669":"#D97706")}</div>`:""}
  </div>`;
}

/* ════════════════════ PATIENT DASHBOARD ════════════════════ */
async function rPatientDash() {
  if(!requireRole("patient")) return;
  const u=APP.user;
  if($("pd-nav-name")) $("pd-nav-name").textContent=u.name;
  if($("pd-welcome"))  $("pd-welcome").textContent="Hello, "+safe(u.name).split(" ")[0]+"! 👋";
  spin("pd-stats"); spin("pd-appts"); spin("pd-doctors");
  try {
    const [appts,docs,notifs] = await Promise.all([
      safeGet("appointments","patient_id=eq."+u.id),
      safeGet("doctors","approved=eq.true&limit=4","doctors"),
      safeGet("notifications","user_id=eq."+u.id+"&limit=5")
    ]);
    APP.cache.appts=appts.length?appts:DEMO.appointments.filter(a=>a.patient_id===u.id);
    APP.cache.docs=docs.length?docs:DEMO.doctors;
    if($("pd-stats")) $("pd-stats").innerHTML=
      sc("📅","Total",APP.cache.appts.length)+
      sc("✅","Confirmed",APP.cache.appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669")+
      sc("🎥","Video",APP.cache.appts.filter(a=>a.is_video).length,"#EDE9FE","#7C4DFF")+
      sc("👨‍⚕️","Doctors",new Set(APP.cache.appts.map(a=>a.doctor_id)).size,"#FEE9E1","#FF6B35");
    if($("pd-appts")) $("pd-appts").innerHTML=APP.cache.appts.length
      ?APP.cache.appts.map(a=>apptCard(a)).join("")
      :empty("📋","No appointments yet.",`<button class="btn btn-primary btn-sm" onclick="go('search')">Book Now</button>`);
    if($("pd-doctors")) $("pd-doctors").innerHTML=APP.cache.docs.map(d=>docCard(d)).join("");
    // Notifications
    if(notifs.length && $("pd-notifs")) {
      const tc={success:"#10B981",info:"#0A7FAF",warning:"#F59E0B",error:"#EF4444"};
      $("pd-notifs").innerHTML=notifs.slice(0,4).map(n=>`
        <div style="background:${n.is_read?"#F9FAFB":"#EFF6FF"};border-radius:10px;padding:10px 14px;margin-bottom:8px;border-left:3px solid ${tc[n.type]||"#0A7FAF"}">
          <div style="font-size:13px;font-weight:700;color:#1A2B3C">${safe(n.title)}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:2px">${safe(n.message)}</div>
        </div>`).join("");
    }
  } catch(e) { toast("Error loading dashboard: "+e.message,true); }
}

/* ════════════════════ DOCTOR DASHBOARD ════════════════════ */
async function rDoctorDash() {
  if(!requireRole("doctor")) return;
  const u=APP.user;
  if($("dd-nav-name")) $("dd-nav-name").textContent=u.name;
  if($("dd-welcome"))  $("dd-welcome").textContent="Welcome, "+safe(u.name)+"! 👨‍⚕️";
  if($("dd-meta"))     $("dd-meta").innerHTML=`<span>🩺 ${safe(u.specialization)}</span><span>🏥 ${safe(u.hospital)}</span>`;
  if($("dd-pending-alert")) $("dd-pending-alert").style.display=u.approved?"none":"flex";
  spin("dd-stats"); spin("dd-today-appts"); spin("dd-all-appts");
  try {
    const appts=await safeGet("appointments","doctor_id=eq."+u.id);
    const todayA=appts.filter(a=>a.date===td());
    const revenue=appts.filter(a=>a.payment_status==="paid").reduce((s,a)=>s+a.fee,0);
    if($("dd-stats")) $("dd-stats").innerHTML=
      sc("📅","Total",appts.length)+
      sc("🌅","Today",todayA.length,"#FEE9E1","#FF6B35")+
      sc("💰","Revenue","₹"+revenue.toLocaleString(),"#EDE9FE","#7C4DFF")+
      sc("✅","Confirmed",appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669");
    if($("dd-today-appts")) $("dd-today-appts").innerHTML=todayA.length
      ?todayA.map(a=>apptCard(a,true)).join(""):empty("🌿","No appointments today.");
    if($("dd-all-appts")) $("dd-all-appts").innerHTML=appts.length
      ?appts.map(a=>apptCard(a,true)).join(""):empty("📭","No appointments yet.");
    // Profile
    if($("dd-status-pill")) $("dd-status-pill").innerHTML=pill(u.approved?"✓ Approved":"⏳ Pending Review",u.approved?"#D1FAE5":"#FEF3C7",u.approved?"#059669":"#D97706");
    if($("dd-profile-grid")) $("dd-profile-grid").innerHTML=[
      ["🩺","Specialization",u.specialization],["🏥","Hospital",u.hospital],
      ["📍","Location",u.district?u.district+", "+u.state_code:u.location],
      ["📋","Reg. No.",u.reg_number],["💰","Fee","₹"+u.fee],
      ["💼","Exp.",(u.experience||0)+" yrs"],["📞","Phone",u.phone],
      ["🎓","Qualifications",u.qualifications]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
    if($("dd-about")) $("dd-about").textContent=u.about||"";
    if($("dd-slots")) $("dd-slots").innerHTML=(u.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("");
  } catch(e) { toast("Error: "+e.message,true); }
}

/* ════════════════════ STORE DASHBOARD ════════════════════ */
async function rStoreDash() {
  if(!requireRole("store")) return;
  const u=APP.user;
  if($("sd-nav-name")) $("sd-nav-name").textContent=u.store_name;
  if($("sd-welcome"))  $("sd-welcome").textContent="Welcome, "+safe(u.store_name)+"! 💊";
  spin("sd-stats"); spin("sd-orders");
  try {
    const orders=await safeGet("prescription_orders","store_id=eq."+u.id);
    const pending=orders.filter(o=>o.status==="pending");
    if($("sd-stats")) $("sd-stats").innerHTML=
      sc("📋","Total Orders",orders.length)+
      sc("⏳","Pending",pending.length,"#FEF3C7","#D97706")+
      sc("✅","Completed",orders.filter(o=>o.status==="completed").length,"#D1FAE5","#059669")+
      sc("💰","Revenue","₹"+orders.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+(o.total_amount||0),0).toLocaleString(),"#EDE9FE","#7C4DFF");
    if($("sd-orders")) $("sd-orders").innerHTML=orders.length
      ?orders.map(o=>orderCard(o)).join("")
      :empty("📋","No orders yet. Prescriptions from patients will appear here.");
    // Store Info
    if($("sd-info")) $("sd-info").innerHTML=[
      ["🏪","Store Name",u.store_name],["👤","Owner",u.owner_name],
      ["📞","Phone",u.phone],["📍","Address",u.address||u.district],
      ["🕐","Hours",u.is_24x7?"24×7":u.opening_time+" - "+u.closing_time],
      ["🚴","Delivery",u.delivery_available?u.delivery_radius_km+"km":"Not Available"],
      ["💊","Drug License",u.drug_license_no||"—"],["✅","Status",u.approved?"Approved":"Pending"]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
  } catch(e) { toast("Error: "+e.message,true); }
}
function orderCard(o) {
  const bc={pending:"#D97706",accepted:"#0A7FAF",packed:"#7C4DFF",delivered:"#059669",completed:"#059669",rejected:"#DC2626"}[o.status]||"#D97706";
  return `<div class="appt-card" style="border-left:4px solid ${bc}">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
      <div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${safe(o.patient_name)||"Patient"}</div>
      <div style="font-size:12px;color:#6B7280">📞 ${safe(o.patient_phone)||"—"}</div></div>
      ${pill((o.status||"pending").replace("_"," ").toUpperCase(),bc+"22",bc)}
    </div>
    <div style="margin-top:8px;font-size:12px;color:#6B7280">${safe(o.notes)||""} ${o.is_urgent?`<span style="color:#DC2626;font-weight:700">🚨 URGENT</span>`:""}</div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      ${o.status==="pending"?`
        <button class="btn btn-green btn-sm" onclick="updateOrderStatus('${o.id}','accepted')">✅ Accept</button>
        <button class="btn btn-red btn-sm" onclick="updateOrderStatus('${o.id}','rejected')">❌ Reject</button>`:""}
      ${o.status==="accepted"?`<button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${o.id}','packed')">📦 Mark Packed</button>`:""}
      ${o.status==="packed"?`<button class="btn btn-green btn-sm" onclick="updateOrderStatus('${o.id}','delivered')">🚴 Mark Delivered</button>`:""}
    </div>
  </div>`;
}
async function updateOrderStatus(id, status) {
  try {
    await safePost("prescription_orders",{status},{},()=>[]);
    await DB.patch("prescription_orders","id=eq."+id,{status}).catch(()=>{});
    toast("Order updated to: "+status);
    rStoreDash();
  } catch(e) { toast(e.message,true); }
}

/* ════════════════════ AMBULANCE DASHBOARD ════════════════════ */
async function rAmbuDash() {
  if(!requireRole("ambulance")) return;
  const u=APP.user;
  if($("amd-nav-name")) $("amd-nav-name").textContent=u.operator_name;
  if($("amd-welcome"))  $("amd-welcome").textContent="Welcome, "+safe(u.operator_name)+"! 🚑";
  spin("amd-stats");
  try {
    if($("amd-stats")) $("amd-stats").innerHTML=
      sc("🚑","Vehicle",safe(u.vehicle_number)||"—")+
      sc("📍","Location",safe(u.base_location||u.district)||"—","#FEE9E1","#FF6B35")+
      sc("💰","Base Fare","₹"+u.base_fare,"#EDE9FE","#7C4DFF")+
      sc("🛣️","Per KM","₹"+u.per_km_rate,"#D1FAE5","#059669");
    // Availability toggle
    if($("amd-avail-btn")) {
      const avail=u.availability_status||"offline";
      $("amd-avail-btn").textContent=avail==="available"?"🟢 Available (Click to go Offline)":avail==="busy"?"🟡 Busy":"🔴 Offline (Click to go Online)";
      $("amd-avail-btn").style.background=avail==="available"?"#059669":avail==="busy"?"#D97706":"#DC2626";
    }
    // Profile
    if($("amd-info")) $("amd-info").innerHTML=[
      ["🚑","Vehicle No.",u.vehicle_number],["🚗","Vehicle Type",u.vehicle_type],
      ["📞","Phone",u.phone],["📞","Alt. Phone",u.alternate_phone],
      ["📍","Base Location",u.base_location||u.district],
      ["💰","Base Fare","₹"+u.base_fare],["🛣️","Per KM Rate","₹"+u.per_km_rate],
      ["📐","Service Radius",u.service_radius_km+" km"],["✅","Status",u.approved?"Approved":"Pending"]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
    // Equipment
    if($("amd-equipment")) $("amd-equipment").innerHTML=[
      ["🩸","Oxygen",u.has_oxygen],["🛏️","Stretcher",u.has_stretcher],
      ["📊","Monitor",u.has_monitor],["💨","Ventilator",u.has_ventilator],
      ["⚡","Defibrillator",u.has_defibrillator]
    ].map(([ic,name,has])=>`<span style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:${has?"#D1FAE5":"#F3F4F6"};color:${has?"#059669":"#9CA3AF"}">${ic} ${name}: ${has?"✓":"✗"}</span>`).join("");
  } catch(e) { toast("Error: "+e.message,true); }
}
async function toggleAvailability() {
  if(!APP.user) return;
  const cur=APP.user.availability_status||"offline";
  const next=cur==="available"?"offline":"available";
  try {
    await DB.patch("ambulances","id=eq."+APP.user.id,{availability_status:next}).catch(()=>{});
    APP.user.availability_status=next;
    Session.save(APP.user,"ambulance");
    toast("Status updated to: "+next);
    rAmbuDash();
  } catch(e) { toast(e.message,true); }
}

/* ════════════════════ LAB DASHBOARD ════════════════════ */
async function rLabDash() {
  if(!requireRole("lab")) return;
  const u=APP.user;
  if($("ld-nav-name")) $("ld-nav-name").textContent=u.lab_name;
  if($("ld-welcome"))  $("ld-welcome").textContent="Welcome, "+safe(u.lab_name)+"! 🔬";
  spin("ld-stats"); spin("ld-bookings"); spin("ld-tests");
  try {
    const [bookings,tests]=await Promise.all([
      safeGet("lab_bookings","lab_id=eq."+u.id),
      safeGet("lab_tests","lab_id=eq."+u.id+"&is_active=eq.true")
    ]);
    if($("ld-stats")) $("ld-stats").innerHTML=
      sc("📅","Total Bookings",bookings.length)+
      sc("⏳","Pending",bookings.filter(b=>b.status==="booked").length,"#FEF3C7","#D97706")+
      sc("✅","Completed",bookings.filter(b=>b.status==="completed").length,"#D1FAE5","#059669")+
      sc("🧪","Tests Listed",tests.length,"#EDE9FE","#7C4DFF");
    if($("ld-bookings")) $("ld-bookings").innerHTML=bookings.length
      ?bookings.map(b=>`
        <div class="appt-card" style="border-left:4px solid #7C4DFF">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${safe(b.patient_name)||"Patient"}</div>
            <div style="font-size:12px;color:#6B7280">📅 ${b.scheduled_date||"—"} · ${safe(b.collection_type)}</div></div>
            ${sPill(b.status)}
          </div>
          <div style="font-size:12px;color:#0A7FAF;font-weight:700;margin-top:6px">₹${b.total_amount||0}</div>
        </div>`).join("")
      :empty("📅","No bookings yet. Patients will book from the app.");
    // Tests management
    if($("ld-tests")) $("ld-tests").innerHTML=tests.length
      ?`<div style="display:grid;gap:8px">`+tests.map(t=>`
        <div style="background:#F9FAFB;border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div><div style="font-size:13px;font-weight:600;color:#1A2B3C">${t.test_name}</div>
          <div style="font-size:11px;color:#9CA3AF">${t.category} · ${t.report_time||"Same Day"}</div></div>
          <div style="font-size:16px;font-weight:800;color:#7C4DFF">₹${t.price}</div>
        </div>`).join("")+"</div>"
      :empty("🧪","No tests added yet.",`<button class="btn btn-purple btn-sm" onclick="showAddTestForm()">+ Add Test</button>`);
    // Lab info
    if($("ld-info")) $("ld-info").innerHTML=[
      ["🔬","Lab Name",u.lab_name],["👤","Owner",u.owner_name],
      ["📞","Phone",u.phone],["📍","Address",u.address||u.district],
      ["🏷️","Lab Type",(u.lab_type||"").replace("_"," ")],["📋","Reg. No.",u.lab_registration_no],
      ["🏠","Home Collection",u.home_collection?"Yes":"No"],["✅","Status",u.approved?"Approved":"Pending"]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
  } catch(e) { toast("Error: "+e.message,true); }
}
function showAddTestForm(){
  const f=$("add-test-form"); if(f) f.style.display=f.style.display==="none"?"block":"none";
}
async function addLabTest(){
  if(!APP.user||APP.role!=="lab") return;
  const name=gv("test-name"),cat=gv("test-cat"),price=gv("test-price"),time=gv("test-time");
  if(!name||!cat||!price){toast("Fill all fields.",true);return;}
  try{
    await DB.post("lab_tests",{lab_id:APP.user.id,test_name:name,category:cat,price:parseInt(price),report_time:time||"Same Day",is_active:true,home_available:APP.user.home_collection||false});
    toast("Test added! 🧪");
    if($("add-test-form"))$("add-test-form").style.display="none";
    rLabDash();
  }catch(e){toast(e.message,true);}
}

/* ════════════════════ SEARCH ════════════════════ */
async function rSearch() {
  const na=$("search-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name||APP.user.store_name||"User"}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login to Book</button>`;
  if($("search-back-btn")) $("search-back-btn").onclick=()=>go(APP.role==="patient"?"patientDash":"landing");
  const chips=$("search-chips");
  if(chips) chips.innerHTML=[{name:"All",icon:""},...SPECS].map(s=>`
    <button class="chip ${(!APP.filterSpec&&s.name==="All")||APP.filterSpec===s.name?"active":""}"
      onclick="setSearchSpec('${s.name==="All"?"":s.name}')">${s.icon} ${s.name}</button>`).join("");
  const qi=$("search-q"); if(qi)qi.value=APP.searchQ;
  await fetchDocs();
}
function setSearchSpec(s){APP.filterSpec=s;rSearch();}
async function filterDoctors(){
  APP.searchQ=($("search-q")||{}).value||"";
  APP.filterSpec=($("search-spec")||{}).value||"";
  document.querySelectorAll(".chip").forEach(c=>{
    const isAll=c.textContent.trim().startsWith("All");
    c.classList.toggle("active",isAll?!APP.filterSpec:(!!APP.filterSpec&&c.textContent.includes(APP.filterSpec)));
  });
  await fetchDocs();
}
async function fetchDocs(){
  const re=$("search-results"),ce=$("search-count"); if(!re) return;
  spin("search-results","Finding doctors...");
  try {
    let q="approved=eq.true";
    if(APP.filterSpec) q+=`&specialization=eq.${enc(APP.filterSpec)}`;
    if(APP.filterState) q+=`&state_code=eq.${enc(APP.filterState)}`;
    if(APP.filterDistrict) q+=`&district=eq.${enc(APP.filterDistrict)}`;
    let docs=await safeGet("doctors",q,"doctors");
    if(!docs.length) docs=DEMO.doctors;
    if(APP.filterSpec) docs=docs.filter(d=>d.specialization===APP.filterSpec);
    if(APP.searchQ){const v=APP.searchQ.toLowerCase();docs=docs.filter(d=>safe(d.name).toLowerCase().includes(v)||safe(d.specialization).toLowerCase().includes(v)||safe(d.hospital).toLowerCase().includes(v));}
    APP.cache.docs=[...APP.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
    if(ce) ce.textContent=docs.length+" doctor"+(docs.length!==1?"s":"")+" found";
    re.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("🔍","No doctors found. Try different filters.");
  } catch(e) { re.innerHTML=DEMO.doctors.map(d=>docCard(d)).join(""); }
}

/* ════════════════════ DOC ACTIONS ════════════════════ */
async function viewDoc(id){
  APP.selectedDoc=APP.cache.docs.find(d=>d.id===id)||DEMO.doctors.find(d=>d.id===id);
  if(!APP.selectedDoc){try{const r=await DB.get("doctors","id=eq."+id);if(r.length)APP.selectedDoc=r[0];}catch{}}
  go("profile");
}
function bookDoc(id){
  if(!APP.user||APP.role!=="patient"){toast("Login as patient to book.",true);go("patientLogin");return;}
  APP.selectedDoc=APP.cache.docs.find(d=>d.id===id)||DEMO.doctors.find(d=>d.id===id)||APP.selectedDoc;
  APP.selectedSlot=""; go("book");
}
async function toggleFav(docId){
  if(!APP.user||APP.role!=="patient"){toast("Login to save favorites.",true);return;}
  const isFav=APP.cache.favs.includes(docId);
  try {
    if(isFav){await DB.del("favorite_doctors",`patient_id=eq.${APP.user.id}&doctor_id=eq.${docId}`).catch(()=>{});APP.cache.favs=APP.cache.favs.filter(id=>id!==docId);toast("Removed ✓");}
    else{await DB.post("favorite_doctors",{patient_id:APP.user.id,doctor_id:docId}).catch(()=>{});APP.cache.favs=[...APP.cache.favs,docId];toast("Saved ❤️");}
    const activePg=document.querySelector(".page.active")?.id?.replace("page-","");
    if(activePg==="search")fetchDocs(); if(activePg==="patientDash")rPatientDash();
  } catch(e){toast(e.message,true);}
}

/* ════════════════════ PROFILE ════════════════════ */
async function rProfile(){
  const d=APP.selectedDoc; if(!d){go("search");return;}
  const na=$("profile-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name||"User"}</span><button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">Login to Book</button>`;
  let reviews=[]; try{reviews=await DB.get("doctor_reviews","doctor_id=eq."+d.id);}catch{}
  const stars=[1,2,3,4,5].map(i=>`<span style="color:${i<=Math.round(d.rating||0)?'#F59E0B':'#E5E7EB'};font-size:16px">★</span>`).join("");
  if($("profile-content")) $("profile-content").innerHTML=`
    <div class="profile-header">
      <div style="display:flex;gap:18px;margin-bottom:18px;flex-wrap:wrap">
        ${avt(d.name,d.color||"#0A7FAF",76)}
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
        ${[["🏥","Hospital",d.hospital],["📍","Location",d.district?d.district+", "+d.state_code:d.city||d.location],["📋","Reg. No.",d.reg_number],["📞","Phone",d.phone],["🎓","Qualifications",d.qualifications],["🌐","Languages",(d.languages||["Telugu","English"]).join(", ")]].map(([ic,l,v])=>`
          <div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}
      </div>
      ${d.about?`<p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${safe(d.about)}</p>`:""}
      ${d.rating>0?`<div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #F3F4F6;margin-bottom:14px">${stars}<span style="font-size:14px;font-weight:700">${d.rating}</span><span style="font-size:12px;color:#9CA3AF">(${d.reviews})</span></div>`:""}
      <div style="display:grid;grid-template-columns:1fr${d.video_consult?" 1fr":""}; gap:10px">
        <button class="btn btn-primary btn-full" onclick="APP.selectedType='inperson';bookDoc('${d.id}')">📅 Book Appointment</button>
        ${d.video_consult?`<button class="btn btn-purple btn-full" onclick="APP.selectedType='video';bookDoc('${d.id}')">🎥 Video Consult</button>`:""}
      </div>
    </div>
    <div class="profile-slots-wrap" style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Available Slots</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${(d.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("")}</div>
    </div>
    ${reviews.length?`<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Patient Reviews ⭐</div>
      ${reviews.slice(0,3).map(r=>`<div style="padding:10px 0;border-bottom:1px solid #F3F4F6"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px"><div style="font-size:13px;font-weight:700">${safe(r.patient_name)||"Patient"}</div><div>${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.rating?"#F59E0B":"#E5E7EB"};font-size:12px">★</span>`).join("")}</div></div><div style="font-size:13px;color:#374151">${safe(r.comment)}</div></div>`).join("")}
    </div>`:""}`;
}

/* ════════════════════ BOOK ════════════════════ */
async function rBook(){
  const d=APP.selectedDoc; if(!d){go("search");return;}
  const c=$("book-content");
  if(!APP.user||APP.role!=="patient"){
    c.innerHTML=`<div style="text-align:center;padding:40px 0"><div style="font-size:56px;margin-bottom:14px">🔒</div><h3 style="font-family:'Lora',serif;font-size:22px;color:#1A2B3C;margin-bottom:8px">Login Required</h3><p style="color:#6B7280;font-size:14px;margin-bottom:20px">Patient login చేయండి</p><button class="btn btn-primary" onclick="go('patientLogin')">Patient Login</button></div>`;
    return;
  }
  APP.selectedSlot="";
  let booked=[]; try{const a=await DB.get("doctor_availability",`doctor_id=eq.${d.id}&date=eq.${td()}`);if(a.length)booked=a[0].booked_slots||[];}catch{}
  const isVideo=APP.selectedType==="video";
  c.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;display:flex;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${avt(d.name,d.color||"#0A7FAF",50)}
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:#1A2B3C">${safe(d.name)}</div>
      <div style="font-size:12px;color:#0A7FAF;font-weight:600">${safe(d.specialization)}</div>
      <div style="font-size:12px;color:#9CA3AF">🏥 ${safe(d.hospital)}</div></div>
      <div style="font-size:20px;font-weight:800;color:#0A7FAF">₹${d.fee}</div>
    </div>
    ${d.video_consult?`<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-label" style="margin-bottom:10px">Appointment Type</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button id="type-inperson" class="slot-btn ${!isVideo?"active":""}" onclick="APP.selectedType='inperson';setBookType()">🏥 In-Person</button>
        <button id="type-video" class="slot-btn ${isVideo?"active":""}" onclick="APP.selectedType='video';setBookType()">🎥 Video Consult</button>
      </div></div>`:""}
    <div style="background:#fff;border-radius:16px;padding:22px 20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-group"><label class="form-label">Date Select చేయండి <span>*</span></label>
        <input type="date" id="book-date" class="form-input" min="${td()}" onchange="onBookDateChange()"/></div>
      <div class="form-group"><label class="form-label">Time Slot <span>*</span></label>
        <div class="slot-grid" id="slot-grid">
          ${(d.slots||[]).map(s=>{const b=booked.includes(s);return `<button class="slot-btn${b?" slot-blocked":""}" ${b?"disabled":""} onclick="${b?"":"pickSlot('"+s+"')"}">${s}${b?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("")}
        </div></div>
      <div id="book-summary" style="display:none;background:#F0FDF4;border-radius:10px;padding:14px;border:1px solid #A7F3D0;margin-top:12px">
        <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px">📋 Booking Summary</div>
        <div id="bsum-txt" style="font-size:13px;color:#047857;line-height:1.8"></div>
        <div style="font-size:15px;font-weight:800;color:#0A7FAF;margin-top:6px">Total: ₹${d.fee}</div>
      </div>
    </div>
    <button class="btn btn-primary btn-full" id="confirm-btn" onclick="confirmBook()" style="font-size:15px;padding:14px">
      Confirm Booking — ₹${d.fee}
    </button>`;
}
function setBookType(){
  const isV=APP.selectedType==="video";
  [$("type-inperson"),$("type-video")].forEach((b,i)=>b&&b.classList.toggle("active",i===0?!isV:isV));
  updateBookSummary();
}
function pickSlot(s){APP.selectedSlot=s;document.querySelectorAll(".slot-btn:not(.slot-blocked)").forEach(b=>b.classList.toggle("active",b.textContent.trim().startsWith(s)));updateBookSummary();}
async function onBookDateChange(){
  const date=($("book-date")||{}).value; if(!date||!APP.selectedDoc)return;
  try{const a=await DB.get("doctor_availability",`doctor_id=eq.${APP.selectedDoc.id}&date=eq.${date}`);const booked=a.length?a[0].booked_slots||[]:[];const sg=$("slot-grid");if(sg)sg.innerHTML=(APP.selectedDoc.slots||[]).map(s=>{const b=booked.includes(s);return `<button class="slot-btn${b?" slot-blocked":""}" ${b?"disabled":""} onclick="${b?"":"pickSlot('"+s+"')"}">${s}${b?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("");}catch{}
  updateBookSummary();
}
function updateBookSummary(){
  const date=($("book-date")||{}).value,sb=$("book-summary"),st=$("bsum-txt");
  if(sb&&st&&date&&APP.selectedSlot){sb.style.display="block";st.innerHTML=`📅 ${date}<br>🕐 ${APP.selectedSlot}<br>👤 ${APP.user.name}<br>${APP.selectedType==="video"?"🎥 Video Consultation":"🏥 In-Person"}`;}else if(sb)sb.style.display="none";
}
async function confirmBook(){
  const date=($("book-date")||{}).value;
  if(!date){toast("Date select చేయండి.",true);return;}
  if(!APP.selectedSlot){toast("Time slot select చేయండి.",true);return;}
  const d=APP.selectedDoc,btn=$("confirm-btn");
  if(btn){btn.disabled=true;btn.textContent="Booking...";}
  try{
    const isVideo=APP.selectedType==="video";
    const meetLink=isVideo?"https://meet.jit.si/docnear-"+(crypto.randomUUID?crypto.randomUUID().slice(0,10):Date.now()):null;
    await safePost("appointments",{
      patient_id:APP.user.id,patient_name:APP.user.name,doctor_id:d.id,doctor_name:d.name,
      specialization:d.specialization,date,slot:APP.selectedSlot,status:"confirmed",
      fee:d.fee,payment_status:"pending",is_video:isVideo,meeting_link:meetLink
    },data=>[{...data,id:"ap_"+Date.now()}]);
    DB.post("notifications",{user_id:d.id,user_type:"doctor",title:"New Appointment 📅",message:`${APP.user.name} — ${date} at ${APP.selectedSlot}${isVideo?" (Video)":""}`,type:"info"}).catch(()=>{});
    if(isVideo&&meetLink){toast("Appointment confirmed! 🎥");setTimeout(()=>{if(confirm("Join video call now?\n"+meetLink))window.open(meetLink,"_blank");},1500);}
    else toast("Appointment booked! 🎉");
    go("patientDash");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Confirm Booking — ₹"+(d?.fee||0);}}
}

/* ════════════════════ STORES ════════════════════ */
async function rStores(){
  const listEl=$("stores-list"); if(!listEl)return;
  spin("stores-list");
  try{
    let stores=await safeGet("medical_stores","approved=eq.true&is_active=eq.true","stores");
    if(!stores.length)stores=DEMO.stores;
    APP.cache.stores=stores;
    listEl.innerHTML=stores.map(s=>storeCard(s)).join("");
  }catch(e){APP.cache.stores=DEMO.stores;listEl.innerHTML=DEMO.stores.map(s=>storeCard(s)).join("");}
}
function storeCard(s){
  const now=new Date(),h=now.getHours(),m=now.getMinutes();
  const cur=h*60+m;
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
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">📍 ${safe(s.address||s.district)||"—"}${s.delivery_available?` · 🚴 ${s.delivery_radius_km}km delivery`:""}</div>
    <div style="display:flex;gap:8px">
      <a href="tel:${s.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">📞 Call</a>
      <button class="btn btn-green" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();prescForStore('${s.id}')">📋 Order Medicines</button>
    </div>
  </div>`;
}
function viewStore(id){APP.selectedStore=APP.cache.stores.find(s=>s.id===id);go("storeDetail");}
function rStoreDetail(){
  const s=APP.selectedStore; if(!s){go("stores");return;}
  if($("store-detail-content")) $("store-detail-content").innerHTML=`
    <div class="profile-header">
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:16px;background:${s.color||"#10B981"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">💊</div>
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(s.store_name)}</h2>
          <div style="font-size:13px;color:#6B7280">👤 ${safe(s.owner_name)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            ${s.approved?pill("✓ Verified","#D1FAE5","#059669"):""}
            ${s.is_24x7?pill("24×7","#EDE9FE","#7C4DFF"):""}
            ${s.delivery_available?pill("🚴 Delivery","#E3F4FC","#0A7FAF"):""}
          </div>
        </div>
      </div>
      <div class="profile-info-grid">
        ${[["📍","Address",s.address||s.district],["📞","Phone",s.phone],["🕐","Hours",s.is_24x7?"24 Hours":(s.opening_time||"09:00")+" - "+(s.closing_time||"21:00")],["🚴","Delivery",s.delivery_available?s.delivery_radius_km+"km":"Not Available"],["💊","Drug License",s.drug_license_no||"—"],["⭐","Rating",s.rating>0?s.rating+"/5":"New"]].map(([ic,l,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <a href="tel:${s.phone}" class="btn btn-outline btn-full">📞 Call Now</a>
        <button class="btn btn-green btn-full" onclick="prescForStore('${s.id}')">📋 Order Medicines</button>
      </div>
    </div>`;
}
function prescForStore(id){APP.selectedStore=APP.cache.stores.find(s=>s.id===id)||APP.selectedStore;go("prescOrder");}

/* ════════════════════ PRESCRIPTION ORDER ════════════════════ */
function rPrescOrder(){
  if(!APP.user||APP.role!=="patient"){toast("Login as patient first.",true);go("patientLogin");return;}
  const c=$("presc-content"); if(!c)return;
  c.innerHTML=`
    <div style="background:#fff;border-radius:16px;padding:22px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${APP.selectedStore?`<div style="display:flex;gap:12px;align-items:center;padding:12px;background:#F0FDF4;border-radius:12px;margin-bottom:16px"><span style="font-size:24px">💊</span><div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${safe(APP.selectedStore.store_name)}</div><div style="font-size:12px;color:#059669">Sending to this store</div></div><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="APP.selectedStore=null;rPrescOrder()">Change</button></div>`:`<div class="alert alert-info" style="margin-bottom:16px">ℹ️ Prescription will be sent to all nearby verified medical stores</div>`}
      <div class="form-group"><label class="form-label">Doctor's Prescription Photo <span>*</span></label>
        <div id="presc-upload-area" style="border:2px dashed #0A7FAF;border-radius:12px;padding:32px 20px;text-align:center;cursor:pointer;background:#F0F9FF;transition:all .2s" onclick="$('presc-file').click()">
          <div style="font-size:40px;margin-bottom:8px">📸</div>
          <div style="font-size:14px;font-weight:600;color:#0A7FAF">Click to upload prescription</div>
          <div style="font-size:12px;color:#9CA3AF;margin-top:4px">JPG, PNG, PDF · Max 5MB</div>
        </div>
        <input type="file" id="presc-file" accept="image/*,.pdf" style="display:none" onchange="onPrescFile(event)"/>
        <div id="presc-preview" style="display:none;margin-top:10px"></div>
      </div>
      <div class="form-group"><label class="form-label">Delivery Address <span>*</span></label><textarea id="presc-address" class="form-input" rows="2" placeholder="Your delivery address..."></textarea></div>
      <div class="form-group"><label class="form-label">Notes</label><input id="presc-notes" class="form-input" placeholder="e.g. Urgent, substitute ok..."/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <button id="urgent-no" class="slot-btn active" onclick="window._urgent=false;setUrgent(false)" style="padding:10px">Normal</button>
        <button id="urgent-yes" class="slot-btn" onclick="window._urgent=true;setUrgent(true)" style="padding:10px">🚨 Urgent</button>
      </div>
    </div>
    <button class="btn btn-green btn-full" id="presc-submit-btn" onclick="submitPrescOrder()" style="font-size:15px;padding:14px">📋 Submit Prescription Order</button>`;
  window._urgent=false; window._prescFile=null;
}
function setUrgent(v){$("urgent-yes")?.classList.toggle("active",v);$("urgent-no")?.classList.toggle("active",!v);}
function onPrescFile(e){
  const file=e.target.files[0]; if(!file)return; window._prescFile=file;
  const prev=$("presc-preview");
  if(file.type.startsWith("image/")){const r=new FileReader();r.onload=ev=>{prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;max-height:200px;object-fit:contain;border-radius:8px;border:1px solid #E5E7EB"/>`;prev.style.display="block";};r.readAsDataURL(file);}
  else{prev.innerHTML=`<div style="padding:12px;background:#F0FDF4;border-radius:8px;color:#059669">📄 ${file.name}</div>`;prev.style.display="block";}
  const ua=$("presc-upload-area");if(ua){ua.style.borderColor="#10B981";ua.innerHTML=`<div style="font-size:30px;margin-bottom:6px">✅</div><div style="font-size:13px;font-weight:600;color:#059669">${file.name}</div>`;}
}
async function submitPrescOrder(){
  if(!window._prescFile){toast("Please upload prescription photo.",true);return;}
  const address=($("presc-address")||{}).value?.trim();
  if(!address){toast("Please enter delivery address.",true);return;}
  const btn=$("presc-submit-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try{
    await safePost("prescription_orders",{
      patient_id:APP.user.id,patient_name:APP.user.name,patient_phone:APP.user.phone,
      store_id:APP.selectedStore?.id||null,store_name:APP.selectedStore?.store_name||null,
      prescription_url:"presc_"+Date.now()+".jpg",delivery_address:address,
      notes:($("presc-notes")||{}).value||"",is_urgent:window._urgent||false,
      status:"pending",payment_mode:"cod"
    },d=>[{...d,id:"rx_"+Date.now()}]);
    toast("Prescription submitted! 🎉 Store will contact you soon.");
    window._prescFile=null; go("patientOrders");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="📋 Submit Prescription Order";}}
}

/* ════════════════════ PATIENT ORDERS ════════════════════ */
async function rPatientOrders(){
  if(!APP.user){go("patientLogin");return;}
  const c=$("orders-content"); if(!c)return; spin("orders-content");
  try{
    const orders=await safeGet("prescription_orders","patient_id=eq."+APP.user.id);
    const sc2={pending:"#D97706",accepted:"#0A7FAF",packed:"#7C4DFF",delivered:"#059669",completed:"#059669",rejected:"#DC2626",cancelled:"#9CA3AF"};
    c.innerHTML=orders.length?orders.map(o=>`
      <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.05);border-left:4px solid ${sc2[o.status]||"#9CA3AF"}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px">
          <div><div style="font-size:13px;font-weight:700;color:#1A2B3C">${safe(o.store_name)||"Sent to nearby stores"}</div><div style="font-size:11px;color:#9CA3AF">${new Date(o.created_at).toLocaleDateString()}</div></div>
          ${pill((o.status||"pending").replace("_"," ").toUpperCase(),(sc2[o.status]||"#9CA3AF")+"22",sc2[o.status]||"#9CA3AF")}
        </div>
        ${o.notes?`<div style="font-size:12px;color:#6B7280">📝 ${o.notes}</div>`:""}
        ${o.is_urgent?`<span style="font-size:11px;background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:6px;font-weight:600">🚨 URGENT</span>`:""}
      </div>`).join("")
      :empty("📋","No orders yet.",`<button class="btn btn-green btn-sm" onclick="go('prescOrder')">Upload Prescription</button>`);
  }catch(e){c.innerHTML=empty("⚠️",e.message);}
}

/* ════════════════════ AMBULANCE ════════════════════ */
async function rAmbulance(){
  const listEl=$("ambu-list"); if(!listEl)return; spin("ambu-list");
  try{
    let ambus=await safeGet("ambulances","approved=eq.true","ambulances");
    if(!ambus.length)ambus=DEMO.ambulances;
    APP.cache.ambus=ambus;
    listEl.innerHTML=ambus.map(a=>`
      <div class="card">
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
          ${a.has_ventilator?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">💨 Ventilator</span>`:""}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <a href="tel:${a.phone}" class="btn btn-outline btn-full">📞 Call Now</a>
          <a href="tel:${a.alternate_phone||a.phone}" class="btn btn-red btn-full">🚑 Emergency</a>
        </div>
      </div>`).join("");
  }catch(e){APP.cache.ambus=DEMO.ambulances;listEl.innerHTML=DEMO.ambulances.map(a=>`<div class="card"><div style="font-size:15px;font-weight:700;color:#1A2B3C;margin-bottom:8px">${a.operator_name}</div><a href="tel:${a.phone}" class="btn btn-red btn-full">📞 ${a.phone}</a></div>`).join("");}
}

/* ════════════════════ LABS ════════════════════ */
async function rLabsPage(){
  const listEl=$("labs-list"); if(!listEl)return; spin("labs-list");
  try{
    let labs=await safeGet("diagnostic_labs","approved=eq.true&is_active=eq.true","labs");
    if(!labs.length)labs=DEMO.labs;
    APP.cache.labs=labs;
    const typeFilter=($("labs-type")||{}).value||"";
    const filtered=typeFilter?labs.filter(l=>l.lab_type===typeFilter):labs;
    listEl.innerHTML=filtered.map(l=>labCard(l)).join("");
  }catch(e){APP.cache.labs=DEMO.labs;listEl.innerHTML=DEMO.labs.map(l=>labCard(l)).join("");}
}
function labCard(l){
  const typeIcon={pathology:"🧪",radiology:"🩻",home_collection:"🏠",full_service:"🔬"};
  return `<div class="card" onclick="viewLab('${l.id}')">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${typeIcon[l.lab_type]||"🔬"}</div>
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
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">📍 ${safe(l.address||l.district)||"—"}${l.home_collection?` · 🏠 ₹${l.home_collection_charge} charge`:""}</div>
    <div style="display:flex;gap:8px">
      <a href="tel:${l.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">📞 Call</a>
      <button class="btn btn-purple" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();viewLab('${l.id}')">Book Tests</button>
    </div>
  </div>`;
}
async function viewLab(id){
  APP.selectedLab=APP.cache.labs.find(l=>l.id===id)||DEMO.labs.find(l=>l.id===id);
  go("labDetail");
}
async function rLabDetail(){
  const l=APP.selectedLab; if(!l){go("labsPage");return;}
  const c=$("lab-detail-content"); if(!c)return; spin("lab-detail-content");
  let tests=[]; try{tests=await DB.get("lab_tests",`lab_id=eq.${l.id}&is_active=eq.true`);}catch{tests=DEMO.labTests?DEMO.labTests.filter(t=>t.lab_id===l.id):[];}
  const groups={};tests.forEach(t=>{groups[t.category]=groups[t.category]||[];groups[t.category].push(t);});
  const catColors={Blood:"#FF4757",Urine:"#FF6B35",Radiology:"#2196F3",Package:"#009688",Special:"#F59E0B"};
  c.innerHTML=`
    <div class="profile-header">
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:16px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">🔬</div>
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(l.lab_name)}</h2>
          <div style="font-size:13px;color:#7C4DFF;font-weight:600">${(l.lab_type||"").replace("_"," ").toUpperCase()}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${l.nabl_accredited?pill("✓ NABL","#D1FAE5","#059669"):""}
            ${l.home_collection?pill("🏠 Home Collection","#EDE9FE","#7C4DFF"):""}
          </div>
        </div>
      </div>
      <div class="profile-info-grid">
        ${[["📞","Phone",l.phone],["📍","Address",l.address||l.district],["🕐","Hours",l.is_24x7?"24 Hours":(l.opening_time||"08:00")+" - "+(l.closing_time||"20:00")],["🏠","Home Collection",l.home_collection?"₹"+l.home_collection_charge:"Not Available"],["📋","License",l.lab_registration_no||"—"],["⭐","Rating",l.rating>0?l.rating+"/5":"New"]].map(([ic,lb,v])=>`<div class="profile-info-item"><div class="profile-info-lbl">${ic} ${lb}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}
      </div>
      <a href="tel:${l.phone}" class="btn btn-outline btn-full">📞 Call to Book</a>
    </div>
    <div style="font-size:16px;font-weight:700;color:#1A2B3C;margin-bottom:14px">Tests (${tests.length})</div>
    ${Object.entries(groups).map(([cat,catTests])=>`
      <div style="background:#fff;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)">
        <div style="padding:12px 16px;background:${catColors[cat]||"#0A7FAF"}22;font-size:13px;font-weight:700;color:${catColors[cat]||"#0A7FAF"}">${cat} Tests (${catTests.length})</div>
        ${catTests.map(t=>`
          <div style="padding:12px 16px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:10px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:#1A2B3C">${t.test_name}</div>
              <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap">
                ${t.fasting_required?`<span style="font-size:10px;color:#D97706;background:#FEF3C7;padding:1px 6px;border-radius:4px">Fasting</span>`:""}
                ${t.home_available?`<span style="font-size:10px;color:#7C4DFF;background:#EDE9FE;padding:1px 6px;border-radius:4px">Home</span>`:""}
                <span style="font-size:10px;color:#6B7280">⏱ ${t.report_time||"Same Day"}</span>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              ${t.discount>0?`<div style="font-size:10px;color:#9CA3AF;text-decoration:line-through">₹${Math.round(t.price/(1-t.discount/100))}</div>`:""}
              <div style="font-size:16px;font-weight:800;color:#7C4DFF">₹${t.price}</div>
              ${t.discount>0?`<div style="font-size:10px;color:#059669;font-weight:600">${t.discount}% off</div>`:""}
            </div>
          </div>`).join("")}
      </div>`).join("")||"<div class='text-muted'>No tests added yet.</div>"}`;
}

/* ════════════════════ LANGUAGE ════════════════════ */
function setLang(lang) {
  APP.lang=lang; localStorage.setItem("docnear_lang",lang);
  [$("btn-lang-en"),$("btn-lang-te")].forEach((b,i)=>{
    if(!b)return;
    const active=(i===0&&lang==="en")||(i===1&&lang==="te");
    b.style.background=active?"linear-gradient(135deg,#0A7FAF,#085F8A)":"transparent";
    b.style.color=active?"#fff":"#6B7280";
  });
}

/* ════════════════════ INIT ════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // Restore session
  const session = Session.load();
  if(session) {
    APP.user = session.user;
    APP.role = session.role;
    // Redirect to appropriate dashboard
    redirectByRole(session.role);
  } else {
    rLanding();
  }
  // Apply language
  setLang(APP.lang);
  // Test Supabase connection
  DB.get("doctors","approved=eq.true&limit=1").then(()=>{APP.isDemo=false;}).catch(()=>{APP.isDemo=true;});
});
