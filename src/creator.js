
const fs = require("fs");
const fetch = require("node-fetch");
const getCode = require("./exports/getCode");
const EventEmitter = require("events");
const getRequestHeaders = require("./exports/getRequestHeaders");

const SocksProxyAgent = require("socks-proxy-agent").SocksProxyAgent;
const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


/**
 * @extends EventEmitter
 * @typedef {Object} TokenCreateorOptions
 */
class TokenCreateor extends EventEmitter {
    /**
     * Discord Bot Token Creator :)
     * @param {Object} options the options for the creator
     * @param {String} options.tokens the tokens for the user accounts
     * @param {String} options.userAgent the user agent for the requests
     * @param {String} options.proxy the proxy for the requests
     * @param {String} options.nameFormat the name format for the bots
     * @param {Boolean} options.enableIntents if the intents should be enabled or not
     * @param {Boolean} showLogs if the logs should be shown or not
     */
    constructor({ tokens, userAgent, proxy, nameFormat = "jamil_{0}", enableIntents = true }, showLogs = true) {
        super();

        if (!Array.isArray(tokens)) throw new Error("tokens must be an array");
        if (!tokens.every(token => typeof token == "object")) throw new Error("tokens must be an array of object");
        if (!tokens?.length) throw new Error("tokens must not be empty");

        this._tokens = tokens;

        if (proxy) {
            if (typeof proxy !== "string") throw new Error("proxy must be a string");
            if (["socks5", "http"].every(p => !proxy.startsWith(p))) throw new Error("proxy must be a [socks5|http] proxy");
            this.proxy = proxy;
        }

        this.options = {
            enableIntents,
            nameFormat
        }

        this.rateLimit = 1;
        this.userAgent = userAgent;
        this.invalidTokens = [];
        this.showLogs = showLogs;

        this.selectedUserToken = {};
    }
    /**
    * @returns {Array[]} the tokens for user accounts without the invalid tokens
    */
    get tokens() {
        return this._tokens.filter(token => !this.invalidTokens.includes(token?.token));
    }

    /**
    * 
    * @param {String} userAgent user agent for the requests
    * @returns {TokenCreateor}
    */
    setUserAgent(userAgent) {
        if (typeof userAgent !== "string") throw new Error("userAgent must be a string");
        this.userAgent = userAgent;
        return this;
    }

    /**
     * 
     * @param {Object} tokenObject the object of the user token data
     * @returns {TokenCreateor}
     */
    setSelectedToken(tokenObject) {
        this.selectedUserToken = tokenObject;
        return this;
    }

    /**
     * 
     * @param {Object} options the options for the request headers
     * @param {Object} options.body the body for request (Body must be a object)
     * @param {("get"|"post"|"delete"|"patch")} options.method the method for the request (default is "post") [post|get|put|delete]
     */
    getRequestOptions = ({ body = null, method = "post" }) => ({
        mode: "cors",
        credentials: "include",
        agent: this.proxy ? this.proxy.startsWith("socks5") ? new SocksProxyAgent(this.proxy) : new HttpsProxyAgent(this.proxy) : undefined,
        method,
        body: JSON.stringify(body),
        headers: getRequestHeaders(this.selectedUserToken?.token, this.userAgent),
    })

    /**
     * 
     * @param {String} url url to send the request to
     * @param {Object} options request options
     * @param {Boolean} returnJson if the response should be json or not
     * @returns {Object|Response} the response of the request
     * @private
     */
    async sendRequest(url, options, returnJson = true) {
        const res = await fetch(url, options).catch(() => null);
        if (!res) return;

        if (res?.status && 429 == res?.status) {
            this.showLogs && console.warn(`[Rate Limit]: waiting for (${this.rateLimit * 2}) Minute`);
            await sleep(1000 * 60 * (this.rateLimit * 2));
            this.rateLimit + 1 > 60 ? this.rateLimit = this.rateLimit / 2 : this.rateLimit++;
            return await this.sendRequest(url, options, returnJson);
        }
        if (res?.status && 403 == res?.status) return 0;
        if (returnJson) return await res.json().catch(() => null);
        return res;
    }

