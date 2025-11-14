const fs = require("fs");
const path = require("path");

// ==================== COLOR CODES ====================
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"
};

// ==================== DIRECTORY SETUP ====================
function ensureLogDir() {
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    return logDir;
}

function getDailyLogFile(type = "pixel") {
    const dir = ensureLogDir();
    const date = new Date().toISOString().split("T")[0];
    return path.join(dir, `${date}-${type}.json`);
}

// ==================== FILE LOGGING ====================
function appendLog(data, fileType = "pixel") {
    const file = getDailyLogFile(fileType);

    let logs = [];
    if (fs.existsSync(file)) {
        try {
            logs = JSON.parse(fs.readFileSync(file, "utf-8"));
        } catch (e) {
            logs = [];
        }
    }

    logs.push({
        timestamp: new Date().toISOString(),
        ...data
    });

    fs.writeFileSync(file, JSON.stringify(logs, null, 2), "utf-8");
}

// ==================== CONSOLE LOGGING ====================
function formatDataShort(data) {
    if (!data || Object.keys(data).length === 0) return "";
    
    const excludeKeys = ['ip', 'userAgent', 'referer', 'headers'];
    const pairs = Object.entries(data)
        .filter(([k, v]) => !excludeKeys.includes(k) && v !== undefined && v !== null)
        .map(([k, v]) => {
            if (typeof v === 'object') {
                return `${k}=${JSON.stringify(v)}`;
            }
            return `${k}=${v}`;
        });
    
    return pairs.length > 0 ? ` | ${pairs.join(" | ")}` : "";
}

function consoleLog(level, event, data = {}) {
    const timestamp = new Date().toISOString();
    let levelColor, levelLabel;

    switch (level) {
        case "info":
            levelColor = colors.blue;
            levelLabel = "ℹ";
            break;
        case "success":
            levelColor = colors.green;
            levelLabel = "✓";
            break;
        case "warn":
            levelColor = colors.yellow;
            levelLabel = "⚠";
            break;
        case "error":
            levelColor = colors.red;
            levelLabel = "✗";
            break;
        case "debug":
            levelColor = colors.magenta;
            levelLabel = "◆";
            break;
        default:
            levelColor = colors.cyan;
            levelLabel = "•";
    }

    const shortData = formatDataShort(data);
    const logMessage = `${colors.gray}[${timestamp.slice(11, 19)}]${colors.reset} ${levelColor}${levelLabel}${colors.reset} ${colors.bright}${event}${colors.reset}${shortData}`;
    console.log(logMessage);
    console.log("");
}

// ==================== GENERIC LOG FUNCTION ====================
function logEvent(level, event, description = "", data = {}, fileType = "pixel") {
    consoleLog(level, event, data);
    appendLog({ event, description, ...data }, fileType);
}

