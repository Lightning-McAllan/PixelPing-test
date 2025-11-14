const express = require("express");
const router = express.Router();

const eventService = require("../services/event.service");

router.post("/", (req, res) => {
    eventService.logEvent({
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });

    res.json({ ok: true });
});

module.exports = router;
