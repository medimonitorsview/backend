const { metrics } = require('@hkube/metrics');

class Metrics {
    constructor() {

    }
    async init(config) {
        await metrics.init(config)
        this['monitor_data'] = metrics.addGaugeMeasure({
            name: 'monitor_data',
            labels: ['monitorId', 'segment_name']
        });
        this['image_id'] = metrics.addGaugeMeasure({
            name: 'image_id',
            labels: ['monitorId']
        });
    }

    getRouter() {
        return metrics.getRouter()
    }
}

module.exports = new Metrics()