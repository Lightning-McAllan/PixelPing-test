const express = require("express");
const router = express.Router();

const pixelService = require("../services/pixel.service");
const logger = require("../services/logging.service");

// GET /assets/logo.png?id=xyz - serve a persistent pixel as the logo asset
router.get("/logo.png", (req, res) => {
    const pixelId = req.query.id;
    if (!pixelId) {
        return res.status(400).json({ error: "Missing id query parameter" });
    }

    logger.log("info", "Assets logo requested (persistent pixel)", { pixelId, ip: req.ip, query: req.query });

    // Serve the actual pixel image using persistent type
    return pixelService.servePixelImageOnly(req, res, pixelId, "persistent");
});

module.exports = router;
