import * as orderService from "../services/admin/orderService.js";
import HTTP_STATUS from "../utils/httpStatus.js";

export const loadOrders=async(req,res)=>{
    try{
        const{search,status,sort}=req.query
        const page=parseInt(req.query.page)||1
        const limit=5
        const data=await orderService.getOrders(page,limit,{search,status,sort})

        res.render("admin/adminOrders/admin-orders",data)
    }catch(error){
        console.log(error)
        res.redirect("/admin/pageerror")
    }
}

export const loadOrderDetails=async(req,res)=>{
    try{
        const order=await orderService.getOrderDetails(req.params.id)

        if(!order){
            return res.redirect("/admin/pageerror")
        }
        res.render("admin/adminOrders/adminOrderDetails",{order})
    }catch(error){
        console.log(error)
        res.redirect("/admin/pageerror")
    }
}

export const updateOrderStatus=async(req,res)=>{
    try{
        const {status}=req.body
        const order=await orderService.updateOrderStatus(req.params.id,status)

       res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order status updated successfully",
      orderStatus: order.orderStatus,
    })

  } catch (error) {

    console.log(error);

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });

  }
}

export const updateOrderItemStatus=async(req,res)=>{
    try{
        const {orderId,itemId}=req.params
        const {status}=req.body

        const order=await orderService.changeOrderItemStatus(
            orderId,itemId,status
        )
        res.status(HTTP_STATUS.OK).json({
            success:true,
            message:"Product status updated successfully",
            orderStatus:order.orderStatus
        })
    }catch(error){
        console.log(error)
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:error.message
        })
    }
}

// export const updatingOrderStatus = async (req, res) => {
//     try {
//         const { status } = req.body;
//         const order = await orderService.changeOrderStatus(req.params.id, status)

//         res.status(HTTP_STATUS.OK).json({
//             success: true,
//             message: "Order status updated successfully",
//             orderStatus: order.orderStatus,
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(HTTP_STATUS.BAD_REQUEST).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };