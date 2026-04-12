import User from '../models/userModels.js';
import authServices from '../services/authServices.js'
 import generateOTP from '../utils/generateOtp.js';


 export const login=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const result=await authServices.loginUser(email,password)
        if(result.success){
            req.session.user=result.user
            res.redirect('/user/homepage')
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

        if(password!==confirmpassword){
            return res.render('user/signup',{message:"password does not match"})
        }
        const result=await authServices.registerUser({
            firstname,lastname,email,password,referalcode
        })

        if(result.success){
            req.session.email=result.email
            res.redirect("/user/verifyOtp")
        }else{
            res.render("user/signup",{message:result.message})
        }
    }catch(error){
        res.status(500).send("server error")
    }
}

export const verifyOtp=async(req,res)=>{
    try{
        const{otp}=req.body
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
        console.log("Resent OTP:", otp); 
    }catch(error){
        res.status(500).send("server error")
    }
}

