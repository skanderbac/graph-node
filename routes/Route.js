var express = require('express');
var router = express.Router();
const Controller = require('../Controllers/controller');

router.get('/all',Controller.getAll);
router.get('/signin',Controller.signIn);

router.get('/callback',Controller.callBack);

router.get('/signout',Controller.signOut);



module.exports = router;
