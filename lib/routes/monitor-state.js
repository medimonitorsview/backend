const express = require('express');
const { sendImages, timeouts } = require('../../config');
const cache = require('../storage/cache');


const monitorState = () => {
    const router = express.Router();

    router.post(['/', '/:monitorId'], async (req, res, next) => {
        const { monitorId=req.params.monitorId, sendImages, autofocus } = req.body;
        console.log(`monitorState for ${monitorId} ${JSON.stringify({sendImages, autofocus})}`)
        if (monitorId == null) {
            res.statusCode = 404;
            res.json({ error: 'monitorId is mandatory' })
        }
        if (sendImages!=null){
            cache.lastRequestedImageForMonitor[monitorId]=sendImages?Date.now():0;
        }
        if (autofocus!=null){
            cache.lastRequestedFocusForMonitor[monitorId]=autofocus?Date.now():0;
        }

        const sendImagesRequested = Date.now() - (cache.lastRequestedImageForMonitor[monitorId] || 0) < timeouts.sendImagesTimeout;
        const autofocusRequested = Date.now() - (cache.lastRequestedFocusForMonitor[monitorId] || 0) < timeouts.autofocusTimeout;
        res.json({
            autofocus: autofocusRequested,
            sendImages: sendImagesRequested
        })

    })
    router.get('/:monitorId', async (req, res, next) => {
        const monitorId=req.params.monitorId
        const sendImagesRequested = Date.now() - (cache.lastRequestedImageForMonitor[monitorId] || 0) < timeouts.sendImagesTimeout;
        const autofocusRequested = Date.now() - (cache.lastRequestedFocusForMonitor[monitorId] || 0) < timeouts.autofocusTimeout;
        res.json({
            autofocus: autofocusRequested,
            sendImages: sendImagesRequested
        })
    })
    return { router, path: '/monitor_state' }

}

module.exports = monitorState;