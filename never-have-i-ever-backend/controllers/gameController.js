const asyncHandler = require('express-async-handler');
const Room = require('../models/Room');
const Question = require('../models/Question');
const User = require('../models/User');

// @desc    Get random questions
// @route   GET /api/questions
// @access  Public
const getRandomQuestions = asyncHandler(async (req, res) => {
  const { count = 10, category } = req.query;
  
  const filter = {};
  if (category) {
    filter.category = category;
  }

  const questions = await Question.aggregate([
    { $match: filter },
    { $sample: { size: parseInt(count) } },
    { $project: { text: 1, category: 1, difficulty: 1 } }
  ]);

  res.json(questions);
});

// @desc    Submit an answer to a question
// @route   POST /api/rooms/:id/answers
// @access  Public
const submitAnswer = asyncHandler(async (req, res) => {
  const { userId, answer } = req.body;
  const roomId = req.params.id;

  // Validate required fields
  if (!userId || answer === undefined) {
    res.status(400);
    throw new Error('Please provide userId and answer');
  }

  // Find room
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  // Check if game is in progress
  if (room.status !== 'playing') {
    res.status(400);
    throw new Error('Game is not in progress');
  }

  // Check if user is in the room
  const playerIndex = room.players.findIndex(
    player => player.user.toString() === userId
  );

  if (playerIndex === -1) {
    res.status(400);
    throw new Error('You are not in this room');
  }

  // Check if user already answered this question in this round
  const existingAnswer = room.answers.find(
    a => a.user.toString() === userId && 
         a.question.toString() === room.currentQuestion.toString() &&
         a.round === room.currentRound
  );

  if (existingAnswer) {
    res.status(400);
    throw new Error('You have already answered this question');
  }

  // Add the answer
  room.answers.push({
    user: userId,
    question: room.currentQuestion,
    answer: answer,
    round: room.currentRound
  });

  await room.save();

  // Check if all players have answered
  const currentRoundAnswers = room.answers.filter(
    a => a.question.toString() === room.currentQuestion.toString() && 
         a.round === room.currentRound
  );

  const allPlayersAnswered = currentRoundAnswers.length === room.players.length;

  // If all players answered, calculate points for this round
  if (allPlayersAnswered) {
    // Calculate how many players answered "Yes"
    const yesAnswers = currentRoundAnswers.filter(a => a.answer === true).length;
    const pointsToAward = 10;

    // Award points based on whether player is in majority or minority
    for (const answer of currentRoundAnswers) {
      const playerIndex = room.players.findIndex(
        p => p.user.toString() === answer.user.toString()
      );

      if (playerIndex !== -1) {
        const isInMinority = (yesAnswers < room.players.length / 2 && answer.answer === true) || 
                             (yesAnswers > room.players.length / 2 && answer.answer === false);
        
        // Award points to minority answers
        if (isInMinority) {
          room.players[playerIndex].points += pointsToAward;
          
          // Also update user's total points in their profile
          await User.findByIdAndUpdate(answer.user, {
            $inc: {
              points: pointsToAward,
              dailyPoints: pointsToAward,
              'stats.totalPoints': pointsToAward
            }
          });
        }
      }
    }

    await room.save();
  }

  res.status(200).json({ 
    message: 'Answer submitted successfully',
    allPlayersAnswered
  });
});

// @desc    Advance to next round
// @route   POST /api/rooms/:id/next-round
// @access  Public
const nextRound = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const roomId = req.params.id;

  // Validate required fields
  if (!userId) {
    res.status(400);
    throw new Error('Please provide userId');
  }

  // Find room
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  // Check if game is in progress
  if (room.status !== 'playing') {
    res.status(400);
    throw new Error('Game is not in progress');
  }

  // Only host can advance to next round
  if (room.host.toString() !== userId) {
    res.status(403);
    throw new Error('Only the host can advance to the next round');
  }

  // Check if all players have answered the current question
  const currentRoundAnswers = room.answers.filter(
    a => a.question.toString() === room.currentQuestion.toString() && 
         a.round === room.currentRound
  );

  if (currentRoundAnswers.length < room.players.length) {
    res.status(400);
    throw new Error('All players must answer before advancing to the next round');
  }

  // Increment round counter
  room.currentRound += 1;

  // Check if game is over
  if (room.currentRound > room.maxRounds) {
    room.status = 'completed';
    
    // Update stats for all players
    for (const player of room.players) {
      await User.findByIdAndUpdate(player.user, {
        $inc: { 'stats.gamesPlayed': 1 }
      });
    }

    // Find the winner(s) and update their stats
    const maxPoints = Math.max(...room.players.map(p => p.points));
    const winners = room.players.filter(p => p.points === maxPoints);

    for (const winner of winners) {
      await User.findByIdAndUpdate(winner.user, {
        $inc: { 'stats.gamesWon': 1 }
      });
    }
  } else {
    // Set the next question
    room.currentQuestion = room.questions[room.currentRound - 1];
  }

  await room.save();

  res.json({ 
    message: room.status === 'completed' 
      ? 'Game completed' 
      : 'Advanced to next round',
    currentRound: room.currentRound,
    isGameOver: room.status === 'completed'
  });
});

module.exports = {
  getRandomQuestions,
  submitAnswer,
  nextRound
};