
const http = require('http');
const app = require('./backend/app')
const debug = require('debug')('node-angular')
const server = http.createServer(app);
const mongoose = require('mongoose')
port = process.env.PORT || 3000;

app.set('port', port);

server.listen(port);