// ==================== PIXEL EVENTS ====================
module.exports = {
    // -------- PIXEL GENERATION --------
    logPixelGeneration(pixelId, pixelType, ip, headers, query, customData = {}) {
        const data = {
            pixelType,
            pixelId,
            ip,
            userAgent: headers["user-agent"] || "unknown",
            referer: headers["referer"] || "direct",
            query,
            ...customData
        };
        logEvent("success", "🎯 PIXEL_GENERATED", `New pixel of type '${pixelType}' was generated and served to client at ${ip}`, data, "pixel");
    },

    // -------- BASIC PIXEL --------
    logBasicLoaded(pixelId, ip, headers) {
        const data = {
            event: "basic_loaded",
            pixelType: "basic",
            pixelId,
            ip,
            userAgent: headers["user-agent"] || "unknown"
        };
        logEvent("success", "📍 BASIC_PIXEL_LOADED", "Basic pixel was successfully loaded and served to the client", data, "pixel");
    },

    // -------- LAZY PIXEL --------
    logLazyInit(pixelId, ip) {
        logEvent("info", "⏱️  LAZY_PIXEL_INIT", "Lazy pixel initialization started - will load after delay", { pixelType: "lazy", pixelId, ip }, "pixel");
    },

    logLazyLoaded(pixelId, ip) {
        logEvent("success", "✓ LAZY_PIXEL_LOADED", "Lazy pixel successfully loaded after 2 second delay", { pixelType: "lazy", pixelId, ip }, "pixel");
    },

    // -------- STEP PIXEL --------
    logStepInit(pixelId, ip) {
        logEvent("info", "👣 STEP_PIXEL_INIT", "Step pixel initialization started - followup will trigger after 5 seconds", { pixelType: "step", pixelId, ip }, "pixel");
    },

    logStepFollowup(pixelId, ip) {
        logEvent("success", "👣 STEP_PIXEL_FOLLOWUP", "Step pixel followup completed after 5 second delay", { pixelType: "step", pixelId, ip }, "pixel");
    },

    // -------- STREAM PIXEL --------
    logStreamInit(pixelId, ip) {
        logEvent("info", "🌊 STREAM_PIXEL_INIT", "Stream pixel initialized - will stream data for up to 15 seconds", { pixelType: "stream", pixelId, ip }, "pixel");
    },

    logStreamTick(pixelId, ip, seconds) {
        logEvent("debug", "🌊 STREAM_TICK", `Stream pixel active - ${seconds} second(s) elapsed`, { pixelType: "stream", pixelId, ip, seconds }, "pixel");
    },

    logStreamClosed(pixelId, ip, seconds) {
        logEvent("success", "🌊 STREAM_CLOSED", `Stream pixel closed after ${seconds} second(s) of streaming`, { pixelType: "stream", pixelId, ip, totalSeconds: seconds }, "pixel");
    },

    // -------- GENERIC PIXEL REQUEST --------
    logPixelRequest(pixelId, pixelType, ip, headers, query) {
        const data = {
            pixelType,
            pixelId,
            ip,
            userAgent: headers["user-agent"] || "unknown",
            referer: headers["referer"] || "direct",
            query
        };
        logEvent("info", "📨 PIXEL_REQUEST", `Pixel request received for ${pixelType} pixel`, data, "pixel");
    },

    // -------- EVENT LOGGING --------
    logCustomEvent(eventName, data = {}, ip = "unknown") {
        const eventData = {
            eventName,
            ip,
            ...data
        };
        logEvent("info", `📊 CUSTOM_EVENT: ${eventName}`, `Custom event '${eventName}' triggered from IP ${ip}`, eventData, "pixel");
    },

    // -------- API REQUEST LOGGING --------
    logApiRequest(method, path, ip, statusCode = null, responseTime = null, headers = {}, body = null) {
        const data = {
            method,
            path,
            ip,
            userAgent: headers["user-agent"] || "unknown",
            statusCode,
            responseTimeMs: responseTime,
            timestamp: new Date().toISOString()
        };

        if (body && Object.keys(body).length > 0) {
            data.bodySize = JSON.stringify(body).length;
        }

        const icon = statusCode >= 400 ? "❌" : "✅";
        const level = statusCode >= 400 ? "warn" : "success";
        logEvent(level, `${icon} API_REQUEST [${method}] ${path}`, `API request ${method} ${path} completed with status ${statusCode} in ${responseTime}ms`, data, "api");
    },

    // -------- ERROR LOGGING --------
    logError(errorMessage, errorDetails = {}, ip = "unknown") {
        const data = {
            ip,
            error: errorMessage,
            ...errorDetails,
            stack: errorDetails.stack || undefined
        };
        logEvent("error", "🚨 ERROR", `An error occurred: ${errorMessage}`, data, "pixel");
    },

    // -------- GENERIC LOGGING --------
    log(level = "info", message, data = {}, fileType = "pixel") {
        logEvent(level, message, "Generic log event", data, fileType);
    },

    logInfo(message, data = {}) {
        logEvent("info", message, "Info log event", data, "pixel");
    },

    logSuccess(message, data = {}) {
        logEvent("success", message, "Success log event", data, "pixel");
    },

    logWarning(message, data = {}) {
        logEvent("warn", message, "Warning log event", data, "pixel");
    },

    logDebug(message, data = {}) {
        logEvent("debug", message, "Debug log event", data, "pixel");
    }
};
