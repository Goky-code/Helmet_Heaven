import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as salesReportController from "../controllers/salesReportController.js";
import {noCache,preventLogin,isAdminAuth } from "../middlewares/adminAuth.js"


    const router=express.Router()

router.get(
    "/salesReport",
    noCache,
    isAdminAuth,
    salesReportController.loadSalesReport
)
router.get("/adminDashboard",
    noCache,
    isAdminAuth,
    adminController.getDashboard
);

router.get(
  "/sales-report/download/excel",
  noCache,
  isAdminAuth,
  salesReportController.downloadSalesReportExcel
);


router.get(
  "/sales-report/download/pdf",
  noCache,
  isAdminAuth,
  salesReportController.downloadSalesReportPDF
);

export default router