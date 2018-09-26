'use strict';

const express = require('express');
const passport = require('passport');
const NotesController = require('../controllers/notes.controller');

const router = express.Router();

router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.route('/')
  .get(NotesController.getAllNotes)
  .post(NotesController.createNewNote);

router.route('/:id')
  .get(NotesController.getNoteById)
  .put(NotesController.updateNoteById)
  .delete(NotesController.deleteNoteById);

module.exports = router;