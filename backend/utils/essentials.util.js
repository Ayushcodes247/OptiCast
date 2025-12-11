const crypto = require("crypto");

const pidGenerator = () => {
  const randomPart = crypto.randomBytes(4).toString("hex");
  const timestampPart = Date.now().toString(36);
  return `${timestampPart}${randomPart}`.toUpperCase();
};

const generatePassword = (lenght = 12) => {
  return crypto.randomBytes(lenght).toString("base64").slice(0, lenght);
};

module.exports = { pidGenerator, generatePassword };
