/* ═══════════════════════════════════════════════════════════════
   DocNear V2 – Complete Health Platform
   Features: Doctors, Medical Stores, Ambulance, Diagnostic Labs
             Prescription Orders, States/Districts, Telugu/English
   ═══════════════════════════════════════════════════════════════ */

const SUPA_URL = "https://avonzvocvonvzamedwvh.supabase.co";
const SUPA_KEY = "sb_publishable_wvfdYDM_JGE8q5NrcYl0EQ_tDOTBL2I";

/* ═══ SHA-256 Hash ═══ */
async function hashPwd(p) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  } catch { return p; }
}

/* ═══ Supabase Helper ═══ */
async function dbReq(path, opts={}) {
  try {
    const res = await fetch(SUPA_URL+"/rest/v1/"+path, {
      headers:{
        "apikey": SUPA_KEY, "Authorization":"Bearer "+SUPA_KEY,
        "Content-Type":"application/json",
        "Prefer": opts.prefer||"return=representation", ...opts.headers
      },
      method: opts.method||"GET",
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.message||"DB Error "+res.status); }
    const t=await res.text(); return t ? JSON.parse(t) : [];
  } catch(err) {
    if(err.name==="TypeError") throw new Error("Network error — internet check చేయండి");
    throw err;
  }
}
const DB = {
  get:   (t,q="")  => dbReq(t+"?"+(q?q+"&":"")+"order=created_at.desc"),
  post:  (t,d)     => dbReq(t,{method:"POST",body:d}),
  patch: (t,f,d)   => dbReq(t+"?"+f,{method:"PATCH",body:d,prefer:"return=representation"}),
  del:   (t,f)     => dbReq(t+"?"+f,{method:"DELETE",prefer:"return=minimal"}),
  rpc:   (fn,args) => dbReq("rpc/"+fn,{method:"POST",body:args})
};

/* ═══ TRANSLATIONS ═══ */
const LANG = {
  en: {
    appName:"DocNear", tagline:"Find Doctors, Stores & Labs",
    searchPlaceholder:"Search doctor, hospital, specialization...",
    bookNow:"Book Now", profile:"Profile",
    doctors:"Doctors", medStores:"Medical Stores",
    ambulance:"Ambulance", labTests:"Lab Tests",
    emergency:"Emergency", prescOrder:"Prescription Order",
    findDoctors:"Find Doctors", allSpecializations:"All Specializations",
    allStates:"All States", allDistricts:"All Districts",
    login:"Login", logout:"Logout", register:"Register",
    patientLogin:"Patient Login", doctorLogin:"Doctor Login",
    adminLogin:"Admin Login", storeLogin:"Store Login",
    ambulanceLogin:"Ambulance Login", labLogin:"Lab Login",
    bookAppointment:"Book Appointment", confirmBooking:"Confirm Booking",
    selectDate:"Select Date", selectSlot:"Select Time Slot",
    dashboard:"Dashboard", myAppointments:"My Appointments",
    availableDoctors:"Available Doctors", loading:"Loading...",
    noResults:"No results found", perVisit:"per visit",
    yearsExp:"y exp", bookingConfirmed:"Appointment Booked! 🎉",
    uploadPrescription:"Upload Prescription",
    sendToNearbyStores:"Send to Nearby Stores",
    ambulanceServices:"Ambulance Services",
    callAmbulance:"Call Ambulance",
    perKm:"/ km", baseFare:"Base Fare",
    bookLabTest:"Book Lab Test",
    homeCollection:"Home Collection",
    reportTime:"Report Time", fasting:"Fasting Required",
    storeOpen:"Open", storeClosed:"Closed",
    delivery:"Delivery Available", pickupOnly:"Pickup Only",
    verified:"✓ Verified", pending:"⏳ Pending",
    inPerson:"In-Person", videoConsult:"Video Consult",
    language:"Language", selectState:"Select State",
    selectDistrict:"Select District",
    backToHome:"← Back to Home",
    yourOrders:"Your Orders", orderStatus:"Order Status",
    callNow:"📞 Call Now"
  },
  te: {
    appName:"డాక్‌నియర్", tagline:"డాక్టర్లు, స్టోర్లు & ల్యాబ్లు",
    searchPlaceholder:"డాక్టర్, ఆసుపత్రి, స్పెషలైజేషన్ వెతకండి...",
    bookNow:"ఇప్పుడే బుక్ చేయండి", profile:"ప్రొఫైల్",
    doctors:"డాక్టర్లు", medStores:"మెడికల్ స్టోర్లు",
    ambulance:"అంబులెన్స్", labTests:"ల్యాబ్ టెస్టులు",
    emergency:"అత్యవసరం", prescOrder:"ప్రిస్క్రిప్షన్ ఆర్డర్",
    findDoctors:"డాక్టర్లు వెతకండి", allSpecializations:"అన్ని స్పెషలైజేషన్లు",
    allStates:"అన్ని రాష్ట్రాలు", allDistricts:"అన్ని జిల్లాలు",
    login:"లాగిన్", logout:"లాగ్‌అవుట్", register:"నమోదు",
    patientLogin:"రోగి లాగిన్", doctorLogin:"డాక్టర్ లాగిన్",
    adminLogin:"అడ్మిన్ లాగిన్", storeLogin:"స్టోర్ లాగిన్",
    ambulanceLogin:"అంబులెన్స్ లాగిన్", labLogin:"ల్యాబ్ లాగిన్",
    bookAppointment:"అపాయింట్‌మెంట్ బుక్ చేయండి", confirmBooking:"బుకింగ్ నిర్ధారించండి",
    selectDate:"తేదీ ఎంచుకోండి", selectSlot:"సమయం ఎంచుకోండి",
    dashboard:"డ్యాష్‌బోర్డ్", myAppointments:"నా అపాయింట్‌మెంట్లు",
    availableDoctors:"అందుబాటులో ఉన్న డాక్టర్లు", loading:"లోడ్ అవుతోంది...",
    noResults:"ఫలితాలు లేవు", perVisit:"సందర్శన కి",
    yearsExp:"సం. అనుభవం", bookingConfirmed:"అపాయింట్‌మెంట్ బుక్ అయింది! 🎉",
    uploadPrescription:"ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి",
    sendToNearbyStores:"దగ్గరలోని స్టోర్లకు పంపండి",
    ambulanceServices:"అంబులెన్స్ సేవలు",
    callAmbulance:"అంబులెన్స్ పిలవండి",
    perKm:"/ కి.మీ", baseFare:"ప్రాథమిక చార్జ్",
    bookLabTest:"ల్యాబ్ టెస్ట్ బుక్ చేయండి",
    homeCollection:"ఇంట్లో నమూనా సేకరణ",
    reportTime:"రిపోర్ట్ సమయం", fasting:"ఉపవాసం అవసరం",
    storeOpen:"తెరిచి ఉంది", storeClosed:"మూసి ఉంది",
    delivery:"డెలివరీ అందుబాటులో", pickupOnly:"పికప్ మాత్రమే",
    verified:"✓ ధృవీకరించబడింది", pending:"⏳ పెండింగ్",
    inPerson:"నేరుగా", videoConsult:"వీడియో కన్సల్ట్",
    language:"భాష", selectState:"రాష్ట్రం ఎంచుకోండి",
    selectDistrict:"జిల్లా ఎంచుకోండి",
    backToHome:"← హోమ్‌కి తిరిగి",
    yourOrders:"మీ ఆర్డర్లు", orderStatus:"ఆర్డర్ స్థితి",
    callNow:"📞 ఇప్పుడే కాల్ చేయండి"
  }
};

/* ═══ App State ═══ */
const APP = {
  lang: localStorage.getItem("docnear_lang") || "en",
  user: null, userType: null,
  selectedDoc: null, selectedStore: null,
  selectedLab: null, selectedAmbu: null,
  selectedSlot: "", selectedType: "inperson",
  searchQ: "", filterSpec: "", filterState: "", filterDistrict: "",
  adminTab: "pending",
  cache: { docs:[], stores:[], labs:[], ambus:[], appts:[], notifs:[], favs:[], states:[], districts:[] },
  isDemo: false,
  demoMode: false
};

