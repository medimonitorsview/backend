const axios = require('axios').default;
const moment = require('moment');
const { coviewConfig } = require('../../config');
const { monitorList, monitorGet } = require('./monitor');
const { monitorImageGetLatest } = require('./monitor-image');
const { nameMapping } = require('../helpers/mapping');
const PB_REGEX = /(?<systolic>[0-9]+)[\/\\](?<diastolic>[0-9]+)/;

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
    if (coviewConfig.logRequests) {
        console.log(`sent to coview: ${data}`)
    }
    console.log(`received ${res && res.data} form coview`);

    return {
        status: "Ok"
    }

}

const enrichNames = (name, value) => {
    if (!name || !value) {
        return [];
    }
    if (name === 'IBP' || name === 'NIBP') {
        const match = value.match(PB_REGEX);
        if (match && match.length === 3) {
            return [
                { name: 'NIBP-Systole', value: match[1] },
                { name: 'NIBP-Diastole', value: match[2] },
            ]
        }
        return [];
    }
    else {
        return [{ name, value }]
    }
}
const mapName = (name, value, deviceCategory) => {
    try {
        const device = nameMapping[deviceCategory];
        if (!device) {
            return [];
        }
        const enriched = enrichNames(name, value);
        const mappedName = enriched.map(n => {
            const newName = device[n.name] && device[n.name].coview;
            if (newName) {
                return { name: newName, value: n.value };
            }
            return null;
        }).filter(n => n);
        return mappedName;
    }
    catch (ex) {
        return [];
    }
}

const handle = async () => {
    try {
        const monitors = await monitorList();
        const monitorsInfo = await Promise.all(monitors.map(m => monitorGet({ monitorId: m })));
        const monitorsData = await Promise.all(monitors.map(m => monitorImageGetLatest({ monitorId: m })));
        const now = moment();
        const filtered = monitorsData.filter(m => m && now.diff(moment(m.timestamp)) < coviewConfig.intervalMs);
        if (filtered.length) {
            const transformed = filtered.map(m => {
                const monitorInfo = monitorsInfo.find(mi => mi.monitorId === m.monitorId) || {};
                const initial = { timestamp: now.valueOf(), id: m.monitorId, name: `${monitorInfo.roomId}:${monitorInfo.patientId}` };
                const mapped = m.ocrResults.reduce((prev, r) => {
                    if (r.value && r.name) {
                        const names = mapName(r.name, r.value, monitorInfo.deviceCategory);
                        if (names && Array.isArray(names)) {
                            names.forEach(n => prev.push({ name: n.name, value: n.value }))
                        }
                    }
                    return prev;
                }, []).filter(r => r);
                if (mapped.length > 0) {
                    const reduced = mapped.reduce((prev, cur) => {
                        if (cur.name) {
                            prev[cur.name] = cur.value;
                        }
                        return prev;
                    }, initial);
                    return reduced;
                }
                return null;
            }).filter(r => r);
            if (transformed.length > 0) {
                const stringified = transformed.map(JSON.stringify).join('\n');
                result = await sendMeasure(stringified);
            }
            else {
                console.log(`no mapped data to send to coview in the last ${coviewConfig.intervalMs} milli`);
            }
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