    /**
     * To skip towfactor operations like create new bot or delete bot
     * @returns {Boolean|Object|Response}
     * @private
     */
    async twoFactorOperation(url, { body, method = "post" }) {
        var response = await this.sendRequest(url, this.getRequestOptions({ body, method }), false);
        if (!response) return { error: true };

        var json = await response.json();
        if (json?.code != 60003) {
            response.json = () => json;
            return [200, 204].includes(response?.status) ? { data: json, skip2Fa: true } : response;
        }

        const { ticket, methods } = json?.mfa || {};
        if (!ticket || !methods?.length) return { error: true };

        const isTotp = methods[0].type === "totp";
        const data = isTotp ? getCode(this.selectedUserToken?.twoFactorKey) : this.selectedUserToken?.password;
        if (!data) {
            this.invalidTokens.push(this.selectedUserToken?.token);
            this.emit("tokenInvalid", this.selectedUserToken);
            return { error: true };
        }
        const mfaType = isTotp ? "totp" : "password";
        const mfaFinishUrl = "https://discord.com/api/v9/mfa/finish";
        const requestOptions = this.getRequestOptions({ body: { data, mfa_type: mfaType, ticket } });

        const lastResponse = await this.sendRequest(mfaFinishUrl, requestOptions, false);
        const json2 = await lastResponse.json().catch(() => ({}));

        if (json2?.code === 60008 && !isTotp) {
            this.invalidTokens.push(this.selectedUserToken?.token);
            this.emit("tokenInvalid", this.selectedUserToken);
            return { error: true };
        }

        return {
            data: json2,
            response: lastResponse,
            cookie: lastResponse.headers.get("set-cookie")
        };
    }

    /**
     * To Reset|Get the bot token
     * @param {String} botID id of the bot|created bot
     * @returns {Promise<String>} the bot token
     */
    async getBotToken(botID) {
        var { cookie, error, data, skip2Fa } = await this.twoFactorOperation(`https://discord.com/api/v9/applications/${botID}/bot/reset`, {
            body: null,
            method: "post"
        });
        if (error || !cookie && !skip2Fa) return;

        if (cookie && !skip2Fa) {
            var reqOptions = this.getRequestOptions({ method: "post" });
            reqOptions.headers["Cookie"] = cookie;

            var json = await this.sendRequest(`https://discord.com/api/v9/applications/${botID}/bot/reset`, reqOptions, true);
            if (!json || !json?.token) return;
            return json?.token;
        }
        return data?.token;
    }

    /**
     * 
     * @param {Object} applicationObject the object of the application
     * @param {String} applicationObject.botID the bot id
     * @param {String} applicationObject.name the bot name
     * @param {("create"|"get"|"delete")} applicationObject.type - The action type (create, get, or delete).
     */
    async performApplicationAction({ botID, name, type = "create" }) {
        if (type == "create" && !name) name = this.options.nameFormat.replace("{0}", generateRandomNumber(1000, 9999));
        if (["delete", "get"].includes(type) && !botID) throw new Error("botID is required for delete or get action");
        if (["create", "get", "delete"].every(t => t !== type)) throw new Error("type must be [create|get|delete]");

        var reqOptions = this.getRequestOptions({
            body: type == "create" ? { name, team_id: null } : null,
            method: type == "get" ? "get" : "post"
        });

        var url = `https://discord.com/api/v9/applications${type == "delete" ? `/${botID}/delete` : type == "get" ? `/${botID}` : ""}`;
        var res = type != "delete" ? await this.sendRequest(url, reqOptions, type != "delete") : this.twoFactorOperation(url);
        if (type == "delete" ? res?.error : !res) return;

        if (type == "create" && !res?.id) {
            this.invalidTokens.push(this.selectedUserToken?.token);
            this.emit("tokenInvalid", this.selectedUserToken);
            this.showLogs && console.warn(`[Invalid Token]: ${this.selectedUserToken?.token}`);
            return;
        }

        if (type == "delete") {
            var { cookie, skip2Fa } = res || {};
            if (skip2Fa) {
                this.showLogs && console.log(`[Bot Deleted]: ${botID}`);
                // return this.emit("botDeleted", botID);
                return;
            }
            if (!cookie) return;
            reqOptions.headers["Cookie"] = cookie;
            res = await this.sendRequest(url, reqOptions, false);
            if (res?.status == 204) {
                this.showLogs && console.log(`[Bot Deleted]: ${botID}`);
                // return this.emit("botDeleted", botID);
                return;
            } else {
                this.showLogs && console.warn(`[Failed to delete bot]: ${botID}`);
                return;
            }
        }
        if (type == "create") res["name"] = name;
        return res;
    }

    /**
     * 
     * @param {String} botID the bot id
     * @returns {Promise<Boolean>}
     */
    async enableIntents(botID) {
        if (!botID) throw new Error("botID is required");
        if (!this.options.enableIntents) return;

        var reqOptions = this.getRequestOptions({
            body: {
                bot_public: true,
                bot_require_code_grant: false,
                flags: 565248
            }, method: "patch"
        });

        let res2 = await this.sendRequest(`https://discord.com/api/v9/applications/${botID}`, reqOptions, false);
        if (res2?.status != 200) {
            this.showLogs && console.warn(`[Warning]: failed to enable intents for bot ${botID}`);
            return false;
        }
        return true;
    }

