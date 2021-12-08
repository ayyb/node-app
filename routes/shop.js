var router = require('express').Router();

// router.use(checkLogin); //하위 모든 라우터들에게 적용
// router.use('/shirts', checkLogin); //개별

function checkLogin(req,res,next){ //로그인 체크 기능
    if(req.user){
      next()
    }else{
      res.send('로그인하지 않았습니다.')
    }
  }

router.get('/shirts',checkLogin, function(요청, 응답){
   응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants',checkLogin, function(요청, 응답){
   응답.send('바지 파는 페이지입니다.');
}); 

module.exports = router; //js파일을 불러오기 위한