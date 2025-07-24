-- MySQL Database Schema for Tournament Leaderboard System

-- Tournaments table
CREATE TABLE tournaments (
     id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 0 -- For optimistic locking
);

-- Games table
CREATE TABLE tournament_selected_games (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_id CHAR(36) NOT NULL,
    tournament_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE players (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    team_id CHAR(36),
    animal_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Team scores table (aggregated team performance per game)
CREATE TABLE team_scores (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id  CHAR(36) NOT NULL,
    game_id  CHAR(36) NOT NULL,
    team_id  CHAR(36) NOT NULL,
    team_bonus_score DECIMAL(10,2) DEFAULT 0.00,
    individual_player_score DECIMAL(10,2) DEFAULT 0.00,
    total_score DECIMAL(10,2) DEFAULT 0.00,
    total_score_with_players DECIMAL(10,2) DEFAULT 0.00,
    team_only_score DECIMAL(10,2) DEFAULT 0.00,
    players_only_score DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Individual player scores table (player performance per game)
CREATE TABLE player_scores (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id CHAR(36) NOT NULL,
    game_id CHAR(36) NOT NULL,
    player_id CHAR(36) NOT NULL,
    team_id CHAR(36),
    score DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Score history table (audit trail for all score changes)
CREATE TABLE score_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id CHAR(36) NOT NULL,
    game_id CHAR(36) NOT NULL,
    entity_type ENUM('team', 'player') NOT NULL,
    entity_id INT NOT NULL, -- team_id or player_id
    request_id VARCHAR(36) NOT NULL, -- For idempotency
    score_type ENUM('team_bonus', 'individual', 'total') NOT NULL,
    previous_score DECIMAL(10,2) DEFAULT 0.00,
    score_added DECIMAL(10,2) DEFAULT 0.00,
    new_total_score DECIMAL(10,2) DEFAULT 0.00,
    is_deduction BOOLEAN DEFAULT FALSE,
    is_negative_total BOOLEAN DEFAULT FALSE,
    has_negative_addition BOOLEAN DEFAULT FALSE,
    resulting_negative_total BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team score history table (detailed team score changes)
CREATE TABLE team_score_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    team_score_id CHAR(36) NOT NULL,
    tournament_id CHAR(36) NOT NULL,
    game_id CHAR(36) NOT NULL,
    team_id CHAR(36) NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    previous_team_bonus_score DECIMAL(10,2) DEFAULT 0.00,
    previous_individual_player_score DECIMAL(10,2) DEFAULT 0.00,
    previous_total_score DECIMAL(10,2) DEFAULT 0.00,
    added_team_bonus_score DECIMAL(10,2) DEFAULT 0.00,
    added_individual_player_score DECIMAL(10,2) DEFAULT 0.00,
    added_total_score DECIMAL(10,2) DEFAULT 0.00,
    new_team_bonus_score DECIMAL(10,2) DEFAULT 0.00,
    new_individual_player_score DECIMAL(10,2) DEFAULT 0.00,
    new_total_score DECIMAL(10,2) DEFAULT 0.00,
    has_negative_addition BOOLEAN DEFAULT FALSE,
    resulting_negative_total BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player score history table (detailed player score changes)
CREATE TABLE player_score_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    player_score_id CHAR(36) NOT NULL,
    tournament_id CHAR(36) NOT NULL,
    game_id CHAR(36) NOT NULL,
    player_id CHAR(36) NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    previous_score DECIMAL(10,2) DEFAULT 0.00,
    score_added DECIMAL(10,2) DEFAULT 0.00,
    new_total_score DECIMAL(10,2) DEFAULT 0.00,
    is_deduction BOOLEAN DEFAULT FALSE,
    is_negative_total BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Overall leaderboard view (computed rankings)
CREATE TABLE overall_leaderboard (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tournament_id CHAR(36) NOT NULL,
    entity_type ENUM('team', 'player') NOT NULL,
    entity_id CHAR(36) NOT NULL,
    total_score DECIMAL(10,2) DEFAULT 0.00,
    rank_position INT NOT NULL,
    games_participated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   
);

-- Leaderboard ranking

SELECT 
  t.id as team_id,
  t.name as team_name,
  COALESCE(te.total, 0) + COALESCE(pe.total, 0) as team_score,
  p.id as player_id,
  p.name as player_name,
  COALESCE(ps.score, 0) as player_score
FROM teams t
LEFT JOIN (
  SELECT team_id, SUM(score_change) as total 
  FROM team_scores 
  GROUP BY team_id
) te ON te.team_id = t.id
LEFT JOIN (
  SELECT p.team_id, SUM(pe.score_change) as total
  FROM players p
  LEFT JOIN player_scores pe ON pe.player_id = p.id
  GROUP BY p.team_id  
) pe ON pe.team_id = t.id
LEFT JOIN players p ON p.team_id = t.id
LEFT JOIN (
  SELECT player_id, SUM(score_change) as score
  FROM player_scores
  GROUP BY player_id
) ps ON ps.player_id = p.id
ORDER BY team_score DESC, player_score DESC;
