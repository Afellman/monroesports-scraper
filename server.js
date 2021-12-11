const https = require("https");
const fs = require("fs");
const dev = process.env.NODE_ENV !== "production";
const SECURE_PORT = parseInt(process.env.PORT, 10) || 4043;
const UNSECURE_PORT = parseInt(process.env.HTTP_PORT, 10) || 8080;
const http = require("http");
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const cheerio = require("cheerio");
const request = require("request");

const getSchedule = (req, res) => {
    let currentSchedule = {};
    let needsRefresh = true;

    const schedulePath = path.join(__dirname, "latestSchedule.json");

    try {
        const schedule = fs.readFileSync(schedulePath);
        const scheduleJSON = JSON.parse(schedule);
        needsRefresh = new Date(scheduleJSON.lastGet) < new Date();
        currentSchedule = scheduleJSON.schedule;
    } catch (err) {
        console.log(err);
    }

    if (needsRefresh) {
        request(
            "http://www.monroesportscenter.com/go-up-strong-fall",
            (err, monroeRes, body) => {
                const parsedSchedule = parseSchedule(body);
                const saveObj = {
                    lastGet: new Date().toISOString(),
                    schedule: parsedSchedule
                };
                // fs.writeFile(schedulePath, saveObj, "utf-8", () => {});
                console.log("schedle sent");
                res.send(parsedSchedule);
            }
        )
            .on("error", (e) => {
                console.error(`Get error: ${e.message}`);
            })
            .end();
    } else {
        res.send(currentSchedule);
    }
};

const parseSchedule = (html) => {
    const $ = cheerio.load(html);
    const ret = [];

    const coachTables = $(".main table");

    coachTables.each((i, coachTable) => {
        const coach = $(coachTable).prev().text();
        const coachTeams = $(coachTable).find("tr");
        coachTeams.each((i, coachTeam) => {
            const team = $(
                $(coachTeam).find(
                    "td > div:nth-child(2) > p:nth-child(1) > b"
                )[0]
            ).text();

            if (!team || team.length === 0) return;

            const obj = {
                team,
                coach,
                html: $(coachTeam).html()
            };
            ret.push(obj);
        });
    });
    return ret;
};

http.createServer(app).listen(UNSECURE_PORT, () => {
    console.log("HTTP Server running on port " + UNSECURE_PORT);
});

console.log(process.argv[2]);
if (process.argv[2] !== "no-secure") {
    https
        .createServer(
            {
                key: fs.readFileSync(
                    path.join(__dirname, "certs", "www.goupstrong.com.key")
                ),

                cert: fs.readFileSync(
                    path.join(__dirname, "certs", "www.goupstrong.com.crt")
                ),

                ca: fs.readFileSync(
                    path.join(
                        __dirname,
                        "certs",
                        "www.goupstrong.com.ca-bundle"
                    )
                )
            },
            app
        )
        .listen(SECURE_PORT, () => {
            console.log("HTTPS Server running on port " + SECURE_PORT);
        });
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.get("/api/getTeamSchedule", getSchedule);
