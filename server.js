const express = require('express');
const app = express();

app.listen(8080, function() {
    console.log('listening on 8080')
})
app.get('/',function(req,res){
    res.sendFile(__dirname+ '/index.html')
})
app.get('/pet',function(req,res){
    res.send('펫용품 사세요')
})
app.get('/beauty',function(req,res){
    res.send('뷰티용품 사세요')
})