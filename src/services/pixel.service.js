const logger = require("./logging.service");
const urlUtil = require("../utils/url");

// Shared pixel buffer
const PIXEL = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
);

/* ---------------------------------------------------------
   GET PIXEL URL
--------------------------------------------------------- */
function getPixelUrl(type, pixelId, req) {
    const baseUrl = urlUtil.getBaseUrl();
    return `${baseUrl}/pixel/serve/${pixelId}`;
}

/* ---------------------------------------------------------
   BASIC PIXEL
--------------------------------------------------------- */
function serveBasicPixel(req, res, pixelId, type) {
    logger.logBasicLoaded(pixelId, req.ip, req.headers);

    const pixelUrl = getPixelUrl(type, pixelId, req);
    return res.json({
        success: true,
        pixelType: type,
        pixelId,
        pixelUrl,
        description: "Basic pixel - serves immediately",
        url: pixelUrl,
        format: "json"
    });
}

/* ---------------------------------------------------------
   LAZY PIXEL
--------------------------------------------------------- */
function serveLazyPixel(req, res, pixelId, type) {
    logger.logLazyInit(pixelId, req.ip);

    const pixelUrl = getPixelUrl(type, pixelId, req);
    return res.json({
        success: true,
        pixelType: type,
        pixelId,
        pixelUrl,
        description: "Lazy pixel - loads after 2 second delay",
        url: pixelUrl,
        delayMs: 2000,
        format: "json"
    });
}

/* ---------------------------------------------------------
   STEP PIXEL
--------------------------------------------------------- */
function serveStepPixel(req, res, pixelId, type) {
    logger.logStepInit(pixelId, req.ip);

    const pixelUrl = getPixelUrl(type, pixelId, req);
    return res.json({
        success: true,
        pixelType: type,
        pixelId,
        pixelUrl,
        description: "Step pixel - followup after 5 second delay",
        url: pixelUrl,
        followupDelayMs: 5000,
        format: "json"
    });
}

/* ---------------------------------------------------------
   STREAM PIXEL
--------------------------------------------------------- */
function serveStreamPixel(req, res, pixelId, type) {
    logger.logStreamInit(pixelId, req.ip);

    const pixelUrl = getPixelUrl(type, pixelId, req);
    return res.json({
        success: true,
        pixelType: type,
        pixelId,
        pixelUrl,
        description: "Stream pixel - streams for up to 15 seconds",
        url: pixelUrl,
        maxDurationMs: 15000,
        format: "json"
    });
}

/* ---------------------------------------------------------
   SERVE ACTUAL PIXEL IMAGE
--------------------------------------------------------- */
function servePixelImage(req, res, pixelId, type) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.end(PIXEL);
}

/* ---------------------------------------------------------
   FACTORY EXPORT
--------------------------------------------------------- */

module.exports = {
    servePixel(type, req, res, pixelId) {
        const map = {
            basic: serveBasicPixel,
            lazy: serveLazyPixel,
            step: serveStepPixel,
            stream: serveStreamPixel
        };

        const handler = map[type];
        if (!handler) {
            return res.status(400).json({ error: "Invalid pixel type", validTypes: ["basic", "lazy", "step", "stream"] });
        }

        return handler(req, res, pixelId, type);
    },

    servePixelImageOnly(req, res, pixelId, type) {
        servePixelImage(req, res, pixelId, type);
    }
};
