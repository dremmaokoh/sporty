const jwt = require("jsonwebtoken");
const Sport = require("../models/models.user");
const dotenv = require("dotenv");
dotenv.config();
const { JWT_SECRET } = process.env;
const mongoose = require("mongoose");

exports.isAuth = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please log in to continue" });
    }

    const decoded = await jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      throw new Error();
    }
    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json(`signUp as user || Token expired  \n ${e}`);
  }
};


exports.validateVerified = async (req, res, next) => {
  try {
    const user = await Sport.findOne({ email: req.body.email });
    console.log(user.isVerified);

    if (user.isVerified) {
      next();
    } else {
      return res
        .status(401)
        .json({ error: "Please check your email to verify account" });
    }
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
};


