const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const auth = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Slow down brute-force attempts on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many requests, please try again later" },
});

router.post("/register", authLimiter, auth.register);
router.get("/verify-email/:token", auth.verifyEmail);
router.post("/login", authLimiter, auth.login);
router.post("/logout", protect, auth.logout);
router.post("/forgot-password", authLimiter, auth.forgotPassword);
router.post("/reset-password", authLimiter, auth.resetPassword);
router.get("/me", protect, auth.getMe);

module.exports = router;
