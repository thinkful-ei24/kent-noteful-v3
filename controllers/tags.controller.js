'use strict';

const Tag = require('../models/tag');

const getAllTags = function(req, res, next) {
  const userId = req.user.id;
  return Tag.find({ userId })
    .sort({ name: 1 })
    .then(tags => res.json(tags))
    .catch(err => next(err));
};

const getTagById = function(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  return Tag.findOne({ _id: id, userId })
    .then(tag => tag ? res.json(tag) : next())
    .catch(err => next(err));
};

const createNewTag = function(req, res, next) {
  const { name } = req.body;
  const userId = req.user.id;

  if (!(name)) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newTag = { name, userId };
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
};
const updateTagById = function(req, res, next) {
  const { name } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  if (!(name)) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateData = { name, userId };
  return Tag.findOneAndUpdate({ _id: id }, updateData, { new: true })
    .then(tag => tag ? res.json(tag) : next())
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
};

const deleteTagById = function(req, res, next) {
  const userId = req.user.id;
  const { id } = req.params;

  return Tag.findOneAndRemove({ _id: id, userId })
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
};

module.exports = {
  getAllTags,
  getTagById,
  createNewTag,
  updateTagById,
  deleteTagById
};