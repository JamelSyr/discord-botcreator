const TokenCreateor = require("../src/creator");

(async () => {
    const creator = new TokenCreateor({
        tokens: [
            {
                token: "...",
                twoFactorKey: "111",
            },
            {
                token: "....",
                twoFactorKey: "",
                password: "111"
            }
        ],
        proxy: "", // the proxy to use - i use ipRoyal proxies
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.1 Safari/537.36",
        enableIntents: true,
        nameFormat: "jamil_{0}",
    }, true);

    var startedAt = Date.now();
    creator.on("tokenCreated", data => {
        // for example save the token in database
    });
    creator.on("tokenInvalid", tokenData => {
        // the user token is invalid - maybe the twofactor key is wrong or the password is wrong or the user banned
    });

    await creator.start({
        loopCount: 20, // the count of the tokens to create
        pathToSaveTokens: `./test.js`, // if you want to save the tokens in file
        loopWait: 1000 * 10, // by default is 1000*10 ms
    });
    console.log(`Time elapsed: ${Date.now() - startedAt}ms`);
})();