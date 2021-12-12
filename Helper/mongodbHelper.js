const {MongoClient} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

module.exports = class MongoDBHelper {
    constructor(options) {
        this.uri = options.uri;
        this.client = new MongoClient(this.uri);
        this.databaseName = options.databaseName;
        this.dataCollectionName = options.dataCollectionName;
        this.client.connect();
    }

    //return an object of database
    getDatabaseList = async () => {
        try{
            return await this.client.db().admin().listDatabases();
        }catch(e){
            console.error(e);
        }
    }

    //fetch inventory by id
    getInventoryById = async (id) => {
        id = new ObjectId(id);
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).find({_id: id}).toArray();
        }catch(e){
            console.error(e);
        }
    }

    //fetch all inventory
    getAllInventory = async () => {
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).find().toArray();
        }catch(e){
            console.error(e);
        }
    }

    //get inventory count
    getCollectionCount = async () => {
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).countDocuments();
        }catch(e){
            console.error(e);
        }
    }

    //create Inventory
    createInventory = async (Inventory) => {
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).insertOne(Inventory);
        }catch(e){
            console.error(e);
        }
    }

    //modify Inventory records
    modifyInventory = async (id, Inventory) => {
        id = new ObjectId(id);
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).updateOne({_id: id}, {$set: Inventory});
        }catch(e){
            console.error(e);
        }
    }

    //get User by username
    getUserByUsername = async (username) => {
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).find({username: username}).toArray();
        }catch(e){
            console.error(e);
        }
    }

    //deleteInventoryById
    deleteInventoryById = async (id) => {
        id = new ObjectId(id);
        try{
            return await this.client.db(this.databaseName).collection(this.dataCollectionName).deleteOne({_id: id});
        }catch(e){
            console.error(e);
        }
    }

}