const getxTrack = require("./getxTrack");

module.exports = (userToken, userAgent, Referer = "https://discord.com/developers/applications") => ({
    accept: "*/*",
    authorization: `${userToken}`,
    Referer,
    "accept-language": "en-GB,en;q=0.9,ar;q=0.8,en-US;q=0.7",
    "content-type": "application/json",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Brave\";v=\"122\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    // Note: for bypass discord delete application after creation, the userAgent is required and the x-track and the user-agent must same in the x-track !!
    // ملاحظة: لتخطي حذف البوت من قبل الديسكورد بعد الانشاء , يجب ان يكون اليوزر اجينت وال اكس تراك متطابقين
    "x-track": getxTrack(userAgent),
    "User-Agent": userAgent
})