var kue = require('kue');
var queue = kue.createQueue({
    prefix: 'queue',
    redis: {
        port: 6380,
        host: '127.0.0.1'
    }
});
module.exports = {
    init : function(jobtype, jobpayload, jobpriority){
        var job = queue
        .create(jobtype, jobpayload)
        .priority(jobpriority)
        .save(function(err){
            if(!err){}
            else console.log(err);
        });
    }
}
