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
