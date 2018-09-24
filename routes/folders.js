'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Folder = require('../models/folder');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  return Folder.find()
    .sort({ name: 1 })
    .then(folders => res.json(folders));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;


  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 400;
    return next(err);
  }

  return Folder.findOne({_id: id})
    .then(folder => folder ? res.json(folder) : next())
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

  const newFolder = { name };
  return Folder.create(newFolder)
    .then(folder => {
      if (folder) {
        console.log(folder);
        res.location(`${req.originalUrl}/${folder.id}`).status(201).json(folder);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { name } = req.body;
  const { id } = req.params;
  if (!(name)) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 400;
    return next(err);
  }

  const updateData = { name };
  return Folder.findOneAndUpdate({_id: id}, updateData, {new: true})
    .then(folder => folder ? res.json(folder) : next())
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  return Folder.findOneAndRemove({_id: id})
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;