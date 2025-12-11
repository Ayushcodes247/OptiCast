const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Username should have at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },

    password: {
      type: String,
      select: false,
      minlength: [8, "Password should have at least 8 characters"],
    },

    pid: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ username: 1, email: 1, pid: 1 });

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

userSchema.statics.hashPassword = async function (plainPassword) {
  return await bcrypt.hash(plainPassword, 12);
};

userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(plainPassword, this.password);
};

function validateUser(data) {
  try {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).trim().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).optional(),
      pid: Joi.string().alphanum().required(),
    }).unknown(false);

    const validationResult = schema.validate(data, { abortEarly: false });

    return validationResult;
  } catch (error) {
    console.error("Error while validating user data:", error.message);
    return error;
  }
}

const userModel = mongoose.model("User", userSchema);

module.exports = { userModel, validateUser };
