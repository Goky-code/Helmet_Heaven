import passport from "passport"
import User from "../../models/userModels.js"

export const loginAdmin=async(email,password)=>{
    if(!email||!password){
        throw new Error("Email and password are required")
    }
    if(email!==process.env.ADMIN_EMAIL){
        throw new Error("Invalid email address")
    }
    if(password!==process.env.ADMIN_PASSWORD){
        throw new Error("Invalid password")
    }
    return true
}

export const getCustomers=async(page,limit,search,status,sort)=>{

    const skip=(page-1)*limit
    const conditions=[]

    if(status==="active"){
        conditions.push({isBlocked:false})
    }
    if(status==="blocked"){
        conditions.push({isBlocked:true})
    }
   
    if(search){
        conditions.push({
            $or:[
               {firstName:{$regex:search,$options:"i"}},
               {lastName:{$regex:search,$options:"i"}} ,
               {email:{$regex:search,$options:"i"}},
               {phone:{$regex:search,$options:"i"}},
            ],
        })
    }

    const filter=conditions.length>0?{$and:conditions}:{}
    const totalUsers=await User.countDocuments(filter)

    const users=await User.find(filter)
    .skip(skip)
    .limit(limit)
   .sort({isBlocked:1})

    const totalPages=Math.ceil(totalUsers/limit)

    return{
        users,
        currentPage:page,
        totalPages,
        totalUsers,
        status,
        search,
        sort,
    }
}

export const changeUserStatus=async(userId)=>{
    const user=await User.findById(userId)

    if(!user){
        throw new Error("user not found")
    }
    user.isBlocked=!user.isBlocked
    await user.save()

    return user
}