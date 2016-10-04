// Require NodeJs Modules
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var Sequelize = require('sequelize');

// Require App Modules
var NodeApp = require('./nodeapp');
var Api = require('./models/api');

// Start Express Module
var app = express();

module.exports = AppRouter = {
    
    apiRoutes: express.Router(),
    apiLogin: express.Router(),

    // EXPRESS 
    
    init: function() {

        // Site root uri: "/"
        app.get('/', function (req, res) {
            Api.prepareResponse(res, 200, {
                "data": "Welcome. Api Version 1 can be found @ /v1"
            });
        });

        // Api Docs: "/docs"
        app.get('/docs', function (req, res) {
            Api.prepareResponse(res, 200, {
                "data": "Api Docs."
            });
        });

        // Auth Sign in: "/signin"
        this.apiLogin.post('/signin', function(req, res) {

            // Validate
            if(!req.body['username'] || !req.body['password']) {
                Api.prepareResponse(res, 403, {
                    "success": false,
                    "error": "Please enter Username and Password."
                });
                return;
            }


            // Check User Credentials 
            Api.loginUser(req.body, function(user) {

                // If login failed
                if(!user) { 
                    Api.prepareResponse(res, 403, {
                        "success": false,
                        "error": "User login failed."
                    });
                    return;
                }

                // Create a token
                var token = jwt.sign(user, NodeApp.appSecret, {
                    expiresIn: '1440m' // expires in 24 hours
                });

                Api.prepareResponse(res, 200, {
                    "success": true,
                    "data": user,
                    "token": token
                });
            });

        });

        // route middleware to verify a token
        this.apiRoutes.use(function(req, res, next) {

            // check header or url parameters or post parameters for token
            var token = req.body.token || req.query.token || req.headers['api-access-token'];

            // decode token
            if (token) {

                // verifies secret and checks exp
                jwt.verify(token, NodeApp.appSecret, function(err, decoded) {      
                    if (err) {
                        Api.prepareResponse(res, 403, {
                            "success": false,
                            "error": "User token not valid."
                        });
                        return;    
                    } else {
                        req.decoded = decoded;    
                        next();
                    }
                });

            } else {
                Api.prepareResponse(res, 403, {
                    "success": false,
                    "error": 'User token is required.' 
                });

            }
        });


        // API ENDPOINTS 

        // Api root: "/v1/"
        this.apiRoutes.get('/', function (req, res) {
            Api.prepareResponse(res, 200, {
                "data": "PlatzShare Api"
            });
        });

        /*
        Api Get User Data: "/v1/data/users/:userId"
        Type: GET
        Params: int "userId" (required)
        Returns: NodeApp.Models.User | null
        */
        this.apiRoutes.get('/data/users/:userId', function (req, res) {
            var userId = req.params['userId'] || ''; 
            Api.loadDBData({
                model: "User",
                key: "id",
                value: userId,
                includes: [
                    {
                        model: 'Member',
                        as: 'Member'
                    }
                ]
            }, function(data) {
                Api.prepareResponse(res, 200, {
                    "success": true,
                    "data" : data || null
                });
            });
        });
        
        /*
        Api Get All Members Data: "/v1/data/members"
        Type: GET
        Returns: Array[NodeApp.Models.Member] | null
        */
        this.apiRoutes.get('/data/members/', function (req, res) {
            Api.loadDBData({
                model: "Member",
                includes: [
                    { model: 'User', as: 'User'},
                    { model: 'ProviderType', as: 'ProviderType'}
                ]
            }, function(data) {
                Api.prepareResponse(res, 200, {
                    "success": true,
                    "count": (data ? data.length : 0),
                    "data" : data || null
                });
            });
        });
        
        /*
        Api Search Members: "/v1/data/members/search"
        Type: POST
        Returns: Array[NodeApp.Models.Member] | null
        */
        this.apiRoutes.post('/data/members/search', function (req, res) {
            var filter = req.body['filter'];
            Api.loadDBData({
                model: "Member",
                filter: filter,
                includes: [
                    { model: 'User', as: 'User'},
                    { model: 'ProviderType', as: 'ProviderType'}
                ]
            }, function(data) {
                Api.prepareResponse(res, 200, {
                    "success": true,
                    "count": (data ? data.length : 0),
                    "data" : data || null
                });
            });
        });
        
        /*
        Api Get Member Data: "/v1/data/members/:memberId"
        Type: GET
        Params: int "memberId" (required)
        Returns: NodeApp.Models.Member | null
        */
        this.apiRoutes.get('/data/members/:memberId', function (req, res) {
            var memberId = req.params['memberId'] || ''; 
            Api.loadDBData({
                model: "Member",
                key: "id",
                value: memberId,
                includes: [
                    { model: 'User', as: 'User'},
                    { model: 'ProviderType', as: 'ProviderType'},
                    { 
                        model: 'ServiceRequestProposal', as: 'Proposals', 
                        includes: [
                            { model: 'ServiceRequest', as: 'Request'}
                        ]
                    }
                ]
            }, function(data) {
                // Property Managers
                if(data && data.dataValues && data.dataValues.User && Api.getMemberType(data.dataValues.memberType) == "Property Manager") {
                    Api.loadDBData({
                        model: "Listing",
                        key: "author",
                        value: data.dataValues.User.userName
                    }, function(listingData) {
                        if(listingData && listingData.length) {
                            data.dataValues.ListingsTotal = listingData.length;
                            data.dataValues.Listings = listingData;
                            data.dataValues = Api.getMemberValuesByType(data.dataValues, "Property Manager");
                        }
                        Api.prepareResponse(res, 200, {
                            "success": true,
                            "data" : data || null
                        });
                    });
                    
                    return;
                }
                data.dataValues = Api.getMemberValuesByType(data.dataValues);
                Api.prepareResponse(res, 200, {
                    "success": true,
                    "data" : data || null
                });
            });
        });
 
        // use body parser 
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        
        // apply the routes to our application with the prefix /api
        app.use('/auth', this.apiLogin);
        app.use('/v1', this.apiRoutes);

        // start server
        app.listen(8000, function () {
            console.log("You're connected. Node is running. Good.");
			
        });

    }

}