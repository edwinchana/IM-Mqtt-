var AWS = require('aws-sdk');
var moment = require('moment');
AWS.config.update({
    region : 'ap-northeast-1',
    accessKeyId : 'AKIAJPBR5B5DNQLIV72A',
    secretAccessKey : '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'
})
AWS.config.setPromisesDependency(require('bluebird'));
var sns = new AWS.SNS();
var co = require('co');
var axios = require('axios');
var redis  = require("promise-redis")();
var client = redis.createClient({
    host:'127.0.0.1',
    port:6380
});
module.exports = {
    publishSNSmsg : function(packet,cb){
        co(function*(){
            const API = 'http://52.193.49.196:3000/1/api/NotificationLogs/getUserARNAndUnReadCount';
            var sendMsgId = packet.topic.split('/')[2];
            var receivedMsgId = packet.topic.split('/')[1];
            var arnReplies = yield client.keys(receivedMsgId+'-ARN*');
            var userInfo,arns;
            if(arnReplies.length === 0){
                userInfo = yield axios.post(API,{
                    "payload":{
                        "ownerId":receivedMsgId,
                        "ownerId2":sendMsgId
                    }
                })
                arns = userInfo.data.response.allArn;
                arns.forEach(function(arn,index){
                    client.set(receivedMsgId+'-ARN-'+index,arn);
                    client.expire(receivedMsgId+'-ARN-'+index,43200);
                })
            }else{
                arns = yield client.mget(arnReplies);
            }
            var sendMsgName = yield client.get(sendMsgId+'-NAME');
            if(sendMsgName === null){
                userInfo = yield axios.post(API,{
                    "payload":{
                        "ownerId":receivedMsgId,
                        "ownerId2":sendMsgId
                    }
                })
                sendMsgName = 'Someone';
                if(userInfo.data.response.userName2!==''){
                    sendMsgName = userInfo.data.response.userName2;
                }else{
                    if(userInfo.data.response.firstName2!==''&& userInfo.data.response.lastName2!==''){
                        sendMsgName = userInfo.data.response.firstName2+' '+userInfo.data.response.lastName2;
                    }else if(userInfo.data.response.firstName2!==''&& userInfo.data.response.lastName2===''){
                        sendMsgName = userInfo.data.response.firstName2;
                    }else{
                        sendMsgName = userInfo.data.response.lastName2;
                    }
                }
                client.set(sendMsgId+'-NAME',sendMsgName);
                client.expire(sendMsgId +'-NAME',43200);
            }
            var badgeCount = yield client.get(receivedMsgId+'-badgeCount');
            if(badgeCount === null){
                badgeCount = 0;
            }
            badgeCount++;
            client.set(receivedMsgId+'-badgeCount',badgeCount);
            var acme = {
                userIdFrom :'',
                ownerId:'',
                notificationType:'NOTIFY_DEEPBLU_IM',
                notification:sendMsgName +': '+packet.message,
                topic:packet.topic,
                status:'unread',
                createDT:moment().format()
            }
            // console.log(arn.data.response);
            var payload = {
                default : sendMsgName +' send one message!',
                APNS_SANDBOX: {
                    aps: {
                        alert: {
                            "loc-key" : sendMsgName +' send one message!',
                            "loc-args" : []
                        },
                        sound: 'default',
                        badge: badgeCount,
                        acme: JSON.stringify(acme)
                    }
                },
                APNS : {
                    aps : {
                        alert:{
                            "loc-key" : sendMsgName +' send one message!',
                            "loc-args" : []
                        },
                        sound:'default',
                        badge:badgeCount,
                        acme :JSON.stringify(acme)
                    }
                },
                GCM : {
                    data : {
                        message : sendMsgName +' send one message!'
                    }
                }
            };
            // console.log(payload.APNS);
            payload.APNS_SANDBOX = JSON.stringify(payload.APNS_SANDBOX);
            payload.APNS = JSON.stringify(payload.APNS);
            payload.GCM = JSON.stringify(payload.GCM);
            payload = JSON.stringify(payload);
            // arns.push('arn:aws:sns:ap-northeast-1:459536672544:endpoint/APNS/Deepblu_iOS_AppStore_Prod/b0a7c7a6-97b0-30d1-8c2b-69b5a0268b0a');
            arns.forEach(function(arn){
                var params = {
                    Message: payload,
                    MessageStructure: 'json',
                    TargetArn: arn
                }
                sns.publish(params,function(err,data){
                    if(err)console.log(err);
                    else console.log(data);
                })
            })
            cb(null,'done');
        }).catch(function(err){
            console.log(err);
            cb(null,'error');
        })
    }
}
