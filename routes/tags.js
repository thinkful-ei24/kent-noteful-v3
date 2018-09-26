'use strict';

const express = require('express');
const passport = require('passport');
const TagsController = require('../controllers/tags.controller');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(TagsController.getAllTags)
  .post(TagsController.createNewTag);

router.route('/:id')
  .get(TagsController.getTagById)
  .put(TagsController.updateTagById)
  .delete(TagsController.deleteTagById);

module.exports = router;