'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const { folders } = require('../db/seed/folders');
const expect = chai.expect;
chai.use(chaiHttp);


describe('Noteful API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Folder.insertMany(folders);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {
    it('should get all folders', function() {
      return Promise.all([
        Folder.find(),
        chai.request(app).get('/api/folders')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/folders/:id', function() {
    it('should get a folder by ID', function() {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });
  });

  describe('POST /api/folders', function() {
    it('should create a new folder', function() {
      const newFolder = { name: 'new'};
      let res;
      return chai.request(app).post('/api/folders').send(newFolder)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          return Folder.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/folders/:id', function() {
    it('should update a folder by ID', function() {
      const updateFolder = { name: 'update' };
      return Folder.findOne()
        .then(folder => {
          updateFolder.id = folder.id;
          return chai.request(app).put(`/api/folders/${folder.id}`).send(updateFolder);
        })
        .then(res => {
          expect(res).to.have.status(200);
          return Folder.findById(updateFolder.id);
        })
        .then(folder => {
          expect(folder.id).to.equal(updateFolder.id);
          expect(folder.name).to.equal(updateFolder.name);
        });
    });  
  });
  
  describe('DELETE /api/folders/:id', function() {
    it('should delete a folder by ID', function() {
      return Folder.findOne()
        .then(folder => {
          return chai.request(app).delete(`/api/folders/${folder.id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });
  });
});