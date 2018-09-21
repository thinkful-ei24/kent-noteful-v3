'use strict';

const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const mongoose = require('mongoose');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'gi');
    filter.$or = [{title: { $regex: re }}, {content: { $regex: re }}];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  return Note
    .find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(Notes => Notes ? res.json(Notes) : next())
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;


  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  return Note
    .findById(id)
    .populate('tags')
    .then(Note => Note ? res.json(Note) : next())
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('Invalid Folder ID');
    err.status = 404;
    return next(err);
  }

  if (tags) {
    tags.forEach(tag => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('Invalid Tag ID');
        err.status = 404;
        return next(err);
      }
    });
  }

  const newNote = {
    title,
    content,
    folderId,
    tags: tags ? tags : []
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
  const { title, content, folderId, tags } = req.body;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 404;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('Invalid Folder ID');
    err.status = 404;
    return next(err);
  }

  if (tags.length) {
    tags.forEach(tag => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('Invalid Tag ID');
        err.status = 404;
        return next(err);
      }
    });
  }

  const newNote = {
    title,
    content,
    folderId,
    tags: tags.length ? tags : []
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