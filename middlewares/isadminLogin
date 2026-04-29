export const isAdminAuth = (req, res, next) => {
  if (req.session.admin) {
    next(); 
  } else {
    res.redirect("/admin/adminLogin");
  }
};