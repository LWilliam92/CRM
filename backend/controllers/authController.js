const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json("Email and password are required");
  }

  db.query("SELECT * FROM users WHERE email=$1", [email], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json("Database error");
    }

    if (result.rows.length === 0) {
      console.log("User not found for email:", email);
      return res.status(400).json("User not found");
    }

    const user = result.rows[0];
    console.log("Found user:", { id: user.id, email: user.email });

    try {
      const valid = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", valid);

      if (!valid) {
        return res.status(400).json("Wrong password");
      }

      const token = jwt.sign({ id: user.id }, "crmsecret");
      console.log("Login successful for user:", email);

      res.json({ token, user });
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return res.status(500).json("Authentication error");
    }
  });
};