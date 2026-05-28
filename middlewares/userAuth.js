import User from "../models/userModels.js"

export const isUserAuth = async (req, res, next) => {
  if (!req.session.user) {
    // ← add this block
    if (req.xhr || req.headers["content-type"] === "application/json") {
      return res.status(401).json({ success: false, message: "Please login to continue" });
    }
    return res.redirect("/user/login");
  }

  try {
    const user = await User.findById(req.session.user._id);

    if (!user) {
      req.session.destroy();
      // ← add this block
      if (req.xhr || req.headers["content-type"] === "application/json") {
        return res.status(401).json({ success: false, message: "Please login to continue" });
      }
      return res.redirect("/user/login");
    }

    if (user.isBlocked) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        // ← add this block
        if (req.xhr || req.headers["content-type"] === "application/json") {
          return res.status(401).json({ success: false, message: "Your account has been blocked" });
        }
        res.redirect("/user/login?blocked=true");
      });
      return;
    }

    next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    // ← add this block
    if (req.xhr || req.headers["content-type"] === "application/json") {
      return res.status(500).json({ success: false, message: "Server error" });
    }
    return res.redirect("/user/login");
  }
};

export const preventUserLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/user/homepage"); 
    }
    next();
};


export const nocache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
};