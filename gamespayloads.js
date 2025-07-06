// ===============================
// ANIMAL SETUP PAYLOADS
// ===============================

const animals = [
  {
    name: 'Lion',
    superpower: {
      description: 'Has authority to take out three words from the forbidden words throughout the game',
      applicableGames: ['Charades'],
      usageLimit: 3,
      specialRules: 'Can remove forbidden words during charades rounds'
    }
  },
  {
    name: 'Tiger',
    superpower: {
      description: 'Has authority to take out three words from the forbidden words throughout the game',
      applicableGames: ['Charades'],
      usageLimit: 3,
      specialRules: 'Can remove forbidden words during charades rounds'
    }
  },
  {
    name: 'Eagle',
    superpower: {
      description: 'The eagle has authority to get back in the game 3 times',
      applicableGames: ['Lemon Lemon'],
      usageLimit: 3,
      specialRules: 'Can rejoin after elimination'
    }
  },
  {
    name: 'Cat',
    superpower: {
      description: 'Has the authority to use up to 8 extra shots after missing a shot',
      applicableGames: ['Ball Pong'],
      usageLimit: 8,
      specialRules: 'Must catwalk and meow every time returning for extra shot'
    }
  },
  {
    name: 'Shark',
    superpower: {
      description: 'Can exchange points with opponent',
      applicableGames: ['Ball Pong'],
      usageLimit: null,
      specialRules: 'Can swap points with any opponent'
    }
  },
  {
    name: 'Dog',
    superpower: {
      description: 'Can pass on the dice instruction to someone else to perform the task',
      applicableGames: ['Dice'],
      usageLimit: 3,
      specialRules: 'Can delegate dice challenges to other players'
    }
  },
  {
    name: 'Whale',
    superpower: {
      description: 'Automatically gets 6 points from opposing team when anyone throws a 6',
      applicableGames: ['Dice'],
      usageLimit: null,
      specialRules: 'Gains points whenever any player rolls a 6'
    }
  },
  {
    name: 'Horse',
    superpower: {
      description: 'Play rock paper scissors to win and receive 12 additional points',
      applicableGames: ['Dice'],
      usageLimit: null,
      specialRules: 'Must win rock paper scissors to gain bonus points'
    }
  },
  {
    name: 'Bison',
    superpower: {
      description: 'Ability to get back in the game 3 times',
      applicableGames: ['Shadowboxing'],
      usageLimit: 3,
      specialRules: 'Can rejoin shadowboxing after losing'
    }
  },
  {
    name: 'Moose',
    superpower: {
      description: 'Ability to swap the shadowboxer two times',
      applicableGames: ['Shadowboxing'],
      usageLimit: 2,
      specialRules: 'Can change who is the active shadowboxer'
    }
  },
  {
    name: 'Goose',
    superpower: {
      description: 'Allowed to move forward and adjust rubber 3 times after throwing',
      applicableGames: ['Rubber Band Game'],
      usageLimit: 3,
      specialRules: 'Can reposition rubber bands after throwing'
    }
  },
  {
    name: 'Turtle',
    superpower: {
      description: 'Allowed to move closer to the target to throw 3 times',
      applicableGames: ['Rubber Band Game'],
      usageLimit: 3,
      specialRules: 'Can move closer to target before throwing'
    }
  },
  {
    name: 'Beaver',
    superpower: {
      description: 'Can pause opponent from stacking for 10 seconds',
      applicableGames: ['Cup Stacking'],
      usageLimit: 2,
      specialRules: 'Can freeze opponents during cup stacking'
    }
  },
  {
    name: 'Bear',
    superpower: {
      description: 'Can scatter opponents cups',
      applicableGames: ['Cup Stacking'],
      usageLimit: 2,
      specialRules: 'Can knock down opponent cup towers'
    }
  },
  {
    name: 'Frog',
    superpower: {
      description: 'Allowed to move forward 3 steps throughout game',
      applicableGames: ['Basketball'],
      usageLimit: 3,
      specialRules: 'Can advance position during basketball shooting'
    }
  },
  {
    name: 'Rabbit',
    superpower: {
      description: 'Allowed to smack the ball off the hoops thrice',
      applicableGames: ['Basketball'],
      usageLimit: 3,
      specialRules: 'Can interfere with opponent shots'
    }
  },
  {
    name: 'Wolf',
    superpower: {
      description: 'Ability to open eyes once in the entire game',
      applicableGames: ['Werewolf'],
      usageLimit: 1,
      specialRules: 'Can peek during night phase once per game'
    }
  },
  {
    name: 'Human',
    superpower: {
      description: 'Cannot collect points from them except during the random dance by monkey',
      applicableGames: ['All'],
      usageLimit: null,
      specialRules: 'Immune to point theft except during monkey dance'
    }
  },
  {
    name: 'Monkey',
    superpower: {
      description: 'Can steal points at the stop time of dance - 5 points per person',
      applicableGames: ['Dance', 'All'],
      usageLimit: null,
      specialRules: 'Triggers monkey dance events, can steal 5 points per victim'
    }
  },
  {
    name: 'Chameleon',
    superpower: {
      description: 'Switch teams twice',
      applicableGames: ['All'],
      usageLimit: 2,
      specialRules: 'Can change team affiliation during games'
    }
  }
];

