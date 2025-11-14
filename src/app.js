const express = require("express");

const {pixelRoutes, eventRoutes} = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/pixel", pixelRoutes);
app.use("/event", eventRoutes);

module.exports = app;
