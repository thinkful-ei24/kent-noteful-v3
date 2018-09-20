'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Folder = require('../models/folder');

// GET all /folders
// Sort by name
router.get('/', (req, res, next) => {
  return Folder.find()
    .sort({ name: 1 })
    .then(folders => folders ? res.json(folders) : next())
    .catch(err => next(err));
});

// GET /folders by id
// Validate the id is a Mongo ObjectId
// Conditionally return a 200 response or a 404 Not Found
router.get('/:id', (req, res, next) => {
  const { id } = req.params;


  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  return Folder.findOne({_id: id})
    .then(folder => folder ? res.json(folder) : next())
    .catch(err => next(err));
});

// POST /folders to create a new folder
// Validate the incoming body has a name field
// Respond with a 201 status and location header
// Catch duplicate key error code 11000 and respond with a helpful error message (see below for sample code)
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

// PUT /folders by id to update a folder name
// Validate the incoming body has a name field
// Validate the id is a Mongo ObjectId
// Catch duplicate key error code 11000 and respond with a helpful error message
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
    err.status = 404;
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

// DELETE /folders by id which deletes the folder AND the related notes
// Respond with a 204 status
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid ID');
    err.status = 404;
    return next(err);
  }

  return Folder.findOneAndRemove({_id: id})
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = router;