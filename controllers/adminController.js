import User from "../models/userModels.js"


export const getLogin = (req, res) => {
  res.render("admin/adminLogin",{error:null});
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Check if fields are empty
  if (!email || !password) {
    return res.render("admin/adminLogin", { error: "Email and password are required" });
  }

  // Check email first
  if (email !== process.env.ADMIN_EMAIL) {
    return res.render("admin/adminLogin", { error: "Invalid email address" });
  }

  // Then check password
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.render("admin/adminLogin", { error: "Invalid password" });
  }

  // Both correct
  req.session.admin = true;
  console.log("success");
  return res.redirect("/admin/adminDashboard");
};

export const getDashboard = (req, res) => {
  console.log("Session:", req.session.admin);
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
    res.clearCookie('connect.sid')
 
  res.redirect("/admin/adminLogin");
   })
};

export const listCustomers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page) || 1;
    const limit  = 5;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const conditions = [];

    if (status === 'active')  conditions.push({ isBlocked: false });
    if (status === 'blocked') conditions.push({ isBlocked: true });

    if (search) {
      conditions.push({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName:  { $regex: search, $options: 'i' } },
          { email:     { $regex: search, $options: 'i' } },
          { phone:     { $regex: search, $options: 'i' } },
        ]
      });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const totalUsers = await User.countDocuments(filter);
    
    const users = await User.find(filter)
                            .skip((page - 1) * limit)
                            .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/adminCustomer", {
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      status,
      search
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    user.isBlocked = !user.isBlocked;

    await user.save();

    res.redirect('/admin/adminCustomer');

  } catch (error) {
    console.log(error);
  }
};

// export const loadCustomers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 5;

//     let filter = {};

//     if (req.query.status === 'active') {
//       filter.isBlocked = false;
//     }

//     if (req.query.status === 'blocked') {
//       filter.isBlocked = true;
//     }

//     const totalUsers = await User.countDocuments(filter);

//     const users = await User.find(filter)
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const totalPages = Math.ceil(totalUsers / limit);

//     res.render('adminCustomer', {
//       users,
//       currentPage: page,
//       totalPages
//     });

//   } catch (error) {
//     console.log(error);
//   }
// };