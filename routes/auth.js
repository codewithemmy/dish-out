const express = require("express");

const router = express.Router();

const { register, verifyEmail, login, forgotPassword, resetPassword } = require("../controllers/auth");

router.route("/register").post(register);
router.route("/verify-mail/:id").post(verifyEmail);
router.route("/login").post(login);
// router.route("/logout").delete(logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

module.exports = router;
