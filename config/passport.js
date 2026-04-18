import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModels.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
   
       const email = profile.emails[0].value;
     let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      authType: "google",
      isVerified: true
    });
  }

  return done(null, user);
  }
));


passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;

