const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function setupUser() {
  try {
    const hashedPassword = await bcrypt.hash("password", 10);
    console.log("Hashed password:", hashedPassword);
    
    db.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@crm.com'",
      [hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Error updating password:", err);
        } else {
          console.log("Password updated successfully for admin user");
          console.log("You can now login with:");
          console.log("Email: admin@crm.com");
          console.log("Password: password");
        }
        process.exit(0);
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    process.exit(1);
  }
}

setupUser();
