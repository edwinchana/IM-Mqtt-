var mosca = require('mosca');
var bluebird = require("bluebird");
var co = require('co');
var moment = require('moment');
var createJob = require('./createJobService.js');
var controllConsole = require('./controllConsole');
var ascoltatore = {
    type: 'redis',
    redis: require('redis'),
    db: 12,
    port: 6379,
    return_buffers: true, // to handle binary payloads
    host: "localhost"

};
var moscaSettings = {
    port: 8952,
    http:{
        port: 18830,
        bundle: true,
        static: './'
    },
    backend: ascoltatore,
    persistence: {
        factory: mosca.persistence.Redis
    }
};
var server = new mosca.Server(moscaSettings);
server.on('ready', setup);

server.on('clientConnected', function(client) {
    // console.log(client.id +' connect!')
    createJob.init('clientStatus',{connect:client.id},'high');
});
// fired when a message is received
server.on('published', function(packet, client) {
    var topicSplit = packet.topic.split('/');
    if(topicSplit[2]==='disconnect'){
        console.log(packet.payload.toString() +' disconnect');
        createJob.init('clientStatus',{disconnect:packet.payload.toString()},'high');
    }else if(topicSplit[0]==='msg'){
        createJob.init('seperateOnAndOff',{message:packet.payload.toString(),topic:packet.topic},'high');
    }else if(topicSplit[0]==='sys' && topicSplit[1]==='online'){
        createJob.init('clientStatus',{connect:topicSplit[2]},'high');
    }
    // console.log(packet.topic.substr(14,10));
});
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
    if(topic.slice(0,3)==='msg'){
        createJob.init('clientSubscribed',topic.toString(),'high');
        controllConsole.log(1,client.id + ' subscribed : '+ topic);
    }
});
// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
    controllConsole.log(1,client.id + ' unsubscribed : '+ topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
    console.log('clientDisconnecting : ', client.id);
    if(userCount.id.slice(0,6)!== 'mqttjs'){
        console.log(client.id);
    }
});
// fired when the mqtt server is ready
function setup() {
    console.log('Mosca server is up and running')
    server.authenticate = function(client,username,password,cb){
        var authorized = (username==='appuser'&&password.toString()==='3cR%&-mwRB4wiEtIv^3-');
        if(authorized){
            cb(null,authorized);
        }
    }
}
