'use strict';

const express = require('express');
const passport = require('passport');
const TagsController = require('../controllers/tags.controller');
const validateId = require('../modules/validateId').validateId;

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(TagsController.getAllTags)
  .post(TagsController.createNewTag);

router.route('/:id')
  .get(validateId, TagsController.getTagById)
  .put(validateId, TagsController.updateTagById)
  .delete(validateId, TagsController.deleteTagById);

module.exports = router;