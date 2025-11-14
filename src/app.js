const express = require("express");
const http = require("http");

const {pixelRoutes, eventRoutes} = require("./routes");
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

// Self-ping function to keep the server alive
function startSelfPing() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
    const SELF_PING_URL = process.env.SELF_PING_URL || "http://localhost:3000/self-ping";

    setInterval(() => {
        http.get(SELF_PING_URL, (res) => {
            console.log(`Self-ping successful: ${res.statusCode}`);
        }).on("error", (err) => {
            console.error("Self-ping failed:", err.message);
        });
    }, PING_INTERVAL);
}

// Start self-ping
startSelfPing();

module.exports = app;
