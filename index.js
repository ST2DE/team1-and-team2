var express = require('express');

var app = express();

app.use('/public', express.static('public'))
app.set('view engine', 'pug')

var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://%s:%s', host, port);
})

app.get('/', function(req, res) {
    res.render('index', {title: 'GoBusGo'});
})

