const role = new URLSearchParams(window.location.search).get("role");

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = document.getElementById("full_name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      full_name,
      email,
      phone,
      password,
      role
    })
  });

  const data = await res.json();

  if (data.success) {
    alert("Registration Success");
    window.location.href = "login.html";
  } else {
    alert("Registration Failed");
  }
});
