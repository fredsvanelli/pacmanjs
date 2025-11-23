export const TILE_SIZE = 24; // pixels

export const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    PELLET: 2,
    POWER_PELLET: 3,
    GHOST_HOUSE: 4,
    PACMAN_START: 5,
    GHOST_START_RED: 6,
    GHOST_START_PINK: 7,
    GHOST_START_BLUE: 8,
    GHOST_START_ORANGE: 9,
};

export const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    NONE: 'none'
};

export const GAME_STATES = {
    INIT: 'INIT',
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    DEATH_SEQUENCE: 'DEATH_SEQUENCE',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    GAME_OVER: 'GAME_OVER'
};

export const COLORS = {
    WALL: '#1919A6', // Classic blue
    PELLET: '#ffb8ae',
    POWER_PELLET: '#ffb8ae',
    PACMAN: '#FFFF00',
    GHOST_RED: '#FF0000',
    GHOST_PINK: '#FFC0CB',
    GHOST_BLUE: '#00FFFF',
    GHOST_ORANGE: '#FFA500',
    GHOST_FRIGHTENED: '#0000FF', // Blue body
    GHOST_EYES: '#FFFFFF',
    GHOST_PUPIL: '#0000FF'
};

export const SPEEDS = {
    PACMAN: 3, // tiles per second (was 6)
    GHOST: 2.75, // (was 5.5)
    GHOST_FRIGHTENED: 1.5, // (was 3)
    GHOST_EATEN: 6 // (was 12)
};

// Classic Pac-Man Level 1 Layout (Simplified/Adapted)
// 1 = Wall, 0 = Empty, 2 = Pellet, 3 = Power Pellet
// 4 = Ghost House, 5 = Pacman Start
// 6,7,8,9 = Ghost Starts
export const LEVEL_1_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 3, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 3, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [0, 2, 2, 2, 2, 2, 0, 0, 1, 7, 8, 9, 1, 0, 0, 2, 2, 2, 2, 2, 0], // Tunnel row
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 6, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0], // Red starts outside
    [1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 3, 2, 1, 1, 2, 2, 2, 2, 5, 0, 2, 2, 2, 2, 2, 1, 1, 2, 3, 1], // Pacman Start
    [1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
