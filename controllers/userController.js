import User from "../models/userModels.js"
import Address from "../models/addressModel.js"


export const getLogin = async(req,res)=>{
     return res.render('user/login')
}

export const logout =(req,res)=>{
     req.session.destroy(()=>{
          res.redirect('user/login')
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
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    res.render("user/profileinformation", { user });

  } catch (error) {
    res.status(500).send("Server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const { firstname, lastname, email, phone } = req.body;
    
   const updateData = {
      name: firstname + " " + lastname,
      email,
      phone
    };
     
    if (req.file) {
      updateData.profileImage = "/uploads/" + req.file.filename;
    }

    await User.findByIdAndUpdate(userId,updateData)
      res.redirect('/user/profileinformation')
    
  } catch (error) {
    res.status(500).send("Server error");
  }
};
// address page
export const getAddresses=async(req,res)=>{
  const userId=req.session.user._id
  const addresses=await Address.find({userId})

  res.render('user/addressPage',{addresses})
}
// add new address
export const getAddAddress = (req, res) => {
  res.render("user/addNewaddress");
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

  res.redirect("/user/addressPage");
};
// edit address
export const getEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);

  res.render("user/editAddress", { address });
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

  res.redirect("/user/addressPage");
};

export const deleteAddress = async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  res.redirect("/user/addressPage");
};

export const setDefaultAddress = async (req, res) => {
  const userId = req.session.user._id;

  // remove old default
  await Address.updateMany({ userId }, { isDefault: false });

  // set new default
  await Address.findByIdAndUpdate(req.params.id, {
    isDefault: true
  });

  res.redirect("/user/addressPage");
};