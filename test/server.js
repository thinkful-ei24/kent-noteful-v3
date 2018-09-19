'use strict';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const { notes } = require('../db/seed/notes');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Reality Check', () => {

  it('true should be true', () => {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', () => {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

});

describe('Basic Express setup', () => {
  describe('Express static', () => {

    it('GET request "/" should return the index page', () => {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', () => {

    it('should respond with 404 when given a bad path', () => {
      return chai.request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });
});

describe('Noteful API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Note.insertMany(notes);
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
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length.of.at.least(1);
          return Note.countDocuments();
        })
        .then(count => expect(res.body).to.have.length(count));
    });

    it('should return correct search results for a valid search term', function() {
      let res;
      return chai.request(app)
        .get('/api/notes?searchTerm=lady%20gaga')
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length.of.at.least(1);
          return Note
            .find({
              $or: [ 
                {title: { $regex: /lady gaga/gi }}, 
                {content: { $regex: /lady gaga/gi }}
              ]
            });
        })
        .then(notes => {
          expect(res.body[0].id).to.equal(notes[0].id);
          expect(res.body[0].title).to.equal(notes[0].title);
          expect(res.body[0].content).to.equal(notes[0].content);
        });
    });

    it('should return nothing for invalid search term', function() {
      let res;
      return chai.request(app)
        .get('/api/notes?searchTerm=qwergsdfhgsdfgh')
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          return Note
            .find({
              $or: [ 
                {title: { $regex: /qwergsdfhgsdfgh/gi }}, 
                {content: { $regex: /qwergsdfhgsdfgh/gi }}
              ]
            });
        })
        .then(notes => {
          expect(res.body).to.be.empty;
          expect(res.body).to.deep.equal(notes);
        });
        
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });


    it('should should return error for incorrect note', function () {
      return chai.request(app).get('/api/notes/DOESNOTEXIST')
        .then((res) => {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
        });
    });
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      let res;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "title" field', function() {
      const newItem = {
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (res) {
          expect(res).to.have.status(400);
        });
    });
  });
});