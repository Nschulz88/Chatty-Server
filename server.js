// server.js

const express = require('express');
const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;


// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new WebSocket.Server({ server });

let webSocketsInUse = {};

var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

// This is a function defined to broadcast all messages to all "online" users
wss.broadcast = function broadcast(data) {
    console.log("logging JSON.parse(data)", typeof JSON.parse(data).content);

    wss.clients.forEach(function each(client) {
        // console.log("logging client", client.readyState, WebSocket.OPEN );
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

const showActiveUsersToAll = () => {
    wss.broadcast(JSON.stringify({
        type: 'activeUserCount',
        activeUsers: wss.clients.size
    }));
};

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
    console.log('Client connected');
    // console.log('log ws: ', ws);
    // let userID = req.headers['sec-websocket-key'];
    // console.log('Logging user ID', userID);
    ws.color = getRandomColor();
    console.log("----------wss.clients.size", wss.clients.size);
    showActiveUsersToAll();

  
    ws.on('message', (message) => {
        let parsedMessage = JSON.parse(message);
        const outgoingMessage = {
            id: uuidv4(),
            username: parsedMessage.username || 'Anonymous',
            content: parsedMessage.content,
            type: (parsedMessage.type === 'postMessage') ? 'incomingMessage' : 'incomingNotification',
            activeUsers: wss.clients.size,
            userColor:  ws.color 
        };
        wss.broadcast(JSON.stringify(outgoingMessage));
    });

    // Set up a callback for when a client closes the socket. This usually means they closed their browser.
    ws.on('close', () => {
        console.log('Client disconnected');
        showActiveUsersToAll();
    });

});