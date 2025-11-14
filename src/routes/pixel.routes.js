const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const pixelService = require("../services/pixel.service");
const logger = require("../services/logging.service");

router.get("/:type", async (req, res) => {
    const pixelId = uuidv4();
    const type = req.params.type;

    // Log the request itself
    logger.logPixelRequest(pixelId, type, req.ip, req.headers, req.query);

    // Serve pixel
    return pixelService.servePixel(type, req, res, pixelId);
});

module.exports = router;