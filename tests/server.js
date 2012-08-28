var fs = require('fs'), 
    path = require('path'), 
    express = require('express'), 
    app = express();

var docRoot = path.join(__dirname, '..');

app.configure(function(){
  app.use(express.logger({ format: ':method :url' }));
  app.use(app.router);
  app.use(express['static'](docRoot));
  app.use(express.directory(docRoot));
});

function handleJsonRest(req, resp){
  var headers = {};
  // $data["headers"][strtr(strtolower(substr($key, 5)), "_", "-")] = $value;
  var hname; 
  for(var name in req.headers) {
    hname = (name.indexOf("HTTP_") === 0) ? 
        name.substring(5).replace(/_/g, '-').toLowerCase() :
        name.toLowerCase();
    headers[hname] = req.headers[name];
  }
  var data = {
    "method": req.method,
    "headers": headers,
    "content": ''
  };
  req.on('data', function(buf){
    data.content += buf.toString();
  });

  req.on('end', function(){
    resp.setHeader('Content-Type', "application/json");
    resp.setHeader('Cache-Control', "no-cache");
    resp.end(JSON.stringify(data) + "\n");
  });
}

app.get('/tests', handleJsonRest);
app.put('/tests', handleJsonRest);
app.post('/tests', handleJsonRest);
app['delete']('/tests', handleJsonRest);

app.listen(8080, "127.0.0.1");
console.log("Test server listening on 127.0.0.1:8080");
