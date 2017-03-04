'use strict';

module.exports = function(){

    var SockJS = require('sockjs-client');
    var Stomp = require('stompjs');
    var stompClient = null;
    var connected = false;
    var data = {};
    var timeToReconnect = 12000;
    var pingDelay = 3000;
    var checkConnectionDelay = 1000;
    var delayBetweenReconnection = 6000;
    var auxNow = new Date().getTime();
    var lastReconnectionTry = auxNow;
    var lastReceivedData = auxNow;
    var lastPingSent = auxNow;
    var checkConnection;
    var autoReconnect = false;
    var firstConnection = true;

    // - metodo p/ checagem de conexão
    var validateConnection = function() {

      // - verifica tempo atual;
      var now = new Date().getTime();

      if ( !stompClient ||
        ( now >= lastReceivedData + timeToReconnect &&
        now >= lastReconnectionTry + delayBetweenReconnection ) )
      {
        // - caso seja necessario reconectar;
        connectChatSocket(false);
      } else if ( connected &&
        now >= lastReceivedData + pingDelay &&
        now >= lastPingSent + pingDelay )
      {

        // - caso seja necessario enviar ping;
        lastPingSent = now;
        stompClient.send('/app/chat.keep.alive', {}, JSON.stringify({
          command: 'SEND_MESSAGE',
          message: 'ping',
          fromUser: data.username,
          fromUserResource: data.resource
        }));

      }

    };

    // - muda status da conexao
    var setConnectionStatus = function(status) {
      // - caso status nao tenha modificado;
      if ( connected !== status ) {
        connected = status;
      }

    };

    // - finaliza conexao;
    var finishConnection = function() {

      // - finaliza stomp caso necessario;
      if ( !!stompClient ) {
        stompClient.disconnect();
        stompClient = null;
      }

      // - seta conexao como offline;
      setConnectionStatus(false);

    };

    // - atualiza dados a recepção de dados via socket;
    var receivedSocketData = function() {
      lastReceivedData = new Date().getTime();
    };

    // - trata comando;
    var treatCommand = function(command) {
      if ( command === 'FORCE_LOGOUT' ) {
        autoReconnect = false;
        finishConnection();
      }
    };

    // - trata mensagem;
    var treatMessage = function(message) {
      var m = JSON.parse(message.body);
      treatCommand(m.command);
    };

    // - connecta socket;
    var connectChatSocket = function (force) {

      // - finaliza conexao caso necessario;
      finishConnection();

      // - logica p/ tratativa de auto reconexão;
      if ( !force && !autoReconnect ) {
        return;
      }

      // - reseta timers;
      var now = new Date().getTime();
      lastReconnectionTry = now;
      lastReceivedData = now;
      lastPingSent = now;

      var socket = new SockJS(data.url, null, {
        'transports': ['websocket', 'xdr-streaming', 'xhr-streaming',
          'iframe-eventsource', 'iframe-htmlfile',
          'xdr-polling', 'xhr-polling', 'iframe-xhr-polling',
          'jsonp-polling']
      });

      stompClient = Stomp.over( socket );
      stompClient.connect(
        {
          resource: data.resource
        },
        function (frame) {
            setConnectionStatus(true);
            receivedSocketData();
            data.successCallback(frame, firstConnection);
            firstConnection = false;
        },
        function (error) {
            data.errorCallback(error);
        }
      );

    };

    return {

      start: function (url, resource, successCallback, errorCallback) {
        if ( !!checkConnection ) {
          clearInterval(checkConnection);
          checkConnection = undefined;
        }
        data.url = url;
        data.resource = resource;
        data.successCallback = successCallback;
        data.errorCallback = errorCallback;

        // - iniciando socket;
        connectChatSocket(true);

        // - iniciando servico p/ checagem de conexao;
        //checkConnection = setInterval( validateConnection, checkConnectionDelay );

      },

      stop: function() {
        if ( !!checkConnection ) {
          clearInterval(checkConnection);
          checkConnection = undefined;
        }
        finishConnection();
      },

      subscribe: function(destination, callback) {
        if ( !stompClient || !connected ) {
          return;
        }
        stompClient.subscribe(destination, function (message) {
            receivedSocketData();
            callback(message);
            treatMessage(message);
        });
      },

      send: function(destination, headers, object) {
        if ( !stompClient || !connected ) {
          return;
        }
        stompClient.send(destination, headers, object);
      },

      status: function() {
        return connected;
      },

      setUser: function (username) {
        data.username = username;
      }
    };


};
