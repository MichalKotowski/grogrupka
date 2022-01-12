const keys = require("./keys");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { Pool } = require("pg");
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
    ssl: {
        rejectUnauthorized: false,
    }
});

app.post("/game", async (req, res) => {
    if (!req.body) res.send({ working: false })

    const session = req.body.session;

    let latestGameId = 0
    const latestGame = await pgClient.query("SELECT game_id FROM placement ORDER BY game_id DESC LIMIT 1");

    if (latestGame.rowCount > 0) latestGameId = latestGame.rows[0].game_id + 1

    pgClient.query(`INSERT INTO games(game_id, date, game_name) VALUES (${latestGameId}, '${session.date}', '${session.game}')`)

    for (const [key, placement] of Object.entries(session)) {
        if (key.includes('user')) {
            let userId = key.charAt(key.length - 1)
            pgClient.query(`INSERT INTO placement(game_id, user_id, placement) VALUES (${latestGameId}, ${userId}, ${placement})`)
        }
    }

    res.send({ working: true })
});

app.post("/elo", async (req, res) => {
    if (!req.body) res.send({ working: false })

    const session = req.body.session;

    const latestGame = await pgClient.query("SELECT game_id FROM games ORDER BY game_id DESC LIMIT 1");

    latestGameId = latestGame.rows[0].game_id

    session.forEach(player => {
        pgClient.query(`INSERT INTO elo(game_id, user_id, current_elo) VALUES (${latestGameId}, ${player[0]}, ${player[1]})`)
    })

    res.send({ working: true })
});

app.get("/users/all", async (req, res) => {
    const players = await pgClient.query("SELECT * FROM users")

    res.send(players)
})

app.get("/elo/all", async (req, res) => {
    const playersElo = await pgClient.query("SELECT DISTINCT ON (user_id) * FROM elo ORDER BY user_id, game_id DESC LIMIT 8")

    res.send(playersElo)
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Listening");
}).on('error', err => {
    console.log(err)
})