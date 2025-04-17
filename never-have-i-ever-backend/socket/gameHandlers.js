const Room = require('../models/Room');
const User = require('../models/User');
const Question = require('../models/Question');

// Handle a user joining a room
const handleJoinRoom = async (io, socket, data) => {
  try {
    const { roomId, userId } = data;
    
    // Join the socket room
    socket.join(roomId);
    
    // Get room data
    const room = await Room.findById(roomId)
      .populate('players.user', 'name avatar')
      .populate('host', 'name avatar');
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Get user data
    const user = await User.findById(userId).select('name avatar');
    
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }
    
    // Emit event to all users in the room
    io.to(roomId).emit('player-joined', { user, roomId });
    
    // Send room data to the newly joined user
    socket.emit('room-data', room);
    
  } catch (error) {
    console.error('Error in handleJoinRoom:', error);
    socket.emit('error', { message: error.message });
  }
};

// Handle a user leaving a room
const handleLeaveRoom = async (io, socket, data) => {
  try {
    const { roomId, userId } = data;
    
    // Leave the socket room
    socket.leave(roomId);
    
    // Get room and check if it still exists
    const room = await Room.findById(roomId);
    
    if (room) {
      // Emit event to all users in the room
      io.to(roomId).emit('player-left', { userId, roomId });
      
      // If the room was deleted (no players left), notify others
      const playerCount = room.players.filter(p => p.user.toString() !== userId).length;
      if (playerCount === 0) {
        io.to(roomId).emit('room-closed');
      }
    }
    
  } catch (error) {
    console.error('Error in handleLeaveRoom:', error);
    socket.emit('error', { message: error.message });
  }
};

// Handle host starting the game
const handleStartGame = async (io, socket, data) => {
  try {
    const { roomId } = data;
    
    // Get room data
    const room = await Room.findById(roomId)
      .populate('currentQuestion')
      .populate('players.user', 'name avatar');
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Emit game started event to all players
    io.to(roomId).emit('game-started', {
      roomId,
      currentRound: room.currentRound,
      currentQuestion: room.currentQuestion,
      players: room.players
    });
    
  } catch (error) {
    console.error('Error in handleStartGame:', error);
    socket.emit('error', { message: error.message });
  }
};

// Handle a user submitting an answer
const handleSubmitAnswer = async (io, socket, data) => {
  try {
    const { roomId, userId, answer } = data;
    
    // Get room data
    const room = await Room.findById(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Get user data
    const user = await User.findById(userId);
    
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }
    
    // Emit event to all users that a player has answered
    io.to(roomId).emit('player-answered', { userId, roomId });
    
    // Check if all players have answered
    const currentRoundAnswers = room.answers.filter(
      a => a.question.toString() === room.currentQuestion.toString() && 
           a.round === room.currentRound
    );
    
    if (currentRoundAnswers.length === room.players.length) {
      // Calculate results
      const yesAnswers = currentRoundAnswers.filter(a => a.answer === true);
      const noAnswers = currentRoundAnswers.filter(a => a.answer === false);
      
      // Get the updated room with player points
      const updatedRoom = await Room.findById(roomId)
        .populate('players.user', 'name avatar')
        .populate('currentQuestion');
      
      // Emit event that all players have answered
      io.to(roomId).emit('all-players-answered', {
        yesCount: yesAnswers.length,
        noCount: noAnswers.length,
        players: updatedRoom.players,
        answers: currentRoundAnswers.map(a => ({
          userId: a.user,
          answer: a.answer
        }))
      });
    }
    
  } catch (error) {
    console.error('Error in handleSubmitAnswer:', error);
    socket.emit('error', { message: error.message });
  }
};

// Handle host advancing to the next round
const handleNextRound = async (io, socket, data) => {
  try {
    const { roomId } = data;
    
    // Get updated room data
    const room = await Room.findById(roomId)
      .populate('currentQuestion')
      .populate('players.user', 'name avatar');
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.status === 'completed') {
      // Game is over, emit game ended event
      io.to(roomId).emit('game-ended', {
        roomId,
        players: room.players,
        winner: room.players.reduce((prev, current) => 
          (prev.points > current.points) ? prev : current
        )
      });
      
      // Update leaderboard
      io.emit('leaderboard-updated');
      
    } else {
      // Game continues, emit new round started event
      io.to(roomId).emit('round-started', {
        roomId,
        currentRound: room.currentRound,
        currentQuestion: room.currentQuestion,
        players: room.players
      });
    }
    
  } catch (error) {
    console.error('Error in handleNextRound:', error);
    socket.emit('error', { message: error.message });
  }
};

module.exports = {
  handleJoinRoom,
  handleLeaveRoom,
  handleStartGame,
  handleSubmitAnswer,
  handleNextRound
};