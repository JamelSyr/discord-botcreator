const TokenCreateor = require("../creator");

(async () => {
    const createor = new TokenCreateor({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.1 Safari/537.36",
    });
    const userData = {
        token: "",
        twoFactorKey: "",
        password: ""
    }
    const botID = "bot id";

    createor.setSelectedToken(userData);

    // get bot data
    var bot = await createor.performApplicationAction({ botID, type: "get" });
    console.log(bot);

    // delete the bot
    await createor.performApplicationAction({ botID, type: "delete" });

    // enable intents for the bot
    await createor.enableIntents(botID);

    // reset the bot token
    var token = await createor.getBotToken(botID);
    console.log(token);

    // 
    

})()