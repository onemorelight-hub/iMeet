const chatMessages = document.querySelector('.chat-messages');
const chatContainer = document.querySelector(".chat-container");
var selectedUsername;
var selectedUserSocket;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const myUserName = urlParams.get('username').trim();

const mediaColumn = document.getElementById("mediaColumn");
document.getElementById("myName").innerHTML=document.getElementById("myName").innerHTML+myUserName;
document.getElementById("onlineButton").style.color="white";
document.getElementById("messageButton").style.color="white";

mediaColumn.hidden = true;

const socket = io();

socket.emit("myuser",myUserName);

socket.on('newUserConnected', ( users ) => {
  outputUsers(users);
  selectOnelineButton();
});

socket.on('chat message', message => {
   outputMessage(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("typing",(msg)=>{
  if(msg.name == selectedUsername){
    document.getElementById("typing").innerText=`${msg.name} Typing..`;
  }
});

socket.on("typingStoped", (msg)=>{
  document.getElementById("typing").innerText="";
});

$(function() {
  $("#chatMeessage").keypress(function (e) {
    socket.emit("typing",{"id" : selectedUserSocket, "name": myUserName});
    if(e.which == 13) {
      if(selectedUsername == undefined){
        errorSelectUser();
      }else{
        socket.emit('chat message', {"id" : selectedUserSocket, "name": myUserName, "targetUser": selectedUsername ,"message": $('#chatMeessage').val()} );
        $('#chatMeessage').val('');
        e.preventDefault();  
      }
    }
  });
  $("#chatMeessage").keyup(function(e){
    socket.emit("typingStoped",{"id" : selectedUserSocket, "name": myUserName});
  });
});

var chatMessagesMap = {};
let mainDiv ;
var userMessageMap = new Map();
var userToSocketMap = new Map();
let temp;

function outputMessage(message) {  
  let div = document.createElement('div');
  if(myUserName == message.name){
    div.innerHTML = `<span class="metaMe"> Me : <span class="white-text">${message.message}</span></span>`;
  }else{
    div.innerHTML = `<span class="metaYou">${message.name} : <span class="white-text">${message.message}</span></span>`;
  }
  if(message.name == myUserName){
    if(chatMessagesMap[message.targetUser] == undefined){
      mainDiv = document.createElement('div');
      mainDiv.setAttribute("id", message.targetUser);
      mainDiv.append(div);
      chatMessagesMap[message.targetUser] = mainDiv;  
    }else{
      chatMessagesMap[message.targetUser].appendChild(div);
    }
  }else{
    if(chatMessagesMap[message.name] == undefined){
      mainDiv = document.createElement('div');
      mainDiv.setAttribute("id", message.name);
      mainDiv.append(div);
      chatMessagesMap[message.name] = mainDiv;
      userMessageMap.set(message.name,1);
    }else{
     chatMessagesMap[message.name].appendChild(div); 
     temp = userMessageMap.get(message.name)+1;
      userMessageMap.set(message.name,temp);
    }
  }
  if(message.name == selectedUsername){
      userMessageMap.set(message.name,0);
  }
  if(selectedUsername == message.targetUser){
    userMessageMap.set(message.targetUser,0);
    document.querySelector('.chat-messages').append(chatMessagesMap[message.targetUser]);
  }else{
    displayMessageList();
    document.querySelector('.chat-messages').appendChild(chatMessagesMap[selectedUsername]);
  }
}

function outputUsers(users) {
  let onlineUser="";
  userToSocketMap.clear();
  `${users.map((user) => {
    userToSocketMap.set(user[1], user[0]);
    if(user[1] != myUserName){
      onlineUser = onlineUser +`<li><button id=${user[0]} name=${user[1]} onclick="onlineButtonClicked(this.id, this.name )" class="no-border text-white">${user[1]}</button></li>`;
    }
  }).join('')}`;
  document.getElementById("name").innerHTML = onlineUser;
}


function onlineButtonClicked(id, name){
  selectedUsername = name;
  selectedUserSocket = id;
  document.getElementById("selectedUser").innerText = selectedUsername;
  document.querySelector('.chat-messages').innerHTML="";
  userMessageMap.set(name,0);
  displayMessageList();
  if(chatMessagesMap[selectedUsername] != undefined){
    document.querySelector('.chat-messages').appendChild(chatMessagesMap[selectedUsername]);
  }
}

function selectOnelineButton(){
  document.getElementById("onlineButton").click();
  document.getElementById("onlineButton").style.color="white";
  document.getElementById("onlineButton").style.backgroundColor="green";
  document.getElementById("messageButton").style.backgroundColor="blue";
}
function selectMessageListButton(){
  document.getElementById("messageButton").click();
  document.getElementById("messageButton").style.color="white";
  document.getElementById("messageButton").style.backgroundColor="green";
  document.getElementById("onlineButton").style.backgroundColor="blue";
}

function displayMessageList(){
  let messageUser="";
    for (var [key, value] of userMessageMap) {
      if(value>0){
        messageUser = messageUser +`<li><button id=${userToSocketMap.get(key)} name=${key} onclick="onlineButtonClicked(this.id, this.name )" class="no-border text-white">${key} <span> New(${value})</span> </button> </li>`;
      }else{
        messageUser = messageUser +`<li><button id=${userToSocketMap.get(key)} name=${key} onclick="onlineButtonClicked(this.id, this.name )" class="no-border text-white">${key}</button></li>`;
      }
    }
    document.getElementById("messagesList").innerHTML = messageUser;
    selectMessageListButton();
}

function errorSelectUser(){
  document.getElementById("selectedUser").innerText="Please select online user";
}

var mediaCallStatus = false;
var callerSocketId;
var localStream;
var pc;
var remoteStream;
var callMode;
var mediaReadyStatus = false;

const serverConfig = {
  'iceServers': [{
    'urls': ['stun:stun.l.google.com:19302']
  }]
};
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

const constraint = {
  audio: false,
  video: true
};
const audioConstraint = {
  audio: true,
  video: false
};
const videoConstraint = {
  audio: true,
  video: true
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const remoteAudio = document.getElementById('remoteAudio');
const acceptCall = document.getElementById('acceptCall');
const declineCall = document.getElementById('declineCall');
const cancelCall = document.getElementById('cancelCall');

const medialCallDiv = document.getElementById("medialCallDiv");
const mediaButtonDiv = document.getElementById("mediaButtonDiv");
disableRemoteVideoDiv();
disableLocalVideoDiv();

acceptCall.addEventListener('click', acceptCallMethod);
declineCall.addEventListener('click', declineCallMethod);
cancelCall.addEventListener('click', cancelCallMethod);

const audioCall = document.getElementById("audioCall");
const videoCall = document.getElementById("videoCall");

audioCall.addEventListener("click",audioCallMethod);
videoCall.addEventListener("click",videoCallMethod);

function enableMediaWindow(){
  mediaColumn.hidden = false;
}
function disableMediaWindow(){
  mediaColumn.hidden = true;
}
function enableCallingDiv(){
  medialCallDiv.hidden = false;
  document.getElementById("cancelDiv").hidden = false;
  document.getElementById("receiveDiv").hidden = true;
}
function enableCallDiv(){
  medialCallDiv.hidden = false;
  document.getElementById("cancelDiv").hidden = true;
  document.getElementById("receiveDiv").hidden = false;
}
function disableMediaCallDiv(){
  medialCallDiv.hidden = true;
  document.getElementById("cancelDiv").hidden = true;
  document.getElementById("receiveDiv").hidden = true;
}
function enableLocalVideoDiv(){
  localVideo.hidden = false;
}
function disableLocalVideoDiv(){
  localVideo.hidden = true;
}
function enableRemoteVideoDiv(){
  remoteVideo.hidden = false;
}
function disableRemoteVideoDiv(){
  remoteVideo.hidden = true;
}
function enableAudioCallDiv(){
  medialCallDiv.hidden = false;
  document.getElementById("mediaCallDetails").innerText="Call Connected with "+selectedUsername;

  document.getElementById("cancelDiv").hidden = true;
  document.getElementById("receiveDiv").hidden = true;
}
function enableMediaButtonDiv(){
  mediaButtonDiv.hidden = false;
}
function disableMediaButttonDiv(){
  mediaButtonDiv.hidden = true;
}
function audioCallMethod(){
  selectOnelineButton();
  if(selectedUsername == undefined){
    errorSelectUser();
  }else{
    mediaCallStatus = true;
    callMode = "Voice";
    enableMediaWindow();
    disableMediaButttonDiv();
    enableCallingDiv();
    document.getElementById("mediaCallDetails").innerText="Calling "+selectedUsername;
    getLocalMediaStream(audioConstraint);
    createPeerConnection();
    socket.emit("callaingMedia",{"id": selectedUserSocket, "callingUser": myUserName,"mode": "Voice"});
  }
}

function videoCallMethod(){
  selectOnelineButton();
  if(selectedUsername == undefined){
    errorSelectUser();
  }else{
    mediaCallStatus = true;
    callMode = "Video";
    enableMediaWindow();
    disableMediaButttonDiv();
    document.getElementById("mediaCallDetails").innerText="Calling "+selectedUsername;
    enableCallingDiv();
    enableLocalVideoDiv();
    getLocalMediaStream(constraint);
    createPeerConnection();
    socket.emit("callaingMedia",{"id": selectedUserSocket, "callingUser": myUserName, "mode": "Video"});
  }
}
function leaveCall(){
  if(remoteStream != null){
    sendMessage('bye');
  }
  mediaCallStatus = false;
  mediaColumn.hidden = true;
  localStream.getTracks().forEach(function(track) { track.stop(); });
  pc.close();
  pc = null;
  localStream = null;
  remoteStream = null;
  callMode = null;
  mediaReadyStatus = false;
  disableLocalVideoDiv();
  disableRemoteVideoDiv();
  enableMediaButtonDiv();
}

function acceptCallMethod(){
  disableMediaButttonDiv();
  getLocalMediaStream(constraint);
  createPeerConnection();
  socket.emit("callAccepted", {"id": selectedUserSocket, "description": "callAccepted"});
  if(callMode === "Voice"){
    disableRemoteVideoDiv();
    disableLocalVideoDiv();
    enableAudioCallDiv();

  }else{
  enableLocalVideoDiv();
  disableMediaCallDiv();

  }
}

function declineCallMethod(){
  socket.emit("declineMediaCall",{"id": selectedUserSocket, "callingUser": myUserName});
    leaveCall();

}

function cancelCallMethod(){
  leaveCall();
}

socket.on("callaingMedia", msg=>{
  if(mediaCallStatus){
    socket.emit("MediaUserBusy",{"id": msg.id,"userName": myUserName});
  }else{
    mediaCallStatus = true;
    disableMediaButttonDiv();
    document.getElementById("mediaCallDetails").innerText=msg.mode +" Call from "+msg.callingUser;
    selectedUserSocket = msg.id;
    selectedUsername = msg.callingUser;
    callMode = msg.mode;
    enableMediaWindow();
    enableCallDiv();
  }
});

socket.on("callAccepted", mas=>{
  if(mediaReadyStatus){
    pc.addStream(localStream);
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    if(callMode === "Video"){
      disableMediaCallDiv();
    }else{
      enableAudioCallDiv();
    }
  }else{
    socket.emit("waitingMediaReady", {"id": selectedUserSocket, "description": "callAccepted"});
  }
});

socket.on("waitingMediaReady", msg=>{
  socket.emit("callAccepted", {"id": selectedUserSocket, "description": "callAccepted"});
});

socket.on('message', msg=> {
  if(msg.description.type ==="offer"){

    if(mediaReadyStatus){
      pc.addStream(localStream);
      pc.setRemoteDescription(new RTCSessionDescription(msg.description));
      doAnswer();
    }else{
      socket.emit("waitingMediaReady", {"id": selectedUserSocket, "description": "callAccepted"});
    }
   
  }else if(msg.description.type ==="answer"){
    pc.setRemoteDescription(new RTCSessionDescription(msg.description));
  }else if(msg.description.type ==="candidate"){
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: msg.description.label,
      candidate: msg.description.candidate
    });
    pc.addIceCandidate(candidate);
  }else if(msg.description === "bye"){
    disableRemoteVideoDiv();
    enableCallingDiv();
    document.getElementById("mediaCallDetails").innerText="Call Ended";
  }
});

socket.on("declineMediaCall", msg=>{
  document.getElementById("mediaCallDetails").innerText="Call declined ";
});

socket.on("MediaUserBusy",msg=>{
  document.getElementById("mediaCallDetails").innerText= msg.userName +" busy on another call";

});
