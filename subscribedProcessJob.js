var kue = require('kue');
var subscribed = require('./subscribed.js');
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
queue.process('clientSubscribed',function(job,done){
    subscribed.subscribed(job.data,done);
})
