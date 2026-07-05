import User from "../models/userModels.js"
import * as adminService from "../services/admin/adminService.js"

export const getLogin = (req, res) => {
  res.render("admin/adminLogin",{error:null});
};

export const login = async (req, res) => {
 try{

  await adminService.loginAdmin(
    req.body.email,
    req.body.password
  )
  req.session.admin=true
   res.redirect("/admin/adminDashboard")

 }catch(error){
  res.render("admin/adminLogin",{
    error:error.message,
  })
 }
}
  
export const getDashboard = (req, res) => {
  console.log("Session:", req.session.admin);
  if (!req.session.admin) {
    return res.redirect("/admin/adminLogin");
  }
  res.render("admin/adminDashboard");
}

export const listCustomers=async(req,res)=>{
  try{
    const page=parseInt(req.query.page)||1
    const limit=5
     
    const data=await adminService.getCustomers(
      page,
      limit,
      req.query.search||"",
      req.query.status||""
    )
     res.render(
      "admin/adminCustomer",
      data)
  }catch(error){
    console.log(error)
    res.status(500).send("server error")
  }
}


export const logout = (req, res) => {
  req.session.destroy((err)=>{
    if(err){
      console.error('logout error',err)
      return res.redirect('/admin/adminDashboard')
    }
    res.clearCookie('connect.sid')
 
  res.redirect("/admin/adminLogin");
   })
};


export const toggleBlockUser = async (req, res) => {
  try {
    await adminService.changeUserStatus(req.params.id)
    res.redirect('/admin/adminCustomer');

  } catch (error) {
    console.log(error)
    res.redirect("/admin/pageerror")
  }
};
