import mongoose from "mongoose";
import Offer from "../../models/offerModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";


const VALID_OFFER_TYPES=["PRODUCT","CATEGORY"]
const VALID_DISCOUNT_TYPES=["PERCENTAGE","FIXED"]

const validateOfferData=async(data)=>{
    const{
        offerName,
        offerType,
        offerFor,
        productId,
        categoryId,
        discountType,
        discountValue,
        startDate,endDate
    }=data

    if(!offerName||!offerName.trim()){
        throw new Error('offer name is required')
    }

    if(!VALID_OFFER_TYPES.includes(offerType)){
        throw new Error("Invalid offer type")
    }

    if(!VALID_DISCOUNT_TYPES.includes(discountType)){
        throw new Error("Invalid discount type")
    }

    const value=Number(discountValue)

     if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Discount value must be greater than 0");
    }

    if (discountType === "PERCENTAGE" && value > 100) {
        throw new Error("Percentage discount cannot exceed 100%");
    }

    if (!startDate || !endDate) {
        throw new Error("Start date and expiry date are required");
    }

     const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
    ) {
        throw new Error("Expiry date must be after start date");
    }

    let finalProductId = null;
    let finalCategoryId = null;
    let finalOfferFor = "";

    if (offerType === "PRODUCT") {
        if (productId === "ALL_PRODUCTS") {
            finalOfferFor = "All Products";
        } else {
            if (!mongoose.isValidObjectId(productId)) {
                throw new Error("Please select a valid product");
            }

            const product = await Product.findOne({
                _id: productId,
                isDeleted: false
            });

            if (!product) {
                throw new Error("Selected product not found");
            }

            finalProductId = product._id;
            finalOfferFor = product.productName;
        }
    }

    if (offerType === "CATEGORY") {

         const normalizedCategoryId = Array.isArray(categoryId)
        ? categoryId[0]
        : categoryId;

        if (!mongoose.isValidObjectId(categoryId)) {
            throw new Error("Please select a valid category");
        }

        const category = await Category.findById(normalizedCategoryId)

        if (!category) {
            throw new Error("Selected category not found");
        }

        finalCategoryId = category._id;
        finalOfferFor = category.name;
    }

    return {
        offerName: offerName.trim(),
        offerType,
        offerFor: finalOfferFor,
        productId: finalProductId,
        categoryId: finalCategoryId,
        discountType,
        discountValue: value,
        startDate: start,
        endDate: end
    };
};




export const getOffers=async()=>{
    const offers=await Offer.find()
    .populate("productId","productName")
    .populate("categoryId","name")
    .sort({createdAt:-1})

    return offers
}

export const getOfferById = async (offerId) => {

     if (!mongoose.isValidObjectId(offerId)) {
        throw new Error("Invalid offer ID");
    }

    const offer = await Offer.findById(offerId)
        .populate("productId", "productName")
        .populate("categoryId", "name");

    if (!offer) {
        throw new Error("Offer not found");
    }

    return offer;
}

export const getCreateOfferData=async()=>{
    const [products,categories]=await Promise.all([
        Product.find({isDeleted:false})
        .select("productName")
        .sort({productName:1})
        .lean(),
        Category.find({isDeleted:false})
        .select("name")
        .sort({name:1})
        .lean()
    ])

    return{
        products,categories
    }
}

export const createOffer=async(offerData)=>{
     const validatedData = await validateOfferData(offerData)
    const offer=new Offer({...validatedData,isActive:true})

    await offer.save()

    return offer
}

export const updateOffer = async (offerId, offerData) => {

     if (!mongoose.isValidObjectId(offerId)) {
        throw new Error("Invalid offer ID");
    }

    const offer= await Offer.findById(offerId)

    if(!offer){
        throw new Error("offer not found")
    }
      const validatedData=await validateOfferData(offerData)
      Object.assign(offer,validatedData)
     
    await offer.save()
    
    return offer
}

export const toggleOfferStatus=async(offerId)=>{

    if(!mongoose.isValidObjectId(offerId)){
        throw new Error("Invalid offer ID")
    }
    const offer=await Offer.findById(offerId)

    if(!offer){
        throw new Error("offer not found")
    }
    offer.isActive=!offer.isActive

    await offer.save()

    return offer
}

export const deleteOffer=async(offerId)=>{
    if(!mongoose.isValidObjectId(offerId)){
        throw new Error("Invalid offer ID")
    }
    const offer=await Offer.findByIdAndDelete(offerId)

    if(!offer){
        throw new Error("Offer not found")
    }
    return offer
}

export const calculateProductOffer=async(product,originalPrice)=>{
    const now=new Date()

    const offers=await Offer.find({
        isActive:true,
        startDate:{$lte:now},
        endDate:{$gte:now}
    }).lean()

    const productId=product._id.toString()
    const categoryId=(product.category?._id||product.Category)?.toString()

    const applicableOffers=offers.filter(offer=>{
        const productMatch=offer.productId&&offer.productId.toString()===product._id.toString()
        const categoryMatch=offer.categoryId&&offer.categoryId.toString()===(product.category?._id||product.category)?.toString()
        return productMatch||categoryMatch
    })

    let bestOffer=null
    let bestDiscount=0

    for(const offer of applicableOffers){
        let discount=0

        if(offer.discountType==="PERCENTAGE"){
            discount=originalPrice*offer.discountValue/100
        }else if(offer.discountType==="FIXED"){
            discount=offer.discountValue
        }

        discount=Math.min(originalPrice,Math.max(0,discount))

        if(discount>bestDiscount){
            bestDiscount=discount
            bestOffer=offer
        }
    }

    const discountAmount=Math.round(bestDiscount*100)/100
    const salePrice=Math.round((originalPrice-discountAmount)*100)/100

    return {
    originalPrice,
    discountAmount,
    salePrice,
    discountPercentage: originalPrice > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0,
    offer: bestOffer
  }
}