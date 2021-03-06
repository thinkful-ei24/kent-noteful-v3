'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const User = require('../models/user');
const { users } = require('../db/seed/users');
const Note = require('../models/note');
const { notes } = require('../db/seed/notes');
const Folder = require('../models/folder');
const { folders } = require('../db/seed/folders');
const Tag = require('../models/tag');
const { tags } = require('../db/seed/tags');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API', function() {
  let token;
  let user;

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Promise.all([
      User.insertMany(users),
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Folder.createIndexes(),
      Tag.insertMany(tags),
      Tag.createIndexes()
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function() {
    it('should return all notes', function() {
      let res;
      return chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length.of.at.least(1);
          return Note.countDocuments({ userId: user.id });
        })
        .then(count => expect(res.body).to.have.length(count));
    });

    it('should return a list sorted desc with the correct right fields', function() {
      return Promise.all([
        Note.find({ userId: user.id }).sort({ updatedAt: 'desc' }),
        chai.request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function(item, i) {
            expect(item).to.be.an('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags', 'userId');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.deep.equal(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.deep.equal(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a title search', function() {
      const searchTerm = 'lady gaga';

      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note
        .find({ $or: [{ title: re }, { content: re }] })
        .sort({ updatedAt: 'desc' });

      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function(item, i) {
            expect(item).to.be.an('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags', 'userId');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.deep.equal(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.deep.equal(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a folderId query', function() {
      let data;
      return Folder.findOne({ userId: user.id })
        .then((_data) => {
          data = _data;
          return Promise.all([
            Note.find({ folderId: data.id }),
            chai.request(app)
              .get(`/api/notes?folderId=${data.id}`)
              .set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });


    it('should return correct search results for a tagId query', function() {
      let data;
      return Tag.findOne({ userId: user.id })
        .then((_data) => {
          data = _data;
          return Promise.all([
            Note.find({ tags: data.id }),
            chai.request(app)
              .get(`/api/notes?tagId=${data.id}`)
              .set('Authorization', `Bearer ${token}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function() {
      const searchTerm = 'NOT-A-VALID-QUERY';
      const re = new RegExp(searchTerm, 'i');
      const dbPromise = Note.find({
        $or: [{ title: re }, { content: re }]
      }).sort({ updatedAt: 'desc' });
      const apiPromise = chai.request(app)
        .get(`/api/notes?searchTerm=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`);
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/notes/:id', function() {
    it('should return correct notes', function() {
      let data;
      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });


    it('should respond with status 400 and an error message when `id` is not valid', function() {
      return chai.request(app)
        .get('/api/notes/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('Invalid ID');
        });
    });

    it('should respond with a 404 for an id that does not exist', function() {
      return chai.request(app)
        .get('/api/notes/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function() {

    it('should create and return a new item when provided valid title and content', function() {
      const newItem = {
        title: 'The best article about cats ever!',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'tags', 'userId');
          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });

    it('should create and return a new item when provided valid title (content optional)', function() {
      const newItem = {
        title: 'The best article about cats ever!'
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags', 'userId');
          return Note.findOne({ _id: res.body.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.not.exist;
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });

    it('should create and return when folderId is an empty string', function() {
      const newItem = {
        title: 'The best article about cats ever!',
        folderId: ''
      };
      let res;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'createdAt', 'updatedAt', 'tags', 'userId');
          return Note.findOne({ _id: res.body.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.folderId).to.not.exist;
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.deep.equal(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function() {
      const newItem = {
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when "title" is empty string', function() {
      const newItem = { title: '' };
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when `folderId` is not valid ', function() {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        folderId: 'NOT-A-VALID-ID'
      };
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Invalid Folder ID');
        });
    });

    it('should return an error when a tag `id` is not valid ', function() {
      const newItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...',
        tags: ['NOT-A-VALID-ID']
      };
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Invalid Tag ID');
        });
    });
  });

  describe('PUT /api/notes/:id', function() {

    it('should update the note when provided a valid title', function() {
      const updateItem = {
        title: 'What about dogs?!'
      };
      let data;
      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'userId');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.deep.equal(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with status 400 and an error message when `id` is not valid', function() {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/notes/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('Invalid ID');
        });
    });

    it('should respond with a 404 for an id that does not exist', function() {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .put('/api/notes/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when "title" is an empty string', function() {
      const updateItem = { title: '' };
      let data;
      return Note.findOne({ userId: user.id })
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
  });

  describe('DELETE /api/notes/:id', function() {
    it('should delete an item by id', function() {
      let noteId;
      return Note
        .findOne({ userId: user.id })
        .then(note => {
          noteId = note.id;
          return chai.request(app)
            .delete(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });
  });
});