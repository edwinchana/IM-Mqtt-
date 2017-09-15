var AWS = require('aws-sdk');
var co = require('co');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/api',router);

AWS.config.setPromisesDependency(require('bluebird'));
var docClient = new AWS.DynamoDB.DocumentClient();

router.post('/getofflineMsg',function(req,res){
    co(function*(){
        var queryParams = {
            TableName : 'IMOffBackup',
            KeyConditionExpression: "IMTopic = :topic",
            ExpressionAttributeValues:{}
        }
        queryParams['ExpressionAttributeValues'][':topic'] = req.body.msg;
        var queryData = yield docClient.query(queryParams).promise();
        if(queryData.Items.length === 0){
            res.send('no response Data');
        }else {
            res.send(queryData);
            var delParams = {
                TableName : 'IMOffBackup',
                Key : {}
            }
            var putParams = {
                TableName : 'IMBackup',
                Item :{}
            }
            for(var i=0;i<queryData.Count;i++){
                delParams['Key']['IMTopic'] = queryData.Items[i]['IMTopic'];
                delParams['Key']['IMTimeStamp'] = queryData.Items[i]['IMTimeStamp'];
                putParams['Item'] = queryData.Items[i];
                // var delData = yield docClient.delete(delParams).promise();
                var putData = yield docClient.put(putParams).promise();
            }
        }
    }).catch(function(err){
        console.log(err);
    })
})
router.post('/getAllMsg',function(req,res){
    co(function*(){
        var queryParams = {
            TableName : 'IMBackup',
            KeyConditionExpression: "IMTopic = :topic",
            ExpressionAttributeValues:{}
        }
        queryParams['ExpressionAttributeValues'][':topic'] = req.body.msg;
        var queryData = yield docClient.query(queryParams).promise();
        if(queryData.Items.length === 0){
            res.send('no response Data');
        }else {
            res.send(queryData);
        }
    }).catch(function(err){
        console.log(err);
    })
})

app.listen(3000);
