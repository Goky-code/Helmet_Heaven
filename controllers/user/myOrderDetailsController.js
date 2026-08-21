import * as myOrderDetailsService from "../../services/user/myOrderDetailsService.js"
import Order from "../../models/orderModel.js"
import PDFDocument from "pdfkit"

export const loadOrderDetails=async(req,res)=>{
    try{
        const userId=req.session.user
        const {orderId}=req.params

        const order=await myOrderDetailsService.getOrderDetails(userId,orderId)

        if(!order){
            return res.redirect("/user/myOrders")
        }
        res.render("user/myOrders/myorderDetails",{
            order
        })
    }catch(error){
        console.log(error)
        res.redirect("/pageNotFound")
    }
}

export const cancelOrder = async (req, res) => {

    try {

        const userId = req.session.user;
        const { orderId } = req.params;

        const selectedItems = req.body.items;

        await myOrderDetailsService.cancelOrderItems(
            userId,
            orderId,
            selectedItems,
            req.body
        );

        return res.redirect(`/user/orders/${orderId}`);

    } catch (error) {

        console.log("CANCEL ORDER ERROR:", error);

        return res.redirect(`/user/orders/${req.params.orderId}`);
    }
}

export const returnOrder=async(req,res)=>{
    try{
        const {orderId}=req.params
           let selectedItems = req.body.items;

        if (!selectedItems) {
            return res.redirect(`/user/orders/${orderId}`);
        }

        if (!Array.isArray(selectedItems)) {
            selectedItems = [selectedItems];
        }

        for (const productId of selectedItems) {

            const reason = req.body[`reason_${productId}`];
            const comment = req.body[`comment_${productId}`];

            await Order.updateOne(
                {
                    orderId,
                    "items.productId": productId
                },
                {
                    $set: {
                        "items.$.status": "Return Requested",
                        "items.$.returnReason": reason,
                        "items.$.returnComment": comment,
                        "items.$.returnedAt": new Date()
                    }
                }
            )
              console.log("Product ID:", productId);
        }

        const order = await Order.findOne({ orderId });

        const allRequested = order.items.every(
            item => item.status === "Return Requested"
        );

        if (allRequested) {
            order.orderStatus = "Return Requested";
            await order.save();
        }

        res.redirect(`/user/orders/${orderId}`);

    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound");
    }
}

export const downloadInvoice=async(req,res)=> {
    try{
        const userId=req.session.user
        const {orderId}=req.params
        
        const order=await myOrderDetailsService.getInvoiceData(userId,orderId)

        if(!order){
            return res.redirect("/user/myOrders/myorders")
        }

        const doc=new PDFDocument({
            margin:50
        })

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Invoice-${order.orderId}.pdf`
        );

        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

       // ===== HEADER =====
doc
    .fontSize(24)
    .fillColor("#1E40AF")
    .text("HELMET HEAVEN", { align: "center" });

doc
    .fontSize(11)
    .fillColor("black")
    .text("Premium Helmet Store", { align: "center" });

doc.moveDown(0.5);

doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

doc.moveDown();

doc
    .fontSize(18)
    .fillColor("#111827")
    .text("TAX INVOICE", { align: "center" });

doc.moveDown(1.5);

// ===== ORDER INFO =====
doc.fontSize(12).fillColor("black");

doc.text(`Invoice No : ${order.orderId}`);
doc.text(`Invoice Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`);
doc.text(`Order Status : ${order.orderStatus}`);

doc.moveDown();

// ===== ADDRESS =====
doc
    .fontSize(14)
    .fillColor("#1E40AF")
    .text("Shipping Address");

doc.moveDown(0.5);

doc
    .fontSize(11)
    .fillColor("black");

doc.text(order.address.name);
doc.text(order.address.houseName);
doc.text(order.address.street);
doc.text(`${order.address.city}, ${order.address.state}`);
doc.text(order.address.pincode);

doc.moveDown();

// ===== PAYMENT =====
doc
    .fontSize(14)
    .fillColor("#1E40AF")
    .text("Payment Details");

doc.moveDown(0.5);

doc
    .fontSize(11)
    .fillColor("black");

doc.text(`Payment Method : ${order.paymentMethod}`);


doc.moveDown();

// ===== PRODUCT TABLE =====
doc
    .fontSize(14)
    .fillColor("#1E40AF")
    .text("Products");

doc.moveDown(0.5);

const startY = doc.y;

doc
    .fontSize(11)
    .fillColor("white")
    .rect(50, startY, 495, 22)
    .fill("#1E40AF");

doc
    .fillColor("white")
    .text("Product", 60, startY + 6)
    .text("Size", 290, startY + 6)
    .text("Qty", 350, startY + 6)
    .text("Amount", 430, startY + 6);

doc.y = startY + 30;

order.items.forEach((item) => {

    doc.fillColor("black");

    doc.text(item.productName, 60, doc.y);
    doc.text(item.size, 290, doc.y);
    doc.text(item.quantity.toString(), 350, doc.y);
    doc.text(`₹${item.totalPrice}`, 430, doc.y);

    doc.moveDown();

    doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

    doc.moveDown(0.5);

});

// ===== TOTAL =====

doc.moveDown();

doc.fontSize(12);

doc.text(`Subtotal : ₹${order.subTotal}`, {
    align: "right"
});

doc.text(
    `Shipping : ${
        order.shipping === 0
            ? "Free"
            : "₹" + order.shipping
    }`,
    {
        align: "right"
    }
);

doc.text(`Tax : ₹${order.tax}`, {
    align: "right"
});

doc.text(`Discount : ₹${order.discount}`, {
    align: "right"
});

doc.moveDown(0.5);

doc
    .moveTo(350, doc.y)
    .lineTo(545, doc.y)
    .stroke();

doc.moveDown(0.5);

doc
    .fontSize(15)
    .fillColor("#1E40AF")
    .text(`Grand Total : ₹${order.grandTotal}`, {
        align: "right"
    });

doc.moveDown(2);


doc.end();

    }catch(error){
        console.log(error)
        res.redirect("/pageNotFound")
    }
    
}