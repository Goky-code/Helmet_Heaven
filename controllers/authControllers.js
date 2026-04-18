import User from '../models/userModels.js';
import authServices from '../services/authServices.js'
import generateOTP from '../utils/generateOtp.js';
import sendEmail from "../utils/sendEmail.js"
import bcrypt from 'bcryptjs';

 export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const result=await authServices.loginUser(email,password)
        if(result.success){
            req.session.user=result.user
            res.redirect('/user/homepage');
            console.log(result);
        }else{
            res.render('user/login',{error:"Invalid email or password"})
            
        }
    }catch(error){
        res.send(500).send("server error")
    }
}

export const signup=async(req,res)=>{
    try{
        const {firstname,lastname,email,password,confirmpassword,referalcode}=req.body
        
        
    if (!firstname || !lastname || !email || !password || !confirmpassword) {
      return res.render("user/signup", { message: "All fields are required" });
    }

    
    if (password.length < 8) {
      return res.render("user/signup", { message: "Password must be at least 8 characters" });
    }

        if(password!==confirmpassword){
            return res.render('user/signup',{message:"password does not match"})
        }

         const emailRegex = /^\S+@\S+\.\S+$/;
         
    if (!emailRegex.test(email)) {
      return res.render("user/signup", { message: "Invalid email format" });
    }

        const result=await authServices.registerUser({
            firstname,lastname,email,password,referalcode
        })

        if(result.success){

             const user = await User.findOne({ email });

           if (!user) {
        return res.render("user/signup", { message: "User creation failed" });
      }   

      const otp = generateOTP();

      user.otp = otp;
      user.otpExpiry = Date.now() + 2 * 60 * 1000;
      await user.save();

      console.log("OTP:", otp); 
      await sendEmail(email, "Your OTP", `Your OTP is ${otp}`);

            req.session.email=email
            console.log("error")
            res.redirect("/user/verifyOtp");
        }
        else{
            res.render("user/signup",{message:result.message})
        }
    }catch(error){
        res.status(500).send("server error")
    }
}

export const verifyOtp=async(req,res)=>{
    try{
       let otp = req.body.otp;

    otp = Array.isArray(otp) ? otp.join("") : otp;

        const email=req.session.email
        const user=await User.findOne({email})

        if(!user){
            return res.redirect('/user/signup')
        }
        if(user.otp!==otp){
            return res.render('user/verifyOtp',{message:"invalid otp"})
        }
        if(user.otpExpiry < Date.now()){
            return res.render('user/verifyOtp',{message:"otp expired"})
        }
        user.isVerified=true
        user.otp=null
        user.otpExpiry=null

        await user.save()
        res.redirect('/user/login')
    }catch(error){
        res.status(500).send("server error")
    }
}

export const resendOtp=async(req,res)=>{
    try{
        const email=req.session.email

        if(!email){
            return res.redirect('/user/signup')
        }
        const user=await User.findOne({email})

        if(!user){
            return res.redirect('/user/signup')
        }
        const otp=generateOTP()

        user.otp=otp
        user.otpExpiry=Date.now()+2*60*1000

        await user.save()
        await sendEmail(email,otp)
        console.log("Resent OTP:", otp); 
        res.redirect('/user/verifyOtp')
    }catch(error){
        res.status(500).send("server error")
    }
}

export const forgotPassword=async(req,res)=>{
    try{
        const{email}=req.body
        const user=await User.findOne({email})

        if(!user){
            return res.render("user/forgotPassword",{message:'user not found'})
        }
        const otp=generateOTP()

        user.otp=otp
        user.otpExpiry=Date.now()+2*60*1000

        await user.save()
        await sendEmail(email,otp)

        req.session.resetEmail=email
        res.redirect('/user/verifyForgotpassOtp')
    }catch(error){
        res.status(500).send('server error')
    }
}

export const verifyForgotOtp=async (req,res)=>{
    try{
        const{otp}=req.body
        const email=req.session.resetEmail

        const user=await User.findOne({email})

        if(!user||user.otp!==otp){
            return res.render('user/verifyForgotpassOtp')
        }
        if(user.otpExpiry<Date.now()){
            return res.render('user/verifyForgotpassOtp')
        }
        res.redirect('/user/resetPassword')
    }catch(error){
        res.status(500).send('server error')
    }
}

export const resetPassword=async (req,res)=>{
    try{
        const{password,confirmpassword}=req.body
        const email=req.session.resetEmail

        if(password!==confirmpassword){
            return res.render('user/resetPassword',{message:'passwords do not match'})
        }
        const user=await User.findOne({email})
        const hashedPassword=await bcrypt.hash(password,10)

        user.password=hashedPassword
        user.otp=null

        await user.save()

        res.redirect('/user/login')
    }catch(error){
        res.status(500).send('server error')
    }
}