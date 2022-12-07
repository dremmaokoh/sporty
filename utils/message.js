const otpGenerator = require("otp-generator");

const OTP = otpGenerator.generate(5,{
    upperCaseAlphabets: false,
  specialChars: false,
  lowerCaseAlphabets: false,
});

let message = `Thanks for signing up, your pass is ${OTP}`;


module.exports = {OTP,message};