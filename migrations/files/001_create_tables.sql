-- Create core tables for Z Games

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    permissions JSON,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Animals table
CREATE TABLE IF NOT EXISTS animals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sound_url VARCHAR(500),
    habitat VARCHAR(100),
    diet VARCHAR(50),
    conservation_status VARCHAR(50),
    fun_facts JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_species (species),
    INDEX idx_habitat (habitat),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    game_type ENUM('quiz', 'memory', 'puzzle', 'action') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    min_players INT DEFAULT 1,
    max_players INT DEFAULT 1,
    estimated_duration INT DEFAULT 300, -- in seconds
    rules JSON,
    scoring_system JSON,
    assets JSON, -- images, sounds, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_game_type (game_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    score INT DEFAULT 0,
    max_possible_score INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    game_data JSON, -- store game state, answers, etc.
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    
    INDEX idx_user_game (user_id, game_id),
    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    game_id INT NOT NULL,
    tournament_type ENUM('single_elimination', 'round_robin', 'swiss') DEFAULT 'single_elimination',
    max_participants INT DEFAULT 100,
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    prize_pool DECIMAL(10, 2) DEFAULT 0.00,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    registration_deadline DATETIME NOT NULL,
    status ENUM('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled') DEFAULT 'upcoming',
    rules JSON,
    prizes JSON,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE,
    
    INDEX idx_game_id (game_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    total_score BIGINT DEFAULT 0,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    average_score DECIMAL(10, 2) DEFAULT 0.00,
    best_score INT DEFAULT 0,
    total_time_played INT DEFAULT 0, -- in seconds
    achievements JSON,
    rank_position INT DEFAULT 0,
    last_game_played TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_game (user_id, game_id),
    INDEX idx_total_score (total_score),
    INDEX idx_rank_position (rank_position),
    INDEX idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
