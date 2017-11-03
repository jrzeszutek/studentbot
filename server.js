const http = require('http');
const request = require("tinyreq"); // npm i --save tinyreq

request("https://new.kt.agh.edu.pl/pl/user/146", function (err, body,response) {
    var konsultacje;

    if(body.indexOf("konsultacje") > -1) {
        konsultacje = body.slice(body.indexOf("konsultacje"), body.indexOf("konsultacje")+ 20);//niedziala
        console.info('----------->',response);
    }
});

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});

}).listen(1337, '127.0.0.1');