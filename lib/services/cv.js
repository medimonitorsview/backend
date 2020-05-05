const axios = require('axios').default;
const path = require('path');
const align_image = '/align_image';
const ocr_path = '/run_ocr';
const showOcr_path = '/show_ocr/';
const { cvConfig } = require('../../config');
const options = {
    timeout: 10000
}
const baseUrl = ()=>(`${cvConfig.schema}://${cvConfig.host}:${cvConfig.port}/${cvConfig.path}`);
const baseUrlNoPath = ()=>(`${cvConfig.schema}://${cvConfig.host}:${cvConfig.port}`);

const alignImage = async ({ file }) => {
    // return {file, monitorId: 55};
    const url = `${cvConfig.schema}://${cvConfig.host}:${cvConfig.port}/${cvConfig.path}${align_image}`
    const res = await axios.request({
        url,
        method: 'post',
        data: file,
        headers: { 'content-type': 'image/jpeg' },
        responseType: 'arraybuffer',
        ...options
    });
    const monitorId = res.headers['x-monitor-id'];
    const alignedFile = Buffer.from(res.data,'binary');
    return {
        monitorId,
        file: alignedFile
    }

}

const showOcr = async (data) => {
    const url = `${cvConfig.schema}://${cvConfig.host}:${cvConfig.port}/${cvConfig.path}${showOcr_path}`
    const res = await axios.request({
        url,
        method: 'post',
        data,
        headers: { 'content-type': 'application/json' },
        responseType: 'arraybuffer',
        ...options
    });
    return res.data;
    

}

const ocr = async (data) => {
    // return {file, monitorId: 55};
    const url = `${cvConfig.schema}://${cvConfig.host}:${cvConfig.port}/${cvConfig.path}${ocr_path}`
    const res = await axios.request({
        url,
        method: 'post',
        data,
        headers: { 'content-type': 'application/json' },
        ...options
    });
    return res.data;
    

}

module.exports = {
    alignImage,
    ocr,
    baseUrl,
    baseUrlNoPath,
    showOcr
}