var co = require('co');
var moment = require('moment');
var redis  = require("promise-redis")();
var client = redis.createClient({
    host:'127.0.0.1',
    port:6380
});
var controllConsole = require('./controllConsole');
module.exports ={
    saveConnectInfo : function(clientId,cb){
        co(function *(){
            var splitClientId = clientId.split('_');
            if(splitClientId[0] === 'mqttjs' ||splitClientId[0]==='serverjs'){
            }else{
                var onlineAndTime={
                    'time' : moment().format(),
                    'message' : 'online'
                }
                var correctClientId=clientId.split('/')[0];
                var clientConnect = yield client.set(correctClientId+'-status',JSON.stringify(onlineAndTime));
                controllConsole.log(0,'client connect : '+correctClientId);
            }
            cb(null,'Done');
        }).catch(function(err){
            console.log(err);
            cb(null,'error');
        })
    },
    disconnect : function(clientId,cb){
        co(function *(){
            var splitClientId = clientId.split('_');
            if(splitClientId[0] === 'mqttjs'||splitClientId[0]==='serverjs'){
            }else{
                var offlineAndTime ={
                    'time' : moment().format(),
                    'message' : 'offline'
                }
                var correctClientId=clientId.split('/')[0];
                var clientdiconnect = yield client.set(correctClientId+'-status',JSON.stringify(offlineAndTime));
                controllConsole.log(0,'client disconnect : '+correctClientId);
            }
            cb(null,'Done');
        }).catch(function(err){
            console.log(err)
            cb(null,'error');
        })
    }
}
