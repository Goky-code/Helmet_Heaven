import Offer from "../../models/offerModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";

export const getOffers=async()=>{
    const offers=await Offer.find()
    .populate("productId","productName")
    .populate("categoryId","name")
    .sort({createdAt:-1})

    return offers
}

export const getOfferById = async (offerId) => {

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
        Product.find({isDeleted:false}).lean(),
        Category.find({isDeleted:false}).lean()
    ])

    return{
        products,categories
    }
}

export const createOffer=async(OfferData)=>{
    const{
        offerName,
        offerType,
        offerFor,
        productId,
        categoryId,
        discountType,
        discountValue,
        startDate,
        endDate,
    }=OfferData

    if(!offerName || !offerName.trim()){
        throw new Error("offer name is required")
    }

    if(Number(discountValue)<=0){
        throw new Error("Discount value must be greater than 0")
    }

    if(discountType==="PERCENTAGE"&&Number(discountValue)>100){
        throw new Error("Percentage discount cannot exceed 100%")
    }
    if(new Date (startDate)>=new Date(endDate)){
        throw new Error("expiry date must be after start date")
    }
    const offer= new Offer({
        offerName: offerName.trim(),
        offerType,
        offerFor,
  productId:
    productId||null,
    categoryId:
    categoryId||null,
      discountType,
    discountValue:Number(discountValue),
    startDate,
    endDate,
     isActive:true,
    })
    await offer.save()

    return offer
}

export const updateOffer = async (offerId, offerData) => {

     const{
        offerName,
        offerType,
        offerFor,
        productId,
        categoryId,
        discountType,
        discountValue,
        startDate,
        endDate,
    }=OfferData

    if(!offerName || !offerName.trim()){
        throw new Error("offer name is required")
    }

    if(Number(discountValue)<=0){
        throw new Error("Discount value must be greater than 0")
    }

    if(discountType==="PERCENTAGE"&&Number(discountValue)>100){
        throw new Error("Percentage discount cannot exceed 100%")
    }
    if(new Date (startDate)>=new Date(endDate)){
        throw new Error("expiry date must be after start date")
    }
    const offer= await Offer.findById(offerId)

    if(!offer){
        throw new Error("offer not found")
    }
       offer. offerName= offerName.trim(),
       offer. offerType=offerType
       offer. offerFor=offerFor
 offer. productId=
    productId||null,
  offer.  categoryId=
    categoryId||null,
    offer.  discountType=discountType
   offer. discountValue=Number(discountValue),
   offer. startDate=startDate
 offer.endDate=endDate
     
    await offer.save()
    
    return offer
}

export const toggleOfferStatus=async(offerId)=>{
    const offer=await Offer.findById(offerId)

    if(!offer){
        throw new Error("offer not found")
    }
    offer.isActive=!offer.isActive

    await offer.save()

    return offer
}