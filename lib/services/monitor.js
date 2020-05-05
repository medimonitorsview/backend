const db = require('../storage/mongo');
const monitorList = async () => {
    // save to database
    const monitors = await db.getMonitors()
    const ret = monitors.map(m => (m.monitorId))
    return ret;
}
const monitorPost = async (data) => {
    const ret = await db.saveMonitor(data);
    return ret.toObject({ flattenMaps: true, versionKey: false })
}
const monitorGet = async ({ monitorId }) => {
    // save to database
    const monitors = await db.getMonitors({ monitorId })
    if (!monitors || !monitors[0]) {
        return null
    }

    return monitors[0].toObject({ flattenMaps: true, versionKey: false });
}
const monitorGetImages = async ({ monitorId, filter }) => {
    // save to database
    const monitors = await db.getMonitorImages({ monitorId, filter })
    return monitors;
}
const monitorDelete = ({ monitorId }) => {
    return db.deleteMonitor({ monitorId })
}

module.exports = {
    monitorList,
    monitorGet,
    monitorPost,
    monitorDelete,
    monitorGetImages
}