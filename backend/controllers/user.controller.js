const { validationResult } = require("express-validator");
const { userModel, validateUser } = require("@models/user.model");
const { pidGenerator } = require("@utils/essentials.util");

const TOKEN_NAME = "auth_token";

module.exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const pid = pidGenerator();
    const userObject = {
      username,
      email,
      password,
      pid,
    };

    const { value, error } = await validateUser(userObject);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((d) => d.message),
      });
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userModel.create({
      ...value,
      password: hashedPassword,
    });

    const token = user.generateAuthToken();

    res.cookie(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registration completed successfully.",
      user,
      token,
      expiresIn: 7 * 24 * 60 * 60,
    });
  } catch (error) {
    console.error("Error while registring user:", error);
    return res.status(500).json({
      success: false,
      message: "User registration failed.",
      error: error.message,
    });
  }
};

module.exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
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
    console.error("Error while login in the user:", error);
    return res.status(500).json({
      success: false,
      message: "User login failed.",
      error: error.message,
    });
  }
};
