const express = require("express");
const bodyParser = require("body-parser"); //express 기본 설치
const MongoClient = require("mongodb").MongoClient;
const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true })); //위치 잘 정리할것.
var pass = "qwer1234";
var db
MongoClient.connect(
  `mongodb+srv://admin:${pass}@cluster0.fjbod.mongodb.net/todoapp?retryWrites=true&w=majority`,
  { useUnifiedTopology: true },
  function (error, client) {
    if (error) return console.log(error);
    db = client.db('todoapp'); //Mongo db 접속 방법

  //   //db insert 방법 db.collection('콜렉션명').insertOn({obj},callback(e,res){function})
  //   db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(error, result){
	//     console.log('저장완료'); 
	// });

    //서버띄우는 코드 여기로 옮기기
    app.listen("8080", function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
app.get("/write", function (req, res) {
  res.sendFile(__dirname + "/write.html");
});
app.get("/pet", function (req, res) {
  res.send("펫용품 사세요");
});
app.get("/beauty", function (req, res) {
  res.send("뷰티용품 사세요");
});
app.get("/list", function (req, res) {
  // res.render('list.ejs') //렌더해줘야됨
  db.collection('post').find().toArray(function(error, result){
    console.log(result)
    res.render('list.ejs',{ posts:result }) //파일로 전송
  })
});
app.post("/add", function (req, res) {
    console.log("add Page", req.body);
    MongoClient.connect(
        `mongodb+srv://admin:${pass}@cluster0.fjbod.mongodb.net/todoapp?retryWrites=true&w=majority`,
        { useUnifiedTopology: true },
        function (error, client) {
          if (error) return console.log(error);
          db = client.db('todoapp'); //Mongo db 접속 방법
      
          //db insert 방법 db.collection('콜렉션명').insertOn({obj},callback(e,res){function})
          db.collection('post').insertOne( req.body , function(error, result){
              console.log('폼데이터 저장완료'); 
          });
        }
      );
  
  res.send("응답되었습니다.");
});
