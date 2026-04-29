import User from "../models/userModels.js"


export const getLogin = (req, res) => {
  res.render("admin/adminLogin",{error:null});
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    
    req.session.admin = true;
     console.log("sucess")
    return res.redirect("/admin/adminDashboard");
  }

  res.render("admin/adminLogin", { error: "Invalid credentials" });
};

export const getDashboard = (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/admin/adminLogin");
  }

  res.render("admin/adminDashboard");
};

export const logout = (req, res) => {
  req.session.destroy((err)=>{
    if(err){
      console.error('logout error',err)
      return res.redirect('/admin/adminDashboard')
    }
    res.clearCookie('coonect.sid')
 
  res.redirect("/admin/adminLogin");
   })
};

export const listCustomers = async (req, res) => {
  try {
    await User.updateMany(
      { isBlocked: { $exists: false } },
      { $set: { isBlocked: false } }
    );

    const customers = await User.find({ authType: "local" });
    res.render('admin/adminCustomer', { customers });
  } catch (error) {
    res.status(500).send('error fetching customers');
  }
};

export const toggleBlockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      [{ $set: { isBlocked: { $not: "$isBlocked" } } }],
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.redirect("/admin/adminCustomer");
  } catch (error) {
    res.status(500).send('Error updating user status');
  }
};