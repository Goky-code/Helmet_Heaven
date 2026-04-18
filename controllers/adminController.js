export const getLogin = (req, res) => {
  res.render("admin/adminLogin",{error:null});
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  
  if (email === "admin@gmail.com" && password === "123456") {
    
    req.session.admin = true;
     console.log("sucess")
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/adminLogin", { error: "Invalid credentials" });
};

export const getDashboard = (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/adminLogin");
  }

  res.render("admin/dashboard");
};

export const logout = (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/adminLogin");
};