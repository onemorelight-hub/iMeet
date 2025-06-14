const express = require('express');
const path = require('path');
const app = express();
const https = require('https');
const http = require('http');
const fs = require('fs');
const router = require('./routers/router');
const users = require('./node/user');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '7000');
app.set('port', port);
app.set('secPort', port + 443);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Create HTTPS server.
 */
const options = {
  key: fs.readFileSync(path.join(__dirname, 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificate.pem'))
};
const secureServer = https.createServer(options, app);

/**
 * Listen on provided ports.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

secureServer.listen(app.get('secPort'), () => {
  console.log(`Secure server listening on port ${app.get('secPort')}`);
});
secureServer.on('error', onError);
secureServer.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

/**
 * Event listener for server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for server "listening" event.
 */
function onListening() {
  const addr = this.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
}

/**
 * Socket.IO implementation
 */
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/', router);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('myuser', (msg) => {
    users.insertSocket(socket.id, msg);
    io.emit('newUserConnected', users.getUsers());
  });

  socket.on('typing', (msg) => {
    io.to(msg.id).emit('typing', msg);
  });

  socket.on('typingStopped', (msg) => {
    io.to(msg.id).emit('typingStopped', msg);
  });

  socket.on('chat message', (msg) => {
    io.to(msg.id).to(socket.id).emit('chat message', msg);
  });

  socket.on('callingMedia', (msg) => {
    io.to(msg.id).emit('callingMedia', {
      id: socket.id,
      callingUser: msg.callingUser,
      mode: msg.mode
    });
  });

  socket.on('callAccepted', (msg) => {
    io.to(msg.id).emit('callAccepted', {
      id: socket.id,
      callingUser: msg.callingUser
    });
  });

  socket.on('declineMediaCall', (msg) => {
    io.to(msg.id).emit('declineMediaCall', {
      id: socket.id,
      callingUser: msg.callingUser
    });
  });

  socket.on('MediaUserBusy', (msg) => {
    io.to(msg.id).emit('MediaUserBusy', {
      id: socket.id,
      userName: msg.userName
    });
  });

  socket.on('waitingMediaReady', (msg) => {
    io.to(msg.id).emit('waitingMediaReady', msg);
  });

  socket.on('message', (msg) => {
    socket.to(msg.id).emit('message', {
      id: socket.id,
      description: msg.description
    });
  });

  socket.on('endCall', (msg) => {
    io.to(msg.id).emit('endCall', {
      id: socket.id,
      callingUser: msg.callingUser
    });
  });

  socket.on('disconnect', () => {
    const userName = users.getUserNameFromSocket(socket.id);
    users.removeSocket(socket.id);
    users.removeUser(userName);
    io.emit('newUserConnected', users.getUsers());
  });
});
