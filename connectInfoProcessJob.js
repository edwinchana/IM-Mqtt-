var kue = require('kue');
var connectStatus = require('./connectStatus.js')
var controllConsole = require('./controllConsole');
var queue = kue.createQueue({
    prefix: 'queue',
    redis: {
        port: 6380,
        host: '127.0.0.1'
    }
});
queue.on('job enqueue', function(id, type){
    // console.log( 'Job %s got queued of type %s', id, type );

}).on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
        if (err) return;
        job.remove(function(err){
            if (err) throw err;
            // console.log('removed completed job #%d', job.id);
        });
    });
});
queue.process('clientStatus',function(job,done){
    if(Object.keys(job.data)[0] === 'connect'){
        if(job.data.connect!=='serverSide'){
            connectStatus.saveConnectInfo(job.data.connect,done);
        }else{
            done(null,'done');
        }
    }else{
        connectStatus.disconnect(job.data.disconnect,done);
    }
})
