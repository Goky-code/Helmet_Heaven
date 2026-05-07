import User from "../models/userModels.js"
import bcrypt from "bcryptjs"


const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if(!user){
    return{success:false,message:"user not found"}
  }

  if(user.isBlocked){
     return{success:false,message:"user is blocked"}
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch){
    return{success:false,message:"invalid credentials"}
  }
  return{success:true,user} 

  
};

const registerUser = async (userData) => {
  
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        return { success: false, message: 'Email already exists' };
    }

    
    const hashedPassword = await bcrypt.hash(userData.password, 10);


    const newUser = new User({
        firstName: userData.firstname,
        lastName: userData.lastname,
        email: userData.email,
        password: hashedPassword,
        referralCode: userData.referralCode,
        isVerified: false 
    })
    await newUser.save();

    return { success: true,email:newUser.email };
};



export default { loginUser,registerUser };