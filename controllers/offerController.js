
import * as offerService from "../services/admin/offerService.js"
import HTTP_STATUS from "../utils/httpStatus.js"

export const loadOffers=async(req,res)=>{
    try{
        const offers=await offerService.getOffers()
        res.render("admin/adminOffers/offers",{offers:offers

        })
    }catch (error){
        console.error("load offers error",error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export const loadCreateOffer=async(req,res)=>{
    try{
        const data=await offerService.getCreateOfferData()
        res.render("admin/adminOffers/addoffer",{
            products:data.products,
            categories:data.categories
            
        })
    }catch(error){
        console.error("load create offer error",error)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export const createNewOffer=async(req,res)=>{
    try{
        await offerService.createOffer(req.body)
        res.redirect("/admin/offers")
    }catch(error){
        console.error("create offer error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}

export const loadEditOffer=async(req,res)=>{
    try{
        const{id}=req.params
        const[offer,data]=await Promise.all([
            offerService.getOfferById(id),
            offerService.getCreateOfferData(),
        ])
        res.render("admin/adminOffers/editOffer",{
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
        await offerService.updateOffer(id,req.body)
        res.redirect("/admin/offers")
    }catch(error){
        console.error("update offer error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}

export const toggleStatus=async(req,res)=>{
    try{
       const{id}=req.params 
       await offerService.toggleOfferStatus(id)
       res.redirect("/admin/offers")
    }catch(error){
        console.error("Toggle offer status error",error)
        res.status(HTTP_STATUS.BAD_REQUEST).send(error.message)
    }
}