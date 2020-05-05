const mongoose = require('mongoose');
const cache = require('./cache')
const { timeouts } = require('../../config');
class Mongo {

    async init(config) {
        this._config = config;
        await mongoose.connect(this._config.connection, { useNewUrlParser: true });
        this._db = mongoose.connection;
        this._createSchemas();
        this._savedImagesToDb = {}
    }

    _key({ monitorId, imageId }) {
        return `${monitorId}:${imageId}`;
    }
    _createSchemas() {
        const monitorImageSchema = new mongoose.Schema({
            monitorId: { type: String, index: true },
            imageId: { type: Number, index: true },
            file: Buffer,
            timestamp: { type: Date, index: true },
            ocrResults: { type: [{}] },
            ocrResultsFromDevice: { type: [{}] },
        });

        this._monitorImage = mongoose.model('monitorImage', monitorImageSchema);

        const monitorSetupSchema = new mongoose.Schema({
            monitorId: { type: String, index: true },
            monitorImage: Buffer,
            patientImage: Buffer,
            roomImage: Buffer,
            patientId: String,
            roomId: String,
            deviceCategory: String,
            deviceModel: String,
            segments: { type: [{}] },
            screenCorners: { type: {} },
            imageId: { type: Number, index: true },
            timestamp: { type: Date, index: true },

        });
        monitorSetupSchema.set('toObject', {
            transform: (doc, ret, options) => { delete ret['_id'] },
        })

        this._monitorSetup = mongoose.model('monitorSetup', monitorSetupSchema);
        
        const applicationStorageSchema = new mongoose.Schema({
            name: { type: String, index: true },
            path: { type: String},
            version: { type: String, index: true},
        });

        this._applicationStorage = mongoose.model('applicationStorage', applicationStorageSchema);

    }

    async saveMonitorImage(data) {
        try {
            const { file, ...toSave } = data;
            const key = this._key(data);
            if (file && Date.now() - (this._savedImagesToDb[data.monitorId] || 0) > timeouts.saveToDb) {
                toSave.file = file
                this._savedImagesToDb[data.monitorId] = Date.now();
                console.log(`saved ${key} to db`);
            }
            let doc = await this._monitorImage.find({
                monitorId: data.monitorId, imageId: data.imageId
            }).sort({ timestamp: 'desc' }).limit(1);
            if (doc && doc[0]) {
                const updateDoc = doc[0];
                if (toSave.ocrResults) {
                    updateDoc.ocrResults = toSave.ocrResults;
                    updateDoc.markModified("ocrResults");
                }
                if (toSave.ocrResultsFromDevice) {
                    updateDoc.ocrResultsFromDevice = toSave.ocrResultsFromDevice;
                    updateDoc.markModified("ocrResultsFromDevice");
                }
                updateDoc.imageId = toSave.imageId
                updateDoc.monitorId = toSave.monitorId;
                updateDoc.file = toSave.file || updateDoc.file;
                updateDoc.timestamp = toSave.timestamp || updateDoc.timestamp;
                await updateDoc.save();


            }
            else {
                doc = await this._monitorImage.create(toSave);
                await doc.save();
            }
            if (file) {
                cache.cache.set(key, file);
            }
        } catch (error) {
            console.error('saveMonitorImage error: ' + error.message)
        }
    }

    async getMonitorImageForOcr({ monitorId, imageId }) {
        try {
            const query = {
                monitorId, imageId
            }
            const doc = await this._monitorImage.find(query).sort({ timestamp: 'desc' }).limit(1);

            if (doc && doc[0]) {
                const image = doc[0]
                const file = image.file || cache.cache.get(this._key(image))
                const ocrResults = image.ocrResultsFromDevice;
                if (file) {
                    return { file, imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults }
                }
                else return { imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults }
            }
            return null;
        } catch (error) {
            console.error('saveMonitorImage error: ' + error.message)
            throw error.message;
        }
    }
    async getMonitorImage({ monitorId, imageId, withOcr = true }) {
        try {
            let doc;
            if (imageId != null) {
                const query = {
                    monitorId, imageId
                }
                if (withOcr) {
                    query.ocrResults = { $exists: true, $ne: [] }
                }
                doc = await this._monitorImage.find(query).sort({ timestamp: 'desc' }).limit(1);
            }
            else {
                const query = {
                    monitorId, ocrResults: { $exists: true }
                }
                if (withOcr) {
                    query.ocrResults = { $exists: true, $ne: [] }
                }
                doc = await this._monitorImage.find(query).sort({ timestamp: 'desc' }).limit(1);
            }
            if (doc && doc[0]) {
                const image = doc[0]
                const file = image.file || cache.cache.get(this._key(image))
                const ocrResults = image.ocrResults && image.ocrResults.length ? image.ocrResults : image.ocrResultsFromDevice;
                if (file) {
                    return { file, imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults }
                }
                else return { imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults }
            }
            return null;
        } catch (error) {
            console.error('saveMonitorImage error: ' + error.message)
            throw error.message;
        }
    }

