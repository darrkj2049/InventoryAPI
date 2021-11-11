const {MongoClient} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

module.exports = class loginServiceProvider {
    constructor(options) {
        this.uri = options.uri;
        this.client = new MongoClient(this.uri);
        this.databaseName = options.databaseName;
        this.dataCollectionName = options.dataCollectionName;
        this.client.connect();
    }
}