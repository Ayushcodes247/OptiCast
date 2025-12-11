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

    return res.status(201).json({
      success: true,
      message: "Registeration/Login successful through Google.",
      user: user,
      token: token,
      expiresIn
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

module.exports = { google };
