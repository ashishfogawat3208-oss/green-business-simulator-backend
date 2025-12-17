// backend/controllers/userController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// 🔑 Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "7d",
  });
};

// 🧩 SIGNUP (with password validation)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include one uppercase letter and one special character.",
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// 🧩 LOGIN (debugging + stable fix)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("➡️ Login attempt for:", email);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ No user found for:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("🔹 User found. Checking password...");
    console.log("Entered password:", password);
    console.log("Stored hash:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    console.log("✅ Login successful for:", email);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// 🧩 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Green Business Simulator" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password Reset - Green Business Simulator",
      html: `
        <p>Hello <b>${user.name}</b>,</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}" target="_blank">${resetURL}</a>
        <p>This link expires in 15 minutes.</p>
        <p>🌿 <b>Green Business Simulator</b></p>
      `,
    });

    console.log("📧 Password reset email sent to:", user.email);
    res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// 🧩 RESET PASSWORD (final working version)
// 🧩 RESET PASSWORD (100% verified working version)
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("➡️ Reset request received for token:", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ Invalid or expired token");
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // ✅ Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include one uppercase letter and one special character.",
      });
    }

    // ✅ Directly assign plain password; model pre-save hook will hash it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // ✅ Save (trigger pre-save hook for hashing)
    await user.save();

    console.log(`✅ Password successfully reset for user: ${user.email}`);

    res.json({ message: "✅ Password reset successful! You can now log in." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
};