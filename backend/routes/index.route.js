const express = require("express");
const router = express.Router();
const google = require("./google/index.route");
const user = require("./user/index.route");

router.use("/google", google);
router.use("/users", user);

module.exports = router;