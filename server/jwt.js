import jwt from "jsonwebtoken";

const token = jwt.sign(
  { user: "jahaganapathi" },
  "secret123",
  { expiresIn: "1h" }
);

console.log("JWT Token:", token);