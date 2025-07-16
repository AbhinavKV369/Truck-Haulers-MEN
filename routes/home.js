const express = require("express");

const {
  handleGetHome,
  handleGetProducts,
  handleGetProductDetails,
  handleGetBuses,
  handleGetTrucks,
  handleGetLightVehicles,
  handleGetMediumVehicles,
  handleGetContact,
  handleGetService,
  handleGetAbout,
  handleGetServerError,
} = require("../controllers/home");

const router = express.Router();

router.get("/", handleGetHome);
router.get("/products", handleGetProducts);
router.get("/view-product/:id", handleGetProductDetails);
router.get("/buses", handleGetBuses); 
router.get("/trucks", handleGetTrucks);
router.get("/light-vehicles", handleGetLightVehicles);
router.get("/medium-vehicles", handleGetMediumVehicles);
router.get("/contact", handleGetContact);
router.get("/services", handleGetService);
router.get("/about", handleGetAbout);
router.get("/server-error", handleGetServerError);

module.exports = router;
