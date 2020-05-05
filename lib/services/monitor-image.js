const db = require('../storage/mongo');
const cv = require('./cv');
const metrics = require('./metrics')
const { monitorGet } = require('./monitor');

const monitorImageSaveOcr = async (data) => {
    const { monitorId, imageId, timestamp, segments } = data;
    await db.saveMonitorImage({ imageId, monitorId, timestamp, ocrResultsFromDevice: segments })
    return true;

}
const monitorImagePost = async (data) => {
    const {
        file,
        imageId,
        timestamp,
        monitorId
    } = data;

    // send to align
    let aligned = {};
    try {
        if (file && Buffer.isBuffer(file)) {
            console.log(`before align ${imageId}`)
            aligned = await cv.alignImage({ file })
        }
    }
    catch (e) {
        console.error("Cannot perform align: " + e.message)
        throw e
    }
    const { file: alignedFile } = aligned;
    const monitor = await monitorGet({ monitorId }) || {};
    if (!monitor.monitorId){
        await db.saveMonitor({ monitorId, timestamp });
    }
    const imageFromDb = await db.getMonitorImageForOcr({ monitorId, imageId, withOcr: false });
    if (imageFromDb) {
        console.log(`has saved ${imageId}, ${monitorId}`)
    }
    let segments;
    if (imageFromDb && imageFromDb.ocrResults) {
        segments = imageFromDb.ocrResults
    }
    else {
        segments = monitor.segments
    }
    let ocred = [];
    try {
        if (alignedFile && Buffer.isBuffer(alignedFile)) {
            const encodedFile = alignedFile.toString('base64')
            console.log(`CV ocr ${imageId}, ${monitorId}, ${JSON.stringify(segments)}`)

            ocred = await cv.ocr({ segments, image: encodedFile, imageId, monitorId });
        }
        else {
            ocred = await cv.ocr({ segments, imageId, monitorId });
        }

    }
    catch (e) {
        console.log("Cannot perform ocr: " + e.message)
    }
    const imageIdNumber = parseInt(imageId);
    if (Number.isInteger(imageIdNumber)) {
        metrics['image_id'].set({ value: imageIdNumber, labelValues: { monitorId } });
    }

    // write metrics
    if (ocred) {
        ocred.forEach(s => {
            metrics['monitor_data'].set({ value: parseFloat(s.value) || 0, labelValues: { monitorId, segment_name: s.segment_name } });
        })
    }
    // save to database
    await db.saveMonitorImage({ imageId, monitorId, timestamp, file: alignedFile, ocrResults: ocred })
    const ret = {
        monitorId,
        nextImageId: imageId + 1
    }
    return ret;
}

const monitorImageGetLatest = async ({ monitorId, imageId, showOcr, withOcr = true }) => {
    const imageFromDb = await db.getMonitorImage({ monitorId, imageId, withOcr });
    if (showOcr) {
        const monitor = await monitorGet({ monitorId })
        let segments;
        if (imageFromDb && imageFromDb.ocrResults) {
            segments = imageFromDb.ocrResults
        }
        else {
            segments = monitor.segments
        }
        if (imageFromDb.file && Buffer.isBuffer(imageFromDb.file)) {
            const encodedFile = imageFromDb.file.toString('base64')
            ocred = await cv.showOcr({ segments, image: encodedFile });
            return { ...imageFromDb, file: ocred };
        }

    }
    return imageFromDb;
}

module.exports = {
    monitorImagePost,
    monitorImageGetLatest,
    monitorImageSaveOcr,
}
