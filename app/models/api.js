var Sequelize = require('sequelize');
var crypto = require('crypto');
var NodeApp = require('../nodeapp');
var Config = require('../config');

// Load Env
Config.loadEnv('./.env1', function(data) {
	Config.dbhost = data.dbhost;
	Config.dbname = data.dbname;
	Config.dbuser = data.dbuser;
	Config.dbpass = data.dbpass;
	Config.dbtype = data.dbtype;
	// console.log('Config', Config);
}, function(err) {
	console.log('Env Config not loaded: ', err);
	console.log('process.env.CLEARDB_DATABASE_URL', process.env.CLEARDB_DATABASE_URL);
	const dbCreds = Config.parseHerokuEnvDB(process.env.CLEARDB_DATABASE_URL);
	// console.log('process.env', process.env);
	// console.log('process', process);
	console.log('dbCreds', dbCreds);
})

module.exports = Api = {
    
    // Api METHODS

    prepareResponse: function(response, code, data) {
        code = code || 200;
        data = data || {};
        response.set({
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            'Access-Control-Allow-Methods': 'PUT, DELETE, GET, POST',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=0',
            'Content-Type': "application/json",
            'ETag': "Studios-WebDevServer",
            'Server': NodeApp.serverName,
            'X-Powered-By': NodeApp.appName
        });
        response
            .status(code)
            .json(data);
    },

    connectDB: function() {
        var sequelize = new Sequelize(Config.dbname, Config.dbuser, Config.dbpass, {
            host: Config.dbhost,
            dialect: Config.dbtype, 
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            }
        });

        return sequelize;
    },

    loadDBModels: function(callback) {
        var db = this.connectDB();
        if(db) {
            // Users
            NodeApp.Models.User = db.define( NodeApp.TablePrefix + 'users', {
                userName: {
                    type: Sequelize.STRING,
                    field: 'username'
                },
                email: {
                    type: Sequelize.STRING
                },
                /*
                password: {
                    type: Sequelize.STRING
                },
                */
                lastVisit: {
                    type: Sequelize.INTEGER,
                    field: 'lastvisit',
                    get: function() {
                        return this.getDataValue('lastVisit') ? new Date(this.getDataValue('lastVisit') * 1000) : '';
                    }
                },
                activation: {
                    type: Sequelize.STRING
                },
                status: {
                    type: Sequelize.ENUM('active', 'disabled')
                },
                memberId: {
                    type: Sequelize.INTEGER,
                    field: 'member_id',
                    references: {
                        model: NodeApp.Models.Member,
                        key: 'id'
                    }
                }
            }, {
                timestamps: false,
                freezeTableName: true // Model tableName will be the same as the model name
            });
            
            // Members
            NodeApp.Models.Member = db.define( NodeApp.TablePrefix + 'group_members', {
                firstName: {
                    type: Sequelize.STRING,
                    field: 'first_name'
                },
                lastName: {
                    type: Sequelize.STRING,
                    field: 'last_name'
                },
                phone: {
                    type: Sequelize.STRING
                },
                address: {
                    type: Sequelize.INTEGER,
                    field: 'mailing_address'
                },
                address2: {
                    type: Sequelize.STRING,
                    field: 'mailing_address2'
                },
                city: {
                    type: Sequelize.STRING,
                    field: 'mailing_city'
                },
                state: {
                    type: Sequelize.STRING,
                    field: 'mailing_state'
                },
                zip: {
                    type: Sequelize.STRING,
                    field: 'mailing_zip'
                },
                facebook: {
                    type: Sequelize.STRING,
                    field: 'facebook_link'
                },
                twitter: {
                    type: Sequelize.STRING,
                    field: 'twitter_link'
                },
                linkedin: {
                    type: Sequelize.STRING,
                    field: 'linkedin_link'
                },
                serviceProviderType: {
                    type: Sequelize.STRING,
                    field: 'service_provider_type',
                    get: function() {
                        return (this.ProviderType ? this.ProviderType.providerTypeName : 'None')
                    }
                },
                memberType: {
                    type: Sequelize.STRING,
                    field: 'g_id',
                    get: function() { return this.getDataValue('memberType') ? Api.getMemberType(this.getDataValue('memberType')) : '' }
                }
            }, {
                timestamps: false,
                instanceMethods: { 
                    getFullname: function() { return [this.firstName, this.lastName].join(' ') },
                    /*
                    toJSON: function () {
                        var repr = this.dataValues;
                        return repr;
                    }
                    */
                },
                getterMethods: { 
                    fullName: function() { return [this.getDataValue('firstName'), this.getDataValue('lastName')].join(' ') },
                    fullAddress: function() { 
                        if(this.address && this.city)
                            return [this.address, this.address2].join(' ') + ", " + this.city + " " + [this.state, this.zip].join(' ');
                        
                        return '';
                    },
                    // memberType: function() { return Api.getMemberType(this.groupId) },
                    // serviceProviderType: function() { return (this.ProviderType ? this.ProviderType.providerTypeName : 'None') }
                },
                // freezeTableName: true // Model tableName will be the same as the model name
            });
            
            // ProviderType
            NodeApp.Models.ProviderType = db.define( NodeApp.TablePrefix + 'service_requests_categories', {
                providerTypeName: {
                    type: Sequelize.STRING,
                    field: 'name'
                }
            }, {
                timestamps: false,
            });
            
            // ServiceRequestProposals
            NodeApp.Models.ServiceRequestProposal = db.define( NodeApp.TablePrefix + 'service_request_proposals', {
                requestId: {
                    type: Sequelize.INTEGER,
                    field: 'service_request_id'
                },
                providerId: {
                    type: Sequelize.INTEGER,
                    field: 'provider_id'
                },
                timeCreated: {
                    type: Sequelize.INTEGER,
                    field: 'date',
                    get: function() {
                        return this.getDataValue('timeCreated') ? new Date(this.getDataValue('timeCreated') * 1000) : '';
                    }
                },
                description: {
                    type: Sequelize.STRING
                }
            }, {
                timestamps: false,
                getterMethods: { 
                    // timeCreated: function() { return this.timeStamp ? new Date(this.timeStamp * 1000) : '' },
                }
            });
            
            // ServiceRequests
            NodeApp.Models.ServiceRequest = db.define( NodeApp.TablePrefix + 'service_requests', {
                clientId: {
                    type: Sequelize.INTEGER,
                    field: 'user_id'
                },
                providerSelectedId: {
                    type: Sequelize.INTEGER,
                    field: 'provider'
                },
                clientName: {
                    type: Sequelize.STRING,
                    field: 'name'
                },
                clientPhone: {
                    type: Sequelize.STRING,
                    field: 'phone'
                },
                clientEmail: {
                    type: Sequelize.STRING,
                    field: 'email'
                },
                location: {
                    type: Sequelize.STRING
                },
                details: {
                    type: Sequelize.STRING,
                    field: 'comment'
                },
                date: {
                    type: Sequelize.STRING,
                },
                time: {
                    type: Sequelize.STRING,
                }
            }, {
                timestamps: false,
            });
            
            // listings
            NodeApp.Models.Listing = db.define( NodeApp.TablePrefix + 'listings', {
                categoryId: {
                    type: Sequelize.INTEGER,
                    field: 'cat'
                },
                cityId: {
                    type: Sequelize.INTEGER,
                    field: 'city'
                },
                typeId: {
                    type: Sequelize.INTEGER,
                    field: 'type'
                },
                rating: {
                    type: Sequelize.INTEGER,
                },
                featured: {
                    type: Sequelize.INTEGER,
                    field: 'feature'
                },
                title: {
                    type: Sequelize.STRING,
                },
                content: {
                    type: Sequelize.STRING,
                    field: 'body'
                },
                squareFootage: {
                    type: Sequelize.STRING,
                    field: 'square_footage'
                },
                numberOfBedrooms: {
                    type: Sequelize.STRING,
                    field: 'bedrooms'
                },
                numberOfBathrooms: {
                    type: Sequelize.STRING,
                    field: 'bathrooms'
                },
                numberOfPeople: {
                    type: Sequelize.STRING,
                    field: 'sleeps'
                },
                location: {
                    type: Sequelize.STRING
                },
                amenities: {
                    type: Sequelize.STRING,
                },
                priceRate: {
                    type: Sequelize.STRING,
                    field: 'price_nightly'
                },
                pageViews: {
                    type: Sequelize.STRING,
                    field: 'hit'
                },
                Owner: {
                    type: Sequelize.STRING,
                    field: 'author'
                },
            }, {
                timestamps: false,
            });
            
            
            NodeApp.Models.Member.hasOne(NodeApp.Models.User, {foreignKey: 'memberId', as: 'User'});
            NodeApp.Models.User.belongsTo(NodeApp.Models.Member, {foreignKey: 'memberId', as: "Member"});
            
            // targetKey for hasMany not supported yet
            // https://github.com/sequelize/sequelize/issues/4258
            // NodeApp.Models.User.hasMany(NodeApp.Models.Listing, {targetKey: 'userName', foreignKey: 'Owner', as: 'Listings'});
            // NodeApp.Models.Listing.belongsTo(NodeApp.Models.User, {targetKey: 'userName', foreignKey: 'Owner', as: "User"});
            
            NodeApp.Models.Member.hasMany(NodeApp.Models.ServiceRequestProposal, {foreignKey: 'providerId', as: 'Proposals'});
            NodeApp.Models.ServiceRequestProposal.belongsTo(NodeApp.Models.Member, {foreignKey: 'providerId', as: "Member"});
            
            NodeApp.Models.ServiceRequest.hasMany(NodeApp.Models.ServiceRequestProposal, {foreignKey: 'requestId', as: 'Proposals'});
            NodeApp.Models.ServiceRequestProposal.belongsTo(NodeApp.Models.ServiceRequest, {foreignKey: 'requestId', as: "Request"});
            
            NodeApp.Models.Member.belongsTo(NodeApp.Models.ProviderType, {foreignKey: 'service_provider_type', as: 'ProviderType'});
            NodeApp.Models.ProviderType.hasOne(NodeApp.Models.Member, {foreignKey: 'service_provider_type', as: "Member"});

            if(callback) callback('Models loaded.')
        }
    },
    
    loginUser: function(params, callback) {
        this.loadDBModels(function(res) {
            if(res) {
                var whereClause = {}
                whereClause["username"] = params.username;
                var shasum = crypto.createHash('sha1');
                    // shasum.update(params.password);
                // var passwordEnc = shasum.digest('hex');
                whereClause["password"] = shasum.update(params.password).digest('hex');
                NodeApp.Models.User.findAll({
                    where: whereClause
                }).then(function (user) {
                    console.log('user', user);
                    if(user) {
                        if(user.length)
                            callback(user[0].dataValues)
                        else callback(user.dataValues)
                    } else callback('');
                });
            }
        });
    },

    loadDBData: function(params, callback) {
        this.loadDBModels(function(res) {
            if(res) {
                var whereClause = {}, includes = [], filter = {}
                if(params.key && params.value) whereClause[params.key] = params.value;
                if(params.includes) includes = Api.getIncludes(params.includes);
                if(params.filter) whereClause = Api.addWhereFilter(whereClause, params.filter); 
                // console.log('includes', includes);
                if(params.key && params.key == 'id' && params.value) {
                    NodeApp.Models[params.model].findOne({
                        where: whereClause,
                        include: includes
                    }).then(function (item) {
                        // console.log('results', item);
                        if(item) {
                            callback(item)
                        } else callback('');
                    }).catch(function(err) {
                        console.log(err);
                        callback({"error": err});
                    });
                } else if(params.model) {
                    NodeApp.Models[params.model].findAll({
                        where: whereClause,
                        include: includes
                    }).then(function (item) {
                        // console.log('results', item);
                        if(item && item.length) {
                            callback(item)
                        } else callback('');
                    }).catch(function(err) {
                        console.log(err);
                        callback({"error": err});
                    });
                } else {
                    callback('');
                }
            }
        });
    },
    
    getIncludes: function(includesArr) {
        if(includesArr.length) {
            var includes = [];
            for(i in includesArr) {
                if(NodeApp.Models[includesArr[i].model] && includesArr[i].as && includesArr[i].includes) 
                    includes.push({model: NodeApp.Models[includesArr[i].model], as: includesArr[i].as, include: this.getIncludes(includesArr[i].includes)});
                else if(NodeApp.Models[includesArr[i].model] && includesArr[i].includes) 
                    includes.push({model: NodeApp.Models[includesArr[i].model], include: this.getIncludes(includesArr[i].includes)});
                else if(NodeApp.Models[includesArr[i].model] && includesArr[i].as) 
                    includes.push({model: NodeApp.Models[includesArr[i].model], as: includesArr[i].as}); 
                else if(NodeApp.Models[includesArr[i].model]) 
                    includes.push({model: NodeApp.Models[includesArr[i].model]}); 
            }
            return includes;
        }
        
        return;
    },
    
    getMemberGroupId: function(type) {
        return Config.grouptypes[type];
    },
    
    getMemberType: function(groupId) {
        var groups = this.invertObject(Config.grouptypes);
        return groups[groupId];
    },
    
    getMemberValuesByType: function(values, type) {
        if(!type && values) type = this.getMemberType(values.memberType);
        
        switch(type) {
            case 'Property Manager':
                delete values['facebook'];
                delete values['twitter'];
                delete values['linkedin'];
                delete values['ProviderType'];
                delete values['providerTypeId'];
                delete values['serviceProviderType'];
                delete values['Proposals'];
                break;
            case 'Client':
                delete values['facebook'];
                delete values['twitter'];
                delete values['linkedin'];
                delete values['ProviderType'];
                delete values['providerTypeId'];
                delete values['serviceProviderType'];
                delete values['Proposals'];
                break;   
            case 'Acquisition Agent':
                delete values['facebook'];
                delete values['twitter'];
                delete values['linkedin'];
                delete values['ProviderType'];
                delete values['providerTypeId'];
                delete values['serviceProviderType'];
                delete values['Proposals'];
                break;    
            case 'Virtual Agent':
                delete values['ProviderType'];
                delete values['providerTypeId'];
                delete values['serviceProviderType'];
                delete values['Proposals'];
                break;  
            case 'Service Provider':
                delete values['ProviderType'];
                delete values['facebook'];
                delete values['twitter'];
                delete values['linkedin'];
                break;    
            default:
                break;
        }
        
        delete values['service_provider_type'];
        
        return values;
    },
    
    addWhereFilter: function(whereObj, filterObj) {
        if(!filterObj) return whereObj;
        
        for(filter in filterObj) {
            if(filter=='type') whereObj['g_id'] = this.getMemberGroupId(filterObj[filter]);
            else 
                whereObj[filter] = filterObj[filter];
        }
        
        return whereObj;
    },
    
    invertObject: function (obj) {
        var new_obj = {};
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                new_obj[obj[prop]] = prop;
            }
        }

        return new_obj;
    }

}