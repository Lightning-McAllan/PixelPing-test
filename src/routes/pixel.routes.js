const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const pixelService = require("../services/pixel.service");
const logger = require("../services/logging.service");

// ==================== GET PIXEL JSON RESPONSE ====================
router.get("/:type", async (req, res) => {
    const pixelId = uuidv4();
    const type = req.params.type;

    // Log the pixel generation request
    logger.logPixelGeneration(pixelId, type, req.ip, req.headers, req.query);

    // Log the request itself
    logger.logPixelRequest(pixelId, type, req.ip, req.headers, req.query);

    // Return pixel URL in JSON format
    return pixelService.servePixel(type, req, res, pixelId);
});

// ==================== SERVE ACTUAL PIXEL IMAGE ====================
router.get("/serve/:pixelId", (req, res) => {
    const pixelId = req.params.pixelId;
    const pixelType = req.query.type || "basic";

    if (pixelType === "persistent") {
        const startTime = Date.now();

        logger.log("info", "Persistent connection started", { pixelId, ip: req.ip, query: req.query });

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-store");

        // Send the pixel initially
        res.write(Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
            "base64"
        ));

        // Keep the connection open
        const keepAliveInterval = setInterval(() => {
            logger.log("debug", "Persistent pixel keep-alive", { pixelId, ip: req.ip, query: req.query });
            res.write(Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
                "base64"
            ));
        }, 5000); // Send a pixel every 5 seconds

        // Handle client disconnect
            req.on("close", () => {
            clearInterval(keepAliveInterval);
            const duration = Date.now() - startTime;
                logger.log("info", "Persistent connection closed", { pixelId, ip: req.ip, duration, query: req.query });
        });
    } else {
        // Serve the actual pixel image
        pixelService.servePixelImageOnly(req, res, pixelId, pixelType);
    }
});

// ==================== PERSISTENT PIXEL ROUTE ====================
router.get("/persistent", async (req, res) => {
    const pixelId = uuidv4();

    // Log the persistent pixel request
    logger.log("info", "Persistent pixel requested", { pixelId, ip: req.ip, query: req.query });

    // Serve the persistent pixel
    return pixelService.servePixel("persistent", req, res, pixelId);
});

module.exports = router;