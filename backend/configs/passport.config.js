const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { userModel, validateUser } = require("@models/user.model");
const { generatePassword, pidGenerator } = require("@utils/essentials.util");
const sendEmail = require("@configs/nodemailer.config");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENTSECRET,
      callbackURL: "http://localhost:4000/api/v1/google/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel
          .findOne({
            email: profile.emails?.[0]?.value,
          });

        const genPass = generatePassword(12);
        const hashPass = await userModel.hashPassword(genPass);
        const pid = pidGenerator();

        if (!user) {
          const userData = {
            username: profile.displayName,
            email: profile.emails?.[0]?.value,
            password: hashPass,
            pid,
          };

          const subject =
            "LOGIN PASSWORD FOR THE USER WHO IS REGISTERED VIA. FACEBOOK REGISTER/LOGIN";
          const text = `
          Hi ${userData.username || "User"},

          You have successfully registered via. facebook and here is your password for manual login.
          ${userData.username}'s Password : ${genPass}.

          Regards,
          OptiCast support 
          `;

          await sendEmail(userData.email, subject, text);

          const { value, error } = await validateUser(userData);
          if (error) {
            console.error("Error while validating user:", error.message);
            return done(error, null);
          }

          user = await userModel.create(value);

          const token = user.generateAuthToken();

          return done(null, { user, token });
        }

        const token = user.generateAuthToken();

        return done(null, { user, token });
      } catch (error) {
        console.error("Facebook authentication error:", error.message);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.user?._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
