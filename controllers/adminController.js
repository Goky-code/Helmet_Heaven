import User from "../models/userModels.js"
import * as adminService from "../services/admin/adminService.js"
import HTTP_STATUS from "../utils/httpStatus.js";

export const getLogin = (req, res) => {
    if (req.session?.admin) {
    return res.redirect("/admin/adminDashboard");
  }

  return res.render("admin/adminLogin", {
    error: null
  })
}
export const login = async (req, res) => {
 try{
const { email, password } = req.body;

    const admin = await adminService.loginAdmin(
      email,
      password)

       req.session.regenerate((err) => {
      if (err) {
        return res.status(500).render("admin/adminLogin", {
          error: "Unable to create admin session"
        });
      }

       req.session.admin = admin;

      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).render("admin/adminLogin", {
            error: "Unable to save admin session"
          });
        }

        return res.redirect("/admin/adminDashboard");
      })
    })

 } catch (error) {
    return res.status(401).render("admin/adminLogin", {
      error: error.message
    });
  }
}
  
export const getDashboard = async(req, res) => {
  console.log("Session:", req.session.admin);
  if (!req.session.admin) {
    return res.redirect("/admin/adminLogin");
  }
  try{
    const dashboardData=
    await adminService.getDashboardData()

    res.render("admin/adminDashboard",{
      ...dashboardData
    })
  }catch(error){
    console.error("Dashboard error:", error)

    res.status(500).send("Unable to load dashboard")
  }
}

export const listCustomers=async(req,res)=>{
  try{
    const page=parseInt(req.query.page)||1
    const limit=5
    const sort=req.query.sort||""
     
    const data=await adminService.getCustomers(
      page,
      limit,
      req.query.search||"",
      req.query.status||"",sort
    )
     res.render(
      "admin/adminCustomer",
      data)
  }catch(error){
    console.log(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("server error")
  }
}


export const logout = (req, res) => {
  req.session.destroy((err)=>{
 if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid',{
      path:"/"
    })
 
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
