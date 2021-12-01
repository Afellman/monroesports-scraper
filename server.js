const { createServer } = require("https");
const { parse } = require("url");
const fs = require("fs");
const dev = process.env.NODE_ENV !== "production";
const SECURE_PORT = parseInt(process.env.PORT, 10) || (4043);
const UNSECURE_PORT = parseInt(process.env.HTTP_PORT, 10) || (8080);
const http = require("http");
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");


const httpsOptions = {
    key: fs.readFileSync(
        path.join(__dirname, "certs", "www.goupstrong.com.key")
    ),

    cert: fs.readFileSync(
        path.join(__dirname, "certs", "www.goupstrong.com.crt")
    ),

    ca: fs.readFileSync(
        path.join(__dirname, "certs", "www.goupstrong.com.ca-bundle")
    )
};

const server = http.createServer(function (req, res) {
        res.writeHead(302, {
            location: "https://" + req.headers.host + req.url
        });
        res.end();
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

createServer(httpsOptions, app)
    .listen(SECURE_PORT, () => {
        console.log("HTTPS Server running on port " + SECURE_PORT);
    });


	app.get("/api/getTeamSchedule", getSchedule);


const getSchedule = (req, res) => {
    const schedule = fs.readFileSync("./latestSchedule.json");
    const scheduleJSON = JSON.parse(schedule);
    const lastGetDate = new Date(scheduleJSON.lastGet);
    const today = new Date();

    let currentSchedule = scheduleJSON.schedule;

    if (lastGetDate < today) {
        fetch("www.monroesportscenter.com/go-up-strong-fall")
            .then((res) => res.text()
            .then((res) => {});
    }
};
