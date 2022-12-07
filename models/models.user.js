const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter a valid username"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please enter a valid phone number"],
    },
    email: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (value.toLowerCase().includes("pass")) {
          throw new Error("Passwords cannot contain 'pass'");
        }
      },
    },
    interestField: {
      type: String,
      required: [true, "Please enter a valid description "],
    },
    smstoken: {
      type: String,
    },

    isVerified: {
      type: String,
      enum: ["true", "false"],
      default: "false",
     },
    date: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sport", userSchema);
