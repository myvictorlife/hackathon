'use strict';

const chatStore = require('./chat-client-store'),
      genericChatClient = require("./chat-client");

var sentText = function(message){
  for (var x=0;x<conexoes.length;x++) {
    if(message.senderId == conexoes[x].uuid){
      console.log('Enviando msg para uuid: ' + conexoes[x].uuid);
      conexoes[x].send(message.body);
    }
  }
}

function sendToChat(message){
  if(!chatStore.contains(message.senderId)){
    var chatClient = new genericChatClient();
    console.log(chatClient)
    chatStore.put(message.senderId, chatClient);
  } if(!chatStore.get(message.senderId).isConnected()){
    chatStore.get(message.senderId).connect(message, sendToChat);
  } else{
    console.log("Send to chat")
    console.log(message)
    var response = chatStore.get(message.senderId).sendMessage(message.messageText);
    
    if(response !== undefined){
      console.log("Response: " + response)  
      sentText({senderId: message.senderId, body: response})
    }
  }
}

exports.receiveMessage = function (req, res) {
  sendToChat({ senderId: req.body.uuid, messageText: req.body.message });
}

exports.sendTextMessage = function (message) {
  console.log('Total de Conexoes: ' + conexoes.length);
  console.log(JSON.stringify(message))
  sentText(message)
}

exports.logoutChat = function(){
  console.log("Entrei logout Chat" + conexoes.length)
  console.log(conexoes)
  
}