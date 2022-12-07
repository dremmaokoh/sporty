const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { passwordHash, passwordCompare } = require("../helper/hashing");
const axios = require ('axios')
const Sport = require("../models/models.user");
const { OTP, message } = require("../utils/message");
const { jwtSign } = require("../helper/jwt");
const {
  findUserByEmail,
  findUserByNumber,
} = require("../services/user.services");
let { PASSWORDS, EMAIL } = process.env;
const transporter = nodemailer.createTransport({
    service: process.env.MAIL,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });


  exports.signUp = async (req, res, next) => {
    try {
      const {
        username,
        email,
        password,
        confirmPassword,
        phoneNumber,
        interestField

      } = req.body;
  
      if (
        !username ||
        !email ||
        !password ||
        !confirmPassword ||
        !phoneNumber ||
        !interestField
      ) {
        return res.status(409).json({
          message: "Please Fill All Fields",
        });
      }
      if (password != confirmPassword) {
        return res.status(409).json({
          message: "The entered passwords do not match!",
        });
      }
  
      const isExisting = await findUserByEmail(email);
      if (isExisting) {
        return res.status(409).json({
          message: "Email Already existing",
        });
      }
      const sameNumber = await findUserByNumber(phoneNumber);
      if (sameNumber) {
        return res.status(409).json({
          message: "Phone Number Already existing",
        });
      }
      const hashedPassword = await passwordHash(password);
  
      const user = new Sport({
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        interestField,
        smstoken: OTP,
        isVerified: false,
      });
      const new_user = await user.save();

      
      const user_info = {
        message: "OTP code is sent to your phone number",
        new_user,
      };

       // Generate Otp, save and send to the user
      let userNumber = user.phoneNumber;
      const config = {
        method: "post",
        url: `https://account.kudisms.net/api/?username=${EMAIL}&password=${PASSWORDS}&message=${message}&sender=Bookie&mobiles=${userNumber}`,
        headers: {},
      };

      // fetch the kudisms 
      const resp = await axios(config);
    
     
      return res.status(201).json(user_info);
    } catch (error) {
      next(error);
    }
  };

  exports.verifyUser = async (req, res, next) => {
   
    try {
      const token = req.query.token;
      const user = await Sport.findOne({ smstoken: token });
      if (user) {
        user.smstoken = null;
        user.isVerified = true;
        await user.save();
        const user_info = {
          message: "Verfication Successful",
        };
        return res.status(201).json(user_info);
      }
      if (user.isVerified !== "false") {
        return res.status(401).json({ error: "User Already Verified" });
      } else {
        const no_verify = {
          message: "Verfication Not Successful",
        };
        return res.status(409).json(no_verify);
      }
    } catch (error) {
      next(error);
    }
  };

  exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(409).json({
          message: "Please Fill All Fields",
        });
      }
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(400).json({
          message: "Invalid Email",
        });
      }
      const isMatch = await passwordCompare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid Password",
        });
      }
  
      const payload = {
        id: user._id,
      };
  
      const token = jwtSign(payload);
      res.cookie("access_token", token);
      const dataInfo = {
        status: "success",
        message: "Login success",
        access_token: token,
      };
      return res.status(200).json(dataInfo);
    } catch (error) {
      next(error);
    }
  };

  exports.forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(409).json({
          message: "Input your email",
        });
      }
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(400).json({
          message: "Invalid Email",
        });
      }
  
      const secret = process.env.JWT_SECRET + user.password;
      const payload = {
        email: user.email,
        id: user._id,
      };
      const token = jwt.sign(payload, secret, { expiresIn: "15m" });
  
      await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Server is ready to rake our messages");
            resolve(success);
          }
        });
      });
      
      const mailOptions = {
        from: ' "Reset Password" <process.env.USER_MAIL>',
        to: user.email,
        subject: "Sporty - Reset your password",
        html: `<h2> ${user.username} ${user.phoneNumber}  </h2> 
                <h2> Thank you for using Sporty </h2> 
               <h4> Please click on the link to continue..... </h4>
               <a href="${process.env.CLIENT_URL}/api/v1/reset-password/${user._id}/${token}">Reset Your Password</a>`,
      };
  
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            reject(err);
          } else {
            console.log("Email Sent");
            resolve(info);
          }
        });
      });
      const user_info = {
        message: "Reset password link is sent to your email",
      };
      return res.status(201).json(user_info);
    } catch (error) {
      next(error);
    }
  };
  
  exports.resetPasswordpage = async (req, res, next) => {
    try {
      const { id, token } = req.params;
  
      const user = await Sport.findById({ _id: id });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const secret = process.env.JWT_SECRET + user.password;
      const payload = jwt.verify(token, secret);
      res.render("reset-password", { email: user.email });
    } catch (error) {
      next(error);
    }
  };
  
  exports.resetPassword = async (req, res, next) => {
    try {
      const { id, token } = req.params;
      const { password, confirmPassword } = req.body;
  
      const user = await Sport.findById({ _id: id });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const secret = process.env.JWT_SECRET + user.password;
      const payload = jwt.verify(token, secret);
      if (!payload) {
        throw new Error();
      }
      req.user = payload;
  
      if (!password || !confirmPassword) {
        return res.status(409).json({
          message: "Please Fill All Fields",
        });
      }
      if (password != confirmPassword) {
        return res.status(409).json({
          message: "The entered passwords do not match!",
        });
      }
      const hashedPassword = await passwordHash(password);
      if (user) {
        user.password = hashedPassword;
        await user.save();
        const user_info = {
          message: "Reset Password Successful",
        };
        return res.status(201).json(user_info);
      } else {
        const no_reset = {
          message: "Reset Password Not Successful",
        };
        return res.status(409).json(no_reset);
      }
    } catch (error) {
      next(error);
    }
  };

  exports.updateUser = async (req, res, next) => {
    const id = req.params.id;
    try {
      const { username, email } =
        req.body;
      const user_product = await Sport.findByIdAndUpdate(
        { _id: id },
        { ...req.body },
        {
          new: true,
        }
      );
      const user_update = {
        message: "Updated successfully",
        user_product,
      };
      return res.status(200).json(user_update);
    } catch (error) {
      next(error);
    }
  };

  exports.logOut = async (req, res) => {
    res.clearCookie("access_token");
    const logout = {
      message: "Logout Successful",
    };
    return res.status(201).json(logout);
  };