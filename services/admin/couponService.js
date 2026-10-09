import mongoose from "mongoose";
import Coupon from "../../models/couponModel.js";

export const getCoupons=async({
    page=1,limit=10,search="",status=""
}={})=>{
    page=Number(page)
    limit=Number(limit)

    if(page<1)
        page=1
    if(limit<1)
        limit=10

    const skip=(page-1)*limit

    const query={}

    if(search&&search.trim()){
        const searchRegex=new RegExp(search.trim(),"i")
        query.$or=[
            {name:searchRegex},
            {code:searchRegex}
        ]
    }

    if(status==="DISABLED"){
        query.isDisabled=true
    }else if(status==="ACTIVE"){
        query.isDisabled=false
        query.expiryDate={
            $gte:new Date()
        }
    }else if(status==="EXPIRED"){
        query.expiryDate={
            $lt:new Date()
        }
    }
    const [coupons,totalcoupons]=await Promise.all([
        Coupon.find(query)
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
            .lean(),
            Coupon.countDocuments(query)
    ])

    const totalPages=Math.ceil(totalcoupons/limit)

    const updatedCoupons=coupons.map(coupon=>{
        let couponStatus
        if(coupon.isDisabled){
            couponStatus="DISABLED"
        }else if(coupon.expiryDate&&new Date(coupon.expiryDate)<new Date()){
            couponStatus="EXPIRED"
        }else{
            couponStatus="ACTIVE"
        }
        return {
            ...coupon,
            status: couponStatus
        }
        })

        return{
            coupons:updatedCoupons,
            totalcoupons,
            totalPages,
            currentPage:page
        }
}

export const getCouponById=async(couponId)=>{
    if(!mongoose.Types.ObjectId.isValid(couponId)){
        throw new Error("Invalid coupon id")
    }
    const coupon=await Coupon.findById(couponId).lean()

    if(!coupon){
        throw new Error("Coupon not found")
    }
    return coupon
}

export const createCoupon=async(couponData)=>{
   const {
    name,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minPurchase,
    startDate,
    expiryDate,
    isDisabled
} = couponData;

    if(!name||!name.trim()){
        throw new Error("Coupon name is required")
    }

   
    if(!discountType){
        throw new Error("Discount type is required")
    }
    if(discountValue===undefined||discountValue===null||discountValue===""){
        throw new Error("Discount value is required")
    }
   if(!startDate){
    throw new Error("Start date is required")
   }
   if(!expiryDate){
    throw new Error("Expiry date is required")
   }

   const couponCode=name.trim().toUpperCase()
   const type=discountType.toUpperCase()
   const discount=Number(discountValue)
   const minimumPurchase=minPurchase===undefined||minPurchase===""?0:Number(minPurchase)
   if(isNaN(discount)||discount<=0){
    throw new Error("Discount value must be greater than 0")
   }
   if(isNaN(minimumPurchase)||minimumPurchase<0){
    throw new Error("Minimum purchase must be ) or greater ")
   }
    if (!["PERCENTAGE", "FIXED"].includes(type)) {
        throw new Error("Invalid discount type")
    }
     if (type === "PERCENTAGE" && discount > 100) {
        throw new Error("Percentage discount cannot exceed 100%")
    }

    if (type === "FIXED" &&
        minimumPurchase > 0 &&
        discount > minimumPurchase
    ) {
        throw new Error("Fixed discount cannot be greater than minimum purchase")
    }

    const maximumDiscount=maxDiscount===undefined||maxDiscount===""?null:Number(maxDiscount)
    if (
    maximumDiscount !== null &&
    (isNaN(maximumDiscount) || maximumDiscount < 0)
    ) {
    throw new Error("Maximum discount must be 0 or greater");
    }

    const start = new Date(startDate)
    const expiry = new Date(expiryDate)

    if (isNaN(start.getTime())) {
        throw new Error("Invalid start date")
    }

    if (isNaN(expiry.getTime())) {
        throw new Error("Invalid expiry date")
    }

    if (expiry <= start) {
        throw new Error("Expiry date must be after start date")
    }
   const existingCoupon = await Coupon.findOne({
        code: couponCode
    });

    if (existingCoupon) {
        throw new Error("Coupon code already exists")
    }

   const coupon=await Coupon.create({
    name:name.trim(),
    code:couponCode,
    description: description
            ? description.trim()
            : "",
        discountType: type,
        discountValue: discount,
        maxDiscount: maximumDiscount,
        minPurchase: minimumPurchase,
        startDate: start,
        expiryDate: expiry,
        isDisabled: Boolean(isDisabled)
        
   })

   return coupon

}

