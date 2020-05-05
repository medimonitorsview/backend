const NodeCache = require("node-cache");
class Cache {
    constructor() {
        this.cache = new NodeCache({
            stdTTL:600
        });
        this.lastRequestedImageForMonitor = {

        }
    }
}

module.exports = new Cache();