/* ═══ DEMO FALLBACK DATA ═══ */
const DEMO = {
  doctors: [
    {id:"d1",name:"Dr. Priya Sharma",email:"priya@docnear.com",password_hash:"demo",phone:"+91 98765 43210",specialization:"Cardiology",reg_number:"MCI-2019-45231",hospital:"Apollo Hospitals",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:12,fee:800,rating:4.8,reviews:234,approved:true,color:"#FF4757",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"],video_consult:true,about:"Specialist in interventional cardiology with 12 years of clinical experience.",qualifications:"MBBS, MD (Cardiology)",languages:["Telugu","English"]},
    {id:"d2",name:"Dr. Rajesh Kumar",email:"rajesh@docnear.com",password_hash:"demo",phone:"+91 98765 12345",specialization:"Neurology",reg_number:"MCI-2017-32145",hospital:"KIMS Hospital",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:15,fee:1200,rating:4.9,reviews:312,approved:true,color:"#7C4DFF",slots:["10:00 AM","11:00 AM","3:00 PM","4:00 PM"],video_consult:true,about:"Senior Neurologist specializing in epilepsy and stroke.",qualifications:"MBBS, DM (Neurology)",languages:["Telugu","English"]},
    {id:"d3",name:"Dr. Sunita Reddy",email:"sunita@docnear.com",password_hash:"demo",phone:"+91 87654 32109",specialization:"Pediatrics",reg_number:"MCI-2020-67890",hospital:"Rainbow Hospital",location:"Secunderabad",city:"Hyderabad",state_code:"TS",district:"Secunderabad",experience:8,fee:600,rating:4.7,reviews:189,approved:true,color:"#00BCD4",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM"],video_consult:false,about:"Dedicated pediatrician with expertise in newborn care.",qualifications:"MBBS, MD (Pediatrics)",languages:["Telugu","English","Hindi"]},
    {id:"d4",name:"Dr. Vikram Rao",email:"vikram@docnear.com",password_hash:"demo",phone:"+91 95543 21098",specialization:"General Medicine",reg_number:"MCI-2018-55432",hospital:"Medicover Hospital",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:10,fee:500,rating:4.7,reviews:560,approved:true,color:"#009688",slots:["8:00 AM","9:00 AM","10:00 AM","11:00 AM"],video_consult:false,about:"General physician with holistic approach to patient care.",qualifications:"MBBS, MD",languages:["Telugu","English"]},
    {id:"d5",name:"Dr. Srinivas Rao",email:"srini@docnear.com",password_hash:"demo",phone:"+91 99887 76655",specialization:"Ophthalmology",reg_number:"MCI-2019-77811",hospital:"LV Prasad Eye Institute",location:"Hyderabad",city:"Hyderabad",state_code:"TS",district:"Hyderabad",experience:14,fee:900,rating:4.8,reviews:302,approved:true,color:"#2196F3",slots:["9:00 AM","10:00 AM","11:00 AM","3:00 PM"],video_consult:true,about:"Expert ophthalmologist specializing in cataract surgery.",qualifications:"MBBS, MS (Ophthalmology)",languages:["Telugu","English"]}
  ],
  stores: [
    {id:"s1",store_name:"Apollo Pharmacy",owner_name:"Ravi Kumar",phone:"+91 98765 11111",state_code:"TS",district:"Hyderabad",address:"Banjara Hills, Hyderabad",is_24x7:true,delivery_available:true,delivery_radius_km:10,approved:true,is_active:true,color:"#10B981",rating:4.5,opening_time:"00:00",closing_time:"23:59"},
    {id:"s2",store_name:"MedPlus Pharmacy",owner_name:"Suresh Reddy",phone:"+91 98765 22222",state_code:"TS",district:"Hyderabad",address:"Jubilee Hills, Hyderabad",is_24x7:false,delivery_available:true,delivery_radius_km:5,approved:true,is_active:true,color:"#059669",rating:4.3,opening_time:"08:00",closing_time:"22:00"}
  ],
  ambulances: [
    {id:"a1",operator_name:"Srinivas Rao",phone:"+91 99001 11111",alternate_phone:"+91 99001 11112",state_code:"TS",district:"Hyderabad",base_location:"Jubilee Hills",vehicle_type:"Advanced Life Support",vehicle_number:"TS 09 AB 1234",base_fare:500,per_km_rate:20,night_charge_extra:200,service_radius_km:25,has_oxygen:true,has_stretcher:true,has_monitor:true,approved:true,availability_status:"available",color:"#EF4444",rating:4.8},
    {id:"a2",operator_name:"Ramesh Kumar",phone:"+91 99002 22222",alternate_phone:"+91 99002 22223",state_code:"TS",district:"Hyderabad",base_location:"Secunderabad",vehicle_type:"Basic Life Support",vehicle_number:"TS 09 CD 5678",base_fare:350,per_km_rate:15,night_charge_extra:150,service_radius_km:30,has_oxygen:true,has_stretcher:true,has_monitor:false,approved:true,availability_status:"available",color:"#DC2626",rating:4.5}
  ],
  labs: [
    {id:"l1",lab_name:"Vijaya Diagnostics",owner_name:"Dr. Vijay Kumar",phone:"+91 98111 11111",state_code:"TS",district:"Hyderabad",address:"Banjara Hills, Hyderabad",lab_type:"full_service",nabl_accredited:true,home_collection:true,home_collection_charge:150,approved:true,is_active:true,color:"#7C4DFF",rating:4.7},
    {id:"l2",lab_name:"Apollo Diagnostics",owner_name:"Raju Sharma",phone:"+91 98111 22222",state_code:"TS",district:"Hyderabad",address:"Jubilee Hills, Hyderabad",lab_type:"pathology",nabl_accredited:false,home_collection:true,home_collection_charge:100,approved:true,is_active:true,color:"#8B5CF6",rating:4.4},
    {id:"l3",lab_name:"MRI & Scan Centre",owner_name:"Dr. Anand",phone:"+91 98111 33333",state_code:"TS",district:"Secunderabad",address:"SP Road, Secunderabad",lab_type:"radiology",nabl_accredited:false,home_collection:false,home_collection_charge:0,approved:true,is_active:true,color:"#6D28D9",rating:4.6}
  ],
  labTests: [
    {id:"lt1",lab_id:"l1",test_name:"Complete Blood Count (CBC)",test_name_te:"పూర్తి రక్త పరీక్ష",category:"Blood",price:250,discount:10,home_available:true,report_time:"Same Day",fasting_required:false},
    {id:"lt2",lab_id:"l1",test_name:"Blood Sugar (Fasting & PP)",test_name_te:"చక్కెర పరీక్ష",category:"Blood",price:150,discount:0,home_available:true,report_time:"Same Day",fasting_required:true},
    {id:"lt3",lab_id:"l1",test_name:"Thyroid Profile (T3,T4,TSH)",test_name_te:"థైరాయిడ్ పరీక్ష",category:"Blood",price:600,discount:15,home_available:true,report_time:"24 Hours",fasting_required:true},
    {id:"lt4",lab_id:"l1",test_name:"Liver Function Test",test_name_te:"కాలేయ పరీక్ష",category:"Blood",price:450,discount:0,home_available:true,report_time:"24 Hours",fasting_required:true},
    {id:"lt5",lab_id:"l1",test_name:"Full Body Checkup",test_name_te:"పూర్తి శరీర పరీక్ష",category:"Package",price:2500,discount:20,home_available:true,report_time:"48 Hours",fasting_required:true},
    {id:"lt6",lab_id:"l2",test_name:"HbA1c (Diabetes)",test_name_te:"మధుమేహ పరీక్ష",category:"Blood",price:450,discount:10,home_available:true,report_time:"Same Day",fasting_required:false},
    {id:"lt7",lab_id:"l2",test_name:"Vitamin D Test",test_name_te:"విటమిన్ డి పరీక్ష",category:"Blood",price:800,discount:0,home_available:true,report_time:"48 Hours",fasting_required:false},
    {id:"lt8",lab_id:"l3",test_name:"X-Ray",test_name_te:"ఎక్స్-రే",category:"Radiology",price:250,discount:0,home_available:false,report_time:"Same Day",fasting_required:false},
    {id:"lt9",lab_id:"l3",test_name:"Ultrasound Abdomen",test_name_te:"అల్ట్రాసౌండ్",category:"Radiology",price:600,discount:0,home_available:false,report_time:"Same Day",fasting_required:false},
    {id:"lt10",lab_id:"l3",test_name:"MRI Brain",test_name_te:"ఎంఆర్ఐ",category:"Radiology",price:5000,discount:15,home_available:false,report_time:"24 Hours",fasting_required:false}
  ],
  patients: [
    {id:"p1",name:"Ananya Patel",email:"ananya@gmail.com",password_hash:"demo",phone:"+91 98765 00001",age:28,blood_group:"O+",gender:"Female"},
    {id:"p2",name:"Vikram Singh",email:"vikram@gmail.com",password_hash:"demo",phone:"+91 98765 00002",age:45,blood_group:"A+",gender:"Male"}
  ],
  appointments: [
    {id:"ap1",patient_id:"p1",patient_name:"Ananya Patel",doctor_id:"d1",doctor_name:"Dr. Priya Sharma",specialization:"Cardiology",date:new Date(Date.now()+86400000).toISOString().split("T")[0],slot:"10:00 AM",status:"confirmed",fee:800,payment_status:"paid",is_video:false},
    {id:"ap2",patient_id:"p1",patient_name:"Ananya Patel",doctor_id:"d2",doctor_name:"Dr. Rajesh Kumar",specialization:"Neurology",date:new Date(Date.now()+172800000).toISOString().split("T")[0],slot:"3:00 PM",status:"confirmed",fee:1200,payment_status:"paid",is_video:true,meeting_link:"https://meet.jit.si/docnear-demo"}
  ],
  states: [
    {code:"TS",name_en:"Telangana",name_te:"తెలంగాణ"},
    {code:"AP",name_en:"Andhra Pradesh",name_te:"ఆంధ్ర ప్రదేశ్"},
    {code:"MH",name_en:"Maharashtra",name_te:"మహారాష్ట్ర"},
    {code:"KA",name_en:"Karnataka",name_te:"కర్ణాటక"},
    {code:"TN",name_en:"Tamil Nadu",name_te:"తమిళనాడు"}
  ],
  districts: {
    "TS":["Hyderabad","Warangal","Karimnagar","Nizamabad","Khammam","Rangareddy","Secunderabad","Medak","Nalgonda"],
    "AP":["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kadapa"]
  }
};

/* ════════════════════ UTILS ════════════════════ */
const $    = id => document.getElementById(id);
const gv   = id => ($( id)||{}).value?.trim()||"";
const enc  = s  => encodeURIComponent(s||"");
const safe = s  => s||"";
const td   = () => new Date().toISOString().split("T")[0];
const ini  = n  => safe(n).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const T    = k  => (LANG[APP.lang]||LANG.en)[k] || k;

function avt(name, color="#0A7FAF", sz=48) {
  return `<div class="avatar" style="width:${sz}px;height:${sz}px;background:${color};font-size:${Math.round(sz*.35)}px">${ini(name)}</div>`;
}
function pill(lbl,bg="#E3F4FC",col="#0A7FAF") {
  return `<span class="pill" style="background:${bg};color:${col}">${lbl}</span>`;
}
function sPill(s) {
  const m={confirmed:["#D1FAE5","#059669"],pending:["#FEF3C7","#D97706"],cancelled:["#FEE2E2","#DC2626"],completed:["#EDE9FE","#7C4DFF"]};
  const[bg,c]=m[s]||m.pending; return pill(s.toUpperCase(),bg,c);
}
function toast(msg,err=false){
  const el=$("toast"); if(!el) return;
  el.style.background=err?"#EF4444":"#10B981"; el.style.color="#fff";
  el.textContent=(err?"❌ ":"✅ ")+msg; el.style.display="block";
  clearTimeout(el._t); el._t=setTimeout(()=>el.style.display="none",4000);
}
function spin(id, msg=""){
  const el=$(id); if(el) el.innerHTML=`<div class="loading-box"><div class="spinner"></div>${msg||T("loading")}</div>`;
}
function sc(icon,label,val,bg="#E3F4FC",vc="#0A7FAF"){
  return `<div class="stat-card"><div class="stat-icon" style="background:${bg}">${icon}</div><div><div class="stat-val" style="color:${vc}">${val}</div><div class="stat-lbl">${label}</div></div></div>`;
}
function empty(icon,msg,btn=""){
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-msg">${msg}</div>${btn}</div>`;
}
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
    ${a.status==="confirmed"&&a.is_video&&a.meeting_link?
      `<button class="btn btn-purple btn-sm" style="margin-top:10px;width:100%" onclick="joinVideo('${a.meeting_link}')">🎥 Join Video Call</button>`:""}
  </div>`;
}

/* ════════════════════ LANGUAGE ════════════════════ */
function setLang(lang) {
  APP.lang = lang;
  localStorage.setItem("docnear_lang", lang);
  // Update all [data-t] elements
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    el.textContent = T(key);
  });
  // Update placeholders
  document.querySelectorAll("[data-tp]").forEach(el => {
    el.placeholder = T(el.getAttribute("data-tp"));
  });
  // Toggle active button
  ["btn-lang-en","btn-lang-te"].forEach(id => {
    const btn = $(id); if(!btn) return;
    btn.style.background = (lang==="en"&&id.includes("en"))||(lang==="te"&&id.includes("te"))
      ? "linear-gradient(135deg,#0A7FAF,#085F8A)" : "transparent";
    btn.style.color = (lang==="en"&&id.includes("en"))||(lang==="te"&&id.includes("te"))
      ? "#fff" : "#6B7280";
  });
  renderLanding();
}

/* ════════════════════ DB with Demo Fallback ════════════════════ */
async function safeGet(table, query="", demoKey="") {
  try {
    const result = await DB.get(table, query);
    return result;
  } catch(e) {
    APP.isDemo = true;
    if(demoKey && DEMO[demoKey]) return DEMO[demoKey];
    return [];
  }
}
async function safePost(table, data, demoFn=null) {
  try { return await DB.post(table, data); }
  catch(e) { if(APP.isDemo && demoFn) return demoFn(data); throw e; }
}

/* ════════════════════ NAVIGATION ════════════════════ */
function go(page) {
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const el=$("page-"+page); if(!el) return;
  el.classList.add("active"); window.scrollTo(0,0);
  const map={
    landing:rLanding, search:rSearch,
    patientDash:rPatientDash, doctorDash:rDoctorDash,
    profile:rProfile, book:rBook,
    stores:rStores, storeDetail:rStoreDetail,
    ambulance:rAmbulance, labsPage:rLabsPage,
    labDetail:rLabDetail, prescOrder:rPrescOrder,
    patientOrders:rPatientOrders
  };
  if(map[page]) map[page]();
}
function logout(){
  APP.user=null; APP.userType=null;
  APP.cache={docs:[],stores:[],labs:[],ambus:[],appts:[],notifs:[],favs:[],states:[],districts:[]};
  go("landing"); toast(T("logout")+".");
}
function joinVideo(link){ window.open(link||"https://meet.jit.si/docnear-"+Date.now(),"_blank"); }

/* ════════════════════ AUTH ════════════════════ */
async function patientLogin(){
  const email=gv("pl-email"),pw=gv("pl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("pl-btn"); if(btn){btn.disabled=true;btn.textContent="...";}
  try{
    const hash=await hashPwd(pw);
    let rows=await safeGet("patients",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&APP.isDemo){const d=DEMO.patients.find(p=>p.email===email);if(d&&pw==="patient123")rows=[d];}
    if(!rows.length){toast("Invalid credentials.",true);return;}
    APP.user={...rows[0]}; APP.userType="patient";
    go("patientDash"); toast("Welcome, "+rows[0].name+"! 👋");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent=T("login");}}
}
async function doctorLogin(){
  const email=gv("dl-email"),pw=gv("dl-pw");
  if(!email||!pw){toast("Email & password required.",true);return;}
  const btn=$("dl-btn"); if(btn){btn.disabled=true;btn.textContent="...";}
  try{
    const hash=await hashPwd(pw);
    let rows=await safeGet("doctors",`email=eq.${enc(email)}&password_hash=eq.${enc(hash)}`);
    if(!rows.length&&APP.isDemo){const d=DEMO.doctors.find(d=>d.email===email);if(d&&pw==="doctor123")rows=[d];}
    if(!rows.length){toast("Invalid credentials.",true);return;}
    APP.user={...rows[0]}; APP.userType="doctor";
    go("doctorDash"); toast("Welcome, "+rows[0].name+"!");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent=T("login");}}
}
function adminLogin(){
  const email=gv("al-email"),pw=gv("al-pw");
  if(email==="admin@docnear.com"&&pw==="admin123"){
    APP.user={name:"Admin",email}; APP.userType="admin";
    window.location.href="admin.html"; return;
  }
  toast("Invalid admin credentials.",true);
}
async function patientRegister(){
  const name=gv("pr-name"),email=gv("pr-email"),pw=gv("pr-pw"),phone=gv("pr-phone"),age=gv("pr-age"),blood=gv("pr-blood"),gender=gv("pr-gender");
  if(!name||!email||!pw||!phone||!age){toast("Fill all required fields.",true);return;}
  const btn=$("pr-btn"); if(btn){btn.disabled=true;btn.textContent="...";}
  try{
    const hash=await hashPwd(pw);
    const rows=await safePost("patients",{name,email,password_hash:hash,phone,age:parseInt(age),blood_group:blood,gender},
      d=>[{...d,id:"p_"+Date.now()}]);
    APP.user={...rows[0]}; APP.userType="patient";
    go("patientDash"); toast("Welcome to DocNear, "+name+"! 🎉");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent=T("register");}}
}
async function doctorRegister(){
  const f={name:gv("dr-name"),email:gv("dr-email"),pw:gv("dr-pw"),phone:gv("dr-phone"),spec:gv("dr-spec"),reg:gv("dr-reg"),hosp:gv("dr-hosp"),loc:gv("dr-loc"),exp:gv("dr-exp"),fee:gv("dr-fee"),about:gv("dr-about"),qual:gv("dr-qual"),state:gv("dr-state"),district:gv("dr-dist")};
  if(!f.name||!f.email||!f.pw||!f.phone||!f.spec||!f.reg||!f.hosp||!f.loc||!f.exp||!f.fee){toast("Fill all required fields.",true);return;}
  const btn=$("dr-btn"); if(btn){btn.disabled=true;btn.textContent="...";}
  try{
    const hash=await hashPwd(f.pw);
    await safePost("doctors",{name:f.name,email:f.email,password_hash:hash,phone:f.phone,specialization:f.spec,reg_number:f.reg,hospital:f.hosp,location:f.loc,city:f.loc,state_code:f.state,district:f.district,experience:parseInt(f.exp),fee:parseInt(f.fee),about:f.about,qualifications:f.qual,approved:false,color:SPECS.find(s=>s.name===f.spec)?.color||"#0A7FAF",slots:["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM"]});
    go("doctorPending"); toast("Registration submitted!");
  }catch(e){toast(e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="Submit";}}
}

/* ════════════════════ RENDER: LANDING ════════════════════ */
const SPECS=[
  {name:"Cardiology",icon:"❤️",color:"#FF4757"},{name:"Neurology",icon:"🧠",color:"#7C4DFF"},
  {name:"Orthopedics",icon:"🦴",color:"#FF6B35"},{name:"Pediatrics",icon:"👶",color:"#00BCD4"},
  {name:"Ophthalmology",icon:"👁️",color:"#2196F3"},{name:"Dermatology",icon:"✨",color:"#E91E8C"},
  {name:"General Medicine",icon:"🏥",color:"#009688"},{name:"Gynecology",icon:"🌸",color:"#E91E63"}
];

async function rLanding(){
  // Nav
  const ng=$("nav-guest"),nu=$("nav-user");
  if(APP.user){
    if(ng) ng.style.display="none"; if(nu){nu.style.display="flex"; $("nav-user-name").textContent=APP.user.name;}
  } else {
    if(ng) ng.style.display="flex"; if(nu) nu.style.display="none";
  }
  // Update all text translations
  document.querySelectorAll("[data-t]").forEach(el=>{ el.textContent=T(el.getAttribute("data-t")); });
  document.querySelectorAll("[data-tp]").forEach(el=>{ el.placeholder=T(el.getAttribute("data-tp")); });
  // Specs
  const sc=$("landing-specs");
  if(sc) sc.innerHTML=SPECS.map(s=>`
    <div class="spec-card" onclick="APP.filterSpec='${s.name}';go('search')"
      onmouseover="this.style.boxShadow='0 8px 20px ${s.color}33'" onmouseout="this.style.boxShadow=''">
      <div class="spec-icon">${s.icon}</div><div class="spec-name">${s.name}</div>
    </div>`).join("");
  // Top Doctors
  const dc=$("landing-doctors");
  if(dc){
    spin("landing-doctors");
    try{
      let docs=await safeGet("doctors","approved=eq.true&limit=3","doctors");
      if(!docs.length) docs=DEMO.doctors.slice(0,3);
      APP.cache.docs=[...APP.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
      dc.innerHTML=docs.map(d=>docCard(d)).join("");
      if(APP.isDemo) dc.innerHTML+=`<div style="grid-column:1/-1;text-align:center;padding:10px;font-size:12px;color:#F59E0B;background:#FEF3C7;border-radius:8px;margin-top:8px">⚠️ Demo mode — run DOCNEAR_FINAL.sql + DOCNEAR_V2.sql in Supabase</div>`;
    }catch(e){dc.innerHTML=DEMO.doctors.slice(0,3).map(d=>docCard(d)).join("");}
  }
  // Load states for filters
  await loadStates();
  renderStateFilter("landing-state-filter");
}

async function loadStates(){
  if(APP.cache.states.length) return;
  try{
    const s=await DB.get("states","order=name_en.asc");
    APP.cache.states=s.length?s:DEMO.states;
  }catch{APP.cache.states=DEMO.states;}
}
async function loadDistricts(stateCode){
  try{
    const d=await DB.get("districts",`state_code=eq.${stateCode}&order=name_en.asc`);
    APP.cache.districts=d.length?d:(DEMO.districts[stateCode]||[]).map(n=>({name_en:n,name_te:n}));
  }catch{APP.cache.districts=(DEMO.districts[stateCode]||[]).map(n=>({name_en:n,name_te:n}));}
}

function renderStateFilter(id){
  const el=$(id); if(!el) return;
  el.innerHTML=`<option value="">${T("allStates")}</option>`+
    APP.cache.states.map(s=>`<option value="${s.code}">${APP.lang==="te"?s.name_te:s.name_en}</option>`).join("");
  el.value=APP.filterState;
}
async function onStateChange(selectId, districtId){
  const val=$(selectId)?.value||"";
  APP.filterState=val; APP.filterDistrict="";
  if(val){ await loadDistricts(val); }
  const distEl=$(districtId); if(!distEl) return;
  if(!val){ distEl.innerHTML=`<option value="">${T("allDistricts")}</option>`; return; }
  distEl.innerHTML=`<option value="">${T("allDistricts")}</option>`+
    APP.cache.districts.map(d=>`<option value="${APP.lang==="te"?d.name_te:d.name_en}">${APP.lang==="te"?d.name_te:d.name_en}</option>`).join("");
}

/* ════════════════════ DOCTOR CARD ════════════════════ */
function docCard(d){
  const sc=(SPECS.find(s=>s.name===d.specialization)||{}).color||"#0A7FAF";
  const isFav=APP.cache.favs?.includes(d.id);
  return `
  <div class="card" onclick="viewDoc('${d.id}')">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      ${avt(d.name,d.color||sc,56)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px">
          <div class="doc-name">${safe(d.name)}</div>
          ${d.video_consult?`<span title="Video consult" style="font-size:12px">🎥</span>`:""}
        </div>
        <div class="doc-spec">${safe(d.specialization)}</div>
        <div class="doc-meta">⭐ <strong>${d.rating||"New"}</strong>${d.reviews>0?` <span style="color:#9CA3AF">(${d.reviews})</span>`:""}</div>
        ${d.district?`<div style="font-size:11px;color:#9CA3AF;margin-top:1px">📍 ${safe(d.district)}</div>`:""}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:18px;font-weight:800;color:#0A7FAF">₹${d.fee||0}</div>
        <div style="font-size:10px;color:#9CA3AF">${T("perVisit")}</div>
        ${APP.userType==="patient"?`<button onclick="event.stopPropagation();toggleFav('${d.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;margin-top:4px">${isFav?"❤️":"🤍"}</button>`:""}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-size:11px;color:#6B7280">🏥 ${safe(d.hospital)||"—"}</span>
      <span style="font-size:11px;color:#6B7280">🏆 ${d.experience||0} ${T("yearsExp")}</span>
      <span style="font-size:11px;color:#6B7280">📍 ${safe(d.city||d.location)||"—"}</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();viewDoc('${d.id}')">${T("profile")}</button>
      <button class="btn btn-primary" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();bookDoc('${d.id}')">${T("bookNow")}</button>
    </div>
  </div>`;
}

/* ════════════════════ STORE CARD ════════════════════ */
function storeCard(s){
  const isOpen = s.is_24x7 || isStoreOpen(s.opening_time, s.closing_time);
  return `
  <div class="card" onclick="viewStore('${s.id}')">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${s.color||"#10B981"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">💊</div>
      <div style="flex:1;min-width:0">
        <div class="doc-name">${safe(s.store_name)}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px">👤 ${safe(s.owner_name)}</div>
        <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
          ${pill(isOpen?T("storeOpen"):T("storeClosed"),isOpen?"#D1FAE5":"#FEE2E2",isOpen?"#059669":"#DC2626")}
          ${s.delivery_available?pill(T("delivery"),"#E3F4FC","#0A7FAF"):pill(T("pickupOnly"),"#F3F4F6","#9CA3AF")}
          ${s.is_24x7?pill("24×7","#EDE9FE","#7C4DFF"):""}
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">📍 ${safe(s.address)||safe(s.district)||"—"}${s.delivery_available?`<span style="margin-left:8px">🚴 ${s.delivery_radius_km}km delivery</span>`:""}</div>
    <div style="display:flex;gap:8px">
      <a href="tel:${s.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">${T("callNow")}</a>
      <button class="btn btn-green" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();uploadPrescForStore('${s.id}')">📋 Order Medicines</button>
    </div>
  </div>`;
}
function isStoreOpen(open,close){
  try{
    const now=new Date(); const h=now.getHours(), m=now.getMinutes();
    const cur=h*60+m;
    const [oh,om]=open.split(":").map(Number);
    const [ch,cm]=close.split(":").map(Number);
    return cur>=oh*60+om && cur<=ch*60+cm;
  }catch{return true;}
}

/* ════════════════════ AMBULANCE CARD ════════════════════ */
function ambuCard(a){
  const statusColor={available:"#059669",busy:"#D97706",offline:"#9CA3AF"};
  const statusBg={available:"#D1FAE5",busy:"#FEF3C7",offline:"#F3F4F6"};
  return `
  <div class="card">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${a.color||"#EF4444"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🚑</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:700;color:#1A2B3C">${safe(a.operator_name)}</div>
        <div style="font-size:12px;color:#6B7280">${safe(a.vehicle_type)}</div>
        <div style="font-size:11px;color:#9CA3AF">${safe(a.vehicle_number)||""} · 📍 ${safe(a.base_location)||safe(a.district)||"—"}</div>
      </div>
      <div>${pill((a.availability_status||"offline").toUpperCase(), statusBg[a.availability_status]||"#F3F4F6", statusColor[a.availability_status]||"#9CA3AF")}</div>
    </div>
    <!-- Pricing -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:10px;color:#9CA3AF;margin-bottom:2px">${T("baseFare")}</div>
        <div style="font-size:13px;font-weight:700;color:#DC2626">₹${a.base_fare||0}</div>
      </div>
      <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:10px;color:#9CA3AF;margin-bottom:2px">${T("perKm")}</div>
        <div style="font-size:13px;font-weight:700;color:#DC2626">₹${a.per_km_rate||0}</div>
      </div>
      <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:10px;color:#9CA3AF;margin-bottom:2px">Radius</div>
        <div style="font-size:13px;font-weight:700;color:#DC2626">${a.service_radius_km||0}km</div>
      </div>
    </div>
    <!-- Equipment -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      ${a.has_oxygen?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">🩸 Oxygen</span>`:""}
      ${a.has_stretcher?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">🛏️ Stretcher</span>`:""}
      ${a.has_monitor?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">📊 Monitor</span>`:""}
      ${a.has_ventilator?`<span style="font-size:11px;background:#F0FDF4;color:#059669;padding:3px 8px;border-radius:8px">💨 Ventilator</span>`:""}
    </div>
    <!-- Rating -->
    ${a.rating>0?`<div style="font-size:12px;color:#6B7280;margin-bottom:10px">⭐ ${a.rating} rating · ${a.total_trips||0} trips</div>`:""}
    <!-- Action buttons -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <a href="tel:${a.phone}" class="btn btn-outline btn-full">${T("callNow")}</a>
      ${a.alternate_phone?`<a href="tel:${a.alternate_phone}" class="btn btn-ghost btn-full">📞 Alternate</a>`:
        `<button class="btn btn-red btn-full" onclick="bookAmbulance('${a.id}')">🚑 Book Now</button>`}
    </div>
    ${a.alternate_phone?`<button class="btn btn-red btn-full" style="margin-top:8px" onclick="bookAmbulance('${a.id}')">🚑 Book Ambulance</button>`:""}
  </div>`;
}

/* ════════════════════ LAB CARD ════════════════════ */
function labCard(l){
  const typeIcon={pathology:"🧪",radiology:"🩻",home_collection:"🏠",full_service:"🔬"};
  return `
  <div class="card" onclick="viewLab('${l.id}')">
    <div style="display:flex;gap:12px;margin-bottom:10px">
      <div style="width:52px;height:52px;border-radius:12px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${typeIcon[l.lab_type]||"🔬"}</div>
      <div style="flex:1;min-width:0">
        <div class="doc-name">${safe(l.lab_name)}</div>
        <div style="font-size:12px;color:#7C4DFF;font-weight:600">${(l.lab_type||"").replace("_"," ").toUpperCase()}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          ${l.nabl_accredited?pill("NABL Accredited","#D1FAE5","#059669"):""}
          ${l.home_collection?pill("🏠 Home Collection","#EDE9FE","#7C4DFF"):""}
        </div>
      </div>
      ${l.rating>0?`<div style="font-size:13px;font-weight:700;color:#F59E0B">⭐${l.rating}</div>`:""}
    </div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:12px">
      📍 ${safe(l.address)||safe(l.district)||"—"}
      ${l.home_collection?`<span style="margin-left:8px">🏠 ₹${l.home_collection_charge} collection charge</span>`:""}
    </div>
    <div style="display:flex;gap:8px">
      <a href="tel:${l.phone}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">${T("callNow")}</a>
      <button class="btn btn-purple" style="flex:1;padding:7px 0;font-size:13px" onclick="event.stopPropagation();viewLab('${l.id}')">${T("bookLabTest")}</button>
    </div>
  </div>`;
}

/* ════════════════════ RENDER: SEARCH ════════════════════ */
async function rSearch(){
  const na=$("search-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name}</span><button class="btn btn-ghost btn-sm" onclick="logout()">${T("logout")}</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">${T("patientLogin")}</button>`;
  $("search-back-btn").onclick=()=>go(APP.userType==="patient"?"patientDash":"landing");
  const chips=$("search-chips");
  if(chips) chips.innerHTML=[{name:"All",icon:""},...SPECS].map(s=>`
    <button class="chip ${(!APP.filterSpec&&s.name==="All")||APP.filterSpec===s.name?"active":""}"
      onclick="setSearchSpec('${s.name==="All"?"":s.name}')">${s.icon} ${s.name}</button>`).join("");
  const qi=$("search-q"),si=$("search-spec");
  if(qi) qi.value=APP.searchQ; if(si) si.value=APP.filterSpec;
  // State/District filters in search
  await loadStates();
  renderStateFilter("search-state");
  if(APP.filterState){
    await loadDistricts(APP.filterState);
    const distEl=$("search-district");
    if(distEl){
      distEl.innerHTML=`<option value="">${T("allDistricts")}</option>`+
        APP.cache.districts.map(d=>`<option value="${d.name_en}">${APP.lang==="te"?d.name_te:d.name_en}</option>`).join("");
      distEl.value=APP.filterDistrict;
    }
  }
  await fetchDocs();
}
function setSearchSpec(s){APP.filterSpec=s;rSearch();}
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
  const re=$("search-results"),ce=$("search-count"); if(!re) return;
  spin("search-results");
  try{
    let q="approved=eq.true";
    if(APP.filterSpec) q+=`&specialization=eq.${enc(APP.filterSpec)}`;
    if(APP.filterState) q+=`&state_code=eq.${enc(APP.filterState)}`;
    if(APP.filterDistrict) q+=`&district=eq.${enc(APP.filterDistrict)}`;
    let docs=await safeGet("doctors",q,"doctors");
    if(!docs.length) docs=DEMO.doctors;
    if(APP.filterSpec) docs=docs.filter(d=>d.specialization===APP.filterSpec);
    if(APP.filterState) docs=docs.filter(d=>d.state_code===APP.filterState);
    if(APP.filterDistrict) docs=docs.filter(d=>d.district===APP.filterDistrict);
    if(APP.searchQ){const v=APP.searchQ.toLowerCase();docs=docs.filter(d=>safe(d.name).toLowerCase().includes(v)||safe(d.specialization).toLowerCase().includes(v)||safe(d.hospital).toLowerCase().includes(v));}
    APP.cache.docs=[...APP.cache.docs.filter(d=>!docs.find(x=>x.id===d.id)),...docs];
    if(ce) ce.textContent=docs.length+" doctor"+(docs.length!==1?"s":"")+" found";
    re.innerHTML=docs.length?docs.map(d=>docCard(d)).join(""):empty("🔍","No doctors found. Try different filters.");
  }catch(e){re.innerHTML=DEMO.doctors.map(d=>docCard(d)).join("");}
}

/* ════════════════════ RENDER: MEDICAL STORES ════════════════════ */
async function rStores(){
  const na=$("stores-nav-actions");
  if(na) na.innerHTML=APP.user
    ?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name}</span><button class="btn btn-ghost btn-sm" onclick="logout()">${T("logout")}</button>`
    :`<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">${T("patientLogin")}</button>`;
  await loadStates();
  renderStateFilter("stores-state");
  const listEl=$("stores-list"); if(!listEl) return;
  spin("stores-list");
  try{
    let q="approved=eq.true&is_active=eq.true";
    if(APP.filterState) q+=`&state_code=eq.${enc(APP.filterState)}`;
    if(APP.filterDistrict) q+=`&district=eq.${enc(APP.filterDistrict)}`;
    let stores=await safeGet("medical_stores",q,"stores");
    if(!stores.length) stores=DEMO.stores;
    APP.cache.stores=stores;
    listEl.innerHTML=stores.length?stores.map(s=>storeCard(s)).join(""):empty("💊","No medical stores found in this area.");
  }catch(e){
    APP.cache.stores=DEMO.stores;
    listEl.innerHTML=DEMO.stores.map(s=>storeCard(s)).join("");
  }
}
async function filterStores(){
  const q=($("stores-q")||{}).value||"";
  APP.filterState=($("stores-state")||{}).value||"";
  const listEl=$("stores-list"); if(!listEl) return;
  spin("stores-list");
  try{
    let stores=APP.cache.stores;
    if(q){const v=q.toLowerCase();stores=stores.filter(s=>safe(s.store_name).toLowerCase().includes(v)||safe(s.district).toLowerCase().includes(v));}
    if(APP.filterState) stores=stores.filter(s=>s.state_code===APP.filterState);
    listEl.innerHTML=stores.length?stores.map(s=>storeCard(s)).join(""):empty("💊","No stores found.");
  }catch(e){listEl.innerHTML=empty("⚠️",e.message);}
}
function viewStore(id){
  APP.selectedStore=APP.cache.stores.find(s=>s.id===id);
  go("storeDetail");
}
function rStoreDetail(){
  const s=APP.selectedStore; if(!s){go("stores");return;}
  const c=$("store-detail-content"); if(!c) return;
  const isOpen=s.is_24x7||isStoreOpen(s.opening_time,s.closing_time);
  c.innerHTML=`
    <div style="background:#fff;border-radius:20px;padding:24px;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.07)">
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:16px;background:${s.color||"#10B981"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">💊</div>
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(s.store_name)}</h2>
          <div style="font-size:13px;color:#6B7280">👤 ${safe(s.owner_name)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            ${pill(isOpen?T("storeOpen"):T("storeClosed"),isOpen?"#D1FAE5":"#FEE2E2",isOpen?"#059669":"#DC2626")}
            ${s.approved?pill(T("verified"),"#D1FAE5","#059669"):""}
            ${s.is_24x7?pill("24×7 Open","#EDE9FE","#7C4DFF"):""}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px">
        ${[["📍","Address",s.address||s.district],["📞","Phone",s.phone],["🕐","Hours",s.is_24x7?"24 Hours":s.opening_time+" - "+s.closing_time],["🚴","Delivery",s.delivery_available?s.delivery_radius_km+"km radius":"Not Available"],["⭐","Rating",s.rating>0?s.rating+"/5":"New"],["💊","Drug License",s.drug_license_no||"—"]].map(([ic,l,v])=>`
          <div style="background:#F9FAFB;border-radius:10px;padding:10px 14px">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:2px">${ic} ${l}</div>
            <div style="font-size:13px;font-weight:600;color:#1A2B3C">${safe(v)||"—"}</div>
          </div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <a href="tel:${s.phone}" class="btn btn-outline btn-full">${T("callNow")}</a>
        <button class="btn btn-green btn-full" onclick="uploadPrescForStore('${s.id}')">📋 Order Medicines</button>
      </div>
    </div>`;
}
function uploadPrescForStore(storeId){
  APP.selectedStore=APP.cache.stores.find(s=>s.id===storeId)||APP.selectedStore;
  go("prescOrder");
}

/* ════════════════════ RENDER: PRESCRIPTION ORDER ════════════════════ */
function rPrescOrder(){
  if(!APP.user||APP.userType!=="patient"){toast("Login as patient first.",true);go("patientLogin");return;}
  const c=$("presc-content"); if(!c) return;
  c.innerHTML=`
    <div style="background:#fff;border-radius:16px;padding:22px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${APP.selectedStore?`
        <div style="display:flex;gap:12px;align-items:center;padding:12px;background:#F0FDF4;border-radius:12px;margin-bottom:16px">
          <span style="font-size:24px">💊</span>
          <div><div style="font-size:14px;font-weight:700;color:#1A2B3C">${safe(APP.selectedStore.store_name)}</div>
          <div style="font-size:12px;color:#059669">Sending to this store</div></div>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="APP.selectedStore=null;rPrescOrder()">Change</button>
        </div>`:`
        <div style="background:#FEF3C7;border-radius:12px;padding:12px;margin-bottom:16px;font-size:13px;color:#92400E">
          ℹ️ Prescription will be sent to all nearby verified medical stores
        </div>`}
      <div class="form-group">
        <label class="form-label">Doctor's Prescription Photo <span>*</span></label>
        <div id="presc-upload-area" style="border:2px dashed #0A7FAF;border-radius:12px;padding:32px 20px;text-align:center;cursor:pointer;background:#F0F9FF;transition:all .2s"
          onclick="$('presc-file').click()" ondragover="event.preventDefault()" ondrop="handleDrop(event)">
          <div style="font-size:40px;margin-bottom:8px">📸</div>
          <div style="font-size:14px;font-weight:600;color:#0A7FAF">Click to upload prescription</div>
          <div style="font-size:12px;color:#9CA3AF;margin-top:4px">JPG, PNG, PDF supported · Max 5MB</div>
        </div>
        <input type="file" id="presc-file" accept="image/*,.pdf" style="display:none" onchange="onPrescFileChange(event)"/>
        <div id="presc-preview" style="display:none;margin-top:10px"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Delivery Address <span>*</span></label>
        <textarea id="presc-address" class="form-input" rows="2" placeholder="Your delivery address...">${APP.user?.address||""}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Additional Notes</label>
        <input id="presc-notes" class="form-input" placeholder="e.g. Urgent, substitute medicines ok, etc."/>
      </div>
      <div class="form-group">
        <label class="form-label">Is this URGENT?</label>
        <div style="display:flex;gap:10px">
          <button id="urgent-no" class="slot-btn active" onclick="setUrgent(false)" style="flex:1">Normal Order</button>
          <button id="urgent-yes" class="slot-btn" onclick="setUrgent(true)" style="flex:1">🚨 Urgent</button>
        </div>
      </div>
    </div>
    <div style="background:#FEF3C7;border-radius:12px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400E">
      ⚠️ <strong>Important:</strong> Only valid prescriptions accepted. Controlled medicines require original prescription.
    </div>
    <button class="btn btn-green btn-full" id="presc-submit-btn" onclick="submitPrescOrder()" style="font-size:15px;padding:14px">
      📋 Submit Prescription Order
    </button>`;
  window._urgentOrder=false;
}
function setUrgent(v){
  window._urgentOrder=v;
  $("urgent-yes").classList.toggle("active",v);
  $("urgent-no").classList.toggle("active",!v);
}
function onPrescFileChange(e){
  const file=e.target.files[0]; if(!file) return;
  window._prescFile=file;
  const prev=$("presc-preview");
  if(file.type.startsWith("image/")){
    const reader=new FileReader();
    reader.onload=ev=>{
      prev.innerHTML=`<img src="${ev.target.result}" style="width:100%;max-height:200px;object-fit:contain;border-radius:8px;border:1px solid #E5E7EB"/>`;
      prev.style.display="block";
    };
    reader.readAsDataURL(file);
  } else {
    prev.innerHTML=`<div style="padding:12px;background:#F0FDF4;border-radius:8px;color:#059669">📄 ${file.name} (${(file.size/1024).toFixed(1)}KB)</div>`;
    prev.style.display="block";
  }
  $("presc-upload-area").style.borderColor="#10B981";
  $("presc-upload-area").innerHTML=`<div style="font-size:30px;margin-bottom:6px">✅</div><div style="font-size:13px;font-weight:600;color:#059669">${file.name}</div><div style="font-size:11px;color:#9CA3AF">Click to change</div>`;
}
function handleDrop(e){
  e.preventDefault();
  const file=e.dataTransfer.files[0];
  if(file){ const dt=new DataTransfer(); dt.items.add(file); $("presc-file").files=dt.files; onPrescFileChange({target:{files:[file]}}); }
}
async function submitPrescOrder(){
  if(!window._prescFile){toast("Please upload a prescription photo.",true);return;}
  const address=gv("presc-address");
  if(!address){toast("Please enter delivery address.",true);return;}
  const btn=$("presc-submit-btn"); if(btn){btn.disabled=true;btn.textContent="Submitting...";}
  try{
    // In real app: upload to Supabase Storage, get URL
    // For demo: use a placeholder URL
    const prescUrl="demo_prescription_"+Date.now()+".jpg";
    const orderData={
      patient_id:APP.user.id, patient_name:APP.user.name, patient_phone:APP.user.phone,
      store_id:APP.selectedStore?.id||null, store_name:APP.selectedStore?.store_name||null,
      prescription_url:prescUrl, delivery_address:address,
      notes:gv("presc-notes"), is_urgent:window._urgentOrder||false,
      status:"pending", payment_mode:"cod"
    };
    await safePost("prescription_orders",orderData,d=>[{...d,id:"rx_"+Date.now()}]);
    toast("Prescription order submitted! 🎉 Medical store will contact you soon.");
    window._prescFile=null;
    go("patientOrders");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent="📋 Submit Prescription Order";}}
}

/* ════════════════════ RENDER: PATIENT ORDERS ════════════════════ */
async function rPatientOrders(){
  if(!APP.user){go("patientLogin");return;}
  const c=$("orders-content"); if(!c) return;
  spin("orders-content");
  try{
    const orders=await safeGet("prescription_orders","patient_id=eq."+APP.user.id);
    const statusColor={pending:"#D97706",accepted:"#0A7FAF",packed:"#7C4DFF",delivered:"#059669",completed:"#059669",rejected:"#DC2626",cancelled:"#9CA3AF"};
    c.innerHTML=orders.length?orders.map(o=>`
      <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.05);border-left:4px solid ${statusColor[o.status]||"#9CA3AF"}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div>
            <div style="font-size:13px;font-weight:700;color:#1A2B3C">${safe(o.store_name)||"Sent to nearby stores"}</div>
            <div style="font-size:11px;color:#9CA3AF">${new Date(o.created_at).toLocaleDateString()}</div>
          </div>
          ${pill((o.status||"pending").replace("_"," ").toUpperCase(),statusColor[o.status]+"22",statusColor[o.status]||"#9CA3AF")}
        </div>
        ${o.notes?`<div style="font-size:12px;color:#6B7280;margin-bottom:6px">📝 ${o.notes}</div>`:""}
        ${o.is_urgent?`<span style="font-size:11px;background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:6px;font-weight:600">🚨 URGENT</span>`:""}
        ${o.total_amount?`<div style="font-size:14px;font-weight:700;color:#0A7FAF;margin-top:6px">₹${o.total_amount}</div>`:""}
      </div>`).join("")
      :empty("📋","No prescription orders yet.",`<button class="btn btn-green btn-sm" onclick="go('prescOrder')">Upload Prescription</button>`);
  }catch(e){c.innerHTML=empty("⚠️","Error loading orders: "+e.message);}
}

/* ════════════════════ RENDER: AMBULANCE ════════════════════ */
async function rAmbulance(){
  await loadStates();
  renderStateFilter("ambu-state");
  const listEl=$("ambu-list"); if(!listEl) return;
  spin("ambu-list");
  try{
    let q="approved=eq.true";
    if(APP.filterState) q+=`&state_code=eq.${enc(APP.filterState)}`;
    if(APP.filterDistrict) q+=`&district=eq.${enc(APP.filterDistrict)}`;
    let ambus=await safeGet("ambulances",q,"ambulances");
    if(!ambus.length) ambus=DEMO.ambulances;
    APP.cache.ambus=ambus;
    listEl.innerHTML=ambus.length?ambus.map(a=>ambuCard(a)).join(""):empty("🚑","No ambulances found in this area.");
  }catch(e){
    APP.cache.ambus=DEMO.ambulances;
    listEl.innerHTML=DEMO.ambulances.map(a=>ambuCard(a)).join("");
  }
}
async function filterAmbulance(){
  APP.filterState=($("ambu-state")||{}).value||"";
  APP.filterDistrict=($("ambu-district")||{}).value||"";
  await rAmbulance();
}
function bookAmbulance(id){
  const a=APP.cache.ambus.find(x=>x.id===id);
  if(a){
    if(confirm(`Book ambulance from ${a.operator_name}?\n📞 ${a.phone}\n💰 Base: ₹${a.base_fare} + ₹${a.per_km_rate}/km\n\nClick OK to call.`)){
      window.location.href="tel:"+a.phone;
    }
  }
}

/* ════════════════════ RENDER: LABS PAGE ════════════════════ */
async function rLabsPage(){
  await loadStates();
  renderStateFilter("labs-state");
  const listEl=$("labs-list"); if(!listEl) return;
  spin("labs-list");
  try{
    let q="approved=eq.true&is_active=eq.true";
    const typeFilter=($("labs-type")||{}).value||"";
    if(typeFilter) q+=`&lab_type=eq.${typeFilter}`;
    if(APP.filterState) q+=`&state_code=eq.${enc(APP.filterState)}`;
    if(APP.filterDistrict) q+=`&district=eq.${enc(APP.filterDistrict)}`;
    let labs=await safeGet("diagnostic_labs",q,"labs");
    if(!labs.length) labs=DEMO.labs;
    APP.cache.labs=labs;
    listEl.innerHTML=labs.length?labs.map(l=>labCard(l)).join(""):empty("🔬","No labs found in this area.");
  }catch(e){
    APP.cache.labs=DEMO.labs;
    listEl.innerHTML=DEMO.labs.map(l=>labCard(l)).join("");
  }
}
async function filterLabs(){
  APP.filterState=($("labs-state")||{}).value||"";
  APP.filterDistrict=($("labs-district")||{}).value||"";
  await rLabsPage();
}
async function viewLab(id){
  APP.selectedLab=APP.cache.labs.find(l=>l.id===id)||DEMO.labs.find(l=>l.id===id);
  go("labDetail");
}
async function rLabDetail(){
  const l=APP.selectedLab; if(!l){go("labsPage");return;}
  const c=$("lab-detail-content"); if(!c) return;
  const typeIcon={pathology:"🧪",radiology:"🩻",home_collection:"🏠",full_service:"🔬"};
  spin("lab-detail-content");
  // Load tests for this lab
  let tests=[];
  try{
    tests=await DB.get("lab_tests",`lab_id=eq.${l.id}&is_active=eq.true&order=category.asc,price.asc`);
    if(!tests.length) tests=DEMO.labTests.filter(t=>t.lab_id===l.id);
  }catch{ tests=DEMO.labTests.filter(t=>t.lab_id===l.id); }
  // Group tests by category
  const groups={};
  tests.forEach(t=>{ groups[t.category]=groups[t.category]||[]; groups[t.category].push(t); });
  const catColors={Blood:"#FF4757",Urine:"#FF6B35",Radiology:"#2196F3",Scan:"#7C4DFF",Pathology:"#E91E8C",Package:"#009688",Special:"#F59E0B"};
  c.innerHTML=`
    <!-- Lab Header -->
    <div style="background:#fff;border-radius:20px;padding:24px;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.07)">
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="width:64px;height:64px;border-radius:16px;background:${l.color||"#7C4DFF"};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${typeIcon[l.lab_type]||"🔬"}</div>
        <div style="flex:1;min-width:160px">
          <h2 style="font-size:20px;font-weight:800;color:#1A2B3C;margin-bottom:3px">${safe(l.lab_name)}</h2>
          <div style="font-size:13px;color:#7C4DFF;font-weight:600">${(l.lab_type||"").replace("_"," ").toUpperCase()}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
            ${l.nabl_accredited?pill("✓ NABL Accredited","#D1FAE5","#059669"):""}
            ${l.home_collection?pill("🏠 Home Collection","#EDE9FE","#7C4DFF"):""}
            ${l.rating>0?pill("⭐ "+l.rating,"#FEF3C7","#D97706"):""}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px">
        ${[["📞","Phone",l.phone],["📍","Address",l.address||l.district],["🕐","Hours",l.is_24x7?"24 Hours":(l.opening_time||"08:00")+" - "+(l.closing_time||"20:00")],["🏠","Home Collection",l.home_collection?"₹"+l.home_collection_charge+" charge":"Not Available"],["📋","License",l.lab_registration_no||"—"],["⭐","Rating",l.rating>0?l.rating+"/5":"New"]].map(([ic,lb,v])=>`
          <div style="background:#F9FAFB;border-radius:10px;padding:10px 14px">
            <div style="font-size:10px;color:#9CA3AF;margin-bottom:2px">${ic} ${lb}</div>
            <div style="font-size:13px;font-weight:600;color:#1A2B3C">${safe(v)||"—"}</div>
          </div>`).join("")}
      </div>
      <a href="tel:${l.phone}" class="btn btn-outline btn-full">${T("callNow")}</a>
    </div>
    <!-- Tests by Category -->
    <div style="font-size:16px;font-weight:700;color:#1A2B3C;margin-bottom:14px">Available Tests (${tests.length})</div>
    ${Object.entries(groups).map(([cat,catTests])=>`
      <div style="background:#fff;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)">
        <div style="padding:12px 16px;background:${catColors[cat]||"#0A7FAF"}22;border-bottom:1px solid ${catColors[cat]||"#0A7FAF"}33">
          <div style="font-size:13px;font-weight:700;color:${catColors[cat]||"#0A7FAF"}">${cat} Tests (${catTests.length})</div>
        </div>
        ${catTests.map(t=>`
          <div style="padding:14px 16px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:12px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:#1A2B3C">${APP.lang==="te"&&t.test_name_te?t.test_name_te:t.test_name}</div>
              <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
                ${t.fasting_required?`<span style="font-size:11px;color:#D97706;background:#FEF3C7;padding:2px 6px;border-radius:4px">Fasting</span>`:""}
                ${t.home_available?`<span style="font-size:11px;color:#7C4DFF;background:#EDE9FE;padding:2px 6px;border-radius:4px">🏠 Home</span>`:""}
                <span style="font-size:11px;color:#6B7280">⏱ ${t.report_time||"Same Day"}</span>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              ${t.discount>0?`<div style="font-size:11px;color:#9CA3AF;text-decoration:line-through">₹${Math.round(t.price/(1-t.discount/100))}</div>`:""}
              <div style="font-size:16px;font-weight:800;color:#7C4DFF">₹${t.price}</div>
              ${t.discount>0?`<div style="font-size:11px;color:#059669;font-weight:600">${t.discount}% off</div>`:""}
            </div>
          </div>`).join("")}
      </div>`).join("")}
    <!-- Book Tests Button -->
    ${APP.userType==="patient"?`
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:8px">Book Lab Tests</div>
      <div style="font-size:13px;color:#6B7280;margin-bottom:14px">Select tests above and book appointment or home collection.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn btn-outline btn-full" onclick="bookLabVisit('${l.id}')">🏥 Visit Lab</button>
        ${l.home_collection?`<button class="btn btn-purple btn-full" onclick="bookHomeCollection('${l.id}')">🏠 Home Collection</button>`:
          `<button class="btn btn-ghost btn-full" disabled>Home N/A</button>`}
      </div>
    </div>`:"<div style='text-align:center;padding:20px'><button class='btn btn-primary' onclick=\"go('patientLogin')\">Login to Book Tests</button></div>"}`;
}
function bookLabVisit(labId){
  toast("Lab visit booking coming soon! Call the lab: "+APP.selectedLab?.phone);
}
function bookHomeCollection(labId){
  toast("Home collection booking coming soon! Call: "+APP.selectedLab?.phone);
}

/* ════════════════════ DOC ACTIONS ════════════════════ */
async function viewDoc(id){
  APP.selectedDoc=APP.cache.docs.find(d=>d.id===id)||DEMO.doctors.find(d=>d.id===id);
  if(!APP.selectedDoc){try{const r=await DB.get("doctors","id=eq."+id);if(r.length)APP.selectedDoc=r[0];}catch{}}
  go("profile");
}
function bookDoc(id){
  if(!APP.user||APP.userType!=="patient"){toast("Login as patient to book.",true);go("patientLogin");return;}
  APP.selectedDoc=APP.cache.docs.find(d=>d.id===id)||DEMO.doctors.find(d=>d.id===id)||APP.selectedDoc;
  APP.selectedSlot=""; go("book");
}
async function toggleFav(docId){
  if(!APP.user||APP.userType!=="patient"){toast("Login to save.",true);return;}
  const isFav=APP.cache.favs.includes(docId);
  try{
    if(isFav){await DB.del("favorite_doctors",`patient_id=eq.${APP.user.id}&doctor_id=eq.${docId}`).catch(()=>{});APP.cache.favs=APP.cache.favs.filter(id=>id!==docId);toast("Removed ✓");}
    else{await DB.post("favorite_doctors",{patient_id:APP.user.id,doctor_id:docId}).catch(()=>{});APP.cache.favs=[...APP.cache.favs,docId];toast("Saved ❤️");}
    const activePg=document.querySelector(".page.active")?.id?.replace("page-","");
    if(activePg==="search")fetchDocs(); if(activePg==="patientDash")rPatientDash();
  }catch(e){toast(e.message,true);}
}

/* ════════════════════ RENDER: PATIENT DASH ════════════════════ */
async function rPatientDash(){
  if(!APP.user) return;
  const u=APP.user;
  if($("pd-nav-name")) $("pd-nav-name").textContent=u.name;
  if($("pd-welcome")) $("pd-welcome").textContent=(APP.lang==="te"?"హలో, ":"Hello, ")+safe(u.name).split(" ")[0]+"! 👋";
  spin("pd-stats"); spin("pd-appts"); spin("pd-doctors");
  try{
    const[appts,docs,notifs]=await Promise.all([
      safeGet("appointments","patient_id=eq."+u.id),
      safeGet("doctors","approved=eq.true&limit=4","doctors"),
      safeGet("notifications","user_id=eq."+u.id+"&limit=10")
    ]);
    APP.cache.appts=appts.length?appts:DEMO.appointments.filter(a=>a.patient_id===u.id);
    APP.cache.docs=docs.length?docs:DEMO.doctors;
    APP.cache.notifs=notifs;
    // Stats
    if($("pd-stats")) $("pd-stats").innerHTML=
      sc("📅","Total",APP.cache.appts.length)+
      sc("✅","Confirmed",APP.cache.appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669")+
      sc("🎥","Video",APP.cache.appts.filter(a=>a.is_video).length,"#EDE9FE","#7C4DFF")+
      sc("👨‍⚕️","Doctors",new Set(APP.cache.appts.map(a=>a.doctor_id)).size,"#FEE9E1","#FF6B35");
    if($("pd-appts")) $("pd-appts").innerHTML=APP.cache.appts.length
      ?APP.cache.appts.map(a=>apptCard(a)).join("")
      :empty("📋","No appointments yet.",`<button class="btn btn-primary btn-sm" onclick="go('search')">${T("bookNow")}</button>`);
    if($("pd-doctors")) $("pd-doctors").innerHTML=APP.cache.docs.map(d=>docCard(d)).join("");
    // Notifications
    if(notifs.length&&$("pd-notifs")){
      const typeColor={success:"#10B981",info:"#0A7FAF",warning:"#F59E0B",error:"#EF4444"};
      $("pd-notifs").innerHTML=notifs.slice(0,5).map(n=>`
        <div style="background:${n.is_read?"#F9FAFB":"#EFF6FF"};border-radius:10px;padding:10px 14px;margin-bottom:8px;border-left:3px solid ${typeColor[n.type]||"#0A7FAF"}">
          <div style="font-size:13px;font-weight:700;color:#1A2B3C">${safe(n.title)}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:2px">${safe(n.message)}</div>
        </div>`).join("");
    }
  }catch(e){toast("Error: "+e.message,true);}
}

/* ════════════════════ RENDER: DOCTOR DASH ════════════════════ */
async function rDoctorDash(){
  if(!APP.user) return;
  const u=APP.user;
  if($("dd-nav-name")) $("dd-nav-name").textContent=u.name;
  if($("dd-welcome")) $("dd-welcome").textContent=(APP.lang==="te"?"స్వాగతం, ":"Welcome, ")+safe(u.name)+"! 👨‍⚕️";
  if($("dd-meta")) $("dd-meta").innerHTML=`<span>🩺 ${safe(u.specialization)}</span><span>🏥 ${safe(u.hospital)}</span>`+(u.reg_number?`<span>📋 ${u.reg_number}</span>`:"");
  if($("dd-pending-alert")) $("dd-pending-alert").style.display=u.approved?"none":"flex";
  spin("dd-stats"); spin("dd-today-appts"); spin("dd-all-appts");
  try{
    const appts=await safeGet("appointments","doctor_id=eq."+u.id);
    const todayA=appts.filter(a=>a.date===td());
    if($("dd-stats")) $("dd-stats").innerHTML=
      sc("📅","Total",appts.length)+
      sc("🌅","Today",todayA.length,"#FEE9E1","#FF6B35")+
      sc("💰","Revenue","₹"+appts.filter(a=>a.payment_status==="paid").reduce((s,a)=>s+a.fee,0).toLocaleString(),"#EDE9FE","#7C4DFF")+
      sc("✅","Confirmed",appts.filter(a=>a.status==="confirmed").length,"#D1FAE5","#059669");
    if($("dd-today-appts")) $("dd-today-appts").innerHTML=todayA.length?todayA.map(a=>apptCard(a,true)).join(""):empty("🌿","No appointments today.");
    if($("dd-all-appts")) $("dd-all-appts").innerHTML=appts.length?appts.map(a=>apptCard(a,true)).join(""):empty("📭","No appointments yet.");
    // Profile
    if($("dd-status-pill")) $("dd-status-pill").innerHTML=pill(u.approved?"✓ Approved":"⏳ Pending",u.approved?"#D1FAE5":"#FEF3C7",u.approved?"#059669":"#D97706");
    if($("dd-profile-grid")) $("dd-profile-grid").innerHTML=[
      ["🩺","Specialization",u.specialization],["🏥","Hospital",u.hospital],
      ["📍","Location",u.district?u.district+", "+u.state_code:u.location],
      ["📋","Reg. No.",u.reg_number],["💰","Fee","₹"+u.fee],["💼","Exp.",(u.experience||0)+" yrs"],
      ["📞","Phone",u.phone],["🎓","Qualifications",u.qualifications]
    ].map(([ic,l,v])=>`<div class="dd-info-item"><div class="dd-info-lbl">${ic} ${l}</div><div class="dd-info-val">${safe(v)||"—"}</div></div>`).join("");
    if($("dd-about")) $("dd-about").textContent=u.about||"";
    if($("dd-slots")) $("dd-slots").innerHTML=(u.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("");
  }catch(e){toast("Error: "+e.message,true);}
}

/* ════════════════════ RENDER: PROFILE & BOOK ════════════════════ */
async function rProfile(){
  const d=APP.selectedDoc; if(!d){go("search");return;}
  const na=$("profile-nav-actions");
  if(na) na.innerHTML=APP.user?`<span style="font-size:12px;font-weight:600;color:#1A2B3C">${APP.user.name}</span><button class="btn btn-ghost btn-sm" onclick="logout()">${T("logout")}</button>`:
    `<button class="btn btn-outline btn-sm" onclick="go('patientLogin')">${T("patientLogin")}</button>`;
  let reviews=[];
  try{reviews=await DB.get("doctor_reviews","doctor_id=eq."+d.id);}catch{}
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
            ${d.approved?pill(T("verified"),"#D1FAE5","#059669"):""}
            ${d.video_consult?pill("🎥 Video","#EDE9FE","#7C4DFF"):""}
          </div>
        </div>
        <div style="text-align:right"><div style="font-size:28px;font-weight:800;color:#0A7FAF">₹${d.fee}</div><div style="font-size:11px;color:#9CA3AF">${T("perVisit")}</div></div>
      </div>
      <div class="profile-info-grid">
        ${[["🏥","Hospital",d.hospital],["📍","Location",d.district?d.district+", "+d.state_code:d.city||d.location],["📋","Reg. No.",d.reg_number],["📞","Phone",d.phone],["🎓","Qualifications",d.qualifications],["🌐","Languages",(d.languages||[]).join(", ")]].map(([ic,l,v])=>`
          <div class="profile-info-item"><div class="profile-info-lbl">${ic} ${l}</div><div class="profile-info-val">${safe(v)||"—"}</div></div>`).join("")}
      </div>
      ${d.about?`<p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${safe(d.about)}</p>`:""}
      ${d.rating>0?`<div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #F3F4F6;margin-bottom:14px">${stars}<span style="font-size:14px;font-weight:700">${d.rating}</span><span style="font-size:12px;color:#9CA3AF">(${d.reviews})</span></div>`:""}
      <div style="display:grid;grid-template-columns:1fr${d.video_consult?" 1fr":""}; gap:10px">
        <button class="btn btn-primary btn-full" onclick="APP.selectedType='inperson';bookDoc('${d.id}')">📅 ${T("bookAppointment")}</button>
        ${d.video_consult?`<button class="btn btn-purple btn-full" onclick="APP.selectedType='video';bookDoc('${d.id}')">🎥 ${T("videoConsult")}</button>`:""}
      </div>
    </div>
    <div class="profile-slots-wrap" style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">${T("selectSlot")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${(d.slots||[]).map(s=>`<span class="profile-slot-tag">🕐 ${s}</span>`).join("")}</div>
    </div>
    ${reviews.length?`<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div style="font-size:14px;font-weight:700;color:#1A2B3C;margin-bottom:12px">Patient Reviews ⭐</div>
      ${reviews.slice(0,3).map(r=>`<div style="padding:12px 0;border-bottom:1px solid #F3F4F6"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="font-size:13px;font-weight:700;color:#1A2B3C">${safe(r.patient_name)||"Patient"}</div><div>${[1,2,3,4,5].map(i=>`<span style="color:${i<=r.rating?"#F59E0B":"#E5E7EB"};font-size:13px">★</span>`).join("")}</div></div><div style="font-size:13px;color:#374151">${safe(r.comment)}</div></div>`).join("")}
    </div>`:""}`;
}

async function rBook(){
  const d=APP.selectedDoc; if(!d){go("search");return;}
  const c=$("book-content");
  if(!APP.user||APP.userType!=="patient"){
    c.innerHTML=`<div style="text-align:center;padding:40px 0"><div style="font-size:56px;margin-bottom:14px">🔒</div><h3 style="font-family:'Lora',serif;font-size:22px;color:#1A2B3C;margin-bottom:8px">Login Required</h3><p style="color:#6B7280;font-size:14px;margin-bottom:20px">${T("patientLogin")} చేయండి</p><button class="btn btn-primary" onclick="go('patientLogin')">${T("patientLogin")}</button></div>`;
    return;
  }
  APP.selectedSlot="";
  let booked=[];
  try{const a=await DB.get("doctor_availability",`doctor_id=eq.${d.id}&date=eq.${td()}`);if(a.length)booked=a[0].booked_slots||[];}catch{}
  const isVideo=APP.selectedType==="video";
  c.innerHTML=`
    <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;display:flex;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      ${avt(d.name,d.color||"#0A7FAF",50)}
      <div style="flex:1"><div style="font-size:15px;font-weight:700;color:#1A2B3C">${safe(d.name)}</div>
      <div style="font-size:12px;color:#0A7FAF;font-weight:600">${safe(d.specialization)}</div>
      <div style="font-size:12px;color:#9CA3AF">🏥 ${safe(d.hospital)}${d.district?" · "+d.district:""}</div></div>
      <div style="font-size:20px;font-weight:800;color:#0A7FAF">₹${d.fee}</div>
    </div>
    ${d.video_consult?`<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-label" style="margin-bottom:10px">Appointment Type</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button id="type-inperson" class="slot-btn ${!isVideo?"active":""}" onclick="APP.selectedType='inperson';setBookType()" style="padding:12px">🏥 ${T("inPerson")}</button>
        <button id="type-video"    class="slot-btn ${isVideo?"active":""}"  onclick="APP.selectedType='video';setBookType()"    style="padding:12px">🎥 ${T("videoConsult")}</button>
      </div></div>`:
      `<div style="background:#E3F4FC;border-radius:10px;padding:10px;margin-bottom:14px;font-size:12px;color:#0A7FAF">🏥 In-Person Appointment at ${safe(d.hospital)}</div>`}
    <div style="background:#fff;border-radius:16px;padding:22px 20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <div class="form-group"><label class="form-label">${T("selectDate")} <span>*</span></label>
        <input type="date" id="book-date" class="form-input" min="${td()}" onchange="onBookDateChange()"/>
      </div>
      <div class="form-group"><label class="form-label">${T("selectSlot")} <span>*</span></label>
        <div class="slot-grid" id="slot-grid">
          ${(d.slots||[]).map(s=>{const b=booked.includes(s);return `<button class="slot-btn${b?" slot-blocked":""}" ${b?"disabled":""} onclick="${b?"":"pickSlot('"+s+"')"}">${s}${b?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("")}
        </div>
      </div>
      <div id="book-summary" style="display:none;background:#F0FDF4;border-radius:10px;padding:14px;border:1px solid #A7F3D0;margin-top:12px">
        <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px">📋 ${APP.lang==="te"?"బుకింగ్ వివరాలు":"Booking Summary"}</div>
        <div id="bsum-txt" style="font-size:13px;color:#047857;line-height:1.8"></div>
        <div style="font-size:15px;font-weight:800;color:#0A7FAF;margin-top:6px">Total: ₹${d.fee}</div>
      </div>
    </div>
    <button class="btn btn-primary btn-full" id="confirm-btn" onclick="confirmBook()" style="font-size:15px;padding:14px">
      ${T("confirmBooking")} — ₹${d.fee}
    </button>
    <p style="font-size:11px;color:#D1D5DB;text-align:center;margin-top:10px">By booking you agree to DocNear's terms</p>`;
}
function setBookType(){
  const isV=APP.selectedType==="video";
  [$("type-inperson"),$("type-video")].forEach((b,i)=>b&&b.classList.toggle("active",i===0?!isV:isV));
  updateBookSummary();
}
function pickSlot(s){APP.selectedSlot=s;document.querySelectorAll(".slot-btn:not(.slot-blocked)").forEach(b=>b.classList.toggle("active",b.textContent.trim().startsWith(s)));updateBookSummary();}
async function onBookDateChange(){
  const date=($("book-date")||{}).value; if(!date||!APP.selectedDoc) return;
  try{const a=await DB.get("doctor_availability",`doctor_id=eq.${APP.selectedDoc.id}&date=eq.${date}`);const booked=a.length?a[0].booked_slots||[]:[];const sg=$("slot-grid");if(sg)sg.innerHTML=(APP.selectedDoc.slots||[]).map(s=>{const b=booked.includes(s);return `<button class="slot-btn${b?" slot-blocked":""}" ${b?"disabled":""} onclick="${b?"":"pickSlot('"+s+"')"}">${s}${b?`<br><span style="font-size:9px">Booked</span>`:""}</button>`;}).join("");}catch{}
  updateBookSummary();
}
function updateBookSummary(){
  const date=($("book-date")||{}).value,sb=$("book-summary"),st=$("bsum-txt");
  if(sb&&st&&date&&APP.selectedSlot){sb.style.display="block";st.innerHTML=`📅 ${date}<br>🕐 ${APP.selectedSlot}<br>👤 ${APP.user.name}<br>${APP.selectedType==="video"?"🎥 Video Consultation":"🏥 In-Person"}`;}else if(sb)sb.style.display="none";
}
async function confirmBook(){
  const date=($("book-date")||{}).value;
  if(!date){toast(T("selectDate")+" required.",true);return;}
  if(!APP.selectedSlot){toast(T("selectSlot")+" required.",true);return;}
  const d=APP.selectedDoc,btn=$("confirm-btn");
  if(btn){btn.disabled=true;btn.textContent="Booking...";}
  try{
    const isVideo=APP.selectedType==="video";
    const meetLink=isVideo?"https://meet.jit.si/docnear-"+crypto.randomUUID().slice(0,10):null;
    const r=await safePost("appointments",{
      patient_id:APP.user.id,patient_name:APP.user.name,doctor_id:d.id,doctor_name:d.name,
      specialization:d.specialization,date,slot:APP.selectedSlot,status:"confirmed",
      fee:d.fee,payment_status:"pending",is_video:isVideo,meeting_link:meetLink
    },data=>[{...data,id:"ap_"+Date.now()}]);
    // Notifications
    DB.post("notifications",{user_id:d.id,user_type:"doctor",title:"New Appointment 📅",message:`${APP.user.name} — ${date} at ${APP.selectedSlot}${isVideo?" (Video)":""}`,type:"info"}).catch(()=>{});
    if(isVideo&&meetLink){toast(T("bookingConfirmed")+" 🎥");setTimeout(()=>{if(confirm("Join video call now?\n"+meetLink))joinVideo(meetLink);},1200);}
    else toast(T("bookingConfirmed"));
    go("patientDash");
  }catch(e){toast("Error: "+e.message,true);}
  finally{if(btn){btn.disabled=false;btn.textContent=T("confirmBooking")+" — ₹"+APP.selectedDoc?.fee;}}
}

/* ════════════════════ INIT ════════════════════ */
document.addEventListener("DOMContentLoaded", async()=>{
  // Apply saved language
  setLang(APP.lang);
  // Test Supabase
  DB.get("doctors","approved=eq.true&limit=1").then(()=>{APP.isDemo=false;}).catch(()=>{APP.isDemo=true;});
  rLanding();
});
