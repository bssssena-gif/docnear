document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.success) {
    alert("Login Success");

    localStorage.setItem("user", JSON.stringify(data.user));

    redirectUser(data.user.role);
  } else {
    alert("Invalid Credentials");
  }
});

function redirectUser(role) {
  if (role === "admin") window.location.href = "/admin.html";
  else if (role === "doctor") window.location.href = "/doctor.html";
  else if (role === "patient") window.location.href = "/patient.html";
  else if (role === "lab") window.location.href = "/lab.html";
  else if (role === "ambulance_driver") window.location.href = "/ambulance.html";
  else if (role === "medical_store") window.location.href = "/store.html";
                                                }
