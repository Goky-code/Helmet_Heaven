 
export const isUserAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/user/login");
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