var checkUserStatus = require('./checkUserStatus.js');
var express = require('express');
var app = express();
var redis  = require("promise-redis")();
var bodyParser = require('body-parser');
var router = express.Router();
var client = redis.createClient({
    host : '127.0.0.1',
    port : 6380
});
var co = require('co');
var allowCrossDomain = function(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(allowCrossDomain);
app.use('/api',router);
router.post('/arnAndUserName',function(req,res){
    if(req.body){
        storeToRedis(req.body);
        res.send('get!');
    }else{
        res.send('Err!');
    }
})
router.post('/checkUserStatus',function(req,res){
    console.log(req.body);
    var chatUserData={
        sendOwnerId :'',
        recieveOwnerId:''
    }
    Object.keys(chatUserData).forEach(function(item){
        if(!req.body[item]){
            res.send('invalid input');
        }
    })
    checkUserStatus.userStatus(res,req.body.sendOwnerId,req.body.recieveOwnerId);
})
router.post('/writeBadgeCount',function(req,res){
    if(req.body.clientId && req.body.badgeCount){
        client.set(req.body.clientId +'-badgeCount',req.body.badgeCount);
        res.send('Got it');
    }else{
        res.send('invalid input');
    }
})
router.get('/getBadgeCount/:clientId',function(req,res){
    if(req.params.clientId){
        co(function*(){
            console.log(req.params.clientId);
            var badgeCount = yield client.get(req.params.clientId +'-badgeCount');
            var regobj = {}
            if(badgeCount === null){
                regobj['clientId'] = req.params.clientId;
                regobj['badgeCount'] = 0;
            }else{
                regobj['clientId'] = req.params.clientId;
                regobj['badgeCount'] = badgeCount;
            }
            res.send(regobj);
        }).catch(function(err){
            if(err)console.log(err)
        })
    }else{
        res.send('invalid input');
    }
})
function storeToRedis(userInfo){
    var name = 'Someone';
    if(userInfo.deviceARNs){
        userInfo.deviceARNs.forEach(function(deviceInfo,index){
            client.set(userInfo.ownerId+'-ARN-'+index,deviceInfo.deviceARN);
        })
        if(userInfo.userName!==''){
            name = userInfo.userName;
        }else{
            if(userInfo.firstName!==''&& userInfo.lastName!==''){
                name = userInfo.firstName+' '+userInfo.lastName;
            }else if(userInfo.firstName!==''&& userInfo.lastName===''){
                name = userInfo.firstName;
            }else if(userInfo.firstName ===''&& userInfo.lastName!==''){
                name = userInfo.lastName;
            }
        }
    }else if(userInfo.deviceARN){
        client.set(userInfo.ownerId+'-ARN-0',userInfo.deviceARN[0]);
        if(userInfo.userName!==''){
            name = userInfo.userName;
        }else{
            if(userInfo.firstName!==''&& userInfo.lastName!==''){
                name = userInfo.firstName+' '+userInfo.lastName;
            }else if(userInfo.firstName!==''&& userInfo.lastName===''){
                name = userInfo.firstName;
            }else if(userInfo.firstName ===''&& userInfo.lastName!==''){
                name = userInfo.lastName;
            }
        }
    }
    client.set(userInfo.ownerId+'-NAME',name);
}

app.listen(3000);
