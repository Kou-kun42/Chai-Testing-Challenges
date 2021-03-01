const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Message = require("../models/message");

/** Route to get all messages. */
router.get("/", (req, res) => {
  // Get all Message objects using `.find()`
  // Return the Message objects as a JSON list
  Message.find({})
    .then((messages) =>
      res.json({
        messages,
      })
    )
    .catch((err) => {
      throw err.message;
    });
});

/** Route to get one message by id. */
router.get("/:messageId", (req, res) => {
  // Get the Message object with id matching `req.params.id`
  // using `findOne`
  // Return the matching Message object as JSON
  Message.findOne({ _id: req.params.messageId })
    .then((message) => res.send(message))
    .catch((err) => {
      throw err.message;
    });
});

/** Route to add a new message. */
router.post("/", (req, res) => {
  let message = new Message(req.body);
  message
    .save()
    .then((message) => {
      return User.findById(message.author);
    })
    .then((user) => {
      // console.log(user)
      user.messages.unshift(message);
      return user.save();
    })
    .then(() => {
      return res.send(message);
    })
    .catch((err) => {
      throw err.message;
    });
});

/** Route to update an existing message. */
router.put("/:messageId", (req, res) => {
  // Update the matching message using `findByIdAndUpdate`
  // Return the updated Message object as JSON
  Message.findByIdAndUpdate(req.params.messageId, {
    $set: { title: req.body.title, body: req.body.body },
  })
    .then(() => {
      return Message.findOne({ _id: req.params.messageId });
    })
    .then((message) => {
      return res.json({ message });
    })
    .catch((err) => {
      throw err.message;
    });
});

/** Route to delete a message. */
router.delete("/:messageId", (req, res) => {
  // Delete the specified Message using `findByIdAndDelete`. Make sure
  // to also delete the message from the User object's `messages` array
  // Return a JSON object indicating that the Message has been deleted
  Message.findByIdAndDelete(req.params.messageId)
    .then((result) => {
      if (result === null) {
        return res.json({ message: "Message does not exist." });
      }
      return User.deleteOne({ messages: req.params.messageId });
    })
    .then(() =>
      res.json({
        message: "Successfully deleted.",
        _id: req.params.messageId,
      })
    )
    .catch((err) => {
      throw err.message;
    });
});

module.exports = router;
