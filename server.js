import express from "express";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

// REGISTER API
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.users.insert({
      full_name,
      email,
      phone,
      password_hash: hash,
      role
    });

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
