const fs = require('fs');

module.exports = class Util{
    constructor(main){
        this.main = main;
    }

    base64_encode(file) {
        var bitmap = fs.readFileSync(file);
        return new Buffer.from(bitmap).toString('base64');
    }
}