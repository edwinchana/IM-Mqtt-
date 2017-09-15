var debugBit = [1,0,1,0,1]; // connect,subscribes,meg,sys,serverpublish
module.exports = {
    log : function(level,msg){
        if (debugBit[level] === 1) console.log(msg);
    },
    setDebugLevel : function(level,value){
        debugBit[level] = value;
    }
}
