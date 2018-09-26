'use strict';

const express = require('express');
const passport = require('passport');
const NotesController = require('../controllers/notes.controller');
const validateId = require('../modules/validateId').validateId;

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(NotesController.getAllNotes)
  .post(NotesController.createNewNote);

router.route('/:id')
  .get(validateId, NotesController.getNoteById)
  .put(validateId, NotesController.updateNoteById)
  .delete(validateId, NotesController.deleteNoteById);

module.exports = router;