const router = require("express").Router();
const {
  signUp,
  loginUser,
  verifyUser,
  forgotPassword,
  resetPassword,
  resetPasswordpage,
  updateUser,
  logOut
} = require("../controller/controller.user");
const { isAuth, validateVerified } = require("../middleware/isAuth");

router.post("/register", signUp);
router.post("/login", validateVerified, loginUser);
router.get("/verify-user", verifyUser);
router.post("/forgotpassword", validateVerified, forgotPassword);
router.get("/reset-password/:id/:token", resetPasswordpage);
router.post("/reset-password/:id/:token", resetPassword);
router.put("/update/:id", isAuth,  updateUser);
router.get("/logout", isAuth, logOut);

module.exports = router;
