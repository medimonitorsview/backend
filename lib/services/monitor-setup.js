const db = require('../storage/mongo');
const monitorSetupPost = async (data) => {

    const { monitorId, patientId, roomId } = data;
    const monitorImage = await db.getMonitorImage({ monitorId });

    // save to database
    await db.saveMonitor({ ...data })
    const ret = {
        monitorId,
        patientId,
        roomId,
        monitorFound: !!monitorImage
    }
    return ret;
}



module.exports = {
    monitorSetupPost,
}