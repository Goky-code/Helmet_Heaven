import Order from "../../models/orderModel.js"
import Product from "../../models/productModel.js"

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
        end=new Date(now.getFullYear(),now.getMonth()+1,0)
        end.setHours(23,59,59,999)

    }else if(type==="yearly"){
        start=new Date(now.getFullYear(),0,1)
        end=new Date(now.getFullYear(),11,31)
        end.setHours(23,59,59,999)
    }else if(type==="custom"){
        if(!startDate||!endDate){
            throw new Error("Start date and end date are required")
        }
         start = new Date(`${startDate}T00:00:00`);
        end = new Date(`${endDate}T23:59:59.999`);
       

        if (Number.isNaN(start.getTime())||Number.isNaN(end.getTime()) ||
            start > end
        ) {
            throw new Error("Invalid date range");
        }
    }else{
        throw new Error("Invalid report type")
    }
    return{start,end}
}

export const getSalesReport=async({
    type="daily",
    startDate="",
    endDate="",
    search=""
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
    }).sort({createdAt:-1})
    .populate("items.productId","productName")
    .lean()

  
    let totalItemsSold=0
    let grossSales = 0
    let productDiscount = 0
    let couponDiscount = 0
    let netSales = 0

     const allSales = []

    for(const order of orders){
        let orderGross=0
        let orderProductDiscount=0
        let orderQuantity=0

        const items=order.items||[]
            for(const item of items){
                const quantity=Number(item.quantity)||0
                const regularPrice=Number(item.regularPrice)||0
                const salePrice=item.salePrice==null?regularPrice:Number(item.salePrice)
                const safeSalePrice=Number.isFinite(salePrice)?salePrice:regularPrice
                const lineGross=regularPrice*quantity
                const lineDiscount=Math.max(0,regularPrice-safeSalePrice)*quantity
                const productName=item.productName||item.productId?.productName||"Unknown Product"

                orderGross+=lineGross
                orderProductDiscount+=lineDiscount
                orderQuantity+=quantity

                allSales.push({
                    orderId:order.orderId,
                    productName,
                    quantity,
                     price: lineGross,
                discount: lineDiscount,
                paymentMethod: order.paymentMethod || "N/A",
                date: order.createdAt
                })
            }
           const orderCouponDiscount =Number(order.discount) || 0
         totalItemsSold += orderQuantity
        grossSales += orderGross
        productDiscount += orderProductDiscount
        couponDiscount += orderCouponDiscount

        netSales += Number(order.grandTotal) || 0
        }
         const totalDiscount = productDiscount + couponDiscount

         const filteredSales = search.trim()
        ? allSales.filter((sale) => {
            const query = search.trim().toLowerCase();

            return (
                String(sale.orderId || "").toLowerCase().includes(query) ||
                sale.productName.toLowerCase().includes(query)
            );
        })
        : allSales

    //     const orderTotalDiscount =
    //         orderProductDiscount +
    //         orderCouponDiscount;


    //     const orderAmount =
    //         Number(order.grandTotal || 0);


    //     totalItemsSold += orderItems;

    //     grossSales += orderGrossSales;

    //     productDiscount += orderProductDiscount

    //     couponDiscount += orderCouponDiscount

    //     totalDiscount += orderTotalDiscount

    //     netSales += orderAmount

    //     return{
    //         orderId:order.orderId,
    //         date:order.createdAt,
    //         items:orderItems,
    //         grossSales:orderGrossSales,
    //         productDiscount:orderProductDiscount,
    //         couponDiscount:orderCouponDiscount,
    //         totalDiscount:orderTotalDiscount,
    //         orderAmount
    //     }

    // })

    return{
        start,
        end,
        totalOrders:orders.length,
        totalItemsSold,
        grossSales,
        productDiscount,
        couponDiscount,
        totalDiscount,
        netSales,
        orders:filteredSales
    }
}