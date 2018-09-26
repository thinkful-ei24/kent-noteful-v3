'use strict';

const express = require('express');
const passport = require('passport');
const FoldersController = require('../controllers/folders.controller');
const validateId = require('../modules/validateId').validateId;

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(FoldersController.getAllFolders)
  .post(FoldersController.createNewFolder);

router.route('/:id')
  .get(validateId, FoldersController.getFolderById)
  .put(validateId, FoldersController.updateFolderById)
  .delete(validateId, FoldersController.deleteFolderById);

module.exports = router;