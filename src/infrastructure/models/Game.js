const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gameCode: { 
    type: String, 
    unique: true,
    uppercase: true,
    trim: true
  },
  isActive: { type: Boolean, default: true },
  participants: [
    {
      name: String,
      avatar: String,
      color: String,
      isActive: { type: Boolean, default: true },
      score: {
        type: Number,
        default: 0
      }
    }
  ],
  scoreLog: [
    {
      participantName: String,
      updatedAt: { type: Date, default: Date.now },
      scoreChange: Number // Positive for score increase, negative for decrease
    }
  ]
}, { timestamps: true });  

// Index for faster gameCode lookups
GameSchema.index({ gameCode: 1 });

// Method to generate a random game code using real words
GameSchema.statics.generateGameCode = function() {
  const adjectives = [
    'SWIFT', 'BRAVE', 'CLEVER', 'BRIGHT', 'STRONG', 'QUICK', 'BOLD', 'SHARP',
    'FIERCE', 'MIGHTY', 'SMART', 'FAST', 'POWER', 'SUPER', 'ULTRA', 'MEGA',
    'EPIC', 'ROYAL', 'NOBLE', 'PRIME', 'ELITE', 'CHAMPION', 'HERO', 'LEGEND',
    'FIRE', 'ICE', 'STORM', 'THUNDER', 'LIGHTNING', 'SHADOW', 'GOLDEN', 'SILVER'
  ];
  
  const nouns = [
    'TIGER', 'EAGLE', 'LION', 'WOLF', 'DRAGON', 'PHOENIX', 'FALCON', 'SHARK',
    'WARRIOR', 'KNIGHT', 'WIZARD', 'HUNTER', 'GUARDIAN', 'MASTER', 'CHIEF',
    'STORM', 'BLADE', 'ARROW', 'SHIELD', 'SWORD', 'HAMMER', 'CROWN', 'STAR',
    'MOUNTAIN', 'RIVER', 'OCEAN', 'FOREST', 'CASTLE', 'TOWER', 'BRIDGE', 'GATE'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

// Method to generate a unique game code with retry logic
GameSchema.statics.generateUniqueGameCode = async function() {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const code = this.generateGameCode();
    const existingGame = await this.findOne({ gameCode: code });
    
    if (!existingGame) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique game code after multiple attempts');
};

// Method to find game by code
GameSchema.statics.findByGameCode = function(code) {
  return this.findOne({ gameCode: code.toUpperCase(), isActive: true });
};

// Auto-generate unique game code before saving
GameSchema.pre('save', async function(next) {
  if (!this.gameCode) {
    try {
      this.gameCode = await this.constructor.generateUniqueGameCode();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Game", GameSchema);
