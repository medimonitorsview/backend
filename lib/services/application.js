const db = require('../storage/mongo');
const fs = require('fs');
const config = require('../../config')
const { promisify } = require('util')
const existsProm = promisify(fs.exists)
const mkdirProm  = promisify(fs.mkdir)
const rmdir = require("rmdir-promise");



const applicationGet =  async (name, version=undefined) => {
    try {
        if (name){
            const app_versions = await db.getApplication({name, version})
            const ret = app_versions.map(app => (app.version)).sort().reverse()
            return ret
        }
    }
    catch (error){
        console.log("Error in applicationGet " + error.message)
        return undefined
    }
}

const getApplicatiosDoc =  async (name, version=undefined) => {
    try {
        if (name){
            const app_versions = await db.getApplication({name, version})
            return app_versions
        }
    }
    catch (error){
        console.log("Error in applicationGet " + error.message)
        return undefined
    }
}

const getLatestVersion = async (name) => {
    try {
        if (name){
            const latest_version = await db.getLatestVersion({name})
            const ret = latest_version.map(app => (app.version))
            return ret
        }
    }
    catch (error){
        console.log("Error in getLatestVersion " + error.message)
        return undefined
    }
}

const applicationGetFile = async (name, version) => {
    try {
        if(!name)
            throw new Error("Application name must be valid")
        if(!version)
            throw new Error("Application version must be valid")
        if (name && version){
            const application_doc = await db.getApplication({name, version})
            const file = application_doc.map(doc => (doc.path))
            const path = file[0]
            return path
        }
    }
    catch (error){
        console.log("Error in applicationGetFile " + error.message)
        return undefined
    }
}

const createApplicationDir = async (name, version) => {
    try{
        const files_location = config.applicationConfig.filesLocation
        if(!files_location)
            throw new Error("filesLocation variable is not defined in config file.")
        let exists = await existsProm(files_location)
        if (!exists){
            await mkdirProm(files_location)
        }

        const app_dir = files_location + "/"+name
        exists = await existsProm(app_dir)
        if (!exists){
            await mkdirProm(app_dir)
        }
        
        const ver_dir = app_dir+"/"+version
        exists = await existsProm(ver_dir)
        if (!exists){
            await mkdirProm(ver_dir)
        }
        return ver_dir
  
    }
    catch(error) {
        console.log("Error in createApplicationDir " + error.message)
        return undefined
    }
}


const saveApplicationData = async (name, path, version) => {
    try{
        ret = await db.saveApplication({ name, path, version });
        return ret
    }   
    catch(error) {
        console.log("Error in saveApplicationData " + error.message)
        return undefined
    }
}

const deleteApplicationData = async (name, version) => {
    try{
        ret = await getApplicatiosDoc(name, version)
        const doc = ret[0]
        const filePath = doc.path
        const spot = filePath.lastIndexOf("/")
        if(spot <= 0){
            return
        }
        const dirToDelete = filePath.substring(0,spot)
        await rmdir(dirToDelete)
        const res = await db.deleteApplication(doc)
        return res
    }
    catch (error){
    console.log("Error while deleting application data ", error.message)
    return undefined
    }

}

module.exports = {
    createApplicationDir,
    applicationGet,
    getLatestVersion,
    applicationGetFile,
    saveApplicationData,
    getApplicatiosDoc,
    deleteApplicationData
}
