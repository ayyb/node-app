const express = require('express');
const bodyParser= require('body-parser') //express 기본 설치
const app = express();

app.use(bodyParser.urlencoded({extended: true})) //위치 잘 정리할것.

app.listen(8080, function() {
    console.log('listening on 8080')
})
app.get('/',function(req,res){
    res.sendFile(__dirname+ '/index.html')
})
app.get('/write',function(req,res){
    res.sendFile(__dirname+ '/write.html')
})
app.get('/pet',function(req,res){
    res.send('펫용품 사세요')
})
app.get('/beauty',function(req,res){
    res.send('뷰티용품 사세요')
})
app.post('/add',function(req,res){
    console.log('add Page',req.body)
    res.send('응답되었습니다.')
})

