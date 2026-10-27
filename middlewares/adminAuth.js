

export const isAdminAuth = (req, res, next) => {
  if (req.session?.admin) {
    return next()
  }

  return res.redirect("/admin/adminLogin");
};

export const preventLogin = (req, res, next) => {
  if (req.session?.admin) {
    return res.redirect("/admin/adminDashboard");
  }

  return next()
};

export const noCache = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0"
  });

  next()
}