    async getMonitorImages({ monitorId, filter, limit = 100 }) {
        try {
            const query = {
                monitorId
            }
            if (filter) {
                query.file = { $exists: true }
            }
            const doc = await this._monitorImage.find(query).sort({ timestamp: 'desc' }).limit(limit);
            if (doc) {
                return doc.map(d => {
                    const file = cache.cache.get(this._key(d))
                    return {
                        imageId: d.imageId,
                        hasImage: !!file,
                        ocrResults: d.ocrResults,
                        timestamp: d.timestamp
                    }
                })
            }
            // if (doc && doc[0]) {
            //     const image = doc[0]
            //     const file = cache.cache.get(this._key(image))
            //     if (file) {
            //         return { file, imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults: image.ocrResults }
            //     }
            //     else return { imageId: image.imageId, monitorId, timestamp: image.timestamp, ocrResults: image.ocrResults }
            // }
            return null;
        } catch (error) {
            console.error('saveMonitorImage error: ' + error.message)
            throw error.message;
        }
    }

    async getMonitors({ monitorId } = {}) {
        try {
            const query = monitorId ? {
                monitorId
            } : {

                }
            const doc = await this._monitorSetup.find(query);
            return doc;
        } catch (error) {
            console.error('getMonitors error: ' + error.message)
            throw error.message;
        }
    }

    async deleteMonitor({ monitorId }) {
        try {
            const query = {
                monitorId
            } 
            const res1 = await this._monitorSetup.deleteMany(query);
            const res2 = await this._monitorImage.deleteMany(query);
            return { status: 'Deleted', monitors: res1.deletedCount, images: res2.deletedCount }
        } catch (error) {
            console.error('getMonitors error: ' + error.message)
            throw error.message;
        }
    };

    async updateMonitor(doc, { segments, imageId, ...data }) {
        if (segments) {
            doc.segments = segments;
            doc.markModified("segments");
        }
        doc.imageId = imageId
        doc.monitorImage = data.monitorImage ? Buffer.from(data.monitorImage, 'base64') : null;
        doc.monitorId = data.monitorId;
        doc.patientImage = data.patientImage ? Buffer.from(data.patientImage, 'base64') : null;
        doc.patientId = data.patientId || doc.patientId;
        doc.deviceCategory = data.deviceCategory || doc.deviceCategory;
        doc.deviceModel = data.deviceModel || doc.deviceModel;
        doc.roomImage = data.roomImage ? Buffer.from(data.roomImage, 'base64') : null
        doc.roomId = data.roomId || doc.roomId;
        if (data.screenCorners) {
            doc.screenCorners = data.screenCorners
            doc.markModified('screenCorners');
        }
        doc.timestamp = data.timestamp || doc.timestamp;
        await doc.save();
        return doc;
    }

    async saveMonitor(data) {
        try {
            const monitors = await this.getMonitors({ monitorId: data.monitorId })
            if (monitors && monitors[0]) {
                return await this.updateMonitor(monitors[0], data)
            }
            const doc = await this._monitorSetup.create(data);
            await doc.save();
            return doc;
        } catch (error) {
            console.error('saveMonitor error: ' + error.message)
        }
    }

    async getApplication(data = {}) {
        try {
            const {name, version, path} = data
            if(!name){
                throw new Error("The name of the application must be valid")
            }
            let query = { name }
            if (version)
                query = { name, version }
            const doc = await this._applicationStorage.find(query)
            return doc;
        } catch (error) {
            console.error('getApplication error: ' + error.message)
            throw error.message;
        }
    }
    
    async getLatestVersion(data = {})
    {
        try {
            const {name} = data
            if(!name){
                throw new Error("The name of the application must be valid")
            }
            const query = { name }
            const doc = await this._applicationStorage.find(query).sort({ version: 'desc' }).limit(1);
            return doc
        }
        catch (error){
            console.log("getLatestVersion Error - " + error.message)
        }
    }
    async updateApplication(doc, data) {
        try{
            const {name, path, version } = data
            if(path)
                doc.path = path
            if(version)
                doc.version = version
            await doc.save();
            return doc;
        }
        catch (error) {
            console.error('saveApplication error: ' + error.message)
            return undefined
        }
  
    }

    async deleteApplication(doc){

        const res = await this._applicationStorage.deleteOne(doc);
        return res
    }

    async saveApplication(data){
        try {
            const {name, path, version} = data
            const application = await this.getApplication(data)
            if (application && application[0]) {
                return await this.updateApplication(application[0], data)
            }
            const doc = await this._applicationStorage.create(data);
            await doc.save();
            return doc;
        }
        catch (error) {
            console.error('saveApplication error: ' + error.message)
            return undefined
        }
    }
}

module.exports = new Mongo();