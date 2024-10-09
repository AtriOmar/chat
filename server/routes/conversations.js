const router = require("express").Router();
const authenticateJwt = require("../authenticateJwt");
const conversationsController = require("../controllers/conversationsController");

// Matches with "/api/user"

router.use(authenticateJwt);

router.post("/create", conversationsController.create);

router.put("/rename", conversationsController.rename);

router.get("/getWithMessages", conversationsController.getWithMessages);

module.exports = router;
