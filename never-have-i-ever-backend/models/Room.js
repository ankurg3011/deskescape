const mongoose = require('mongoose');

const roomSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a room name'],
      trim: true
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      required: [true, 'Please specify room type']
    },
    passcode: {
      type: String,
      required: function() {
        return this.type === 'private';
      }
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 30
    },
    maxRounds: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    currentRound: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'completed'],
      default: 'waiting'
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        points: {
          type: Number,
          default: 0
        },
        isReady: {
          type: Boolean,
          default: false
        }
      }
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    currentQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    answers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        },
        answer: {
          type: Boolean
        },
        round: {
          type: Number
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Room', roomSchema);