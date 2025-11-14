const logger = require("./logging.service");

module.exports = {
    logPixelRequest(data) {
        logger.logCustomEvent("pixel_request", {
            pixelType: data.pixelType,
            userAgent: data.headers["user-agent"] || "unknown",
            referer: data.headers["referer"] || "direct",
            query: data.query,
            ip: data.ip
        }, data.ip);
    },

    logEvent(data) {
        logger.logCustomEvent("custom_event", {
            userAgent: data.headers["user-agent"] || "unknown",
            referer: data.headers["referer"] || "direct",
            body: data.body,
            ip: data.ip
        }, data.ip);
    }
};
