var express = require('express');
var router = express.Router();
const path = require('path');
const url = require('url');
const user = require('../node/user')


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'home.html'))
});


router.get('/chat', (req, res) => {
    const username = url.parse(req.url,true).query.username.trim();
    console.log("user: "+username);
    if(username == null || username == '' || checkSpace(username)){
        res.sendFile(path.join(__dirname, '../views', 'home.html'));
    }
    else{
        
        user.addUser(username, status=>{
            if(status){
                console.log("user Added")
                res.sendFile(path.join(__dirname, '../views', 'chat.html'));
            }else{
                console.log("Duplicate user")
                res.sendFile(path.join(__dirname, '../views', 'error.html'));
            }
        }); 
    }
});

function checkSpace(str){
    return (/\s/g.test(str));
}

router.get('/index', (req, res) => {
  res.sendfile('./views/index.html');
});

module.exports = router;