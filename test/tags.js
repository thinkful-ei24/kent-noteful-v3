'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');
const Tag = require('../models/tag');
const {tags} = require('../db/seed/tags');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, {useNewUrlParser: true})
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Promise.all([
      Tag.insertMany(tags),
      Tag.createIndexes()
    ]);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {
    it('should return the correct number of tags', function() {
      return Promise.all([
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct fields and values', function() {
      return Promise.all([
        Tag.find().sort('name'),
        chai.request(app).get('/api/tags')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function(item, i) {
            expect(item).to.be.an('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });
  });

  describe('GET /api/tags/:id', function() {
    it('should get a tag by ID', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should respond with a 400 for an invalid id', function() {
      return chai.request(app)
        .get('/api/tags/INVALID-ID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('Invalid ID');
        });
    });

    it('should respond with a 404 for an ID that does not exist', function() {
      return chai.request(app)
        .get('/api/tags/DOESNOTEXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/tags', function() {
    it('should create a new tag', function() {
      const newTag = {name: 'new'};
      let res;
      return chai.request(app).post('/api/tags').send(newTag)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should return an error when missing "name" field', function() {
      const newTag = {};
      return chai.request(app).post('/api/tags').send(newTag)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function() {
      return Tag.findOne()
        .then(data => {
          const newTag = {'name': data.name};
          return chai.request(app).post('/api/tags').send(newTag);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });
  });

  describe('PUT /api/tags/:id', function() {
    it('should update a tag by ID', function() {
      const updateTag = {name: 'update'};
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/tags/${data.id}`).send(updateTag);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateTag.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should respond with a 400 for an invalid id', function() {
      const updateTag = {name: 'update'};
      return chai.request(app)
        .put('/api/tags/INVALID-ID')
        .send(updateTag)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('Invalid ID');
        });
    });

    it('should respond with a 404 for an id that does not exist', function() {
      const updateTag = {name: 'update'};
      return chai.request(app)
        .put('/api/tags/DOESNOTEXIST')
        .send(updateTag)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function() {
      const updateTag = {};
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/tags/${data.id}`).send(updateTag);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function() {
      return Tag.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/tags/${item1.id}`)
            .send(item1);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('The tag name already exists');
        });
    });
  });

  describe('DELETE /api/tags/:id', function() {
    it('should delete a tag by ID', function() {
      let id;
      return Tag.findOne()
        .then(tag => {
          id = tag.id;
          return chai.request(app).delete(`/api/tags/${id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Tag.findById(id);
        })
        .then(data => {
          expect(data).to.be.null;
        });
    });
  });
});