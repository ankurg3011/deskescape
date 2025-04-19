 // src/components/game/GameRoom.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import PlayerList from './PlayerList';
import Question from './Question';
import { toast } from 'react-toastify';

const GameRoom = () => {
    const { roomId } = useParams();
    const { currentUser } = useContext(AuthContext);
    const { socket, joinRoom, leaveRoom, startGame, submitAnswer, nextRound } = useSocket();
    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [roundResults, setRoundResults] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoomDetails();
        
        // Set up socket listeners
        if (socket) {
            socket.on('player-joined', handlePlayerJoined);
            socket.on('player-left', handlePlayerLeft);
            socket.on('game-started', handleGameStarted);
            socket.on('player-answered', handlePlayerAnswered);
            socket.on('all-players-answered', handleAllPlayersAnswered);
            socket.on('round-started', handleRoundStarted);
            socket.on('game-ended', handleGameEnded);
            socket.on('room-closed', handleRoomClosed);
            socket.on('error', handleSocketError);
            
            return () => {
                socket.off('player-joined');
                socket.off('player-left');
                socket.off('game-started');
                socket.off('player-answered');
                socket.off('all-players-answered');
                socket.off('round-started');
                socket.off('game-ended');
                socket.off('room-closed');
                socket.off('error');
            };
        }
    }, [socket, roomId]);

    const fetchRoomDetails = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/rooms/${roomId}`);
            setRoom(response.data);
            
            // If user is already in the room, join socket room
            const isUserInRoom = response.data.players.some(
                player => player.user._id === currentUser._id
            );
            
            if (isUserInRoom && socket) {
                joinRoom(roomId, currentUser._id);
            }
            
            // Reset answered state when fetching new room
            if (response.data.status === 'playing') {
                checkIfUserHasAnswered(response.data);
            } else {
                setHasAnswered(false);
            }
        } catch (error) {
            console.error('Error fetching room details:', error);
            setError('Failed to load room details');
        } finally {
            setIsLoading(false);
        }
    };

    const checkIfUserHasAnswered = (roomData) => {
        if (!roomData || !roomData.answers || !roomData.currentQuestion) return;
        
        const userAnsweredCurrentQuestion = roomData.answers.some(
            a => a.user === currentUser._id && 
                a.question === roomData.currentQuestion._id &&
                a.round === roomData.currentRound
        );
        
        setHasAnswered(userAnsweredCurrentQuestion);
    };

    const handleJoinRoom = async () => {
        try {
            setIsJoining(true);
            await api.post(`/rooms/${roomId}/join`, { 
                userId: currentUser._id,
                passcode: room.type === 'private' ? passcode : undefined
            });
            
            // Join socket room
            joinRoom(roomId, currentUser._id);
            toast.success('Joined room successfully');
            fetchRoomDetails();
        } catch (error) {
            console.error('Error joining room:', error);
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await api.post(`/rooms/${roomId}/leave`, { userId: currentUser._id });
            leaveRoom(roomId, currentUser._id);
            toast.info('Left room successfully');
            navigate('/rooms');
        } catch (error) {
            console.error('Error leaving room:', error);
            toast.error('Failed to leave room');
        }
    };

    const handleStartGame = async () => {
        try {
            await api.post(`/rooms/${roomId}/start`, { userId: currentUser._id });
            startGame(roomId);
        } catch (error) {
            console.error('Error starting game:', error);
            toast.error(error.response?.data?.message || 'Failed to start game');
        }
    };

    const handleAnswer = async (answer) => {
        try {
            setHasAnswered(true);
            await api.post(`/rooms/${roomId}/answers`, {
                userId: currentUser._id,
                answer
            });
            submitAnswer(roomId, currentUser._id, answer);
            
            // Force refresh to get updated player answer status
            setTimeout(() => {
                fetchRoomDetails();
            }, 500);
        } catch (error) {
            console.error('Error submitting answer:', error);
            toast.error('Failed to submit answer');
            setHasAnswered(false);
        }
    };

    const handleNextRound = async () => {
        try {
            setRoundResults(null);
            await api.post(`/rooms/${roomId}/next-round`, { userId: currentUser._id });
            nextRound(roomId);
            setHasAnswered(false);
            
            // Force a refresh to get the new question
            setTimeout(() => {
                fetchRoomDetails();
            }, 500);
        } catch (error) {
            console.error('Error advancing to next round:', error);
            toast.error(error.response?.data?.message || 'Failed to advance to next round');
        }
    };

    // Socket event handlers
    const handlePlayerJoined = ({ user }) => {
        toast.info(`${user.name} joined the room`);
        fetchRoomDetails();
    };

    const handlePlayerLeft = ({ userId }) => {
        fetchRoomDetails();
    };

    const handleGameStarted = (data) => {
        toast.info('Game started!');
        fetchRoomDetails();
    };

    const handlePlayerAnswered = ({ userId }) => {
        // Make sure to refresh room data when a player answers
        fetchRoomDetails();
    };

    const handleAllPlayersAnswered = (data) => {
        setRoundResults(data);
        // Force a refresh to get the latest data
        fetchRoomDetails();
        
        // Alert only the host about the next round option
        if (room && room.host && room.host._id === currentUser._id) {
            toast.info('All players answered! You can proceed to the next round.');
        }
    };

    const handleRoundStarted = (data) => {
        toast.info(`Round ${data.currentRound} started!`);
        // Reset the answered state for the new round
        setHasAnswered(false);
        setRoundResults(null);
        // Force a refresh to get the new question
        fetchRoomDetails();
    };

    const handleGameEnded = (data) => {
        toast.success('Game ended!');
        navigate('/leaderboard');
    };

    const handleRoomClosed = () => {
        toast.info('Room was closed');
        navigate('/rooms');
    };

    const handleSocketError = ({ message }) => {
        toast.error(message);
    };

    if (isLoading) {
        return <div className="flex justify-center mt-12">Loading room details...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-12">{error}</div>;
    }

    if (!room) {
        return <div className="text-center mt-12">Room not found</div>;
    }

    // Check if user is in the room
    const isUserInRoom = room.players.some(player => player.user._id === currentUser._id);
    const isUserHost = room.host._id === currentUser._id;
    
    // Calculate the count of players who have answered
    const answerCount = room.answers?.filter(
        a => a.question === room.currentQuestion?._id && a.round === room.currentRound
    ).length || 0;
    
    // Calculate the total number of players
    const totalPlayers = room.players.length;
    
    // Calculate if all players have answered
    const allPlayersAnswered = answerCount === totalPlayers && totalPlayers > 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">{room.name}</h1>
                <div>
                    {isUserInRoom ? (
                        <button 
                            onClick={handleLeaveRoom}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Leave Room
                        </button>
                    ) : (
                        <button 
                            onClick={handleJoinRoom}
                            disabled={isJoining || room.status !== 'waiting' || room.players.length >= room.maxPlayers}
                            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                        >
                            {isJoining ? 'Joining...' : 'Join Room'}
                        </button>
                    )}
                </div>
            </div>

            {room.type === 'private' && !isUserInRoom && (
                <div className="mb-4">
                    <label className="block mb-2">Passcode:</label>
                    <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <PlayerList players={room.players} host={room.host} />
                    
                    {isUserHost && room.status === 'waiting' && (
                        <button
                            onClick={handleStartGame}
                            disabled={room.players.length < 2}
                            className="w-full bg-green-500 text-white py-2 rounded mt-4 disabled:bg-gray-400"
                        >
                            Start Game
                        </button>
                    )}
                    
                    {room.status === 'playing' && (
                        <div className="mt-4 bg-blue-50 p-4 rounded">
                            <h3 className="font-semibold mb-2">Game Progress</h3>
                            <div className="flex justify-between mb-2">
                                <span>Round:</span>
                                <span>{room.currentRound} of {room.maxRounds}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Answers:</span>
                                <span>{answerCount} of {totalPlayers}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="col-span-2">
                    {room.status === 'waiting' ? (
                        <div className="bg-gray-100 p-6 rounded text-center">
                            <h2 className="text-xl mb-2">Waiting for players...</h2>
                            <p>Game will start when the host is ready.</p>
                        </div>
                    ) : room.status === 'playing' ? (
                        <div className="bg-white p-6 rounded shadow">
                            <div className="mb-4">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                    Round {room.currentRound} of {room.maxRounds}
                                </span>
                            </div>
                            
                            {room.currentQuestion ? (
                                <Question 
                                    question={room.currentQuestion} 
                                    onAnswer={handleAnswer}
                                    disabled={!isUserInRoom || hasAnswered || roundResults}
                                    hasAnswered={hasAnswered}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-lg text-gray-500">Waiting for the next question...</p>
                                </div>
                            )}
                            
                            {/* Show real-time progress */}
                            {!roundResults && room.currentQuestion && (
                                <div className="mt-6 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {answerCount} of {totalPlayers} players answered
                                        </span>
                                        <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full" 
                                                style={{ width: `${(answerCount / totalPlayers) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(roundResults || allPlayersAnswered) && (
                                <div className="mt-6 bg-gray-100 p-4 rounded">
                                    <h3 className="text-lg font-bold mb-2">Round Results</h3>
                                    <div className="flex justify-around mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{roundResults?.yesCount || 0}</div>
                                            <div>Said Yes</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{roundResults?.noCount || 0}</div>
                                            <div>Said No</div>
                                        </div>
                                    </div>
                                    
                                    {isUserHost && (
                                        <button
                                            onClick={handleNextRound}
                                            className="w-full bg-blue-500 text-white py-2 rounded mt-2"
                                        >
                                            {room.currentRound >= room.maxRounds ? 'End Game' : 'Next Round'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-100 p-6 rounded text-center">
                            <h2 className="text-xl mb-2">Game completed!</h2>
                            <p>Check the leaderboard to see the final scores.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameRoom;