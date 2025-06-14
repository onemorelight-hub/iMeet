const chatMessages = document.querySelector('.chat-messages');
const chatContainer = document.querySelector('.chat-container');
let selectedUsername;
let selectedUserSocket;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const myUserName = urlParams.get('username').trim();
const mediaColumn = document.getElementById('mediaColumn');
document.getElementById('myName').innerHTML += myUserName;
document.getElementById('onlineButton').style.color = 'white';
document.getElementById('messageButton').style.color = 'white';
mediaColumn.hidden = true;

const socket = io();

socket.emit('myuser', myUserName);

socket.on('newUserConnected', (users) => {
  outputUsers(users);
  selectOnlineButton();
});

socket.on('chat message', (message) => {
  outputMessage(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('typing', (msg) => {
  if (msg.name === selectedUsername) {
    document.getElementById('typing').innerText = `${msg.name} Typing...`;
  }
});

socket.on('typingStopped', (msg) => {
  document.getElementById('typing').innerText = '';
});

$(function () {
  $('#chatMeessage').keypress(function (e) {
    socket.emit('typing', { id: selectedUserSocket, name: myUserName });
    if (e.which === 13) {
      if (!selectedUsername) {
        errorSelectUser();
      } else {
        socket.emit('chat message', {
          id: selectedUserSocket,
          name: myUserName,
          targetUser: selectedUsername,
          message: $('#chatMeessage').val()
        });
        $('#chatMeessage').val('');
        e.preventDefault();
      }
    }
  });

  $('#chatMeessage').keyup(function (e) {
    socket.emit('typingStopped', { id: selectedUserSocket, name: myUserName });
  });
});

const chatMessagesMap = {};
let mainDiv;
const userMessageMap = new Map();
const userToSocketMap = new Map();

function outputMessage(message) {
  const div = document.createElement('div');
  div.innerHTML = message.name === myUserName
    ? `<span class="metaMe"> Me: <span class="white-text">${message.message}</span></span>`
    : `<span class="metaYou">${message.name}: <span class="white-text">${message.message}</span></span>`;

  if (message.name === myUserName) {
    if (!chatMessagesMap[message.targetUser]) {
      mainDiv = document.createElement('div');
      mainDiv.setAttribute('id', message.targetUser);
      mainDiv.append(div);
      chatMessagesMap[message.targetUser] = mainDiv;
    } else {
      chatMessagesMap[message.targetUser].appendChild(div);
    }
  } else {
    if (!chatMessagesMap[message.name]) {
      mainDiv = document.createElement('div');
      mainDiv.setAttribute('id', message.name);
      mainDiv.append(div);
      chatMessagesMap[message.name] = mainDiv;
      userMessageMap.set(message.name, 1);
    } else {
      chatMessagesMap[message.name].appendChild(div);
      userMessageMap.set(message.name, (userMessageMap.get(message.name) || 0) + 1);
    }
  }

  if (message.name === selectedUsername) {
    userMessageMap.set(message.name, 0);
  }

  if (selectedUsername === message.targetUser) {
    userMessageMap.set(message.targetUser, 0);
    document.querySelector('.chat-messages').append(chatMessagesMap[message.targetUser]);
  } else {
    displayMessageList();
    if (chatMessagesMap[selectedUsername]) {
      document.querySelector('.chat-messages').appendChild(chatMessagesMap[selectedUsername]);
    }
  }
}

function outputUsers(users) {
  userToSocketMap.clear();
  const onlineUser = users
    .filter(user => user[1] !== myUserName)
    .map(user => {
      userToSocketMap.set(user[1], user[0]);
      return `<li><button id=${user[0]} name=${user[1]} onclick="onlineButtonClicked(this.id, this.name)" class="no-border text-white">${user[1]}</button></li>`;
    })
    .join('');
  document.getElementById('name').innerHTML = onlineUser;
}

function onlineButtonClicked(id, name) {
  selectedUsername = name;
  selectedUserSocket = id;
  document.getElementById('selectedUser').innerText = selectedUsername;
  document.querySelector('.chat-messages').innerHTML = '';
  userMessageMap.set(name, 0);
  displayMessageList();
  if (chatMessagesMap[selectedUsername]) {
    document.querySelector('.chat-messages').appendChild(chatMessagesMap[selectedUsername]);
  }
}

function selectOnlineButton() {
  document.getElementById('onlineButton').click();
  document.getElementById('onlineButton').style.backgroundColor = 'green';
  document.getElementById('messageButton').style.backgroundColor = 'blue';
}

function selectMessageListButton() {
  document.getElementById('messageButton').click();
  document.getElementById('messageButton').style.backgroundColor = 'green';
  document.getElementById('onlineButton').style.backgroundColor = 'blue';
}

function displayMessageList() {
  const messageUser = Array.from(userMessageMap)
    .map(([key, value]) => {
      const socketId = userToSocketMap.get(key);
      return value > 0
        ? `<li><button id=${socketId} name=${key} onclick="onlineButtonClicked(this.id, this.name)" class="no-border text-white">${key} <span> New(${value})</span></button></li>`
        : `<li><button id=${socketId} name=${key} onclick="onlineButtonClicked(this.id, this.name)" class="no-border text-white">${key}</button></li>`;
    })
    .join('');
  document.getElementById('messagesList').innerHTML = messageUser;
  selectMessageListButton();
}

function errorSelectUser() {
  document.getElementById('selectedUser').innerText = 'Please select an online user';
}

/**
 * WebRTC Implementation
 */
let mediaCallStatus = false;
let callerSocketId;
let localStream;
let pc;
let remoteStream;
let callMode;
let mediaReadyStatus = false;

const serverConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
};

const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

const constraints = {
  audio: true,
  video: { width: 1280, height: 720 }
};

const audioConstraints = {
  audio: true,
  video: false
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const acceptCall = document.getElementById('acceptCall');
const declineCall = document.getElementById('declineCall');
const cancelCall = document.getElementById('cancelCall');
const medialCallDiv = document.getElementById('medialCallDiv');
const mediaButtonDiv = document.getElementById('mediaButtonDiv');

disableRemoteVideoDiv();
disableLocalVideoDiv();

acceptCall.addEventListener('click', acceptCallMethod);
declineCall.addEventListener('click', declineCallMethod);
cancelCall.addEventListener('click', cancelCallMethod);

const audioCall = document.getElementById('audioCall');
const videoCall = document.getElementById('videoCall');
audioCall.addEventListener('click', audioCallMethod);
videoCall.addEventListener('click', videoCallMethod);

function enableMediaWindow() {
  mediaColumn.hidden = false;
}

function disableMediaWindow() {
  mediaColumn.hidden = true;
}

function enableCallingDiv() {
  medialCallDiv.hidden = false;
  document.getElementById('cancelDiv').hidden = false;
  document.getElementById('receiveDiv').hidden = true;
}

function enableCallDiv() {
  medialCallDiv.hidden = false;
  document.getElementById('cancelDiv').hidden = true;
  document.getElementById('receiveDiv').hidden = false;
}

function disableMediaCallDiv() {
  medialCallDiv.hidden = true;
  document.getElementById('cancelDiv').hidden = true;
  document.getElementById('receiveDiv').hidden = true;
}

function enableLocalVideoDiv() {
  localVideo.hidden = false;
}

function disableLocalVideoDiv() {
  localVideo.hidden = true;
}

function enableRemoteVideoDiv() {
  remoteVideo.hidden = false;
}

function disableRemoteVideoDiv() {
  remoteVideo.hidden = true;
}

function enableAudioCallDiv() {
  medialCallDiv.hidden = false;
  document.getElementById('mediaCallDetails').innerText = `Call Connected with ${selectedUsername}`;
  document.getElementById('cancelDiv').hidden = true;
  document.getElementById('receiveDiv').hidden = true;
}

function enableMediaButtonDiv() {
  mediaButtonDiv.hidden = false;
}

function disableMediaButtonDiv() {
  mediaButtonDiv.hidden = true;
}

async function getLocalMediaStream(constraints) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (constraints.video) {
      localVideo.srcObject = localStream;
      enableLocalVideoDiv();
    }
    mediaReadyStatus = true;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    document.getElementById('mediaCallDetails').innerText = 'Failed to access media devices';
    leaveCall();
  }
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(serverConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleTrackEvent;
    pc.oniceconnectionstatechange = handleICEConnectionStateChange;
    pc.onnegotiationneeded = handleNegotiationNeeded;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  } catch (error) {
    console.error('Error creating peer connection:', error);
    leaveCall();
  }
}

function handleIceCandidate(event) {
  if (event.candidate) {
    socket.emit('message', {
      id: selectedUserSocket,
      description: {
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate
      }
    });
  }
}

function handleTrackEvent(event) {
  remoteStream = event.streams[0];
  if (callMode === 'Video') {
    remoteVideo.srcObject = remoteStream;
    enableRemoteVideoDiv();
  }
}

function handleICEConnectionStateChange() {
  if (pc && (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed')) {
    leaveCall();
  }
}

async function handleNegotiationNeeded() {
  try {
    const offer = await pc.createOffer(sdpConstraints);
    await pc.setLocalDescription(offer);
    socket.emit('message', {
      id: selectedUserSocket,
      description: pc.localDescription
    });
  } catch (error) {
    console.error('Negotiation error:', error);
    leaveCall();
  }
}

async function doAnswer() {
  try {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('message', {
      id: selectedUserSocket,
      description: pc.localDescription
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    leaveCall();
  }
}

function leaveCall() {
  if (mediaCallStatus) {
    socket.emit('endCall', {
      id: selectedUserSocket,
      callingUser: myUserName
    });
  }

  mediaCallStatus = false;
  mediaReadyStatus = false;
  callMode = null;

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteStream = null;
  }

  if (pc) {
    pc.close();
    pc = null;
  }

  disableMediaWindow();
  disableLocalVideoDiv();
  disableRemoteVideoDiv();
  disableMediaCallDiv();
  enableMediaButtonDiv();
}

function audioCallMethod() {
  selectOnlineButton();
  if (!selectedUsername) {
    errorSelectUser();
    return;
  }
  mediaCallStatus = true;
  callMode = 'Voice';
  enableMediaWindow();
  disableMediaButtonDiv();
  enableCallingDiv();
  document.getElementById('mediaCallDetails').innerText = `Calling ${selectedUsername}`;
  getLocalMediaStream(audioConstraints);
  createPeerConnection();
  socket.emit('callingMedia', {
    id: selectedUserSocket,
    callingUser: myUserName,
    mode: 'Voice'
  });
}

function videoCallMethod() {
  selectOnlineButton();
  if (!selectedUsername) {
    errorSelectUser();
    return;
  }
  mediaCallStatus = true;
  callMode = 'Video';
  enableMediaWindow();
  disableMediaButtonDiv();
  enableCallingDiv();
  document.getElementById('mediaCallDetails').innerText = `Calling ${selectedUsername}`;
  getLocalMediaStream(constraints);
  createPeerConnection();
  socket.emit('callingMedia, {
    id: selectedUserSocket,
    callingUser: myUserName,
    mode: 'Video'
  });
}

function acceptCallMethod() {
  disableMediaButtonDiv();
  getLocalMediaStream(callMode === 'Voice' ? audioConstraints : constraints);
  createPeerConnection();
  socket.emit('callAccepted', {
    id: selectedUserSocket,
    callingUser: myUserName
  });
  if (callMode === 'Voice') {
    disableRemoteVideoDiv();
    disableLocalVideoDiv();
    enableAudioCallDiv();
  } else {
    enableLocalVideoDiv();
    disableMediaCallDiv();
  }
}

function declineCallMethod() {
  socket.emit('declineMediaCall', {
    id: selectedUserSocket,
    callingUser: myUserName
  });
  leaveCall();
}

function cancelCallMethod() {
  leaveCall();
}

socket.on('callingMedia', (msg) => {
  if (mediaCallStatus) {
    socket.emit('MediaUserBusy', {
      id: msg.id,
      userName: myUserName
    });
  } else {
    mediaCallStatus = true;
    disableMediaButtonDiv();
    document.getElementById('mediaCallDetails').innerText = `${msg.mode} Call from ${msg.callingUser}`;
    selectedUserSocket = msg.id;
    selectedUsername = msg.callingUser;
    callMode = msg.mode;
    enableMediaWindow();
    enableCallDiv();
  }
});

socket.on('callAccepted', async (msg) => {
  if (mediaReadyStatus) {
    try {
      await pc.setLocalDescription(await pc.createOffer(sdpConstraints));
      socket.emit('message', {
        id: selectedUserSocket,
        description: pc.localDescription
      });
      if (callMode === 'Video') {
        disableMediaCallDiv();
      } else {
        enableAudioCallDiv();
      }
    } catch (error) {
      console.error('Error handling call accepted:', error);
      leaveCall();
    }
  } else {
    socket.emit('waitingMediaReady', {
      id: selectedUserSocket,
      description: 'callAccepted'
    });
  }
});

socket.on('waitingMediaReady', (msg) => {
  socket.emit('callAccepted', {
    id: selectedUserSocket,
    description: 'callAccepted'
  });
});

socket.on('message', async (msg) => {
  try {
    if (msg.description.type === 'offer') {
      if (mediaReadyStatus) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.description));
        await doAnswer();
      } else {
        socket.emit('waitingMediaReady', {
          id: selectedUserSocket,
          description: 'callAccepted'
        });
      }
    } else if (msg.description.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.description));
    } else if (msg.description.type === 'candidate') {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: msg.description.label,
        candidate: msg.description.candidate
      });
      await pc.addIceCandidate(candidate);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    leaveCall();
  }
});

socket.on('declineMediaCall', (msg) => {
  document.getElementById('mediaCallDetails').innerText = 'Call declined';
  leaveCall();
});

socket.on('MediaUserBusy', (msg) => {
  document.getElementById('mediaCallDetails').innerText = `${msg.userName} is busy on another call`;
  leaveCall();
});

socket.on('endCall', (msg) => {
  document.getElementById('mediaCallDetails').innerText = 'Call ended';
  leaveCall();
});
