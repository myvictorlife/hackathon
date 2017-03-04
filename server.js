const express = require('express')
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    routes = require('./plugins/web-client'),
    bodyParser = require('body-parser'),
    config  = require('./config/default');

// Body-Parser
app.use(bodyParser.json());
app.use(function(req, res, next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        next();
    },
    bodyParser.urlencoded({
        extended: true
    })
);

// ************************************************************************************
// ******************************* Load View ******************************************
// ************************************************************************************

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');
app.post('/be4chat', function(req, res) {

    console.log(req.body.img)
    res.render('pages/be4chat', {
        URL: config.URL,
        img: req.body.img,
        imgWidth: req.body.largura,
        imgHeight: req.body.altura
    });
});

app.post('/msg', routes.receiveMessage);

// Client
var client = require('./routes/client')
app.use('/client', client)

// ************************************************************************************
// ************************************************************************************
// ************************************************************************************

global.mensagem = {texto: '-- sem mensagem --'};
global.conexoes = [];
global.wsserver;

// WebSockets
io.sockets.on("connection", function(ws){
    console.log("Um usuário qualquer esta connectado")
    
    // Novo usuário adicionado ao chat.
    conexoes.push(ws);
    

    ws.on('message', function(message) {
        ws.uuid = message; 
        //console.log('WS identificado: ' + ws.uuid);
    });

    // Usuário saiu do chat
    ws.on('disconnect', function (reason) {
        
        // Remover Usuário da lista de conexões
        for (var x=0;x<conexoes.length;x++) {
          if(ws.uuid == conexoes[x].uuid){
            conexoes.splice(x,1);
          }
        }
    });

});

var port = process.env.PORT || 8000
server.listen(port, function(){
    console.log("Servidor conectado http://localhost:"+port)
})