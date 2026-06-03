const supabaseClient = supabase.createClient(
  "https://avonzvocvonvzamedwvh.supabase.co",
  "sb_publishable_wvfdYDM_JGE8q5NrcYl0EQ_tDOTBL2I"
);

async function loadDoctors(){

  const box = document.getElementById("doctorList");

  if(!box) return;

  box.innerHTML = "Loading doctors...";

  const { data, error } = await supabaseClient
    .from("doctors")
    .select("*");

  if(error){
    box.innerHTML = "Error: " + error.message;
    console.log(error);
    return;
  }

  if(data.length === 0){
    box.innerHTML = "No doctors found";
    return;
  }

  let html = "";

  data.forEach(doc => {

    html += `
      <div class="card">
        <h3>${doc.name || ""}</h3>
        <p>${doc.specialization || ""}</p>
        <p>${doc.hospital || ""}</p>
        <p>${doc.city || ""}</p>
      </div>
    `;

  });

  box.innerHTML = html;
}
async function loadMedicalStores(){

const box = document.getElementById("medicalStoreList");

if(!box) return;

const { data, error } = await supabaseClient
.from("medical_stores")
.select("*");

if(error){
box.innerHTML = error.message;
return;
}

let html = "";

data.forEach(store => {

html += `
<div class="card">
<h3>${store.store_name || ""}</h3>
<p>${store.city || ""}</p>
<p>${store.phone || ""}</p>
</div>
`;

});

box.innerHTML = html;

}

async function loadLabs(){

const box = document.getElementById("labList");

if(!box) return;

const { data, error } = await supabaseClient
.from("labs")
.select("*");

if(error){
box.innerHTML = error.message;
return;
}

let html = "";

data.forEach(lab => {

html += `
<div class="card">
<h3>${lab.lab_name || ""}</h3>
<p>${lab.city || ""}</p>
<p>${lab.phone || ""}</p>
</div>
`;

});

box.innerHTML = html;

}

async function loadAmbulances(){

  const box = document.getElementById("ambulanceList");

  if(!box) return;

  const { data, error } = await supabaseClient
    .from("ambulance_providers")
    .select("*");

  if(error){
    box.innerHTML = error.message;
    return;
  }

  let html = "";

  data.forEach(item => {

    html += `
      <div class="card">
        <h3>${item.provider_name || ""}</h3>
        <p>${item.city || ""}</p>
        <p>${item.phone || ""}</p>
      </div>
    `;

  });

  box.innerHTML = html;

}

async function patientRegister(){

  const name = document.getElementById("pr-name").value.trim();
  const email = document.getElementById("pr-email").value.trim();
  const phone = document.getElementById("pr-phone").value.trim();
  const password = document.getElementById("pr-password").value.trim();

  if(!name || !email || !password){
    toast("Fill all required fields");
    return;
  }

  const { data, error } = await supabaseClient
    .from("patients")
    .insert([
      {
        name: name,
        email: email,
        phone: phone,
        password: password
      }
    ]);

  if(error){
    console.log(error);
    toast("Register Failed: " + error.message);
    return;
  }

  toast("Patient Registered Successfully");

  // login page కి redirect
  go("patientLogin");
}



























  
