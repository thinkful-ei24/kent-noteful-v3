'use strict';

const express = require('express');
const passport = require('passport');
const FoldersController = require('../controllers/folders.controller');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(FoldersController.getAllFolders)
  .post(FoldersController.createNewFolder);

router.route('/:id')
  .get(FoldersController.getFolderById)
  .put(FoldersController.updateFolderById)
  .delete(FoldersController.deleteFolderById);

module.exports = router;