

<div align="center">

### discordbot-tools

  <p align="center">
A simple and easy package to create and manage Discord bots using user accounts' tokens and the Discord API    <br />
    <br />
    <a href="https://github.com/johnathandavis/discordbot-tools/issues/new?labels=bug">Report Bug</a> |  <a href="https://github.com/johnathandavis/discordbot-tools/issues/new?labels=enhancement">Request Feature</a>
  </p>

  <p>
 <a href="https://github.com/JamelSyr"><img src="https://img.shields.io/static/v1?label=powered%20by&message=Jamil&color=000636&style=for-the-badge&logo=Windows%20Terminal&logoColor=fff"/></a>
 <a href="https://www.npmjs.com/package/discordbot-tools"><img src="https://img.shields.io/npm/v/discordbot-tools.svg?style=for-the-badge" alt="NPM version" /></a>
 <a href="https://www.npmjs.com/package/discordbot-tools"><img src="https://img.shields.io/npm/dt/discordbot-tools.svg?maxAge=3600&style=for-the-badge" alt="NPM downloads" /></a>
  </p>
  
</div>

<h2>Installation</h2>

### Install **[discordbot-tools](https://npmjs.com/package/discordbot-tools)**

```sh
npm i discordbot-tools
```

<h1>Features</h1>

- Simple & easy to use 🎗️
- Event-based system 📡
- Bypass Discord's deletion of the bot after creation and ratelimits 🚀
- Automatically get 2FA code if enabled in the user account 📟
- Create bots using user account tokens 🤖
- Custom name format for the bots 📝
- Save tokens to a file 📁
- Proxy support 🛡️

<h2>Getting Started</h2>

#### At first install the [discordbot-tools](https://npmjs.com/discordbot-tools) package

1. <h4>Create bulk bots using user accounts tokens</h4>

```js
const TokenCreateor = require("discordbot-tools");
(async () => {
    const creator = new TokenCreateor({
        tokens: [ // the array of the user accounts tokens
            {
            /* [IMPORTANT] */
            // If the user account doesn't have 2FA enabled, you need to add the password.
            // If 2FA is enabled, you can add only the twoFactorKey.

                token: "user account token",
                twoFactorKey: "", // if the user account has 2FA enabled - add the key here
                password: "", // if there are no 2FA enabled !
            },

            // token with 2FA enabled
            {
                token: "user account token",
                twoFactorKey: "2FA key",
            },
            // token without 2FA
            {
                token: "user account token",
                password: "user account password",
            }
        ],
        proxy: "", // the proxy to use - i use ipRoyal proxies
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.1 Safari/537.36", // the user agent to use - important to bypass discord security
        enableIntents: true, // enable the intents - by default is true
        nameFormat: "jamil_{0}", // the name format of the bots - {0} will be replaced with a random number between 1 and 9999
    }, true);

    var startedAt = Date.now();
    creator.on("tokenCreated", data => {
        // the token is created - you can do anything with the token
        // for example save the token in database
    });
    creator.on("tokenInvalid", tokenData => {
        // the user token is invalid - maybe the twofactor key is wrong or the password is wrong or the user banned
    });

    await creator.start({
        loopCount: 20, // the count of the tokens to create, for example if you have 10 tokens and you want to create 100 bots you need to set this to 100, it will loop over the 10 tokens and create 100 bots
        pathToSaveTokens: `./test.js`, // if you want to save the tokens in file
        loopWait: 1000 * 10, // by default is 1000*10 ms - the time to wait between each loop
    });
    console.log(`Time elapsed: ${Date.now() - startedAt}ms`);
})();
```

2. <h4>Change and manage a single bot</h4>

```js
const TokenCreateor = require("discordbot-tools");
(async () => {
    const createor = new TokenCreateor({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.1 Safari/537.36",
    });
    const userData = {
        token: "",
        twoFactorKey: "",
        password: "" // if there are no 2FA enabled !
    } // the owner of the bot id you want to manage
    const botID = "bot_id"; // the bot id you want to manage
    createor.setSelectedToken(userData); // set the user data (IMPORTANT)

    // get bot data
    var bot = await createor.performApplicationAction({ botID, type: "get" });
    console.log(bot);

    // enable intents for the bot
    await createor.enableIntents(botID);

    // reset the bot token
    var token = await createor.getBotToken(botID);
    console.log(token);

    // delete the bot
    await createor.performApplicationAction({ botID, type: "delete" });
})()
```

## Documentation

<h4>Note: If you are using the methods without the `start()` method, you need to set the user data using the `setSelectedToken(userData)` method before using the methods! The `userData` object is the user account data that owns the bot you want to manage.</h4>

- `userData` object =>

```json
{
    "token": "", // the user account token
    "twoFactorKey": "", // if the user account has 2FA enabled - add the key here
    "password": "", // if there are no 2FA enabled !
}
```

<p>
If the user account doesn't have 2FA enabled, you need to add the password. <br>
If 2FA is enabled, you can add only the twoFactorKey. <br>
The 2FA key is the key you get from Discord when you enable 2FA in the user account. <br>
Example of 2FA key:
 <br><br>

<img src="https://i.imgur.com/6nKiQAl.png" width="400px" height="auto">

</p>

---

- example of the created bot object =>

```json
{
   "token": "botToken",
   "botID": "id of the bot",
   "name": "name of the bot",
   "userToken": "the user token who created the bot",
   "haveTwoFactor": false // if the user account have 2FA enabled this will be true
}
``` 

----


- `start({ pathToSaveTokens, loopCount, loopWait })` method - to create the bots using accounts tokens
    - `pathToSaveTokens` - if you want to save the tokens in file after creating the bots add the path here - not required
    - `loopCount` - the count of the tokens to create - for example if you have 10 tokens and you want to create 100 bots you need to set this to 100, it will loop over the 10 tokens and create 100 bots
    - `loopWait` - the time to wait between each loop - by default is 10sec / 1000*10 ms
- `performApplicationAction({ botID, type })` method - to perform an action on the bot
    - `botID` - the bot id you want to manage - not required if the action type is `create`
    - `type` - the action type 
      - `get` to get the bot data, 
      - `delete` to delete the bot, 
      - `create` to create a bot **You can use it only in start() method**

- `enableIntents(botID)` method - to enable intents for the bot
    - `botID` - the bot id you want to enable intents for

- `getBotToken(botID)` method - to get the bot token or reset it
    - `botID` - the bot id you want to get the token for

- `setSelectedToken(userData)` method - to set the user data (only use if you are not used start() method)
    - `userData` - the user data object
- `on("tokenCreated", data => {})` event - to listen to the token created event it will work when the bot is created and only work if you are using the start() method
    - `data` the created bot object

- `on("tokenInvalid", tokenData => {})` event - to listen to the token invalid event it will work when the user token is invalid and only work if you are using the start() method
    - `tokenData` the user data object
    
<h2>Contributing</h2>

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

<h2>License</h2>  

[MIT](https://choosealicense.com/licenses/mit/)

## Contact

- Email: <a href="mailto:mojamilchch@gmail.com"> mojamilchch@gmail.com </a>
- [Instagram - @jamil_syrr](https://www.instagram.com/jamil_syrr/)
- [Github](https://github.com/JamelSyr)
- Discord: **6qm**

<br><br>

## Thank you for using discordbot-tools 🎉

<a href="https://www.buymeacoffee.com/jamill"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=jamill&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>