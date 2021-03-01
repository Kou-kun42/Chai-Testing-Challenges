require("dotenv").config();
const app = require("../server.js");
const mongoose = require("mongoose");
const chai = require("chai");
const chaiHttp = require("chai-http");
const assert = chai.assert;

const User = require("../models/user.js");
const Message = require("../models/message.js");

chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

const SAMPLE_USER_ID = "aaaaaaaaaaaa";
const SAMPLE_MESSAGE_ID = "bbbbbbbbbbbb";
const SAMPLE_MESSAGE2_ID = "cccccccccccc";

describe("Message API endpoints", () => {
  beforeEach((done) => {
    // Makes test user
    const sampleUser = new User({
      username: "myuser",
      password: "mypassword",
      _id: SAMPLE_USER_ID,
    });

    const sampleMessage = new Message({
      title: "Sample Message",
      body: "Sample Message Body",
      author: SAMPLE_USER_ID,
      _id: SAMPLE_MESSAGE_ID,
    });

    sampleUser
      .save()
      .then(() => sampleMessage.save())
      .then(() => {
        done();
      });
  });

  afterEach((done) => {
    User.deleteMany({ username: "myuser" })
      .then(() => Message.deleteMany({ title: { $ne: "" } }))
      .then(() => {
        done();
      });
  });

  it("should load all messages", (done) => {
    chai
      .request(app)
      .get("/messages")
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.messages).to.be.an("array");
        done();
      });
  });

  it("should get one specific message", (done) => {
    chai
      .request(app)
      .get(`/messages/${SAMPLE_MESSAGE_ID}`)
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("object");
        expect(res.body.title).to.equal("Sample Message");
        expect(res.body.body).to.equal("Sample Message Body");
        done();
      });
  });

  it("should post a new message", (done) => {
    chai
      .request(app)
      .post("/messages")
      .send({
        title: "Sample Message 2",
        body: "Sample Message 2 Body",
        author: SAMPLE_USER_ID,
        _id: SAMPLE_MESSAGE2_ID,
      })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("title", "Sample Message 2");
        expect(res.body).to.have.property("body", "Sample Message 2 Body");

        // check that message is actually inserted into database
        Message.findById(SAMPLE_MESSAGE2_ID).then((message) => {
          expect(message).to.be.an("object");
          expect(message.title).to.equal("Sample Message 2");
          expect(message.body).to.equal("Sample Message 2 Body");
          done();
        });
      });
  });

  it("should update a message", (done) => {
    chai
      .request(app)
      .put(`/messages/${SAMPLE_MESSAGE_ID}`)
      .send({
        title: "Changed Sample Title",
        body: "Changed sample message body",
      })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.message).to.be.an("object");
        expect(res.body.message).to.have.property(
          "title",
          "Changed Sample Title"
        );
        expect(res.body.message).to.have.property(
          "body",
          "Changed sample message body"
        );

        // check that user is actually inserted into database
        Message.findById(SAMPLE_MESSAGE_ID).then((message) => {
          expect(message).to.be.an("object");
          expect(message.title).to.equal("Changed Sample Title");
          expect(message.body).to.equal("Changed sample message body");
          done();
        });
      });
  });

  it("should delete a message", (done) => {
    chai
      .request(app)
      .delete(`/messages/${SAMPLE_MESSAGE_ID}`)
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.message).to.equal("Successfully deleted.");
        expect(res.body._id).to.equal(SAMPLE_MESSAGE_ID);

        // check that message is actually deleted from database
        Message.findById(SAMPLE_MESSAGE_ID).then((message) => {
          expect(message).to.equal(null);
          done();
        });
      });
  });
});
