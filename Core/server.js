const http = require('http');
const fs = require('fs');
const Config = require('./config');
const url = require('url');

module.exports = class InventoryApi{
    constructor(){

        //Load Config
		this.config = new Config();

        this.httpServer = http.createServer((req, res) => {
			let path = url.parse(req.url).pathname;

            if(!path || path === '' || path === '/'){
                //主頁
                path = '/index.html';
            }
            if(!path.startsWith('api')){
                fs.readFile(`${__dirname}/../webComponent/${path}`, (err, data) => {
                    if(err){
                        res.writeHead(404);
                        res.write('404 Not Found!');
                        res.end();
                    }else{
                        res.writeHead(200, {'Content-Type':'text/html', 'charset': 'utf-8'});
                        res.write(data, 'utf8');
                        res.end();
                    }
                });
                return;
            }
        })

        
        //Start Server
        this.httpServer.listen(this.config.serverPort ? this.config.serverPort : 3000, () => {
			console.log(`Server running on Port: ${this.config.serverPort}!`);
		});
    }
}