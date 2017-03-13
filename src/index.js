'use strict'
var os = require('os');

var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , app = express();
    
app.use(express.static(__dirname + '/'));
var server = http.createServer(app);
var wss = new WebSocketServer({server:server});

var dom_list = [];
var connections = {};

wss.on('connection', function(socket){
    console.log(socket);
    
    add_list(socket);
    
    socket.on('close', function(){
        console.log('close');
        close_event(socket.upgradeReq.socket.remoteAddress);
        // connections = connections.filter(function (conn, i) {
        //     return (conn === socket) ? false : true;
        // });
    });
    
    socket.on('message', function(data){
        //var msg = JSON.parse(data);
        console.log('message', data);
        sendNextWindow(socket.upgradeReq.socket.remoteAddress, data);
    });
});
server.listen(3000);

function add_list(s){
    var ip = s.upgradeReq.socket.remoteAddress;
    connections[ip] = s;
    dom_list.push(ip);
    
    var ul = document.getElementById('list');
    var li = document.createElement('li');
    li.id = ip;
    li.className = 'ui-state-default'
    li.innerHTML = ip;
    
    ul.appendChild(li);
}

function submit_list() {
    var tmp_list = [];
    var ul = document.getElementById('list');
    var list = ul.getElementsByTagName('li');
    console.log(list);
    
    for(var i = 0; i < list.length; i++){
        tmp_list.push(list[i].textContent);
    }
    
    console.log(tmp_list);
    dom_list = tmp_list;
}

function sendNextWindow(ip, data){
    var len = dom_list.length;
    var msg = JSON.stringify(data);
    if(len === 0)
        return;
    
    
    if(len === 1){
        console.log(connections[ip]);
        connections[ip].send(msg);
    }else{
        var index = dom_list.indexOf(ip);
        var next = dom_list[index + 1];       
        console.log(connections[next]);
        
        if(connections[next]){
            connections[next].send(msg);
        }else{
            next = dom_list[0];
            connections[next].send(msg);
        }
    }
}

function close_event(ip){
    delete connections[ip];
    const dom = document.getElementById(ip);
    dom.parentNode.removeChild(dom);
}

function get_ip(){
    var ip;
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function(ifname){
        ifaces[ifname].forEach(function(iface){
            if('IPv4' !== iface.family || iface.internal !==false){
                return;
            }
            ip = iface.address;
        });
    });
    return ip;
}
window.onload =  function(e) {
    var el = document.getElementById('ip');  
    el.innerHTML　= get_ip();

};

$(function(){
	$('#list').sortable();
    var bt = document.getElementById('submit').addEventListener('click', submit_list);
});