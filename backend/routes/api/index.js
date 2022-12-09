var router = require("express").Router();

router.use("/login", require("./login"));
router.use("/orders", require("./orders"));

module.exports = router;
