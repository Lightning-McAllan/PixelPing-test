const logger = require("./logging.service");
const urlUtil = require("../utils/url");

// Shared pixel buffer
const PIXEL = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
);

// Store pixel metadata for tracking behavior
const pixelMetadata = new Map();

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
   SERVE ACTUAL PIXEL IMAGE WITH DELAYS
--------------------------------------------------------- */
function servePixelImage(req, res, pixelId, pixelType) {
    // Store metadata for this pixel
    pixelMetadata.set(pixelId, {
        type: pixelType,
        createdAt: new Date(),
        ip: req.ip
    });

    // Clean up old metadata after 1 hour
    if (pixelMetadata.size > 1000) {
        const now = Date.now();
        for (const [id, data] of pixelMetadata.entries()) {
            if (now - data.createdAt > 3600000) {
                pixelMetadata.delete(id);
            }
        }
    }

    const metadata = pixelMetadata.get(pixelId);
    const type = metadata?.type || pixelType || "basic";

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");

    switch (type) {
        case "basic":
            // Serve immediately
            logger.logBasicLoaded(pixelId, req.ip, req.headers);
            res.end(PIXEL);
            break;

        case "lazy":
            // Delay 2 seconds before serving
            logger.logLazyInit(pixelId, req.ip);
            setTimeout(() => {
                logger.logLazyLoaded(pixelId, req.ip);
                res.end(PIXEL);
            }, 2000);
            break;

        case "step":
            // Serve immediately, but log followup after 5 seconds
            logger.logStepInit(pixelId, req.ip);
            res.end(PIXEL);
            setTimeout(() => {
                logger.logStepFollowup(pixelId, req.ip);
            }, 5000);
            break;

        case "stream":
            // Stream pixel
            logger.logStreamInit(pixelId, req.ip);
            res.write(PIXEL);

            let seconds = 0;
            const interval = setInterval(() => {
                seconds++;
                logger.logStreamTick(pixelId, req.ip, seconds);
            }, 1000);

            // When client closes connection
            req.on("close", () => {
                clearInterval(interval);
                logger.logStreamClosed(pixelId, req.ip, seconds);
            });

            // Force end after 15 seconds
            setTimeout(() => {
                clearInterval(interval);
                if (!res.headersSent || !res.writableEnded) {
                    res.end();
                }
                logger.logStreamClosed(pixelId, req.ip, seconds);
            }, 15000);
            break;

        default:
            // Default to basic
            logger.logBasicLoaded(pixelId, req.ip, req.headers);
            res.end(PIXEL);
    }
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
