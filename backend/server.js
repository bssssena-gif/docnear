import bcrypt from "bcrypt";

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.users.findOne({ email });

    if (!user) {
      return res.json({ success: false });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
