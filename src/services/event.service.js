const logger = require("./logging.service");

module.exports = {
    logPixelRequest(data) {
        logger.log({
            event: "pixel_request",
            pixelType: data.pixelType,
            headers: data.headers,
            query: data.query,
            ip: data.ip
        });
    },

    logEvent(data) {
        logger.log({
            event: "custom_event",
            headers: data.headers,
            body: data.body,
            ip: data.ip
        });
    }
};
