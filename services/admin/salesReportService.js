import Order from "../../models/orderModel.js"

export const getDateRange=({type,startDate,endDate})=>{
    const now=new Date()
    let start
    let end

    if(type==="daily"){
        start=new Date(now)
        start.setHours(0,0,0,0)

        end=new Date(now)
        end.setHours(23,59,59,999)

    }else if(type==="weekly"){
        start=new Date(now)
        const day=start.getDay()
        const diff=day===0?6:day-1
        start.setDate(start.getDate()-diff)
        start.setHours(0,0,0,0)
        end=new Date(start)
        end.setDate(start.getDate()+6)
        end.setHours(23,59,59,999)
        
    }else if(type==="monthly"){
        start=new Date(now.getFullYear(),now.getMonth(),1)
        start.setHours(0,0,0,0)
        end=new Date(now.getFullYear(),now.getMonth()+1,0)
        end.setHours(23,59,59,999)

    }else if(type==="yearly"){
        start=new Date(now.getFullYear(),0,1)
        start.setHours(0,0,0,0)

        end=new Date(now.getFullYear(),11,31)
        end.setHours(23,59,59,999)
    }else if(type==="custom"){
        if(!startDate||!endDate){
            throw new Error("Start date and end date are required")
        }
        start=new Date(startDate)
        start.setHours(0,0,0,0)

        end=new Date(endDate)
        end.setHours(23,59,59,999)
    }else{
        throw new Error("Invalid report type")
    }
    return{start,end}
}

export const getSalesReport=async({
    type,startDate,endDate
})=>{

    const {start,end}=getDateRange({
        type,
        startDate,
        endDate
    })
    const orders=await Order.find({
        orderStatus:"Delivered",
        createdAt:{
            $gte:start,
            $lte:end
        }
    }).sort({createdAt:-1}).lean()

    let totalOrders=0
    let totalItemsSold=0
    let grossSales = 0
    let productDiscount = 0
    let couponDiscount = 0
    let totalDiscount = 0
    let netSales = 0

    const reportOrders=orders.map(order=>{
        totalOrders++

        let orderGrossSales=0
        let orderProductDiscount=0
        let orderItems=0

        for(const item of order.items){
            const quantity=Number(item.quantity||0)
            const regularPrice=Number(item.regularPrice||0)
            const salePrice=Number(item.salePrice||regularPrice)
              orderItems += quantity
            orderGrossSales += regularPrice * quantity
                orderProductDiscount += (regularPrice - salePrice) * quantity     
        }
         const orderCouponDiscount =
            Number(order.discount || 0);


        const orderTotalDiscount =
            orderProductDiscount +
            orderCouponDiscount;


        const orderAmount =
            Number(order.grandTotal || 0);


        totalItemsSold += orderItems;

        grossSales += orderGrossSales;

        productDiscount += orderProductDiscount

        couponDiscount += orderCouponDiscount

        totalDiscount += orderTotalDiscount

        netSales += orderAmount

        return{
            orderId:order.orderId,
            date:order.createdAt,
            items:orderItems,
            grossSales:orderGrossSales,
            productDiscount:orderProductDiscount,
            couponDiscount:orderCouponDiscount,
            totalDiscount:orderTotalDiscount,
            orderAmount
        }

    })

    return{
        start,
        end,
        totalOrders,
        totalItemsSold,
        grossSales,
        productDiscount,
        couponDiscount,
        totalDiscount,
        netSales,
        orders:reportOrders
    }
}