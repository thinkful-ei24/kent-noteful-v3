'use strict';

const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();
const options = { session: false, failWithError: true };
const localAuth = passport.authenticate('local', options);
const jwtAuth = passport.authenticate('jwt', options);

router.post('/', localAuth, AuthController.createNewAuth);
router.post('/refresh', jwtAuth, AuthController.refreshAuth);

module.exports = router;