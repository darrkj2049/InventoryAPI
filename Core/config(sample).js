module.exports = class Config {
    constructor() {
        this.serverPort = 3000;
        this.author = '';
        this.identityKey = '';
        this.mongoDBuri = ''; //mongodb+srv://<username>:<password>@<link>
        this.databaseName = ''; //mongodb database name
        this.dataCollectionName = ''; //mongodb collection name
        this.loginCollectionName = ''; //mongodb collection name for login
    }
  }