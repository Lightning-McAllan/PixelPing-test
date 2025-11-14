const fs = require("fs");
const path = require("path");

function ensureLogDir() {
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    return logDir;
}

function getDailyLogFile() {
    const dir = ensureLogDir();
    const date = new Date().toISOString().split("T")[0];
    return path.join(dir, `${date}.json`);
}

function appendLog(data) {
    const file = getDailyLogFile();

    let logs = [];
    if (fs.existsSync(file)) {
        logs = JSON.parse(fs.readFileSync(file));
    }

    logs.push({
        timestamp: new Date().toISOString(),
        ...data
    });

    fs.writeFileSync(file, JSON.stringify(logs, null, 2));
}

module.exports = {
    /* ---------------- BASIC ---------------- */
    logBasicLoaded(pixelId, ip, headers) {
        appendLog({ event: "basic_loaded", pixelType: "basic", pixelId, ip, headers });
    },

    /* ---------------- LAZY ---------------- */
    logLazyInit(pixelId, ip) {
        appendLog({ event: "lazy_init", pixelType: "lazy", pixelId, ip });
    },

    logLazyLoaded(pixelId, ip) {
        appendLog({ event: "lazy_loaded", pixelType: "lazy", pixelId, ip });
    },

    /* ---------------- STEP ---------------- */
    logStepInit(pixelId, ip) {
        appendLog({ event: "step_init", pixelType: "step", pixelId, ip });
    },

    logStepFollowup(pixelId, ip) {
        appendLog({ event: "step_followup", pixelType: "step", pixelId, ip });
    },

    /* ---------------- STREAM ---------------- */
    logStreamInit(pixelId, ip) {
        appendLog({ event: "stream_init", pixelType: "stream", pixelId, ip });
    },

    logStreamTick(pixelId, ip, seconds) {
        appendLog({ event: "stream_tick", pixelType: "stream", pixelId, ip, seconds });
    },

    logStreamClosed(pixelId, ip, seconds) {
        appendLog({ event: "stream_closed", pixelType: "stream", pixelId, ip, seconds });
    },

    /* -------------- GENERIC REQUEST -------------- */
    logPixelRequest(pixelId, pixelType, ip, headers, query) {
        appendLog({
            event: "pixel_request",
            pixelType,
            pixelId,
            ip,
            headers,
            query
        });
    }
};
