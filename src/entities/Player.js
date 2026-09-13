import { Entity } from './Entity.js';
import { Input } from '../engine/Input.js';
import { Sound } from '../engine/Sound.js';
import { moveAndCollide } from '../level/Collision.js';
import { drawPlayer } from '../render/Sprites.js';
import {
  TILE, GRAVITY, FALL_GRAVITY, MAX_FALL_SPEED, RUN_ACCEL, WALK_ACCEL,
  RUN_MAX_SPEED, WALK_MAX_SPEED, FRICTION, AIR_FRICTION, SKID_FRICTION,
  JUMP_VELOCITY, JUMP_HOLD_BOOST, MAX_JUMP_HOLD_FRAMES, SPIN_JUMP_VELOCITY,
  CAPE_FLUTTER_GRAVITY, CAPE_FLUTTER_MAX_FALL,
} from '../engine/Constants.js';

export const SMALL_H = 28;
const BIG_H = 60;
const W = 26;

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, W, SMALL_H);
    this.powerLevel = 0; // 0 small, 1 big, 2 fire/cape
    this.powerType = null; // 'fire' | 'cape'
    this.spawnX = x;
    this.spawnY = y;
    this.jumpFrames = 0;
    this.jumping = false;
    this.spinning = false;
    this.spinTimer = 0;
    this.crouch = false;
    this.invuln = 0;
    this.starTimer = 0;
    this.runSpeedTimer = 0;
    this.capeFlying = false;
    this.capeOpen = false;
    this.dead = false;
    this.deathTimer = 0;
    this.fireCooldown = 0;
    this.coyoteTimer = 0;
    this.time = 0;
    this.wasOnGround = true;
    this.suit = { grow: 0 }; // 0..1 animation for grow/shrink
    this.animLock = 0;
    this.score = 0;
    this.coins = 0;
    this.lives = 4;
    this.frozen = false;
    this.enteringPipe = false;
    this.won = false;
    this.wantsFireball = false;
  }

  get big() { return this.powerLevel >= 1; }
  get fire() { return this.powerLevel === 2 && this.powerType === 'fire'; }
  get cape() { return this.powerLevel === 2 && this.powerType === 'cape'; }

  setPowerLevel(level, type = null) {
    const wasBig = this.big;
    this.powerLevel = level;
    this.powerType = type;
    const targetH = level >= 1 ? BIG_H : SMALL_H;
    if (targetH !== this.h) {
      const bottom = this.y + this.h;
      this.h = targetH;
      this.y = bottom - this.h;
    }
  }

  grantPowerup(kind) {
    if (kind === 'mushroom') {
      if (this.powerLevel === 0) {
        this.setPowerLevel(1, null);
        Sound.powerup();
        this.animLock = 0.3;
      } else {
        this.score += 1000;
        Sound.coin();
      }
    } else if (kind === 'fire') {
      this.setPowerLevel(2, 'fire');
      Sound.powerup();
      this.animLock = 0.3;
    } else if (kind === 'cape') {
      this.setPowerLevel(2, 'cape');
      Sound.powerup();
      this.animLock = 0.3;
    } else if (kind === '1up') {
      this.lives++;
      Sound.oneUp();
    } else if (kind === 'star') {
      this.starTimer = 11;
      Sound.powerup();
    }
    this.invuln = Math.max(this.invuln, 1.6);
  }

  takeHit() {
    if (this.invuln > 0 || this.starTimer > 0 || this.dead) return;
    if (this.powerLevel > 0) {
      this.setPowerLevel(this.powerLevel === 2 ? 1 : 0, null);
      this.invuln = 2.0;
      Sound.powerdown();
    } else {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0;
    this.vy = -13;
    this.vx = 0;
    Sound.die();
  }

  update(dt, level, game) {
    this.time += dt;
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.starTimer > 0) this.starTimer = Math.max(0, this.starTimer - dt);
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.animLock > 0) { this.animLock -= dt; return; }

    if (this.dead) {
      this.vy += GRAVITY;
      this.y += this.vy;
      this.deathTimer += dt;
      return;
    }

    if (this.frozen) return;

    const left = Input.isDown('left');
    const right = Input.isDown('right');
    const down = Input.isDown('down');
    const up = Input.isDown('up');
    const runHeld = Input.isDown('run');
    const jumpPressed = Input.wasPressed('jump');
    const jumpHeld = Input.isDown('jump');
    const jumpReleased = Input.wasReleased('jump');
    const runPressed = Input.wasPressed('run');

    const maxSpeed = runHeld ? RUN_MAX_SPEED : WALK_MAX_SPEED;
    const accel = runHeld ? RUN_ACCEL : WALK_ACCEL;

    // Crouch (big only, grounded)
    this.crouch = this.big && down && this.onGround && !this.spinning;

    // Horizontal movement
    if (!this.crouch) {
      if (left && !right) {
        if (this.vx > 0) { this.vx -= SKID_FRICTION; }
        else this.vx = Math.max(-maxSpeed, this.vx - accel);
        this.facing = -1;
      } else if (right && !left) {
        if (this.vx < 0) { this.vx += SKID_FRICTION; }
        else this.vx = Math.min(maxSpeed, this.vx + accel);
        this.facing = 1;
      } else {
        const fr = this.onGround ? FRICTION : AIR_FRICTION;
        if (this.vx > 0) this.vx = Math.max(0, this.vx - fr);
        else if (this.vx < 0) this.vx = Math.min(0, this.vx + fr);
      }
    } else {
      this.vx *= 0.7;
    }

    if (Math.abs(this.vx) > RUN_MAX_SPEED * 0.92 && runHeld) {
      this.runSpeedTimer += dt;
    } else {
      this.runSpeedTimer = Math.max(0, this.runSpeedTimer - dt * 2);
    }

    // Coyote time so jumps feel forgiving near ledges
    if (this.onGround) this.coyoteTimer = 0.09;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    // Jump / spin jump
    if (jumpPressed && (this.onGround || this.coyoteTimer > 0) && !this.crouch) {
      const spin = down;
      this.vy = spin ? SPIN_JUMP_VELOCITY : JUMP_VELOCITY;
      if (this.runSpeedTimer > 0.25 && this.cape) this.vy *= 1.12;
      this.jumping = true;
      this.spinning = spin;
      this.spinTimer = spin ? 0.5 : 0;
      this.jumpFrames = 0;
      this.onGround = false;
      this.coyoteTimer = 0;
      if (spin) Sound.jump(); else this.big ? Sound.bigJump() : Sound.jump();
    } else if (jumpHeld && this.jumping && this.vy < 0 && this.jumpFrames < MAX_JUMP_HOLD_FRAMES) {
      this.vy += JUMP_HOLD_BOOST;
      this.jumpFrames++;
    }
    if (jumpReleased) this.jumpFrames = MAX_JUMP_HOLD_FRAMES;
    if (this.onGround) { this.jumping = false; }

    if (this.spinTimer > 0) {
      this.spinTimer -= dt;
      if (this.spinTimer <= 0) this.spinning = false;
    }

    // Gravity + cape flutter
    this.capeOpen = false;
    this.capeFlying = false;
    if (this.vy < 0) {
      this.vy += GRAVITY;
    } else {
      if (this.cape && jumpHeld && !this.onGround) {
        this.vy += CAPE_FLUTTER_GRAVITY;
        if (this.vy > CAPE_FLUTTER_MAX_FALL) this.vy = CAPE_FLUTTER_MAX_FALL;
        this.capeOpen = true;
        this.capeFlying = true;
      } else {
        this.vy += FALL_GRAVITY;
      }
    }
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    // Fireball throw
    this.wantsFireball = false;
    if (this.fire && runPressed && this.fireCooldown <= 0) {
      this.wantsFireball = true;
      this.fireCooldown = 0.35;
      Sound.fireball();
    }

    this.wasOnGround = this.onGround;
    this.onGround = false;

    const hitsX = moveAndCollide(level, this, this.vx, 0);
    const hitsY = moveAndCollide(level, this, 0, this.vy);

    if (hitsX.hitLeft || hitsX.hitRight) this.vx = 0;

    if (hitsY.hitBottom && !this.wasOnGround) {
      // landed
    }
    if (hitsY.hitTop) {
      game.onPlayerHitCeiling(this, level);
    }

    // Fell into a pit
    if (this.y > level.heightPx() + 100) {
      this.die();
    }

    // Animation frame
    this.frameTimer += dt;
    if (Math.abs(this.vx) > 0.3 && this.onGround) {
      const speedFactor = Math.max(0.06, 0.16 - Math.abs(this.vx) * 0.012);
      if (this.frameTimer > speedFactor) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }
    } else {
      this.frame = 0;
    }
  }

  onLand() {
    Sound && null;
  }

  onHitWall() {}

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    if (this.invuln > 0 && Math.floor(this.time * 20) % 2 === 0 && this.starTimer <= 0) return;
    drawPlayer(ctx, drawX, drawY, this.w, this.h, {
      facing: this.facing,
      frame: this.frame,
      crouch: this.crouch,
      jumping: !this.onGround,
      spinning: this.spinning,
      fire: this.fire,
      cape: this.cape,
      capeOpen: this.capeOpen,
      starFlicker: this.starTimer > 0,
      time: this.time * 60,
    });
  }
}
