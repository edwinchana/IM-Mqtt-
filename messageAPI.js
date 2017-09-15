var co = require('co');
var express = require('express');
var app = express();
var router = express.Router();
var redis  = require("promise-redis")();
var client = redis.createClient({
    host:'127.0.0.1',
    port:6380
});
app.use('/api',router);
router.get('/offlineMsg/:id',function(req,res){
    co(function*(){
        res.setHeader('Content-Type','application/json');
        var offMsgReplies = yield client.keys(req.params.id+'-m-off*');
        var offMsgResult = yield client.mget(offMsgReplies);
        console.log(offMsgResult);
        res.send(offMsgResult);
    }).catch(function(err){
        console.log(err);
        res.send(['no offline message response!!']);
    })
})
router.get('/onlineMsg/:id',function(req,res){
    co(function*(){
        res.setHeader('Content-Type','application/json');
        var onMsgReplies = yield client.keys(req.params.id+'-m-on*');
        var onMsgResult = yield client.mget(onMsgReplies);
        res.send(onMsgResult);
    }).catch(function(err){
        console.log(err);
        res.send(['no online message response!!'])
    })
});
router.get('/delonMsg/:id',function(req,res){
    co(function*(){
        res.setHeader('Content-Type','application/json');
        var delonMsgReplies = yield client.keys(req.params.id+'-m-on*');
        if(delonMsgReplies.length===0){
            res.send(['no onMsg can delete!!!'])
        }else{
            client.del(req.params.id+'-onMessage-count')
            delonMsgReplies.map(function(key){
                client.del(key);
            })
            res.send(['success!']);
        }
    }).catch(function(err){
        console.log(err);
        res.send(['no onMsg can delete!!!'])
    })
})
router.get('/deloffMsg/:id',function(req,res){
    co(function*(){
        res.setHeader('Content-Type','application/json');
        var deloffMsgReplies = yield client.keys(req.params.id+'-m-off*');
        console.log(deloffMsgReplies);
        if(deloffMsgReplies.length ===0){
            res.send(['no offMsg can delete!!!'])
        }else{
            client.del(req.params.id+'-offMessage-count')
            deloffMsgReplies.map(function(key){
                client.del(key);
            })
            res.send(['success!!']);
        }
    }).catch(function(err){
        console.log(err);
        res.send(['no offMsg can delete!!!'])
    })
})
app.listen(3000);