export const updateCoupon=async(couponId,couponData)=>{
    if(!mongoose.Types.ObjectId.isValid(couponId)){
        throw new Error("Invalid coupon ID")
    }
    const coupon=await Coupon.findById(couponId)

    if(!coupon){
        throw new Error("Coupon not found")
    }
   const {
    name,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minPurchase,
    startDate,
    expiryDate,
    isDisabled
} = couponData

 if (!name || !name.trim()) {
        throw new Error("Coupon name is required")
    }

if(!discountType){
    throw new Error("Discount type is required")
}

if(discountValue===undefined||discountValue===null||discountValue===""){
    throw new Error("Discount value is required")
}

    const couponCode = name.trim().toUpperCase()

    const type = discountType.toUpperCase()

    const discount = Number(discountValue)

    const minimumPurchase =
        minPurchase === undefined || minPurchase === ""
            ? 0
            : Number(minPurchase)

    const maximumDiscount=maxDiscount===undefined||maxDiscount===""?null:Number(maxDiscount)       


    if (isNaN(discount) || discount <= 0) {
        throw new Error("Discount value must be greater than 0")
    }


    if (isNaN(minimumPurchase) || minimumPurchase < 0) {
        throw new Error("Minimum purchase must be 0 or greater")
    }


    if (!["PERCENTAGE", "FIXED"].includes(type)) {
        throw new Error("Invalid discount type")
    }


    if (type === "PERCENTAGE" && discount > 100) {
        throw new Error("Percentage discount cannot exceed 100%")
    }


    if (type === "FIXED" &&
        minimumPurchase > 0 &&
        discount > minimumPurchase) {
        throw new Error(
            "Fixed discount cannot be greater than minimum purchase"
        )
    }

     if(maximumDiscount!==null&&(isNaN(maximumDiscount)||maximumDiscount<0)){
        throw new Error("Maximum discount must be 0 or greater")
     }

     if(type==="FIXED"&&maximumDiscount!==null){
        throw new Error( "Maximum discount is only applicable for percentage coupons")
     }

    const start = new Date(startDate)
    const expiry = new Date(expiryDate)


    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
        throw new Error("Invalid date")
    }


    if (expiry <= start) {
        throw new Error(
            "Expiry date must be after start date"
        );
    }


    
    const existingCoupon = await Coupon.findOne({
        code: couponCode,
        _id: { $ne: couponId }
    })


    if (existingCoupon) {
        throw new Error("Coupon code already exists")
    }


    coupon.name = name.trim()
    coupon.code = couponCode
    coupon.description = description
        ? description.trim()
        : ""
    coupon.discountType = type
    coupon.discountValue = discount
    coupon.maxDiscount = maximumDiscount
    coupon.minPurchase = minimumPurchase
    coupon.startDate = start
    coupon.expiryDate = expiry
    coupon.isDisabled = Boolean(isDisabled)


    await coupon.save()


    return coupon

}

export const deleteCoupon=async(couponId)=>{
    if(!mongoose.Types.ObjectId.isValid(couponId)){
        throw new Error("Invalid couponId")
    }
    const coupon=await Coupon.findById(couponId)

    if(!coupon){
        throw new Error("coupon not found")
    }
    await Coupon.findByIdAndDelete(couponId)

    return true
}