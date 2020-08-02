var Set = require("set");
var HashMap = require("hashmap")

var users = new Set();

var userMap = new HashMap();

const insertSocket = function(id, value){
    console.log("insertSocket: "+id + " "+value)
    userMap.set(id,value);
}

const removeSocket = function(id){
    userMap.remove(id);
}

const getUsers = function(){
    console.log("entries: "+userMap.entries())
    return userMap.entries();
}

const getUserNameFromSocket = function(id){
    return userMap.get(id);
}

// Set users

const getUserSize = function(){
    return users.size();
}
const addUser = function(user, callback){
    var size = users.size();
    users.add(user);
    if(users.size() == size+1){
        callback(true);
    }else{
        callback(false);
    }
}

const removeUser = function(userName){
    users.remove(userName);
}

module.exports = {
    addUser: addUser,
    getUserSize: getUserSize,  
    getUsers: getUsers,
    removeUser:removeUser,

    insertSocket: insertSocket,
    removeSocket: removeSocket,
    getUserNameFromSocket: getUserNameFromSocket,
}