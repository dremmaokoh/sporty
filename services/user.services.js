const Sport = require("../models/models.user");

exports.findUserByEmail = async (email) => {
  const user = await Sport.findOne({
    email,
  });
  if (!user) {
    return false;
  }
  return user;
};

exports.findUserByNumber = async (phoneNumber) => {
  const user = await Sport.findOne({
    phoneNumber,
  });
  if (!user) {
    return false;
  }
  return user;
};
