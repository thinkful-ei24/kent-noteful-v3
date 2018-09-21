'use strict';

const express = require('express');
const router = express.Router();
const Tag = require('../models/tag');
const Note = require('../models/note');
const mongoose = require('mongoose');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  return Tag.find()
    .sort({ name: 1 })
    .then(tags => tags ? res.json(tags) : next())
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

  return Tag.findOne({_id: id})
    .then(tag => tag ? res.json(tag) : next())
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;
  if (!(name)) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newTag = { name };
  return Tag.create(newTag)
    .then(tag => {
      if (tag) {
        res.location(`${req.originalUrl}/${tag.id}`).status(201).json(tag);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { name } = req.body;
  const { id } = req.params;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  const updateData = { name };
  return Tag.findOneAndUpdate({_id: id}, updateData, {new: true})
    .then(tag => tag ? res.json(tag) : next())
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  return Tag.findOneAndRemove({_id: id})
    .then(() => {
      return Note.updateMany({tags: id}, {$pull: {tags: id}}, {new: true});
    })
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;