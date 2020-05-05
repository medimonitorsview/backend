const express = require('express');
const { monitorList, monitorGet, monitorPost, monitorDelete, monitorGetImages } = require('../services/monitor');
const multer = require('multer');
const upload = multer();

const monitorSetup = () => {
    const router = express.Router();
    router.get('/list', async (req, res, next) => {
        try {
            const ret = await monitorList();
            res.json(ret)
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: 'Internal error' })
        }
    });
    router.delete('/:monitorId', async (req, res, next) => {
        const monitorId = req.params.monitorId;
        if (monitorId == null) {
            res.statusCode = 404;
            res.json({ error: 'not found' })
            res.end();
            return;
        }
        try {
            const ret = await monitorDelete({ monitorId });
            if (!ret) {
                res.status(404)
                res.end();
            } else {
                res.json(ret)
            }
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: error.message })
        }
        next();

    });
    router.get('/:monitorId', async (req, res, next) => {
        try {
            const monitorId = req.params.monitorId;
            const ret = await monitorGet({ monitorId });
            if (!ret) {
                res.status(404)
                res.end();
            } else {
                res.json(ret)
            }
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: error.message })
        }
        next();
    });
    router.get('/images/:monitorId', async (req, res, next) => {
        try {
            const monitorId = req.params.monitorId;
            const html = req.query.html === 'true'
            const filter = req.query.filter === 'true'
            if (monitorId == null) {
                res.statusCode = 404;
                res.json({ error: 'not found' })
                res.end();
                return;
            }
            const ret = await monitorGetImages({ monitorId, filter });
            if (!ret) {
                res.status(404)
                res.end();
            } else {
                if (html) {
                    res.type('html')
                    const lines = [];
                    lines.push('<!DOCTYPE html>')
                    lines.push('<html>')
                    lines.push('<body>')
                    lines.push('<table style="width:100%">')

                    ret.forEach(l => {
                        lines.push('<tr>')
                        lines.push(`<td><img src="/monitor_image/${monitorId}?imageId=${l.imageId}" title="imageId=${l.imageId}" alt="imageId=${l.imageId}"></td>`)
                        lines.push('</tr>')
                    })
                    lines.push('</table>')
                    lines.push('</body>')
                    lines.push('</html>')
                    res.write(lines.join('\n'))
                    res.end();
                }
                else {
                    res.json(ret)
                }
            }
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: error.message })
        }
        next();
    });
    router.post('/:monitorId', async (req, res, next) => {
        try {
            const monitorId = req.params.monitorId;
            const body = req.body;
            const ret = await monitorPost({ ...body, monitorId });
            if (!ret) {
                res.status(404)
                res.end();
            } else {
                res.json(ret)
            }
        } catch (error) {
            res.statusCode = 500;
            res.json({ error: error.message })
        }
    });


    return { router, path: '/monitor' }
}

module.exports = monitorSetup;