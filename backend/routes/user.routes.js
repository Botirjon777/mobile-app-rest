const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public
router.post("/signup", userController.signup);
router.post("/signin", userController.signin);

// Protected
router.get("/getUser", authMiddleware, userController.getUser);
router.get("/getAllUsers", authMiddleware, userController.getAllUsers);
router.get("/bulk", authMiddleware, userController.bulkSearch);
router.get("/otherusers", authMiddleware, userController.getOtherUsers);

module.exports = router;
