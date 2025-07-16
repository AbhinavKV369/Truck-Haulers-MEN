const bcrypt = require("bcryptjs");

async function hashTheValue(value, salt) {
    const result = await bcrypt.hash(value, salt); 
    return result;
}

async function compareTheValue(plain, hashed) {
    const result = await bcrypt.compare(plain, hashed); 
    return result;
}

module.exports = {
    hashTheValue,
    compareTheValue
}
