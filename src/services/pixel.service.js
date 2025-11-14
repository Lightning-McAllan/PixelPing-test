const logger = require("./logging.service");

// Shared pixel buffer
const PIXEL = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
);

/* ---------------------------------------------------------
   BASIC PIXEL
--------------------------------------------------------- */
function serveBasicPixel(req, res, pixelId) {
    logger.logBasicLoaded(pixelId, req.ip, req.headers);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.end(PIXEL);
}

/* ---------------------------------------------------------
   LAZY PIXEL
--------------------------------------------------------- */
function serveLazyPixel(req, res, pixelId) {
    logger.logLazyInit(pixelId, req.ip);

    setTimeout(() => {
        logger.logLazyLoaded(pixelId, req.ip);

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-store");
        res.end(PIXEL);
    }, 2000);
}

/* ---------------------------------------------------------
   STEP PIXEL
--------------------------------------------------------- */
function serveStepPixel(req, res, pixelId) {
    logger.logStepInit(pixelId, req.ip);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.end(PIXEL);

    setTimeout(() => {
        logger.logStepFollowup(pixelId, req.ip);
    }, 5000);
}

/* ---------------------------------------------------------
   STREAM PIXEL
--------------------------------------------------------- */
function serveStreamPixel(req, res, pixelId) {
    logger.logStreamInit(pixelId, req.ip);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
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
        res.end();
        logger.logStreamClosed(pixelId, req.ip, seconds);
    }, 15000);
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
            return res.status(400).json({ error: "Invalid pixel type" });
        }

        return handler(req, res, pixelId);
    }
};
