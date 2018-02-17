var http = require('http');
var https = require('https');
var url = require("url");
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("config.json"));
var blacklist = config.blacklist;

console.log('Server started on port 3000');
//var blacklist = [{}]
//returned object is an EventEmitter
var server = http.createServer(function(request, response) {

  var p_url = url.parse(request.url,true);
  const { headers, method } = request;

  console.log(headers);
//  console.log("URL: "+ request.url);
  //console.log("Path: "+ p_url.path);
  //console.log("Host: "+ request.headers.host)
  let body = [];
  for(i in blacklist)
  {
    if(request.url.includes(blacklist[i]))
    {
      response.writeHead(403);
      return response.end("<h1>Oops! This domain has been blacklisted<h1>");
    }
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
     path: p_url.path,
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

server.addListener('connect', function(https_request, ))

// });

//
// let data = '';
// var proxy = http.request(options, function (res) {
// res.on('data',(chunk) => {
//     data += chunk;
//   });
//   res.on('end', () => {
//     console.log(JSON.parse(data));
//   });
// proxy.end();

//View Engine Middleware
// app.set('view engine', 'ejs'); //set views to ejs
// app.set('views', path.join(__dirname, 'views')); //read ejs files
// app.use(express.static(path.join(__dirname, 'views')));
//
// app.get('/', function(req, res){ //main output
//   res.render('main.ejs');
//
//
// });
// app.listen(3000, function(){ //local host
//   console.log('Server for search page started on port 3000');
// });
  // function callback runs if a server receives a message
  // node is built to handle events whenever they occur
  // IE it handles threading behind the scenes
  //
