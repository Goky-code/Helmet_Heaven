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

export const downloadInvoice = async (req, res) => {
    try {
        const userId = req.session.user;
        const { orderId } = req.params;

        const order = await myOrderDetailsService.getInvoiceData(
            userId,
            orderId
        );

        if (!order) {
            return res.redirect("/user/myOrders/myorders");
        }

        const doc = new PDFDocument({
            margin: 50
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Invoice-${order.orderId}.pdf`
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        doc.pipe(res);

        // ==========================================
        // HEADER
        // ==========================================

        doc
            .fontSize(24)
            .fillColor("#1E40AF")
            .text("HELMET HEAVEN", {
                align: "center"
            });

        doc
            .fontSize(11)
            .fillColor("black")
            .text("Premium Helmet Store", {
                align: "center"
            });

        doc.moveDown(0.5);

        // Header line
        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown();

        // Tax Invoice
        doc
            .fontSize(18)
            .fillColor("#111827")
            .text("TAX INVOICE", {
                align: "center"
            });

        doc.moveDown(1.5);

        // ==========================================
        // ORDER INFORMATION
        // ==========================================

        doc
            .fontSize(12)
            .fillColor("black");

        doc.text(
            `Invoice No : ${order.orderId}`
        );

        doc.text(
            `Invoice Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`
        );

        doc.text(
            `Order Status : ${order.orderStatus}`
        );

        doc.moveDown();

        // ==========================================
        // SHIPPING ADDRESS
        // ==========================================

        doc
            .fontSize(14)
            .fillColor("#1E40AF")
            .text("Shipping Address");

        doc.moveDown(0.5);

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(
            order.address.name
        );

        doc.text(
            order.address.houseName
        );

        doc.text(
            order.address.street
        );

        doc.text(
            `${order.address.city}, ${order.address.state}`
        );

        doc.text(
            order.address.pincode
        );

        doc.moveDown();

        // ==========================================
        // PAYMENT DETAILS
        // ==========================================

        doc
            .fontSize(14)
            .fillColor("#1E40AF")
            .text("Payment Details");

        doc.moveDown(0.5);

        doc
            .fontSize(11)
            .fillColor("black")
            .text(
                `Payment Method : ${order.paymentMethod}`
            );

        doc.moveDown();

        // ==========================================
        // PRODUCTS
        // ==========================================

        doc
            .fontSize(14)
            .fillColor("#1E40AF")
            .text("Products");

        doc.moveDown(0.5);

        // ------------------------------------------
        // TABLE SETTINGS
        // ------------------------------------------

        const tableX = 50;
        const tableWidth = 495;

        const headerHeight = 24;
        const rowHeight = 30;

        const headerY = doc.y;

        // Column positions
        const productX = 60;
        const sizeX = 315;
        const qtyX = 375;
        const amountX = 445;

        // ------------------------------------------
        // TABLE HEADER
        // ------------------------------------------

        doc
            .rect(
                tableX,
                headerY,
                tableWidth,
                headerHeight
            )
            .fill("#1E40AF");

        // Header text
        doc
            .fontSize(11)
            .fillColor("white");

        doc.text(
            "Product",
            productX,
            headerY + 7
        );

        doc.text(
            "Size",
            sizeX,
            headerY + 7,
            {
                width: 40,
                align: "center"
            }
        );

        doc.text(
            "Qty",
            qtyX,
            headerY + 7,
            {
                width: 40,
                align: "center"
            }
        );

        doc.text(
            "Amount",
            amountX,
            headerY + 7,
            {
                width: 80,
                align: "right"
            }
        );

        // ------------------------------------------
        // FILTER CANCELLED PRODUCTS
        // ------------------------------------------

        const invoiceItems = order.items.filter(
            item => item.status !== "Cancelled"
        );

        // Start first row
        let rowY = headerY + headerHeight;

        // ------------------------------------------
        // TABLE ROWS
        // ------------------------------------------

        invoiceItems.forEach((item) => {

            // Same Y position for every column
            const currentY = rowY + 8;

            doc
                .fontSize(11)
                .fillColor("black");

            // Product
            doc.text(
                item.productName,
                productX,
                currentY,
                {
                    width: 230,
                    ellipsis: true
                }
            );

            // Size
            doc.text(
                item.size || "-",
                sizeX,
                currentY,
                {
                    width: 40,
                    align: "center"
                }
            );

            // Quantity
            doc.text(
                String(item.quantity),
                qtyX,
                currentY,
                {
                    width: 40,
                    align: "center"
                }
            );

            // Amount
            doc.text(
                `₹${item.totalPrice}`,
                amountX,
                currentY,
                {
                    width: 80,
                    align: "right"
                }
            );

            // Row bottom line
            doc
                .moveTo(
                    tableX,
                    rowY + rowHeight
                )
                .lineTo(
                    tableX + tableWidth,
                    rowY + rowHeight
                )
                .stroke();

            // Next row
            rowY += rowHeight;
        });

        // ------------------------------------------
        // MOVE BELOW TABLE
        // ------------------------------------------

        doc.y = rowY + 10;

        // ==========================================
        // TOTAL SECTION
        // ==========================================

        const totalX = 350;
        const totalWidth = 195;

        doc
            .fontSize(12)
            .fillColor("black");

        // ------------------------------------------
        // SUBTOTAL
        // ------------------------------------------

        doc.text(
            `Subtotal : ₹${order.subTotal}`,
            totalX,
            doc.y,
            {
                width: totalWidth,
                align: "right"
            }
        );

        doc.moveDown(0.3);

        // ------------------------------------------
        // SHIPPING
        // ------------------------------------------

        doc.text(
            `Shipping : ${
                order.shipping === 0
                    ? "Free"
                    : "₹" + order.shipping
            }`,
            totalX,
            doc.y,
            {
                width: totalWidth,
                align: "right"
            }
        );

        doc.moveDown(0.3);

        // ------------------------------------------
        // TAX
        // ------------------------------------------

        doc.text(
            `Tax : ₹${order.tax}`,
            totalX,
            doc.y,
            {
                width: totalWidth,
                align: "right"
            }
        );

        doc.moveDown(0.3);

        // ------------------------------------------
        // DISCOUNT
        // ------------------------------------------

        doc.text(
            `Discount : ₹${order.discount}`,
            totalX,
            doc.y,
            {
                width: totalWidth,
                align: "right"
            }
        );

        doc.moveDown(0.5);

        // ------------------------------------------
        // GRAND TOTAL LINE
        // ------------------------------------------

        doc
            .moveTo(
                totalX,
                doc.y
            )
            .lineTo(
                545,
                doc.y
            )
            .stroke();

        doc.moveDown(0.5);

        // ------------------------------------------
        // GRAND TOTAL
        // ------------------------------------------

        doc
            .fontSize(15)
            .fillColor("#1E40AF")
            .text(
                `Grand Total : ₹${order.grandTotal}`,
                totalX,
                doc.y,
                {
                    width: totalWidth,
                    align: "right"
                }
            );

        // ==========================================
        // END PDF
        // ==========================================

        doc.end();

    } catch (error) {

        console.log(error);

        res.redirect("/pageNotFound");
    }
};