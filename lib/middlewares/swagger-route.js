const express = require('express');
const fs = require('fs');
const routes = (swaggerFile) => {
    const router = express.Router();
    const swaggerContent = fs.readFileSync(swaggerFile);
    const swagger = JSON.parse(swaggerContent)
    router.get('/', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swagger);
    });

    return router;
};
module.exports = routes;
