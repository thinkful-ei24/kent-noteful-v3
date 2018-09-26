'use strict';

const express = require('express');
const passport = require('passport');
const TagsController = require('../controllers/tags.controller');
const { validateId, validateName } = require('../modules/validate');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(TagsController.getAllTags)
  .post(validateName, TagsController.createNewTag);

router.route('/:id')
  .get(validateId, TagsController.getTagById)
  .put(validateId, validateName, TagsController.updateTagById)
  .delete(validateId, TagsController.deleteTagById);

module.exports = router;