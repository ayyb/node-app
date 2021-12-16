const express = require("express");
const bodyParser = require("body-parser"); //express 기본 설치
const MongoClient = require("mongodb").MongoClient;
const app = express();
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const objectId = require("mongodb")
var path = require('path');
require("dotenv").config();

let multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("PNG, JPG만 업로드하세요"));
    }
    callback(null, true);
  },
  // limits: {
  //   fileSize: 1024 * 1024,
  // },
});

//미들웨어 사용부분
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true })); //위치 잘 정리할것.
app.use("/public", express.static("public"));
app.use("/shop", require("./routes/shop.js"));
app.use("/board/sub", require("./routes/board.js"));

var db;
MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true },
  function (error, client) {
    if (error) return console.log(error);
    db = client.db("todoapp"); //Mongo db 접속 방법

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
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      console.log(result);
      res.render("list.ejs", { posts: result }); //파일로 전송
    });
});
app.post("/add", function (req, res) {
  console.log("add Page", req.body);
  MongoClient.connect(
    process.env.DB_URL,
    { useUnifiedTopology: true },
    function (error, client) {
      if (error) return console.log(error);
      db = client.db("todoapp"); //Mongo db 접속 방법
      db.collection("counter").findOne(
        { name: "게시물갯수" },
        function (e, res) {
          var totalPostCount = res.totalPost;
          var post = {
            _id: totalPostCount + 1,
            writer: req.user._id,
            title: req.body.title,
            date: req.body.date,
          };
          db.collection("post").insertOne(post, function (error, result) {
            db.collection("counter").updateOne(
              { name: "게시물갯수" },
              { $inc: { totalPost: 1 } },
              function (e, res) {
                //$inc operate
                if (e) {
                  return console.log(e);
                }
              }
            );
            console.log("폼데이터 저장완료");
          });
        }
      );

      //db insert 방법 db.collection('콜렉션명').insertOn({obj},callback(e,res){function})
    }
  );

  res.send("응답되었습니다.");
});
app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id); //문자열을 숫자로
  db.collection("post").deleteOne(
    { _id: req.body._id, 작성자: req.user._id },
    function (e, res) {
      console.log("삭제완료");
    }
  );
  res.send("삭제되었습니다.");
});

app.get("/detail/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (e, result) {
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (e, result) {
      // console.log(result)
      res.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", function (req, res) {
  console.log(req.body.id);
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function () {
      console.log("수정완료");
      res.redirect("/list");
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (req, res) {
    //passport를 사용해서 id, pw 확인
    res.redirect("/");
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "id", //userName 필드
      passwordField: "pw", //password 필드
      session: true, //세션 생성 여부
      passReqToCallback: false, //추가적인 검사가 필요한지
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (e, result) {
    console.log(result);
    done(null, result);
  });
});

app.get("/mypage", function (req, res) {
  //console.log(req.user);
  res.render("mypage.ejs", { user: req.user });
});

app.get("/upload", function (req, res) {
  console.log("upload page");
  res.render("upload.ejs");
});

app.get("/search", (req, res) => {
  var srchWord = [
    {
      $search: {
        index: "titleSearh",
        text: {
          query: req.query.value,
          path: "title", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
  ];

  console.log(req.query);
  db.collection("post")
    .aggregate(srchWord)
    .toArray((e, result) => {
      console.log("검색단어", srchWord);
      console.log("검색결과", result);
      res.render("search.ejs", { posts: result });
    });
});

app.post("/register", function (req, res) {
  console.log(req.body);
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    function (e, result) {
      console.log(result);
      res.send("가입되었습니다.");
    }
  );
});

app.get("/shop/shirts", function (req, res) {
  res.send("셔츠 파는 페이지입니다.");
});

app.get("/shop/pants", function (req, res) {
  res.send("바지 파는 페이지입니다.");
});

app.post("/upload",upload.single('profileImg'),function(req,res){
  res.send('업로드 완료')
})

app.get('/image/:imageName', function(req, res){
  res.sendFile( __dirname + '/public/image/' + req.params.imageName )
})

app.post('/chatroom', function(req,res){
  console.log('챗데이터')
  var dataSet = {
    title:'blabla',
    member:[objectId(req.body.chatedId), req.user._id],
    data : new Date()
  }
  
  db.collection('chatroom').insertOne(dataSet).then(function(result){
    res.send('저장완료')
  });
})

app.get('/chat',function(req,res){
  db.collection('chatroom').find({ member : req.user._id }).toArray().then((result)=>{
    console.log(result);
    res.render('chat.ejs', {data : result})
  })
})

app.post('/message',function(req,res){
  var dataSet = {
    parent : req.body.parent,
    userid : req.user._id,
    content : req.body.content,
    date : new Date(),
  }
  db.collection('message').insertOne(dataSet)
  .then((result)=>{
    res.send(result);
  })
})

app.get('/message/:parentid', function(req, res){

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  db.collection('message').find({ parent: req.params.parentid }).toArray()
  .then((result)=>{
    console.log(result);
    res.write('event: test\n');
    res.write(`data: ${JSON.stringify(결과)}\n\n`);
  });

  const searchDoc = [
    { $match: { 'fullDocument.parent': req.params.parentid } }
  ];

  const changeStream = db.collection('message').watch(searchDoc);
  changeStream.on('change', result => {
    console.log(result.fullDocument);
    var addDoc = [result.fullDocument];
    res.write(`data: ${JSON.stringify(addDoc)}\n\n`);
  });
});