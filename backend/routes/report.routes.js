const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");

router.get("/dashboard", reportController.getDashboardReport);

module.exports = router;
