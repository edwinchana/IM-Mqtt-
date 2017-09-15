var AWS = require('aws-sdk');
var co = require('co');

AWS.config.setPromisesDependency(require('bluebird'));
var docClient = new AWS.DynamoDB.DocumentClient();
var redis  = require("promise-redis")();
var client = redis.createClient({
    host : '127.0.0.1',
    port : 6380
});
module.exports = {
    userStatus : function(res,sendOwnerId,recieveOwnerId){
        co(function*(){
            var redisData;
            var topic = 'msg/'+recieveOwnerId+'/'+sendOwnerId;
            var sendNameStatus = yield client.get(sendOwnerId+'-status');
            var recieveNameStatus = yield client.get(recieveOwnerId+'-status');
            var sendName = yield client.get(sendOwnerId+'-NAME');
            var recieveName = yield client.get(recieveOwnerId+'-NAME');
            var replies = yield client.keys(topic+'*');
            if(replies.length!==0){
                redisData = yield client.mget(replies);
            }else {
                redisData = [];
            }
            var queryParams = {
                TableName : 'IMBackup',
                KeyConditionExpression: "IMTopic = :IMTopic",
                ExpressionAttributeValues:{}
            }
            queryParams['ExpressionAttributeValues'][':IMTopic'] = topic;
            var queryData = yield docClient.query(queryParams).promise();
            var regobj = {
                sendNameStatus : sendNameStatus,
                recieveNameStatus : recieveNameStatus,
                sendMsgName : sendName,
                recieveMsgName : recieveName,
                onMsg : {},
                offMsg : {}
            }
            console.log(queryData);
            if(queryData.Items.length !== 0){
                queryData.Items.forEach(function(item,index){
                    console.log(item);
                    var msgObj = {};
                    var time = new Date(item.IMTimeStamp*1000);
                    var year = time.getFullYear();
                    var month = "0"+time.getMonth();
                    var date = "0"+time.getDate();
                    var hours = time.getHours();
                    var minutes = "0" + time.getMinutes();
                    var seconds = "0" + time.getSeconds();
                    msgObj['time']= year+'/'+month.substr(-2)+'/'+date.substr(-2) + ' '+ hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                    var msgContent = JSON.parse(item.Msg);
                    msgObj['text'] = msgContent.text;
                    regobj['onMsg'][index+1] = msgObj;
                })
            }
            if(redisData.length!== 0){
                redisData.forEach(function(item,index){
                    var msgObj = {};
                    var msgContent = JSON.parse(item)
                    var time = new Date(msgContent.timestamp*1000);
                    var year = time.getFullYear();
                    var month = "0"+time.getMonth();
                    var date = "0"+time.getDate();
                    var hours = time.getHours();
                    var minutes = "0" + time.getMinutes();
                    var seconds = "0" + time.getSeconds();
                    msgObj['time']= year+'/'+month.substr(-2)+'/'+date.substr(-2) + ' '+ hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                    msgObj['text'] = msgContent.text;
                    regobj['offMsg'][index+1] = msgObj;
                })
            }
            if(Object.keys(regobj['onMsg']).length===0&&Object.keys(regobj['offMsg']).length===0){
                res.send('no response Data')
            }else{
                res.send(regobj);
            }
        }).catch(function(err){
            if(err)console.log(err);
        })
    }
}
