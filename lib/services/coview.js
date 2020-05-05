const axios = require('axios').default;
const moment = require('moment');
const { coviewConfig } = require('../../config');
const { monitorList, monitorGet } = require('./monitor');
const { monitorImageGetLatest } = require('./monitor-image');

const options = {
    timeout: 10000
}
const baseUrl = () => (`${coviewConfig.schema}://${coviewConfig.host}:${coviewConfig.port}/${coviewConfig.path}`);

const sendMeasure = async (data) => {
    const url = `${baseUrl()}`
    const res = await axios.request({
        url,
        method: 'post',
        data,
        headers: { 'content-type': 'application/json' },
        ...options
    });
    return {
        status: "Ok"
    }

}

const handle = async () => {
    try {
        const monitors = await monitorList();
        const monitorsInfo = await Promise.all(monitors.map(m => monitorGet({ monitorId: m })));
        const monitorsData = await Promise.all(monitors.map(m => monitorImageGetLatest({ monitorId: m })));
        const now = moment();
        const filtered = monitorsData.filter(m => now.diff(moment(m.timestamp)) < coviewConfig.intervalMs);
        if (filtered.length) {
            const transformed = filtered.map(m => {
                const monitorInfo = monitorsInfo.find(mi => mi.monitorId === m.monitorId) || {};
                const initial = { timestamp: now.valueOf(), id: m.monitorId, name: `${monitorInfo.roomId}:${monitorInfo.patientId}` };
                const reduced = m.ocrResults.reduce((prev, cur) => {
                    if (cur.value && cur.name) {
                        prev[cur.name] = cur.value;
                    }
                    return prev;
                }, initial);
                return reduced;
            });
            const stringified = transformed.map(JSON.stringify).join('\n');
            await sendMeasure(stringified);
        }
        else {
            console.log(`no data to send to coview in the last ${coviewConfig.intervalMs} milli`);
        }
    }
    catch (ex) {
        console.error(`error in coview handle: ${ex.message}`);
    }
    finally {
        if (coviewConfig.enabled) {
            setTimeout(handle, coviewConfig.intervalMs);
        }
    }
}
const start = () => {
    if (coviewConfig.enabled) {
        setTimeout(handle, coviewConfig.intervalMs);
    }
}

module.exports = {
    sendMeasure,
    start
}