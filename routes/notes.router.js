'use strict';

const express = require('express');
const passport = require('passport');
const NotesController = require('../controllers/notes.controller');
const { validateId, validateTitle } = require('../modules/validate');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(NotesController.getAllNotes)
  .post(validateTitle, NotesController.createNewNote);

router.route('/:id')
  .get(validateId, NotesController.getNoteById)
  .put(validateId, validateTitle, NotesController.updateNoteById)
  .delete(validateId, NotesController.deleteNoteById);

module.exports = router;