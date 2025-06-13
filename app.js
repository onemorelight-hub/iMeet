var express = require('express');
var path = require('path');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');
var router = require('./routers/router');
const users = require('./node/user');
const user = require('./node/user');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '7000');
app.set('port', port);
app.set('secPort',port+443);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
}

/**
 * Create HTTPS server.
 */ 
 
var options = {
  key: fs.readFileSync(__dirname+'/private.key'),
  cert: fs.readFileSync(__dirname+'/certificate.pem')
};
var secureServer = https.createServer(options,app);
/**
 * Listen on provided port, on all network interfaces.
 */
secureServer.listen(app.get('secPort'), () => {
   console.log('Server listening on port ',app.get('secPort'));
});
secureServer.on('error', onError);
secureServer.on('listening', onListening);


/**
 * ################# Socket IO implementation ########################
 */
var io = require('socket.io')(server);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/assets',express.static(__dirname + '/assets'));
app.use("/",router)


io.on('connection', (socket) => {
    console.log('a user connected: '+socket.id);

    socket.on("myuser", (msg)=>{
      user.insertSocket(socket.id, msg);
      io.emit('newUserConnected', users.getUsers())
    })

    socket.on("typing", (msg)=>{
      io.to(msg.id).emit("typing",msg);
    })

    socket.on("typingStoped", (msg)=>{
      io.to(msg.id).emit("typingStoped",msg);
    })

    socket.on('chat message', (msg) => {
        io.to(msg.id).to(socket.id).emit('chat message',msg);
    });

  //-----------------------------------------------------------------

    socket.on("callaingMedia", (msg)=>{
      io.to(msg.id).emit("callaingMedia",{"id": socket.id, "callingUser": msg.callingUser,"mode": msg.mode});
    })

    socket.on("callAccepted", (msg)=>{
      io.to(msg.id).emit("callAccepted",{"id": socket.id, "callingUser": msg.callingUser});
    })

    socket.on("declineMediaCall", (msg)=>{
      io.to(msg.id).emit("declineMediaCall",{"id": socket.id, "callingUser": msg.callingUser});
    })

    socket.on("MediaUserBusy", msg=>{
      io.to(msg.id).emit("MediaUserBusy",{"id": socket.id, "userName": msg.userName});
    })

    socket.on("waitingMediaReady", msg=>{
      io.to(msg.id).emit("waitingMediaReady",msg);
    })
    //-------------------------------------------------------------

    socket.on('message', msg=> {
      socket.to(msg.id).emit('message', {"id": socket.id, "description":msg.description});
    });

    socket.on("disconnect", msg=>{
      let userName = users.getUserNameFromSocket(socket.id);
      users.removeSocket(socket.id);
      users.removeUser(userName);
      io.emit('newUserConnected', users.getUsers())
    });

});

