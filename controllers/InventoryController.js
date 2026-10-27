import * as InventoryService from "../services/admin/InventoryService.js"
import HTTP_STATUS from "../utils/httpStatus.js"

export const getInventory=async(req , res)=>{
    try{
        const page=parseInt(req.query.page)||1
        const limit=5

        const search=req.query.search||""
        const status=req.query.status||""
        const category=req.query.category||""

        const data=await InventoryService.getInventory(page,limit,search,status,category)
        res.render("admin/Inventory",data)
    }catch(error){
         console.log(error);

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .send("Server error")
    }
}

export const updateVariantStock=async(req,res)=>{
    try{
        const {productId,variantId}=req.params
        const{stock}=req.body

        if(stock===undefined||stock===null||isNaN(stock)||Number(stock)<0){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,message:"Invalid Stock quantity"
            })
        }
        await InventoryService.updateVariantStock(productId,variantId,Number(stock))
         res.json({
            success: true,
            message: "Stock updated successfully"
        })
    }catch (error) {

        console.log(error)

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || "Failed to update stock"
        })
    }
    
}