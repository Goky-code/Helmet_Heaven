
import * as offerService from "../services/admin/offerService.js"
import HTTP_STATUS from "../utils/httpStatus.js"

export const loadOffers=async(req,res)=>{
    try{
        const offers=await offerService.getOffers()
       return res.render("admin/adminOffers/offers",{offers
  })
    }catch (error){
        console.error("load offers error",error)
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .send("Failed to load offers")
    }
}

export const loadCreateOffer=async(req,res)=>{
    try{
        const data=await offerService.getCreateOfferData()
       return res.render("admin/adminOffers/addoffer",{
            products:data.products,
            categories:data.categories      
        })
    }catch(error){
        console.error("load create offer error",error)
       return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .send("Failed to load create offer page")
    }
}

export const createNewOffer=async(req,res)=>{
    try{
        await offerService.createOffer(req.body)
       return res.redirect("/admin/offers")
    }catch(error){
        console.error("create offer error",error)
       return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}

export const loadEditOffer=async(req,res)=>{
    try{
        const{id}=req.params
        const[offer,data]=await Promise.all([
            offerService.getOfferById(id),
            offerService.getCreateOfferData(),
        ])
            return res.render("admin/adminOffers/editOffer",{
            offer,
            products:data.products,
            categories:data.categories,
          
        })
    }catch(error){
        console.error("load edit offer error",error)
        res.status(HTTP_STATUS.NOT_FOUND).send(error.message)
    }
}

export const updateExistingOffer=async(req,res)=>{
    try{
        const {id}=req.params
        console.log("========== UPDATE OFFER DEBUG ==========");
    console.log("Offer ID:", id);
    console.log("Offer type:", req.body.offerType);
    console.log("Category ID:", req.body.categoryId);
    console.log("Product ID:", req.body.productId);
    console.log("Offer for:", req.body.offerFor);
    console.log("Full body:", req.body);
    console.log("========================================");

        await offerService.updateOffer(id,req.body)
        return res.redirect("/admin/offers")
    }catch(error){
        console.error("update offer error",error)
         return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}

export const toggleStatus=async(req,res)=>{
    try{
       const{id}=req.params 
       const offer=await offerService.toggleOfferStatus(id)
        return res.redirect("/admin/offers")
    }catch(error){
        console.error("Toggle offer status error",error)
        return res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}

export const removeOffer=async(req,res)=>{
    try{
        const{id}=req.params
        await offerService.deleteOffer(id)
        return res.status(HTTP_STATUS.OK).json({
            success:true,
            message:"Offer deleted successfully"
        })
    }catch(error){
        console.error("Delete offer error:", error)

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message || "Failed to delete offer"
        })
    }
}