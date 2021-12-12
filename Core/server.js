const Config = require('./config');
const express = require('express');
const path = require('path');
const session = require('express-session');
const Util = require('./util');

const MongoDBHelper = require('../Helper/mongodbHelper');

module.exports = class InventoryApi{
    constructor(){
        //Load Util
        this.util = new Util();
        //Load Config
		this.config = new Config();
        this.app = express();
        
        this.dbHelper = new MongoDBHelper({uri: this.config.mongoDBuri, databaseName: this.config.databaseName, dataCollectionName: this.config.dataCollectionName});
        this.loginHelper = new MongoDBHelper({uri: this.config.mongoDBuri, databaseName: this.config.databaseName, dataCollectionName: this.config.loginCollectionName});
        //this.dbHelper.getDatabaseList().then(dbObj => {
        //    //get database object
        //});
        this.app.engine('html', require('ejs').renderFile);

        this.auth = (req, res, next) => {
            if(req.session.username){
                next()
            }else{
                return res.redirect('/login');
            }
        }
        this.app.use(express.urlencoded({extended: true}))
        this.app.use(express.json());

        this.app.use(session({
            name: 'ssid',
            secret: this.config.identityKey,
            saveUninitialized: false,
            resave: false,
            cookie: {
                maxAge: 30 * 60 * 1000
            }
        }));

        //Routes
        this.app.get('/', (req,res) => {
            res.redirect('/home');
        });

        this.app.get('/login', (req,res) => {
            if(req.session.user){
                //already logged in
                return res.redirect('/home')
            }
            //login page
            res.sendFile(path.join(__dirname, '../webComponent/login.html'));
        });

        this.app.get('/home', this.auth, (req, res) => {
            //logged in page
            const username = req.session.username;
            this.dbHelper.getCollectionCount().then(count => {
                this.dbHelper.getAllInventory().then(records => {
                    let htmlString = '';
                    for(let i in records) {
                        htmlString += `<tr><td><a href="/details?_id=${records[i]._id}">${records[i].name}</a></td><td style="display:none;"></td><td style="display:none;"></td></tr>`;
                    }
                    res.render(path.join(__dirname, '../webComponent/home.html'), {username: username, author: this.config.author, count: count, htmlString: htmlString});
                });
                    

                    // this.util.parseRecord2HTML(result).then(htmlString => {
                    //     res.render(path.join(__dirname, '../webComponent/home.html'), {username: username, author: this.config.author, count: count, htmlString: htmlString});
                    // });
            })
        });

        this.app.get('/details', this.auth, (req, res) => {
            this.dbHelper.getInventoryById(req.query._id).then(array => {
                let inventoryObj = array[0];
                res.render(path.join(__dirname, '../webComponent/details.html'), {name: inventoryObj.name, type: inventoryObj.type, quantity: inventoryObj.quantity, street: inventoryObj.inventory_address.street, building: inventoryObj.inventory_address.building, country: inventoryObj.inventory_address.country, zipcode: inventoryObj.inventory_address.zipcode, gps: `[${inventoryObj.inventory_address.latitude},${inventoryObj.inventory_address.longitude}]`, manager: inventoryObj.manager, id: inventoryObj._id, DEL: `${inventoryObj._id}&owner=${inventoryObj.manager}`});
            })
        })

        this.app.get('/logout', this.auth, (req, res)=> {
            req.session.destroy(() => {
                //session destroyed callback
            });
            res.redirect('/');
        })
        

        this.app.post('/login', (req, res) => {
            const { username, password } = req.body;

            //connect to dabase and check 
            this.loginHelper.getUserByUsername(username).then(user => {
                if(user.length > 0){
                    if(user[0].password === password){
                        req.session.username = username;
                        res.redirect('/home');
                    }else{
                        res.redirect('/login');
                    }
                }else{
                    res.redirect('/login');
                }
            });
            

            //todo remove hardcode testing account authentication
            //todo compare username/password with database user record

            // //testing session
            // if(username === 'demo' && password === ''){
            //     req.session.username = username;
            //     return res.redirect('/home');
            // }
            // return res.redirect('/login');
        });
  
        
        //todo app route (get Create) (render the page that can create inventory items)
        this.app.get('/create', this.auth, (req, res) => {
            res.render(path.join(__dirname, '../webComponent/create.html'));
        })

        //todo app route (post create) !important --> image upload -> base64 -> database
        this.app.post('/create', (req, res) => {
            const inventoryItem = {
                name: req.body.name,
                inv_type: req.body.inv_type,
                quantity: req.body.quantity,
                photo: req.body.photo,
                photo_base64: req.body.photo_base64,
                inventory_address: {
                    street: req.body.street,
                    building: req.body.building,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    coordinates: req.body.coordinates
                },
                manager: req.body.manager,
            }
            //const {name, inv_type, quantity, street, building, country, zipcode, latitude, longitude, photo}
        });
        

        //start app
        this.app.listen(this.config.serverPort, () => console.log('Listening on port ' + this.config.serverPort));
    }

}