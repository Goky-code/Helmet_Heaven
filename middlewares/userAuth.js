import User from "../models/userModels.js"

export const isUserAuth = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/user/login")
    }

    try {
        const user = await User.findById(req.session.user._id)

        if (!user) {
            req.session.destroy()
            return res.redirect("/user/login")
        }

        if (user.isBlocked) {
            req.session.destroy((err) => {
                if (err) console.error("Session destroy error:", err);
                res.redirect("/user/login?blocked=true");
            });
            return;
        }

        next();

    } catch (error) {
        console.error("Auth middleware error:", error);
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