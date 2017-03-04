'use strict';

module.exports = function(){
  const config = require('config'),
    messageService = require('./web-client');
  var genericChatSocket = require("./chat-socket");
  var chatSocket = new genericChatSocket();

  var resourceCode =  Math.random().toString(36).substr(2, 8);
  var id = "";
  var username = "";
  var accessKey = "";
  var group = config.get('chatGroup');
  var sessionId = null;
  var fromUser = null;
  var fromUserResource = null;
  var lockedFirstMessage = false;
  var url = config.get('chatURL');
  var BUNDLE_ERROR = "bundle.not.found";
  var GENERAL_ERROR_MESSAGE = "Erro inesperado, tente novamente.";
  var closeSessionTimestamp = 0;
  var delayFirstMessage = 200000;
  var delayCloseSession = 20000;
  var lastMessageReceived = new Date().getTime();
  var connected = false;
  var closeKeyword = "#sair";

  function connect(data, sendToChat) {
    username = data.senderId;
    accessKey = data.senderId;
    id = data.senderId;
    chatSocket.start(
      url+accessKey,
      resourceCode,
      function(frame) {
        connected = true;
        username = frame.headers['user-name'];
        chatSocket.setUser(username);

        chatSocket.subscribe('/user/exchange/amq.direct/chat.message/resource/' + resourceCode, function (message) {
          var chatMessage = JSON.parse(message.body);

          lastMessageReceived = new Date().getTime();

          console.info("Message receive on " + username + "  , message: " + chatMessage);
          fromUser = chatMessage.fromUser;
          fromUserResource = chatMessage.fromUserResource;

          if (chatMessage.sessionId !== null) {
            sessionId = chatMessage.sessionId;
          }

          if (lockedFirstMessage) {
            lockedFirstMessage = false;
            if(chatMessage.sessionId !== null){
              messageService.sendTextMessage( {senderId: id, body: "Para cancelar o atendimento digite " + closeKeyword});
            }
          }

          if (!chatMessage.sessionOn) {
            closeSessionTimestamp = new Date().getTime();
            disconnect();
          }
          if (chatMessage.message.indexOf(BUNDLE_ERROR) !== -1) {
            disconnect();
            chatMessage.message = GENERAL_ERROR_MESSAGE;
          }
          messageService.sendTextMessage({senderId: id, body: chatMessage.message})
        });

        chatSocket.subscribe('/user/exchange/amq.direct/errors', function (message) {
          console.error(message);
        });

        sendToChat(data);

      },
      function (error) {
        connected = false;
        console.error(error);
        messageService.sendTextMessage({senderId: id, body:"Desculpe, chat fora do ar, tente novamente mais tarde."});
      }
    );


  }

  function disconnect(){
    chatSocket.stop();
    connected = false;
    sessionId = null;
  }

  function getCommand(message){

    if(sessionId === null){
      return 'CREATE_CHAT_SESSION';
    }
    if(closeKeyword === message){
      return 'CANCEL_CHAT_SESSION';
    }
    return 'SEND_MESSAGE'
  }

  function sendMessage(message) {
    console.log(message)
    var destination = '/app/chat.private.group.' + group;
    if(sessionId === null && closeSessionTimestamp != 0 && (new Date().getTime() - closeSessionTimestamp < delayCloseSession)){
      return "Aguarde " + delayCloseSession/1000 + " segundos até inciar um novo atendimento";
    }
    if(lockedFirstMessage && (new Date().getTime()- lastMessageReceived < delayFirstMessage)){
      return "Aguarde um instante."
    }
    var command = getCommand(message);
    if(sessionId === null){
      lockedFirstMessage = true;
    }

    chatSocket.send(destination, {}, JSON.stringify({
      message: message,
      fromUserResource: resourceCode,
      toUserResource: fromUserResource,
      sessionId: sessionId,
      group: group,
      fromUser: id,
      toUser: fromUser,
      command: command
    }));

  }

  return {

    connect: connect,

    disconnect: disconnect,

    sendMessage: sendMessage,

    getLastMessageReceivedTime: function () {
      return lastMessageReceived;
    },

    isConnected: function(){
      return connected;
    }

  }




};