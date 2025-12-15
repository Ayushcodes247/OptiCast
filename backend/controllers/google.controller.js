const { validationResult } = require("express-validator");
const { userModel, validateUser } = require("@models/user.model");
const { pidGenerator, generatePassword } = require("@utils/essentials.util");
const sendEmail = require("@configs/nodemailer.config");
const TOKEN_NAME = "auth_token";

const google = (req, res) => {
  try {
    const { user, token } = req.user;
    if (!user || !token) {
      return res.status(400).json({
        success: false,
        message: "User data and authentication TOKEN is missing or expired.",
      });
    }

    res.cookie(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const expiresIn = 7 * 24 * 60 * 60;

    res.status(201).json({
      success: true,
      message: "Registeration/Login successful through Google.",
      user: user,
      token: token,
      expiresIn,
    });
  } catch (error) {
    console.error("Error in google controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
      error,
    });
  }
};

const front_google_register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email } = req.body;
    const existingUser = await userModel.findOne({ email: email });

    const genPass = generatePassword(12);
    const hashPass = await userModel.hashPassword(genPass);
    const pid = pidGenerator();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const userData = {
      username: name,
      email,
      password: hashPass,
      pid,
    };

    const subject =
      "LOGIN PASSWORD FOR THE USER WHO IS REGISTERED VIA. GOOGLE REGISTER/LOGIN";
    const text = `
          Hi ${userData.username || "User"},

          You have successfully registered via. GOOGLE and here is your password for manual login.
          ${userData.username}'s Password : ${genPass}.

          Regards,
          OptiCast support 
          `;

    await sendEmail(userData.email, subject, text);

    const { value, error } = await validateUser(userData);
    if (error) {
      console.error("Error while validating user:", error.message);
      return res
        .status(400)
        .json({ success: false, message: error.message, error: error });
    }

    const user = await userModel.create(value);
    const token = user.generateAuthToken();

    res.cookie(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Registeration successful through GOOGLE.",
      user: user,
      token: token,
      expiresIn: 7 * 24 * 60 * 60,
    });
  } catch (error) {
    console.error("Error while registering through GOOGLE:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
      error: error,
    });
  }
};

const front_google_login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await userModel
      .findOne({ email: email })
      .select("-password -__v");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or user not exist's.",
      });
    }

    const token = user.generateAuthToken();

    res.cookie(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    const safeUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: safeUser,
      token: token,
      expiresIn: 7 * 24 * 60 * 60,
    });
  } catch (error) {
    console.error("Error while login through facebook:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
      error: error,
    });
  }
};

module.exports = { google, front_google_register, front_google_login };
