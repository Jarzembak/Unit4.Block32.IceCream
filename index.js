const pg = require("pg");
const express = require("express");
const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/acme_icecream_db"
);
const app = express();

const init = async () => {
    app.use(express.json());
    app.use(require("morgan")("dev"));

    await client.connect();
    console.log("connected to database");

    let SQL = /*SQL*/ `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_favorite BOOLEAN NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;
    await client.query(SQL);
    console.log("tables created");

    SQL = /*SQL*/ `
        INSERT INTO flavors(name, is_favorite) VALUES
            ('Chocolate', false),
            ('Vanilla', false),
            ('Coffee', false),
            ('Chocolate Peanut Butter Fudge', true),
            ('Strawberry', false);
    `;
    await client.query(SQL);
    console.log("data seeded");

    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`listening on port ${port}`));

    // Add flavors
    app.post("/api/flavors", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                INSERT INTO flavors(name, is_favorite)
                VALUES ($1, $2)
                RETURNING *
            `;
            const response = await client.query(SQL, [
                req.body.name,
                req.body.is_favorite,
            ]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/flavors", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                SELECT * from flavors
                `;
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/flavors/:id", async(req, res, next) => {
        try {
            const SQL = /*SQL*/ `
            SELECT * from flavors
            WHERE id=$1
            `;
            const response = await client.query(SQL, [req.params.id]);
            res.send(response.rows[0])
        } catch (error) {
            next(error);
        }
    })

    app.delete("/api/flavors/:id", async(req, res, next) => {
        try {
            const SQL = /*SQL*/ `
            DELETE from flavors
            WHERE id=$1
            `;
            await client.query(SQL, [req.params.id]);
            res.sendStatus(204);
        } catch (error) {
            next(error)
        }
    })
    app.put("/api/flavors/:id", async(req, res, next) => {
        try {
            const SQL = /*SQL*/ `
            UPDATE flavors
            SET name=$1, is_favorite=$2, updated_at=now()
            Where id=$3 RETURNING *
            `;
            const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error);
        }
    })
};

init();
