import * as salesReportService from "../services/admin/salesReportService.js"
import HTTP_STATUS from "../utils/httpStatus.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export const loadSalesReport=async(req,res)=>{
    try{
        const {
            type="daily",
            startDate="",
            endDate=""
        }=req.query
    

    const report=await salesReportService.getSalesReport({
        type,
        startDate,
        endDate
    })

    res.render('admin/salesReport',{
       sales:report.orders,
       period:type,
       startDate:report.start,
       endDate:report.end,
       totalRevenue:report.netSales,
       totalOrders:report.totalDiscount,
       currentPage:1,
       totalPage:1,
       totalRecords:report.orders.length,
       limit:report.orders.length||10,
       search:""

    })

}catch(error){
    console.error("Sales Report error",error)

res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send( "Failed to load sales report")
}

}

export const downloadSalesReportPDF = async (req, res) => {

    try {

        const {
            type = "daily",
            startDate = "",
            endDate = ""
        } = req.query;


        const report = await getSalesReport({
            type,
            startDate,
            endDate
        });


        const doc = new PDFDocument({
            margin: 40
        });


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="sales-report.pdf"`
        );


        doc.pipe(res);


        doc
            .fontSize(20)
            .text("Helmet Heaven - Sales Report");


        doc.moveDown();


        doc
            .fontSize(11)
            .text(
                `Period: ${report.start.toLocaleDateString()} - ${report.end.toLocaleDateString()}`
            );


        doc.moveDown();


        doc.fontSize(12);

        doc.text(
            `Total Orders: ${report.totalOrders}`
        );

        doc.text(
            `Total Items Sold: ${report.totalItemsSold}`
        );

        doc.text(
            `Gross Sales: ₹${report.grossSales.toFixed(2)}`
        );

        doc.text(
            `Product Discount: ₹${report.productDiscount.toFixed(2)}`
        );

        doc.text(
            `Coupon Discount: ₹${report.couponDiscount.toFixed(2)}`
        );

        doc.text(
            `Total Discount: ₹${report.totalDiscount.toFixed(2)}`
        );

        doc.text(
            `Net Sales: ₹${report.netSales.toFixed(2)}`
        );


        doc.moveDown();


        doc.fontSize(10);


        for (const order of report.orders) {

            doc.text(
                `Order: ${order.orderId}`
            );

            doc.text(
                `Date: ${new Date(order.date).toLocaleDateString()}`
            );

            doc.text(
                `Items: ${order.items}`
            );

            doc.text(
                `Gross Sales: ₹${order.grossSales.toFixed(2)}`
            );

            doc.text(
                `Product Discount: ₹${order.productDiscount.toFixed(2)}`
            );

            doc.text(
                `Coupon Discount: ₹${order.couponDiscount.toFixed(2)}`
            );

            doc.text(
                `Total Discount: ₹${order.totalDiscount.toFixed(2)}`
            );

            doc.text(
                `Order Amount: ₹${order.orderAmount.toFixed(2)}`
            );

            doc.moveDown();
        }


        doc.end();


    } catch (error) {

        console.error(
            "PDF report error:",
            error
        );

        res.status(500).send(
            "Failed to generate PDF"
        );
    }
}

export const downloadSalesReportExcel = async (req, res) => {

    try {

        const {
            type = "daily",
            startDate = "",
            endDate = ""
        } = req.query;


        const report = await getSalesReport({
            type,
            startDate,
            endDate
        });


        const workbook =
            new ExcelJS.Workbook();


        const worksheet =
            workbook.addWorksheet(
                "Sales Report"
            );


        worksheet.columns = [

            {
                header: "Order ID",
                key: "orderId",
                width: 20
            },

            {
                header: "Date",
                key: "date",
                width: 15
            },

            {
                header: "Items",
                key: "items",
                width: 10
            },

            {
                header: "Gross Sales",
                key: "grossSales",
                width: 15
            },

            {
                header: "Product Discount",
                key: "productDiscount",
                width: 20
            },

            {
                header: "Coupon Discount",
                key: "couponDiscount",
                width: 20
            },

            {
                header: "Total Discount",
                key: "totalDiscount",
                width: 20
            },

            {
                header: "Order Amount",
                key: "orderAmount",
                width: 20
            }

        ];


        report.orders.forEach(order => {

            worksheet.addRow({

                orderId: order.orderId,

                date: new Date(
                    order.date
                ).toLocaleDateString(),

                items: order.items,

                grossSales:
                    order.grossSales,

                productDiscount:
                    order.productDiscount,

                couponDiscount:
                    order.couponDiscount,

                totalDiscount:
                    order.totalDiscount,

                orderAmount:
                    order.orderAmount
            });

        });


        worksheet.addRow({});


        worksheet.addRow({
            orderId: "SUMMARY"
        });


        worksheet.addRow({
            orderId: "Total Orders",
            items: report.totalOrders
        });


        worksheet.addRow({
            orderId: "Total Items Sold",
            items: report.totalItemsSold
        });


        worksheet.addRow({
            orderId: "Gross Sales",
            grossSales: report.grossSales
        });


        worksheet.addRow({
            orderId: "Product Discount",
            productDiscount:
                report.productDiscount
        });


        worksheet.addRow({
            orderId: "Coupon Discount",
            couponDiscount:
                report.couponDiscount
        });


        worksheet.addRow({
            orderId: "Total Discount",
            totalDiscount:
                report.totalDiscount
        });


        worksheet.addRow({
            orderId: "Net Sales",
            orderAmount:
                report.netSales
        });


        worksheet.getRow(1).font = {
            bold: true
        };


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );


        res.setHeader(
            "Content-Disposition",
            'attachment; filename="sales-report.xlsx"'
        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (error) {

        console.error(
            "Excel report error:",
            error
        );

        res.status(500).send(
            "Failed to generate Excel"
        );
    }
}