    async start({ pathToSaveTokens, loopCount, loopWait = 1000 * 10 }) {
        if (!this.userAgent) throw new Error("userAgent must be set first use setUserAgent(userAgent) method to set the userAgent first");
        if (!this.tokens?.length) throw new Error("tokens must not be empty, set the tokens first");

        if (isNaN(loopCount)) throw new Error("loopCount must be set");
        if (isNaN(loopWait)) throw new Error("loopWait must be set");

        if (1000 > loopWait) throw new Error("loopWait must be at least [1 seconds - 1000ms]");
        if (!this.options.nameFormat.includes("{0}")) throw new Error("nameFormat must include {0}");

        if (pathToSaveTokens) {
            if (!fs.existsSync(pathToSaveTokens)) throw new Error("path for save tokens must be a valid path");
            if (!["json", "js"].includes(pathToSaveTokens.split(".").pop())) throw new Error("path for save tokens must be a json or js file");
            if (fs.lstatSync(pathToSaveTokens).isDirectory()) throw new Error("path for save tokens must be a file not a directory");
        }
        if (!pathToSaveTokens) console.warn("[Warning]: pathToSaveTokens is not set, the tokens will not be saved to a file\nTo ensure that tokens are not lost, we recommend that you add a file");
        if (!this.proxy) console.warn("[Warning]: no proxy is set, the requests will be sent without a proxy");

        var tokens = [];
        this.tokenIndex = 0;
        for (var i = 0; i < loopCount; i++) {
            this.selectedUserToken = this?.tokens[this.tokenIndex];
            console.log(this.selectedUserToken);
            if (this.tokenIndex + 1 > this.tokens?.length - 1) this.tokenIndex = 0;
            else this.tokenIndex++;

            var token = this.selectedUserToken?.token;
            if (!token) {
                this._tokens = this._tokens.filter(t => t?.token != this.selectedUserToken?.token);
                this.showLogs && console.warn(`[Invalid Token]: ${token}`);
                continue;
            }

            // First: create new application and bot
            const application = await this.performApplicationAction({ type: "create" });
            if (!application) continue;
            const { id: botID, name } = application || {};

            // bypass discord delete application after creation using request
            await this.sendScience(botID);
            await this.performApplicationAction({ botID, type: "get" });
            await this.getSkus(botID);

            if (this.options.enableIntents) await this.enableIntents(botID);

            var botToken = await this.getBotToken(botID);
            if (!botToken) {
                if (!this.invalidTokens.includes(token)) {
                    this.invalidTokens.push(token);
                    this.emit("tokenInvalid", this.selectedUserToken);
                }
                await this.performApplicationAction({ type: "delete", botID });
                continue;
            }

            var obj = {
                botID,
                name,
                token: botToken,
                userToken: token,
                haveTwoFactor: !!this.selectedUserToken?.twoFactorKey
            };
            tokens.push(obj);
            this.emit("tokenCreated", obj);

            if (pathToSaveTokens) this.updateFile(obj, pathToSaveTokens);
            this.selectedUserToken = {};

            this.showLogs && console.log(`[Success]: created bot ${botID} with token ${botToken}\n\n`);
            await sleep(loopWait);
        }
        return tokens;
    }

    /**
     * @private
     */
    updateFile(obj, path) {
        var fileData = fs.readFileSync(path, "utf-8");
        if (!fileData) fileData = "[]";
        var data = JSON.parse(fileData);
        data.push(obj);
        fs.writeFileSync(path, JSON.stringify(data, null, 4));

        fileData = null;
        data = null;
        return obj;
    }

    // methods to bypass auto delete of the bot after creation

    /**
     * 
     * @param {String} botID 
     * @private
     */
    sendScience = async (botID) => await fetch(`https://discord.com/api/v9/science`, {
        ...this.getRequestOptions({
            method: "post",
            body: {
                token: undefined,
                "events": [
                    {
                        "type": "dev_portal_page_viewed",
                        "properties": {
                            "client_track_timestamp": Date.now(),
                            "page_name": `applications/${botID}/information`,
                            "previous_page_name": "applications",
                            "previous_link_location": null,
                            "has_session": true,
                            "client_uuid": `1234${botID}1234`,
                            "client_send_timestamp": Date.now() + 1000
                        }
                    }
                ]
            }
        }),
        referrer: `https://discord.com/developers/applications/${botID}/information`,
    }).catch(() => undefined)
    /**
     * 
     * @param {String} botID 
     * @private
     */
    getSkus = async (botID) => await fetch(`https://discord.com/api/v9/applications/${botID}/skus?localize=false&with_bundled_skus=true`, this.getRequestOptions({ method: "get" })).catch(() => undefined)

}

module.exports = TokenCreateor;