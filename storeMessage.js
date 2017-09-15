var co = require('co');
var controllConsole = require('./controllConsole');
var AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
var docClient = new AWS.DynamoDB.DocumentClient();
var redis  = require("promise-redis")();
var client = redis.createClient({
    host : '127.0.0.1',
    port : 6380
});
var createJob = require('./createJobService.js');
module.exports = {
    storeOffMsg : function(packet,cb){
        console.log(packet.topic);
        co(function*(){
            client.set(packet.topic+'/'+Math.floor(Date.now()),packet.message);
            cb(null,'Done');
        }).catch(function(err){
            console.log(err);
            cb(null,'error');
        })
    },
    storeOnMsg : function(packet,cb){
        console.log(packet.topic);
        co(function*(){
            var msgParams = {
                TableName : '',
                Item :{}
            }
            msgParams['TableName'] = 'IMBackup';
            msgParams['Item']['IMTopic'] = packet.topic;
            msgParams['Item']['IMTimeStamp'] = JSON.stringify(Math.floor(Date.now()));
            msgParams['Item']['Msg'] = packet.message;
            var successPut = yield docClient.put(msgParams).promise();
            // console.log('onMsgSuccess');
            cb(null,'Done');
        }).catch(function(err){
            console.log(err);
            cb(null,'error');
        })
    },
    seperateOnAndOff : function(packet,cb){
        co(function*(){
            controllConsole.log(2,packet.topic +' : '+packet.message);
            var username = packet.topic.split('/',3);
            var otherName = username[1];
            var selfName = username[2];
            var replyStatus = yield client.get(otherName+'-status')
            if(replyStatus === null){
                var regobj={
                    message : 'offline'
                }
                client.set(otherName+'-status',JSON.stringify(regobj));
                createJob.init('storeOffMsg',{topic:packet.topic,message:packet.message},'high');
                if(packet.topic.split('/')[3]!=='r'){
                    createJob.init('publishSNSmsg',{topic:packet.topic,message:packet.message},'high');
                }
            }else if(JSON.parse(replyStatus).message === 'offline'){
                createJob.init('storeOffMsg',{topic:packet.topic,message:packet.message},'high');
                if(packet.topic.split('/')[3]!=='r'){
                    createJob.init('publishSNSmsg',{topic:packet.topic,message:packet.message},'high');
                }
            }else{
                createJob.init('storeOnMsg',{topic:packet.topic,message:packet.message},'high');
            }
            cb(null,'done');
        }).catch(function(err){
            console.log(err);
            cb(null,'error')
        })
    }
}
