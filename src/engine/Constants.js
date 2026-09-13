export const TILE = 32;
export const VIEW_W = 800;
export const VIEW_H = 448;
export const VIEW_TILES_W = VIEW_W / TILE;
export const VIEW_TILES_H = VIEW_H / TILE;

export const GRAVITY = 0.62;
export const FALL_GRAVITY = 0.78;
export const MAX_FALL_SPEED = 13;

export const RUN_ACCEL = 0.28;
export const WALK_ACCEL = 0.2;
export const RUN_MAX_SPEED = 4.6;
export const WALK_MAX_SPEED = 2.6;
export const FRICTION = 0.3;
export const AIR_FRICTION = 0.18;
export const SKID_FRICTION = 0.45;

export const JUMP_VELOCITY = -11.2;
export const JUMP_HOLD_BOOST = -0.52;
export const MAX_JUMP_HOLD_FRAMES = 14;
export const SPIN_JUMP_VELOCITY = -10.6;

export const CAPE_FLUTTER_GRAVITY = 0.22;
export const CAPE_FLUTTER_MAX_FALL = 2.6;
export const CAPE_FLY_THRESHOLD = 60;

export const PLAYER_STATE = {
  SMALL: 'small',
  BIG: 'big',
  FIRE: 'fire',
  CAPE: 'cape',
};

export const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyK', 'KeyZ'],
  run: ['ShiftLeft', 'ShiftRight', 'KeyJ', 'KeyX'],
  pause: ['Escape', 'Enter'],
};

export const COLORS = {
  sky: '#5c94fc',
  skyNight: '#0e1030',
};
