import User from "../models/userModels.js"
import Address from "../models/addressModel.js"


export const getLogin = async(req,res)=>{
     return res.render('user/login')
}

export const logout =(req,res)=>{
    
      req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.redirect("/user/profileinformation"); 
        }
        
        
        res.clearCookie('connect.sid'); 
        
      
        res.redirect("/user/login")
          
     })
}

export const getsignup = async(req,res)=>{
     return res.render('user/signup')
}

export const getOtp=(req,res)=>{
     res.render('user/verifyOtp')
}

export const getHome=async(req,res)=>{
  if (!req.session.user) {
    return res.redirect('/user/login');
  }

  return res.render('user/homepage');
};

export const getforgotPassword=(req,res)=>{
     res.render('user/forgotPassword')
}

export const getVerifyforgotOtp=(req,res)=>{
     res.render('user/verifyForgotpassOtp')
}

export const getresetPassword=(req,res)=>{
     res.render('user/resetPassword')
}

export const getProfile = async (req, res) => {
  try {

    if(!req.session.user){
      return res.redirect("/user/login")
    }
    const userId = req.session.user._id;
    console.log("userid:",userId)

    const user = await User.findById(userId);

    if(!user){
      return res.redirect("/user/login")
    }
console.log("User Data from Database:", user);
    res.render("user/profileinformation", { user });

  } catch (error) {
    console.error("profile error",error)
    res.status(500).send("Server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { firstName, lastName, phone } = req.body;

    // 1. Prepare data only for fields that were sent
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    // 2. Handle Image Upload
    if (req.file) {
      // NOTE: Ensure this matches the field name in your Database!
      // If your EJS uses 'profileImage', change this key to 'profileImage'
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // 3. Update the user
    await User.findByIdAndUpdate(userId, updateData);

    // 4. Decide how to respond
    // If there is an image, it was likely an AJAX (Fetch) call from the Crop Modal
    if (req.file) {
      return res.json({ success: true });
    }

    // Otherwise, it was a standard form submission
    res.redirect("/user/profileinformation");

  } catch (error) {
    console.error("Update profile error:", error);
    
    // Send JSON error if it was an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.file) {
      return res.status(500).json({ success: false, message: "Server Error" });
    }
    
    res.status(500).send("Server Error");
  }
};


// address page
export const getAddresses = async (req, res) => {
  try {
    if (!req.session.user) {
        return res.redirect("/user/login");
    }

    const userId = req.session.user._id;
    const addresses = await Address.find({ userId });

    res.render('user/address/addressPage', { addresses });
  } catch (error) {
    console.error("Address Error:", error);
    res.status(500).send("Server Error");
  }
}
// add new address
export const getAddAddress = (req, res) => {
  res.render("user/address/addNewaddress");
};
export const addAddress = async (req, res) => {
  const userId = req.session.user._id;

  const {
    name, street, apartment,
    city, state, zip, phone, isDefault
  } = req.body;

  if (isDefault ==='on') {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.create({
    userId,
    name,
    street,
    apartment,
    city,
    state,
    zip,
    phone,
    isDefault: isDefault === "on"
  });

  res.redirect("/user/address/addressPage");
};
// edit address
export const getEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);

  res.render("user/address/editAddress", { address });
};

export const updateAddress = async (req, res) => {
  const userId = req.session.user._id;

  const {
    name, street, apartment,
    city, state, zip, phone, isDefault
  } = req.body;

  if (isDefault==='on') {
    await Address.updateMany({ userId }, { isDefault: false });
  }

  await Address.findByIdAndUpdate(req.params.id, {
    name,
    street,
    apartment,
    city,
    state,
    zip,
    phone,
    isDefault: isDefault === "on"
  });

  res.redirect("/user/address/addressPage");
};

export const deleteAddress = async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  res.redirect("/user/address/addressPage");
};

export const setDefaultAddress = async (req, res) => {
  const userId = req.session.user._id;

  // remove old default
  await Address.updateMany({ userId }, { isDefault: false });

  // set new default
  await Address.findByIdAndUpdate(req.params.id, {
    isDefault: true
  });

  res.redirect("/user/address/addressPage");
};