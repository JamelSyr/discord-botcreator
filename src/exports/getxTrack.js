
module.exports = (uAgent) => {
    const data = {
        "os": "Windows",
        "browser": "Chrome",
        "device": "",
        "system_locale": "en-GB",
        "browser_user_agent": uAgent,
        "browser_version": "122.0.0.1",
        "os_version": "10",
        "os_version_info": "10",
        "os_version_detail": "",
        "referer": "",
        "referer_current": "",
        "referer_current": "",
        "referer_detail": "",
        "related_channel": "stable",
        "client_build_number": 9999,
        "client_event_source": null
    };
    var b64Data = Buffer.from(JSON.stringify(data)).toString('base64');
    return b64Data;
}