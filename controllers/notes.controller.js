'use strict';

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const mongoose = require('mongoose');

const getAllNotes = function(req, res, next) {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;
  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'gi');
    filter.$or = [{ title: { $regex: re } }, { content: { $regex: re } }];
  }

  if (folderId) filter.folderId = folderId;
  if (tagId) filter.tags = tagId;
  if (userId) filter.userId = userId;

  return Note
    .find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(Notes => Notes ? res.json(Notes) : next())
    .catch(err => next(err));
};

const getNoteById = function(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;

  return Note
    .findOne({ _id: id, userId })
    .populate('tags')
    .then(Note => Note ? res.json(Note) : next())
    .catch(err => next(err));
};

const createNewNote = function(req, res, next) {
  const { title, content, folderId, tags = [] } = req.body;
  const userId = req.user.id;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('Invalid Folder ID');
    err.status = 400;
    return next(err);
  }

  if (folderId) {
    Folder.findOne({ _id: folderId, userId })
      .then(folder => {
        if (!folder) {
          const err = new Error('This is not your folder');
          err.status = 400;
          return next(err);
        }
      });
  }

  if (tags) {
    tags.forEach(tag => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('Invalid Tag ID');
        err.status = 400;
        return next(err);
      }

      Tag.findOne({ _id: tag, userId })
        .then(tag => {
          if (!tag) {
            const err = new Error('This is not your tag');
            err.status = 400;
            return next(err);
          }
        });
    });
  }

  const newNote = {
    title,
    content,
    folderId,
    tags,
    userId
  };

  if (newNote.folderId === '') {
    delete newNote.folderId;
  }

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
};

const updateNoteById = function(req, res, next) {
  const { id } = req.params;
  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];
  const userId = req.user.id;
  const folderId = req.body.folderId;

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.folderId && !mongoose.Types.ObjectId.isValid(toUpdate.folderId)) {
    const err = new Error('Invalid Folder ID');
    err.status = 400;
    return next(err);
  }

  if (folderId) {
    Folder.findOne({ _id: folderId, userId })
      .then(folder => {
        if (!folder) {
          const err = new Error('This is not your folder');
          err.status = 400;
          return next(err);
        }
      });
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));

    if (badIds.length) {
      const err = new Error('Invalid Tag ID');
      err.status = 400;
      return next(err);
    }

    const otherIds = toUpdate.tags.filter((tag) => {
      return !Tag.findOne({ _id: tag, userId });
    });

    if (otherIds.length) {
      const err = new Error('This is not your tag');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = { folderId : 1 };
  }

  Note.findOneAndUpdate({ _id: id, userId }, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
};

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
const deleteNoteById = function(req, res, next) {
  const userId = req.user.id;
  const noteId = req.params.id;
  return Note.findOneAndRemove({ _id: noteId, userId })
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNewNote,
  updateNoteById,
  deleteNoteById
};