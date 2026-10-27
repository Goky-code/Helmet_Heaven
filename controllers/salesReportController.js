import * as salesReportService from "../services/admin/salesReportService.js"
import HTTP_STATUS from "../utils/httpStatus.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export const loadSalesReport=async(req,res)=>{
    try{
        const {
            type="daily",
            startDate="",
            endDate="",
            search = ""
        }=req.query
    

    const report=await salesReportService.getSalesReport({
        type,
        startDate,
        endDate,
        search
    })

    res.render('admin/salesReport',{
       sales:report.orders,
       period:type,
       startDate:report.start,
       endDate:report.end,
       totalRevenue:report.netSales,
       totalOrders:report.totalOrders,
       totalDiscount:report.totalDiscount,
       currentPage:1,
       totalPage:1,
       totalRecords:report.orders.length,
       limit:report.orders.length||10,
       search

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
            endDate = "",
            search = ""
        } = req.query;


        const report = await salesReportService. getSalesReport({
            type,
            startDate,
            endDate,
            search
        })

   const doc = new PDFDocument({
            size: "A4",
            layout: "landscape",
            margins: {
                top: 30,
                bottom: 30,
                left: 32,
                right: 32
            },
            bufferPages: true
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="sales-report.pdf"'
        );

        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 32;
        const contentWidth = pageWidth - margin * 2;

        const purple = "#7955E8";
        const lightBackground = "#F5F5F9";
        const borderColor = "#DDDEE5";
        const textColor = "#292936";
        const mutedColor = "#666675";

        const money = (amount) =>
            `INR ${Number(amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

        const formatDate = (date) => {
            const d = new Date(date);

            return Number.isNaN(d.getTime())
                ? "N/A"
                : d.toLocaleDateString("en-GB");
        };

        const periodLabels = {
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            yearly: "Yearly",
            custom: "Custom Date Range"
        };

      
        doc.fillColor(purple)
            .font("Helvetica-Bold")
            .fontSize(25)
            .text("HELMET HEAVEN", margin, 30);

        doc.fillColor(textColor)
            .font("Helvetica")
            .fontSize(9)
            .text("E-Commerce Portal", margin, 60);

        doc.text("Sales Report", margin, 73);

        doc.fillColor(purple)
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("SALES REPORT", margin, 35, {
                width: contentWidth,
                align: "right"
            });

        doc.fillColor(mutedColor)
            .font("Helvetica")
            .fontSize(9)
            .text(
                `Period: ${formatDate(report.start)} - ${formatDate(report.end)}`,
                margin,
                63,
                {
                    width: contentWidth,
                    align: "right"
                }
            );

        doc.text(
            `Report Type: ${periodLabels[type] || type}`,
            margin,
            76,
            {
                width: contentWidth,
                align: "right"
            }
        );

        doc.moveTo(margin, 98)
            .lineTo(pageWidth - margin, 98)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        
        const cardY = 112;
        const cardHeight = 64;
        const cardGap = 14;
        const cardWidth = (contentWidth - cardGap * 2) / 3;

        const drawCard = (x, label, value) => {
            doc.roundedRect(
                x,
                cardY,
                cardWidth,
                cardHeight,
                7
            )
                .fillColor(lightBackground)
                .fill();

            doc.fillColor(mutedColor)
                .font("Helvetica-Bold")
                .fontSize(9)
                .text(label.toUpperCase(), x + 12, cardY + 12);

            doc.fillColor(purple)
                .font("Helvetica-Bold")
                .fontSize(15)
                .text(String(value), x + 12, cardY + 32, {
                    width: cardWidth - 24,
                    ellipsis: true
                });
        };

        drawCard(
            margin,
            "Total Revenue",
            money(report.netSales)
        );

        drawCard(
            margin + cardWidth + cardGap,
            "Total Orders",
            report.totalOrders
        );

        drawCard(
            margin + (cardWidth + cardGap) * 2,
            "Total Discount",
            money(report.totalDiscount)
        );

        
        let y = cardY + cardHeight + 15;

        doc.fillColor(textColor)
            .font("Helvetica")
            .fontSize(9)
            .text(
                `Items Sold: ${report.totalItemsSold}`,
                margin,
                y
            );

        doc.text(
            `Gross Sales: ${money(report.grossSales)}`,
            margin + 180,
            y
        );

        doc.text(
            `Product Discount: ${money(report.productDiscount)}`,
            margin + 390,
            y
        );

        doc.text(
            `Coupon Discount: ${money(report.couponDiscount)}`,
            margin + 590,
            y
        );

        y += 24;

        
        const columns = [
            { label: "SL", width: 30 },
            { label: "Order ID", width: 110 },
            { label: "Product Name", width: 185 },
            { label: "Qty", width: 48 },
            { label: "Price", width: 90 },
            { label: "Discounted", width: 90 },
            { label: "Payment", width: 105 },
            { label: "Date", width: 90 }
        ];

        const tableWidth = columns.reduce(
            (total, column) => total + column.width,
            0
        );

        const drawTableHeader = () => {
            doc.rect(margin, y, tableWidth, 25)
                .fillColor(purple)
                .fill();

            let x = margin;

            columns.forEach((column) => {
                doc.fillColor("#FFFFFF")
                    .font("Helvetica-Bold")
                    .fontSize(8)
                    .text(
                        column.label,
                        x + 5,
                        y + 8,
                        {
                            width: column.width - 10,
                            lineBreak: false
                        }
                    );

                x += column.width;
            });

            y += 25;
        };

        drawTableHeader();

        if (!report.orders.length) {
            doc.fillColor(textColor)
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "No sales found for the selected period.",
                    margin + 10,
                    y + 18
                );
        } else {
            report.orders.forEach((sale, index) => {
                const productName = String(
                    sale.productName || "Unknown Product"
                );

                const rowHeight = Math.max(
                    27,
                    doc.heightOfString(productName, {
                        width: columns[2].width - 10,
                        font: "Helvetica",
                        fontSize: 8
                    }) + 12
                );

               
                if (y + rowHeight > pageHeight - 35) {
                    doc.addPage();
                    y = 35;
                    drawTableHeader();
                }

                if (index % 2 === 0) {
                    doc.rect(margin, y, tableWidth, rowHeight)
                        .fillColor("#F4F4F6")
                        .fill();
                }

                doc.rect(margin, y, tableWidth, rowHeight)
                    .strokeColor(borderColor)
                    .lineWidth(0.4)
                    .stroke();

                const values = [
                    String(index + 1),
                    String(sale.orderId || "N/A"),
                    productName,
                    String(sale.quantity || 0),
                    money(sale.price),
                    money(
                        Number(sale.price || 0) -
                        Number(sale.discount || 0)
                    ),
                    String(sale.paymentMethod || "N/A"),
                    formatDate(sale.date)
                ];

                let x = margin;

                values.forEach((value, columnIndex) => {
                    const column = columns[columnIndex];

                    doc.fillColor(textColor)
                        .font("Helvetica")
                        .fontSize(8)
                        .text(
                            value,
                            x + 5,
                            y + 7,
                            {
                                width: column.width - 10,
                                height: rowHeight - 8,
                                lineBreak: true,
                                ellipsis: true
                            }
                        );

                    x += column.width;
                });

                y += rowHeight;
            });
        }

       
        const range = doc.bufferedPageRange();

        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(range.start + i);

            doc.fillColor(mutedColor)
                .font("Helvetica")
                .fontSize(8)
                .text(
                    `Helmet Heaven | Sales Report | Page ${i + 1} of ${range.count}`,
                    margin,
                    pageHeight - 22,
                    {
                        width: contentWidth,
                        align: "center"
                    }
                );
        }

        doc.end();
    } catch (error) {
        console.error("PDF report error:", error);

        if (!res.headersSent) {
            res.status(500).send("Failed to generate PDF");
        }
    }
}

export const downloadSalesReportExcel = async (req, res) => {

    try {

        const {
            type = "daily",
            startDate = "",
            endDate = "",
             search = ""
        } = req.query;


        const report = await salesReportService.getSalesReport({
            type,
            startDate,
            endDate,
            search
        });


        const workbook =
            new ExcelJS.Workbook();


         workbook.creator = "Helmet Heaven";
        workbook.subject = "Sales Report";
        workbook.title = "Helmet Heaven Sales Report";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Sales Report", {
            views: [{ state: "frozen", ySplit: 6 }]
        });

        
        worksheet.columns = [
            { key: "sl", width: 7 },
            { key: "orderId", width: 23 },
            { key: "productName", width: 30 },
            { key: "quantity", width: 12 },
            { key: "price", width: 16 },
            { key: "discounted", width: 17 },
            { key: "paymentMethod", width: 20 },
            { key: "date", width: 16 }
        ];

        const moneyFormat = '"₹"#,##0.00';
        const dateFormat = "dd/mm/yyyy";

        const formatDate = (date) => {
            const d = new Date(date);
            return Number.isNaN(d.getTime()) ? "N/A" : d;
        };

        const periodLabels = {
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            yearly: "Yearly",
            custom: "Custom Date Range"
        };

        const formatPeriodDate = (date) =>
            formatDate(date) instanceof Date
                ? formatDate(date).toLocaleDateString("en-GB")
                : "N/A";

       
        worksheet.mergeCells("A1:H1");
        worksheet.getCell("A1").value =
            "Helmet Heaven - Sales Report";

        worksheet.getCell("A1").font = {
            name: "Arial",
            size: 16,
            bold: true
        };
        worksheet.getCell("A1").alignment = {
            horizontal: "center",
            vertical: "middle"
        };
        worksheet.getRow(1).height = 27;

      
        worksheet.mergeCells("A2:H2");
        worksheet.getCell("A2").value =
            `Report Period: ${formatPeriodDate(report.start)} → ` +
            `${formatPeriodDate(report.end)} (${periodLabels[type] || type})`;

        worksheet.getCell("A2").font = {
            size: 11,
            bold: true
        };
        worksheet.getCell("A2").alignment = {
            horizontal: "center",
            vertical: "middle"
        };

       
        worksheet.getCell("A4").value = "Total Revenue";
        worksheet.getCell("B4").value = report.netSales;

        worksheet.mergeCells("D4:E4");
        worksheet.getCell("D4").value = "Total Orders";
        worksheet.getCell("F4").value = report.totalOrders;

        worksheet.getCell("G4").value = "Total Discount";
        worksheet.getCell("H4").value = report.totalDiscount;

        ["A4", "D4", "G4"].forEach((cell) => {
            worksheet.getCell(cell).font = { bold: true };
        });

        ["B4", "H4"].forEach((cell) => {
            worksheet.getCell(cell).numFmt = moneyFormat;
            worksheet.getCell(cell).font = { bold: true };
        });

        worksheet.getCell("F4").font = { bold: true };

       
        const headerRow = worksheet.getRow(6);

        headerRow.values = [
            "SL",
            "Order ID",
            "Product Name",
            "Quantity",
            "Price",
            "Discounted",
            "Payment Method",
            "Date"
        ];

        headerRow.height = 23;
        headerRow.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 10
        };
        headerRow.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF7955E8" }
            };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            };
        });

        
        report.orders.forEach((sale, index) => {
            const row = worksheet.addRow({
                sl: index + 1,
                orderId: sale.orderId || "N/A",
                productName: sale.productName || "Unknown Product",
                quantity: Number(sale.quantity) || 0,
                price: Number(sale.price) || 0,
                discounted:
                    (Number(sale.price) || 0) -
                    (Number(sale.discount) || 0),
                paymentMethod: sale.paymentMethod || "N/A",
                date: formatDate(sale.date)
            });

            row.alignment = {
                vertical: "middle"
            };

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin", color: { argb: "FFD0D0D0" } },
                    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
                    left: { style: "thin", color: { argb: "FFD0D0D0" } },
                    right: { style: "thin", color: { argb: "FFD0D0D0" } }
                };
            });

            row.getCell(1).alignment = { horizontal: "center" };
            row.getCell(4).alignment = { horizontal: "center" };
            row.getCell(5).numFmt = moneyFormat;
            row.getCell(6).numFmt = moneyFormat;
            row.getCell(8).numFmt = dateFormat;
        });

        
        worksheet.autoFilter = {
            from: "A6",
            to: "H6"
        };

        
        const filename = `sales-report-${type}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Excel report error:", error);

        if (!res.headersSent) {
            res.status(500).send("Failed to generate Excel report");
        }
    }
}