const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const User = require('../models/user');
const Tag = require('../models/tag');
const Folder = require('../models/folder');
const Note = require('../models/note');

const { users } = require('../db/seed/users');
const { tags } = require('../db/seed/tags');
const { folders } = require('../db/seed/folders');
const { notes } = require('../db/seed/notes');

mongoose.connect(MONGODB_URI, { useNewUrlParser:true })
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags),
      User.insertMany(users),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);// eslint-disable-line no-console
  });