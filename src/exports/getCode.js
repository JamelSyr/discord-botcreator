const speakeasy = require('speakeasy');
const getCode = (secret) => {
    if (!secret) return console.log("Secret is required");
    const totpCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
    });
    return totpCode;
}
module.exports = getCode;