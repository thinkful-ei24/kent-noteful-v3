'use strict';

const express = require('express');

const router = express.Router();

const Note = require('../models/note');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  let filter = {};
  const re = new RegExp(searchTerm, 'gi');

  if (searchTerm) {
    filter = { $or: [ {title: { $regex: re }}, {content: { $regex: re }}]};
  }

  return Note
    .find(filter)
    .sort({ updatedAt: 'desc' })
    .then(Notes => Notes ? res.json(Notes) : next())
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  return Note
    .findById(id)
    .then(Note => Note ? res.json(Note) : next())
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newNote = { 
    title, 
    content
  };
  
  return Note
    .create(newNote)
    .then(Note => {
      if (Note) {
        res.location(`${req.originalUrl}/${Note.id}`).status(201).json(Note);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 404;
    return next(err);
  }

  const newNote = { 
    title, 
    content
  };

  return Note
    .findByIdAndUpdate(noteId, newNote, {new: true})
    .then(Note => Note ? res.json(Note) : next())
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const noteId = req.params.id;
  return Note.findByIdAndRemove(noteId)
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;