// ===============================
// GAME DEFINITIONS PAYLOADS
// ===============================

const gameDefinitions = [
  {
    name: 'Charades (Four Words)',
    type: 'team',
    description: 'A 2 team-based charades-style game with a twist — each round centers around an action word, but there are four forbidden words that cannot be used when describing it.',
    rules: [
      'One target word that the team needs to guess',
      'Four forbidden words that cannot be used when giving clues',
      'Describer can speak freely except forbidden words, no gestures or sound effects',
      'If forbidden words are used, round ends immediately with no points',
      'Teams have 1 minute to guess, then opposing team gets 30 seconds for one guess'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 3,
      penaltyPoints: 0,
      customRules: '5 points for correct guess, 3 bonus points for opposing team if they guess correctly'
    },
    prizes: [],
    timeLimit: 90,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Word cards', 'Timer'],
    applicableSuperpowers: [
      { animal: 'Lion', effect: 'Remove 3 forbidden words throughout game' },
      { animal: 'Tiger', effect: 'Remove 3 forbidden words throughout game' }
    ]
  },
  {
    name: 'Lemon Lemon',
    type: 'general',
    description: 'A fast-paced elimination game where players call out numbers in sequence while saying "Lemon"',
    rules: [
      'Players sit in circle with assigned numbers',
      'Start by saying "Lemon" + own number + another player number',
      'Called player responds with "Lemon" + own number + another player number',
      'Game continues with increasing speed',
      'Players eliminated for hesitation or mistakes',
      'Last two players remaining win'
    ],
    pointSystem: {
      winPoints: 10,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '10 points each for last two standing'
    },
    prizes: ['$20 gift card each'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: [],
    applicableSuperpowers: [
      { animal: 'Eagle', effect: 'Can get back in game 3 times after elimination' }
    ]
  },
  {
    name: 'Ball Pong',
    type: 'general',
    description: 'Throw ping pong ball at numbered targets to win prizes and points',
    rules: [
      'Throw ping pong ball at target slots numbered 1-12',
      'Receive points equal to slot number plus any prizes in that slot',
      'Each player gets standard number of throws'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points equal to slot number hit, plus slot prizes'
    },
    prizes: ['Various prizes in numbered slots'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Ping pong balls', 'Target board with numbered slots', 'Prizes'],
    applicableSuperpowers: [
      { animal: 'Cat', effect: 'Use up to 8 extra shots after missing (must catwalk and meow)' },
      { animal: 'Shark', effect: 'Can exchange points with opponent' }
    ]
  },
  {
    name: 'Dice',
    type: 'general',
    description: 'Roll dice and complete challenges based on the number rolled',
    rules: [
      'Each team member takes a turn rolling dice',
      'Must complete challenge corresponding to number rolled',
      'Failure to complete challenge may result in penalties',
      'Special rules for certain numbers (6 gives whale points, 5 triggers Kong shout)'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: -5,
      customRules: 'Points based on dice roll and challenge completion'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Dice', 'Challenge cards'],
    applicableSuperpowers: [
      { animal: 'Dog', effect: 'Pass dice instruction to someone else 3 times' },
      { animal: 'Whale', effect: 'Gain 6 points when anyone rolls a 6' },
      { animal: 'Horse', effect: 'Play rock paper scissors for 12 bonus points' }
    ]
  },
  {
    name: 'Shadowboxing',
    type: 'individual',
    description: 'A game of quick reflexes - look in opposite direction of where opponent points',
    rules: [
      'Players face each other',
      'One player points in a direction',
      'Other player must look in opposite direction',
      'If you look where opponent points, you lose',
      'Requires quick reflexes and attention'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '5 points for winner'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: 2,
    minPlayers: 2,
    equipment: [],
    applicableSuperpowers: [
      { animal: 'Bison', effect: 'Get back in game 3 times' },
      { animal: 'Moose', effect: 'Swap shadowboxer 2 times' }
    ]
  },
  {
    name: 'Rubber Band Game',
    type: 'team',
    description: 'Throw rubber bands at target, collect overlapping bands for points',
    rules: [
      'Throw rubber bands at target area',
      'Collect rubber bands that overlap with others',
      'Number of collected rubber bands equals points',
      'Team with most rubber bands wins bonus points'
    ],
    pointSystem: {
      winPoints: 20,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points equal to rubber bands collected, plus 20 bonus points for winning team'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Rubber bands', 'Target area'],
    applicableSuperpowers: [
      { animal: 'Goose', effect: 'Move forward and adjust rubber bands 3 times after throwing' },
      { animal: 'Turtle', effect: 'Move closer to target 3 times' }
    ]
  },
  {
    name: 'Cup Stacking',
    type: 'team',
    description: 'Stack cups in relay fashion in pyramid formation',
    rules: [
      'Stack 10 cups in pyramid: 4-3-2-1 formation',
      'Teams work in relay fashion',
      'First team to complete stacking wins',
      'Must unstack and restack if knocked down'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '5 points each to winning team players'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Cups (10 per team)'],
    applicableSuperpowers: [
      { animal: 'Beaver', effect: 'Pause opponent stacking for 10 seconds, 2 times total' },
      { animal: 'Bear', effect: 'Scatter opponent cups, 2 times total' }
    ]
  },
  {
    name: 'Basketball (Step Forward Step Back)',
    type: 'team',
    description: 'Advance through boxes by making successful shots, go back on misses',
    rules: [
      'Start in first box, advance with successful shots',
      'Miss a shot, go back to previous box',
      'Move through all 3 boxes with successful shots for 3 points',
      'Lose 1 point for each missed basket',
      'If miss first basket, next team member takes turn'
    ],
    pointSystem: {
      winPoints: 3,
      bonusPoints: 0,
      penaltyPoints: -1,
      customRules: '3 points for successful progression, -1 point per miss'
    },
    prizes: ['Random draw prize for final shot makers'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Basketball', 'Hoop', 'Floor boxes/markers'],
    applicableSuperpowers: [
      { animal: 'Frog', effect: 'Move forward 3 steps throughout game' },
      { animal: 'Rabbit', effect: 'Smack ball off hoops 3 times' }
    ]
  },
  {
    name: 'Werewolf',
    type: 'general',
    description: 'Classic werewolf elimination game with night and day phases',
    rules: [
      'Night phase: werewolves choose victim to eliminate',
      'Day phase: all players vote to eliminate suspected werewolf',
      'Werewolves win if all villagers eliminated',
      'Villagers win if all werewolves eliminated',
      'Alternates between night and day phases'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Winner determined by team victory'
    },
    prizes: ['3 packs drumstick chicken for villagers', '1 pack for werewolves'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 6,
    equipment: ['Role cards'],
    applicableSuperpowers: [
      { animal: 'Wolf', effect: 'Open eyes once during night phase per game' }
    ]
  },
  {
    name: 'Just Dance',
    type: 'general',
    description: 'Dance competition following video choreography',
    rules: [
      'Follow dance moves from video',
      'Judges rate performance',
      'Best dancers win points',
      'Monkey can trigger special dance events'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points awarded based on performance'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Music system', 'Dance videos'],
    applicableSuperpowers: [
      { animal: 'Monkey', effect: 'Trigger monkey dance events to steal points' }
    ]
  }
];

// ===============================
// PRIZE SETUP PAYLOADS
// ===============================

const prizes = [
  {
    name: '$20 Gift Card',
    description: 'Twenty dollar gift card',
    value: '$20',
    type: 'gift_card',
    quantity: 2,
    availableForGames: ['Lemon Lemon'],
    isAwarded: false
  },
  {
    name: 'Drumstick Chicken - 3 Pack',
    description: 'Three packs of drumstick chicken',
    value: '3 packs',
    type: 'food',
    quantity: 1,
    availableForGames: ['Werewolf'],
    isAwarded: false
  },
  {
    name: 'Drumstick Chicken - 1 Pack',
    description: 'One pack of drumstick chicken',
    value: '1 pack',
    type: 'food',
    quantity: 1,
    availableForGames: ['Werewolf'],
    isAwarded: false
  },
  {
    name: 'Random Basketball Prize',
    description: 'Random prize from paper draw',
    value: 'Various',
    type: 'other',
    quantity: 5,
    availableForGames: ['Basketball'],
    isAwarded: false
  }
];

// Ball Pong slot prizes (12 slots)
for (let i = 1; i <= 12; i++) {
  prizes.push({
    name: `Ball Pong Slot ${i} Prize`,
    description: `Prize for hitting slot ${i}`,
    value: 'TBD',
    type: 'other',
    quantity: 1,
    availableForGames: ['Ball Pong'],
    isAwarded: false
  });
}

// ===============================
// SAMPLE GAME SESSION PAYLOAD
// ===============================

const sampleGameSession = {
  name: 'Epic Games Night 2025',
  date: new Date(),
  status: 'planning',
  players: [], // Will be populated with player ObjectIds
  teams: {
    team1: {
      name: 'Team Alpha',
      players: [],
      totalPoints: 0
    },
    team2: {
      name: 'Team Beta',
      players: [],
      totalPoints: 0
    }
  },
  gameRounds: [],
  currentRound: null,
  settings: {
    enableSuperpowers: true,
    monkeyDanceEnabled: true,
    randomPrizeDraws: true
  }
};

// ===============================
// SAMPLE PLAYERS PAYLOAD
// ===============================

const samplePlayers = [
  {
    name: 'Alice',
    animal: null, // Will be set to Animal ObjectId
    team: 'Team1',
    totalPoints: 0,
    superpowerUsages: []
  },
  {
    name: 'Bob',
    animal: null,
    team: 'Team1',
    totalPoints: 0,
    superpowerUsages: []
  },
  {
    name: 'Charlie',
    animal: null,
    team: 'Team2',
    totalPoints: 0,
    superpowerUsages: []
  },
  {
    name: 'Diana',
    animal: null,
    team: 'Team2',
    totalPoints: 0,
    superpowerUsages: []
  }
];

// ===============================
// SAMPLE GAME ROUND PAYLOAD
// ===============================

const sampleGameRound = {
  gameSession: null, // GameSession ObjectId
  gameDefinition: null, // GameDefinition ObjectId
  roundNumber: 1,
  status: 'waiting',
  participants: [
    {
      player: null, // Player ObjectId
      team: 'Team1',
      participated: false
    }
  ],
  results: {
    winner: null,
    pointsAwarded: [],
    prizesAwarded: []
  },
  gameSpecificData: {
    // Will be populated based on game type
  },
  superpowerUsages: [],
  startTime: null,
  endTime: null,
  notes: ''
};

// ===============================
// MONKEY DANCE EVENT PAYLOAD
// ===============================

const sampleMonkeyDanceEvent = {
  gameSession: null, // GameSession ObjectId
  triggeredBy: null, // Monkey player ObjectId
  victims: [
    {
      player: null, // Player ObjectId
      pointsStolen: 5
    }
  ],
  triggeredAt: new Date(),
  song: 'Monkey Dance Song'
};

// ===============================
// DICE CHALLENGES REFERENCE
// ===============================

const diceChallengeLookup = {
  2: { challenge: 'Act out the sound and movement of your animal', points: 2 },
  3: { challenge: '5 push-ups, stand up beat chest and yell "all hail, king kong"', points: 3 },
  4: { challenge: 'Pick up and finish a ball of lime', points: 4 },
  5: { challenge: 'Can swap animal superpowers', points: 5 },
  6: { challenge: 'Whale gains 6 points when anyone throws a 6', points: 6 },
  7: { challenge: 'Two shots of vodka (or lime juice for non alcohol drinkers)', points: 7 },
  8: { challenge: 'Pick one person and act like a striper', points: 8 },
  9: { challenge: 'Cat walk back and forth like a runway model', points: 9 },
  10: { challenge: 'Sing a love song to one person on your knee', points: 10 },
  11: { challenge: 'Shout "I love Z games!" when someone rolls a 5 (failure = -5 points)', points: 11 },
  12: { challenge: 'Horse: Play rock, paper, scissors. Win and receive 12 additional points', points: 12 }
};

// ===============================
// EXPORT ALL PAYLOADS
// ===============================

module.exports = {
  animals,
  gameDefinitions,
  prizes,
  sampleGameSession,
  samplePlayers,
  sampleGameRound,
  sampleMonkeyDanceEvent,
  diceChallengeLookup
};