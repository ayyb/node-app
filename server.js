const express = require("express");
const bodyParser = require("body-parser"); //express 기본 설치
const MongoClient = require("mongodb").MongoClient;
const app = express();
const methodOverride = require('method-override')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
require('dotenv').config()

//미들웨어 사용부분
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true })); //위치 잘 정리할것.
app.use('/public',express.static('public'))
app.use('/shop', require('./routes/shop.js') );
app.use('/board/sub', require('./routes/board.js') );

var db
MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true },
  function (error, client) {
    if (error) return console.log(error);
    db = client.db('todoapp'); //Mongo db 접속 방법

  //   //db insert 방법 db.collection('콜렉션명').insertOn({obj},callback(e,res){function})
  //   db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(error, result){
	//     console.log('저장완료'); 
	// });

    //서버띄우는 코드 여기로 옮기기
    app.listen(process.env.PORT, function () {
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
        process.env.DB_URL,
        { useUnifiedTopology: true },
        function (error, client) {
          if (error) return console.log(error);
          db = client.db('todoapp'); //Mongo db 접속 방법
          db.collection('counter').findOne({name : '게시물갯수'},function(e,res){
              var totalPostCount = res.totalPost
              var post = {_id : totalPostCount+1, writer: req.user._id, title : req.body.title, date : req.body.date}
              db.collection('post').insertOne(  post, function(error, result){
                db.collection('counter').updateOne({name : '게시물갯수'},{$inc:{totalPost :1}},function(e,res){ //$inc operate
                  if(e){
                    return console.log(e)
                  }
                })
                console.log('폼데이터 저장완료'); 
              });

          })
          
          //db insert 방법 db.collection('콜렉션명').insertOn({obj},callback(e,res){function})
          
        }
      );
  
  res.send("응답되었습니다.");
});
app.delete("/delete",function(req,res){
  req.body._id = parseInt(req.body._id)//문자열을 숫자로
  db.collection('post').deleteOne({_id : req.body._id, 작성자 : req.user._id }, function(e,res){
    console.log('삭제완료')
  })
  res.send('삭제되었습니다.')
})

app.get("/detail/:id",function(req,res){
  db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(e, result){
    res.render("detail.ejs",{data:result})
  })
})

app.get("/edit/:id",function(req,res){
  db.collection('post').findOne({ _id : parseInt(req.params.id)},function(e, result){
    // console.log(result)
    res.render("edit.ejs",{post:result})
  })
})

app.put('/edit',function(req,res){
  console.log(req.body.id);
  db.collection('post').updateOne({ _id: parseInt(req.body.id)},{$set:{title: req.body.title, date:req.body.date}},function(){
    console.log('수정완료')
    res.redirect('/list')
  })
})

app.get('/login',function(req,res){
  res.render('login.ejs')
})

app.post('/login',passport.authenticate('local',{failureRedirect:'/fail'}),function(req,res){ //passport를 사용해서 id, pw 확인
  res.redirect('/')
})

passport.use(new LocalStrategy({
  usernameField: 'id', //userName 필드
  passwordField: 'pw', //password 필드
  session: true, //세션 생성 여부
  passReqToCallback: false, //추가적인 검사가 필요한지
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id: 아이디 }, function (e, result) {
    console.log(result)
    done(null, result)
  })
}); 

app.get('/mypage',checkLogin,function(req,res){
  //console.log(req.user);
  res.render('mypage.ejs',{ user:req.user })
})

function checkLogin(req,res,next){
  if(req.user){
    next()
  }else{
    res.send('로그인하지 않았습니다.')
  }
}

app.get('/search',(req,res)=>{
  var srchWord =   [{
    $search: {
      index: 'titleSearh',
      text: {
        query: req.query.value,
        path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
      }
    }
  }
] 

  console.log(req.query)
  db.collection('post').aggregate(srchWord).toArray((e,result)=>{
    console.log('검색단어',srchWord);
    console.log('검색결과',result);
    res.render('search.ejs',{ posts:result })
  })
})

app.post('/register',function(req,res){
  console.log(req.body)
  db.collection('login').insertOne({id:req.body.id,pw:req.body.pw},function(e,result){
    console.log(result)
    res.send('가입되었습니다.')
  })
})

app.get('/shop/shirts', function(req, res){
  res.send('셔츠 파는 페이지입니다.');
});

app.get('/shop/pants', function(req, res){
  res.send('바지 파는 페이지입니다.');
}); 