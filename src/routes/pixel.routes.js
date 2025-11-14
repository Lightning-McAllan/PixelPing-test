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

    // Serve the actual pixel image
    pixelService.servePixelImageOnly(req, res, pixelId, pixelType);
});

module.exports = router;