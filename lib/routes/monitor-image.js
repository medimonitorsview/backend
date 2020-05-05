const express = require('express');
const asyncHandler = require('express-async-handler')
const cache = require('../storage/cache');

const { monitorImagePost, monitorImageGetLatest } = require('../services/monitor-image');

const monitorImages = () => {
    const router = express.Router();
    router.post('/', asyncHandler(async (req, res, next) => {
        const body = req.body;
        const imageId = parseInt(req.headers['x-image-id'] || 0);
        const monitorId = req.headers['x-monitor-id'];
        const timestamp = req.headers['x-timestamp'] || Date.now();

        const data = {
            file: body,
            imageId,
            monitorId,
            timestamp
        }
        try {
            const ret = await monitorImagePost(data);
            console.log(`OK for imageId ${imageId}, monitorId: ${ret.monitorId}`)
            res.json(ret)
        } catch (error) {
            res.statusCode = 500;
            console.error(`failed for ${imageId}. error: ${error.message}`)

            res.json({ error: error.message })
        }
        next();
    }));

    router.get('/:monitorId', async (req, res, next) => {
        const monitorId = req.params.monitorId;
        const imageIdParam = req.headers['x-image-id'] || req.query.imageId;
        const imageId = imageIdParam ? parseInt(imageIdParam) : null;

        if (monitorId == null) {
            res.statusCode = 404;
            res.json({ error: 'not found' })
        }
        const showOcr = req.query.show_ocr === 'true';
        cache.lastRequestedImageForMonitor[monitorId] = Date.now();

        try {
            const ret = await monitorImageGetLatest({ monitorId,    imageId, showOcr, withOcr: false });
            if (!ret || !ret.file) {
                res.status(404);
                res.end();
                return
            }

            res.set('x-image-id', ret.imageId);
            res.set('x-timestamp', ret.timestamp);
            res.type('jpeg')
            res.write(ret.file)
            res.end();
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: 'Internal error' })
        }
        next();

    })
    return { router, path: '/monitor_image' }
}

module.exports = monitorImages;