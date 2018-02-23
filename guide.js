var http = require('http');
var https = require('https');
var url = require("url");
var fs = require('fs');
var net = require('net');
var config = JSON.parse(fs.readFileSync("config.json"));
var blacklist = config.blacklist;

console.log('Server started on port 3000');
//var blacklist = [{}]
//returned object is an EventEmitter
var server = http.createServer(function(request, response) {

  var proxy_url = url.parse(request.url,true);
  const { headers, method } = request;

  console.log(headers);
//  console.log("URL: "+ request.url);
  //console.log("Path: "+ proxy_url.path);
  //console.log("Host: "+ request.headers.host)
  fs.readFile('requests.json', 'utf8', function readFileCallback(err, data){
    if (err) console.log(err);
    else fs.writeFile('requests.json', JSON.stringify(headers), 'utf8', function(error) { if(error) { console.log(error.stack)}})
  });

  let body = [];
  for(i in blacklist)
  {
    if(request.url.includes(blacklist[i]))
    {
      response.writeHead(403);
      return response.end("<h1>Oops! This domain has been blocked<h1>");
    }
  }

  if(request.url.includes("example"))
  {

  }
  //console.log('serve: ' + request.url);

  request.on('error', (err) => {
    console.error(err.stack);
  });
  //grab data out of the stream by listening to the stream's data/end events
  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    body = Buffer.concat(body).toString();
    //now have headers. method, url and body of request
  });


   var data = [];
   var proxy_req = http.request({
     port: 80,
     host: request.headers.host,
     method: method,
     path: proxy_url.path,
   });
     proxy_req.end();

     proxy_req.on('error', (err) => {
       console.log("Packet sent.....but error?")
       console.error(err.stack);
     });

     proxy_req.on('response', function (proxy_resp) {

     proxy_resp.on('data', (chunk) => {

       data.push(chunk);
       response.write(chunk, 'binary');
     });
     proxy_resp.on('end', () => {
      response.end();
   });
   response.writeHead(proxy_resp.statusCode, proxy_resp.headers);
 });
}).listen(3000);


//HTTPS Listener (through HTTP connect protocol)
server.addListener('connect', function(request, socket, bodyhead) {
    proxy_url = url.parse('https://'+request.url,true);
    // console.log("HTTPS URL: "+proxy_url.href);
    // console.log("Got https request");
    for(i in blacklist)
    {
      //proxy_url.hostname.search(blacklist[i])!=-1
      if(proxy_url.href.includes(blacklist[i]))
      {
        console.log("HELLO");

        socket.write("HTTP/" + request.httpVersion + " 403 Forbidden\r\n\r\n", function() {
            socket.end("<h1>Oops! This domain has been blocked<h1>");
        });

      }
    }

    //console.log("URL: " + proxy_url.hostname)
    //connects proxy to the port requested
    var proxy_socket = new net.Socket();
    proxy_socket.connect(proxy_url.port, proxy_url.hostname, function () {
          proxy_socket.write(bodyhead);
          socket.write("HTTP/" + request.httpVersion + " 200 Connection established\r\n\r\n");
      }
    );

    //Finish browser-proxy socket when proxy-server socket is finished or breaks
    proxy_socket.on('end', function () {
      socket.end();
    });
    proxy_socket.on('error', function () {
      socket.write("HTTP/" + request.httpVersion + " 500 Connection error\r\n\r\n");
      socket.end();
    });

    //Tunnel data from each socket out the other
    socket.on('data', function (chunk) {
      proxy_socket.write(chunk);
    });
    proxy_socket.on('data', function (chunk) {
      socket.write(chunk);
    });

    //Finish proxy-server socket when browser-proxy socket is finished or breaks
    socket.on('end', function () {
      proxy_socket.end();
    });
    socket.on('error', function () {
      proxy_socket.end();
    });



});
