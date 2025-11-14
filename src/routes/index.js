const express = require("express");
const router = express.Router();

// Self-ping endpoint
router.get("/self-ping", (req, res) => {
    res.status(200).json({ message: "Server is alive!" });
});

// Health check endpoint for Render
router.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "PixelPing",
        timestamp: new Date().toISOString()
    });
});

module.exports = {
    pixelRoutes: require("./pixel.routes"),
    eventRoutes: require("./event.routes"),
    selfPingRoute: router,
    healthRoute: router
};
