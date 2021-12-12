const Config = require('./config');
const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const Util = require('./util');
const fs = require('fs');

const MongoDBHelper = require('../Helper/mongodbHelper');
const upload = multer({dest: path.join(__dirname, '../uploads/')});

module.exports = class InventoryApi{
    constructor(){
        //Load Util
        this.util = new Util(this);
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
                res.render(path.join(__dirname, '../webComponent/details.html'), {name: inventoryObj.name, type: inventoryObj.type, quantity: inventoryObj.quantity, photo: inventoryObj.photo, photo_minetype: inventoryObj.photo_mimetype, street: inventoryObj.inventory_address.street, building: inventoryObj.inventory_address.building, country: inventoryObj.inventory_address.country, zipcode: inventoryObj.inventory_address.zipcode, gps: `[${inventoryObj.inventory_address.latitude},${inventoryObj.inventory_address.longitude}]`, manager: inventoryObj.manager, id: inventoryObj._id, DEL: `${inventoryObj._id}&owner=${inventoryObj.manager}`});
            })
        });

        this.app.get('/edit', this.auth, (req, res) => {
            this.dbHelper.getInventoryById(req.query._id).then(array => {
                let inventoryObj = array[0];
                //check if the user is the owner
                if(inventoryObj.manager != req.session.username){
                    res.send("You are not the owner of this inventory<br><a href='/home'>back</a>");
                }
                res.render(path.join(__dirname, '../webComponent/edit.html'), {name: inventoryObj.name, type: inventoryObj.type, quantity: inventoryObj.quantity, photo: inventoryObj.photo, photo_minetype: inventoryObj.photo_mimetype, street: inventoryObj.inventory_address.street, building: inventoryObj.inventory_address.building, country: inventoryObj.inventory_address.country, zipcode: inventoryObj.inventory_address.zipcode, latitude: inventoryObj.inventory_address.latitude, longitude: inventoryObj.inventory_address.longitude, manager: inventoryObj.manager, id: inventoryObj._id});
            })
        });

        this.app.get('/delete', this.auth, (req, res) => {
            this.dbHelper.getInventoryById(req.query._id).then(array => {
                let inventoryObj = array[0];
                //check if the user is the owner
                if(inventoryObj.manager == req.session.username){
                    this.dbHelper.deleteInventoryById(req.query._id).then(result => {
                        res.redirect('/home');
                    });
                }else{
                    res.send("You are not the owner of this inventory<br><a href='/home'>back</a>");
                }
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
        });
  
 
        //todo app route (get Create) (render the page that can create inventory items)
        this.app.get('/create', this.auth, (req, res) => {
            res.render(path.join(__dirname, '../webComponent/create.html'));
        })

        //todo app route (post create) !important --> image upload -> base64 -> database
        this.app.post('/create', upload.single('photo'), (req, res) => {
            let inventoryItem = {
                name: req.body.name,
                type: req.body.inv_type,
                quantity: req.body.quantity,
                photo: undefined,
                photo_mimetype: undefined,
                inventory_address: {
                    street: req.body.street,
                    building: req.body.building,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                },
                manager: req.session.username,
            }
            //user have uploaded a photo
            if(req.file){
                //debuging method, send back the image to client
                // res.send(`<img src="data:image/png;base64,${this.util.base64_encode(req.file.path)}"/>`);
                    inventoryItem.photo = this.util.base64_encode(req.file.path);
                    inventoryItem.photo_mimetype = req.file.mimetype;

                //delete file after photo has been converted to base64 and insert to database
                fs.unlink(req.file.path, (err) => {
                    if(err) throw err;
                });
            }
            //insert record to database
            this.dbHelper.createInventory(inventoryItem).then(result => {
                res.redirect('/home');
            });
            //const {name, inv_type, quantity, street, building, country, zipcode, latitude, longitude, photo}
        });

        this.app.post('/update', upload.single('photo'), this.auth, (req,res) => {
            let inventoryObj = {
                name: req.body.name,
                type: req.body.type,
                quantity: req.body.quantity,
                inventory_address: {
                    street: req.body.street,
                    building: req.body.building,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude
                },
                manager: req.session.username
            }
            //user have uploaded a new photo
            if(req.file){
                inventoryObj.photo = this.util.base64_encode(req.file.path);
                inventoryObj.photo_mimetype = req.file.mimetype;
                //delete file after photo has been converted to base64 and insert to database
                fs.unlink(req.file.path, (err) => {
                    if(err) throw err;
                });
            }
            this.dbHelper.updateInventory(req.body._id, inventoryObj).then(result => {
                res.redirect('/home');
            });
        });
        

        //start app
        this.app.listen(this.config.serverPort, () => console.log('Listening on port ' + this.config.serverPort));
        
    }

}