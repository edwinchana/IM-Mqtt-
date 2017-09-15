var AWS = require('aws-sdk');
AWS.config.update({
    region : 'ap-northeast-1',
    endpoint : 'https://dynamodb.ap-northeast-1.amazonaws.com',
    accessKeyId : 'AKIAJPBR5B5DNQLIV72A',
    secretAccessKey : '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'
})
AWS.config.setPromisesDependency(require('bluebird'));
var docClient = new AWS.DynamoDB.DocumentClient();
var controllConsole = require('./controllConsole');
var co = require('co');
var mqtt = require('mqtt');
var client1 = mqtt.connect('mqtt://',{
    host: 'localhost',
    port: 8952,
    clean :true,
    clientId:'serverSide',
    username : 'appuser',
    password : '3cR%&-mwRB4wiEtIv^3-',
    will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 1,
        retain: false
    }});
    var redis  = require("promise-redis")();
    var client = redis.createClient({
        host : '127.0.0.1',
        port : 6380
    });
    var createJob = require('./createJobService.js');

    module.exports = {
        subscribed : function(topic,cb){
            co(function*(){
                var splitTopic = topic.split('/')
                var correctTopic = splitTopic[0]+'/'+splitTopic[1]+'/'+splitTopic[2];
                var replies = yield client.keys(correctTopic+'/*');
                if(replies.length !== 0){
                    var result = yield client.mget(replies);
                    for(var i=0;i<result.length;i++){
                        console.log('serverSide publish $$ ' + correctTopic + ': ' +result[i]);
                        client1.publish(correctTopic,result[i],{qos:1,retain:false});
                        createJob.init('backupOffMsgtoOnMsg',{topic:correctTopic,message:result[i]},'high');
                        var delMsg = yield client.del(replies[i]);
                    }
                }
                cb(null,'Done');
            }).catch(function(err){
                console.log(err);
                cb(null,'error');
            })
        }
    }
