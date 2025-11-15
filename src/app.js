const express = require("express");
const http = require("http");
const axios = require("axios");

const {pixelRoutes, eventRoutes, selfPingRoute, healthRoute} = require("./routes");
const logger = require("./services/logging.service");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== API REQUEST LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
    const startTime = Date.now();

    // Capture original res.end
    const originalEnd = res.end;

    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        logger.logApiRequest(
            req.method,
            req.path,
            req.ip,
            res.statusCode,
            responseTime,
            req.headers,
            req.body
        );

        // Call original res.end
        originalEnd.call(this, chunk, encoding);
    };

    next();
});

app.use("/pixel", pixelRoutes);
app.use("/event", eventRoutes);

// Mount health and self-ping endpoints at root
app.use("/", selfPingRoute);
app.use("/", healthRoute);

// Self-ping function to keep the server alive
function startSelfPing() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const PORT = process.env.PORT || 3000;
    // Default to local self-ping when not provided (useful for dev)
    const DEFAULT_SELF_PING_URL = `http://localhost:${PORT}/self-ping`;
    const SELF_PING_URL = process.env.SELF_PING_URL || DEFAULT_SELF_PING_URL;
    logger.logDebug("Starting self-ping", { url: SELF_PING_URL, intervalMs: PING_INTERVAL });

    async function pingSelf() {
        try {
            const response = await axios.get(SELF_PING_URL, { timeout: 5000 });
            logger.logInfo(`Self-ping successful: ${response.status}`, { url: SELF_PING_URL, status: response.status });
        } catch (error) {
            logger.logError("Self-ping failed", { url: SELF_PING_URL, message: error.message, stack: error.stack });
        }
    }

    // Ping immediately to verify endpoint availability, then set regular interval
    pingSelf();
    setInterval(pingSelf, PING_INTERVAL);
}

// Start self-ping
startSelfPing();

module.exports = app;
