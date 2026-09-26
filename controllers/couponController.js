import * as couponService from "../services/admin/couponService.js"
import Coupon from "../models/couponModel.js"
import HTTP_STATUS from "../utils/httpStatus.js"

export const loadCoupons=async(req,res)=>{
    try{
        const{
            page=1,
            search="",
            status=""
        }=req.query

    const data=await couponService.getCoupons({
        page,limit:10,search,status
    })
    res.render("admin/admincoupon/coupons",{
        coupons:data.coupons,
        totalcoupons:data.totalcoupons,
        totalpages:data.totalpages,
        currentPage:data.currentPage,
        search,
        selectedStatus:status
        
    })
    }catch(error){
        console.error("Load coupons error",error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("Failed to load coupons")
    }
}

export const loadAddCoupon=async(req,res)=>{
    try{
        res.render("admin/admincoupon/addCoupon")
    }catch(error){
        console.error(
            "load add coupon error",error
        )
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("failed to load add coupon page")
    }
}

export const createCoupon=async(req,res)=>{
    try{
      const coupon=await couponService.createCoupon(req.body)
      res.status(HTTP_STATUS.CREATED).json({
        success:true,
        message:"Coupon created successfully",
        coupon
      })
    }catch(error){
        console.error("create coupon error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,message:error.message
        })
    }
}

export const loadEditCoupon=async(req,res)=>{
    try{
        const{id}=req.params
        const coupon=await couponService.getCouponById(id)
        res.render("admin/admincoupon/editCoupon",{coupon})
    }catch(error){
         console.error(
            "Load edit coupon error:",
            error
        )
        res.status(404).send(
            error.message
        )
    }
}

export const updateCoupon=async(req,res)=>{
    try{
        const {id}=req.params

       const coupon= await couponService.updateCoupon(id,req.body)

        res.status(HTTP_STATUS.CREATED).json({
            success:true,
            message:"Coupon updated successfully",
            coupon})
    }catch(error){
        console.error("update coupon error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:error.message
        })
    }
}

export const deletCoupon=async(req,res)=>{
    try{
        const{id}=req.params
        await couponService.deletCoupon(id)
        res.json({
            success:true,
            message:"coupon added successfully"
        })
    }catch(error){
        console.error("Delete coupon error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:error.message
        })
    }
}

