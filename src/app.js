const express = require("express");

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

module.exports = app;
