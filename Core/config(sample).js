module.exports = class Config {
    constructor() {
        this.serverPort = 3000;
        this.author = '';
        this.identityKey = '';
        this.mongoDBuri = ''; //mongodb+srv://<username>:<password>@<link>
        this.databaseName = ''; //mongodb database name
        this.dataCollectionName = ''; //mongodb Inventory collection
        this.loginCollectionName = ''; //mongodb User collection
    }
  }