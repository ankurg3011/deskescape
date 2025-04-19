 // src/components/game/Question.js
import React from 'react';

const Question = ({ question, onAnswer, disabled, hasAnswered }) => {
  if (!question) {
    return <div className="text-center p-8">Loading question...</div>;
  }
  
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold mb-6">Never have I ever {question.text}</h2>
      
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={() => onAnswer(true)}
          disabled={disabled}
          className={`px-6 py-3 rounded-lg transition-all ${
            hasAnswered
              ? 'bg-blue-100 text-blue-800'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          Yes, I have
        </button>
        
        <button
          onClick={() => onAnswer(false)}
          disabled={disabled}
          className={`px-6 py-3 rounded-lg transition-all ${
            hasAnswered
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-500 text-white hover:bg-red-600'
          } disabled:opacity-50`}
        >
          No, I haven't
        </button>
      </div>
      
      {hasAnswered && (
        <p className="mt-4 text-green-600">Your answer has been submitted. Waiting for other players...</p>
      )}
    </div>
  );
};

export default Question;