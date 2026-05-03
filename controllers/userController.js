import User from "../models/userModels.js"
import Address from "../models/addressModel.js"
import sendEmail from "../utils/sendEmail.js";
import bcrypt from 'bcrypt';

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



export const sendEmailOTP = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.session.user._id;  // ✅ was req.session.userId

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await User.findByIdAndUpdate(userId, {
      otp: otp,
      otpExpiry: Date.now() + 5 * 60 * 1000
    });

    req.session.newEmail = newEmail;

    await sendEmail(newEmail, "Email Change OTP", otp);

    console.log("OTP saved for userId:", userId);  // verify this prints

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};

export const loadOTPPage = (req, res) => {
  res.render("user/editEmailotp",{
      newEmail: req.session.newEmail
  });
  
};

export const verifyEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.session.user?._id;  // ✅ fixed
    const newEmail = req.session.newEmail;

    if (!otp) {
      return res.render("user/editEmailotp", { message: "OTP not received", newEmail });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/user/login");
    }

    if (user.otpExpiry < Date.now()) {
      return res.render("user/editEmailotp", { message: "OTP expired", newEmail });
    }

    if (user.otp.toString() !== otp.toString()) {
      return res.render("user/editEmailotp", { message: "Invalid OTP", newEmail });
    }

    user.email = newEmail;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    req.session.destroy();
    res.redirect("/user/login");  // ✅ fixed

  } catch (error) {
    console.log(error);
    res.redirect("/user/profileinformation");
  }
};

export const resendEmailOTP = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const newEmail = req.session.newEmail;

    if (!newEmail) {
      return res.json({ success: false, message: "Session expired, please try again" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save new OTP to user
    await User.findByIdAndUpdate(userId, {
      otp: otp,
      otpExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send email
    await sendEmail(newEmail, "Email Change OTP", otp);

    console.log("Resend OTP for userId:", userId);

    res.json({ success: true });

  } catch (error) {
    console.log("Resend OTP error:", error);
    res.json({ success: false, message: "Server error" });
  }
};

export const passwordchange=(req,res)=>{
  res.render('user/passwordChange')
}

export const changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const userId = req.session.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.authType === 'google') {
      return res.json({ success: false, message: "Password change not available for Google login users" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};