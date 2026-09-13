import { Input } from './Input.js';
import { Sound } from './Sound.js';
import { Camera } from './Camera.js';
import { VIEW_W, VIEW_H, TILE, PLAYER_STATE } from './Constants.js';
import { parseLevel } from '../level/LevelLoader.js';
import { TILE_TYPES } from '../render/Tileset.js';
import { drawBackground } from '../render/Background.js';
import { drawTile } from '../render/Tileset.js';
import { Player, SMALL_H } from '../entities/Player.js';
import { spawnFromLevel } from '../entities/EntityFactory.js';
import { Fireball } from '../entities/Fireball.js';
import { Poof, BrickFragment, ScorePopup } from '../entities/Particle.js';
import { Coin, CoinPopup } from '../entities/items/Coin.js';
import { Mushroom } from '../entities/items/Mushroom.js';
import { FireFlower } from '../entities/items/FireFlower.js';
import { CapeFeather } from '../entities/items/CapeFeather.js';
import { Star } from '../entities/items/Star.js';
import { WORLDS, allLevelDefs } from '../data/world.js';
import * as UI from '../ui/UI.js';

const SAVE_KEY = 'capeKingdomSave_v1';
const BOUNCE_VY = -7.4;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = 'title';
    this.prevTime = 0;
    this.acc = 0;
    this.dtFixed = 1 / 60;

    this.progress = this.loadProgress();
    this.worldIndex = 0;
    this.mapCursor = 0;
    this.pendingLevelIndex = 0;

    this.level = null;
    this.player = null;
    this.camera = null;
    this.enemies = [];
    this.items = [];
    this.fireballs = [];
    this.fx = [];
    this.timeLeft = 300;
    this.timeAccum = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.introTimer = 0;
    this.completeTimer = 0;
    this.completeStage = 0;
    this.deathPauseTimer = 0;
    this.paused = false;
    this.frame = 0;
    this.titleBlink = 0;
    this.shakeTimer = 0;
    this.shakeMag = 0;
    this.flagSliding = false;

    window.addEventListener('keydown', () => Sound.unlock(), { once: true });
    window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { unlockedIndex: 0, completed: [], coinsTotal: 0, scoreTotal: 0, bestTimes: {} };
  }

  saveProgress() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress)); } catch (e) { /* ignore */ }
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(t) {
    const dt = Math.min(0.05, (t - this.prevTime) / 1000 || 0);
    this.prevTime = t;
    this.update(dt);
    this.render();
    Input.endFrame();
    requestAnimationFrame((tt) => this.loop(tt));
  }

  // ---------- State transitions ----------

  goTitle() {
    this.state = 'title';
    Sound.stopMusic();
  }

  goMap() {
    this.state = 'map';
    this.mapCursor = this.progress.unlockedIndex;
    Sound.startMusic('map');
  }

  beginLevel(index) {
    const def = allLevelDefs[index];
    if (!def) { this.state = 'win'; Sound.stopMusic(); return; }
    this.pendingLevelIndex = index;
    this.level = parseLevel(def);
    const startX = this.level.playerStart.x * TILE;
    const startBottom = (this.level.playerStart.y + 1) * TILE;
    this.player = new Player(startX, startBottom - SMALL_H);
    this.player.lives = this.progress.lives ?? 4;
    this.player.coins = this.progress.coinsCarry ?? 0;
    this.player.score = this.progress.scoreTotal ?? 0;
    this.respawnPoint = { x: this.player.x, y: this.player.y };
    this.camera = new Camera(this.level.widthPx(), this.level.heightPx());
    this.camera.snap(this.player);

    const spawned = spawnFromLevel(this.level);
    this.enemies = spawned.enemies;
    this.enemies.forEach((e) => { e.game = this; });
    this.items = spawned.items;
    this.blockSpawns = spawned.blockSpawns;
    this.fireballs = [];
    this.fx = [];
    this.timeLeft = this.level.timeLimit;
    this.timeAccum = 0;
    this.combo = 0;
    this.flagSliding = false;
    this.midpointReached = false;

    this.state = 'intro';
    this.introTimer = 1.4;
    Sound.startMusic(this.level.theme === 'castle' ? 'castle' : 'overworld');
  }

  respawnInLevel() {
    this.player.dead = false;
    this.player.x = this.respawnPoint.x;
    this.player.y = this.respawnPoint.y;
    this.player.vx = 0; this.player.vy = 0;
    this.player.setPowerLevel(0, null);
    this.player.invuln = 2.0;
    this.camera.snap(this.player);
    this.state = 'intro';
    this.introTimer = 0.8;
  }

  levelComplete() {
    this.state = 'levelComplete';
    this.completeTimer = 0;
    this.completeStage = 0;
    Sound.stopMusic();
    const idx = this.pendingLevelIndex;
    if (!this.progress.completed.includes(idx)) this.progress.completed.push(idx);
    if (idx + 1 > this.progress.unlockedIndex) this.progress.unlockedIndex = Math.min(idx + 1, allLevelDefs.length - 1);
    this.progress.coinsCarry = this.player.coins;
    this.progress.scoreTotal = this.player.score;
    this.progress.lives = this.player.lives;
    this.saveProgress();
  }

  gameOver() {
    this.state = 'gameOver';
    Sound.stopMusic();
    this.progress.lives = 4;
    this.progress.coinsCarry = 0;
    this.saveProgress();
  }

  // ---------- Update ----------

  update(dt) {
    this.frame++;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    switch (this.state) {
      case 'title': return this.updateTitle(dt);
      case 'map': return this.updateMap(dt);
      case 'intro': return this.updateIntro(dt);
      case 'playing': return this.updatePlaying(dt);
      case 'paused': return this.updatePaused(dt);
      case 'levelComplete': return this.updateLevelComplete(dt);
      case 'gameOver': return this.updateGameOver(dt);
      case 'win': return this.updateWin(dt);
      default: return;
    }
  }

  updateTitle(dt) {
    this.titleBlink += dt;
    if (Input.wasPressed('jump') || Input.wasPressed('pause')) {
      Sound.select();
      this.goMap();
    }
  }

  updateMap(dt) {
    const world = WORLDS[this.worldIndex];
    if (Input.wasPressed('right')) {
      if (this.mapCursor < this.progress.unlockedIndex && this.mapCursor < allLevelDefs.length - 1) { this.mapCursor++; Sound.select(); }
    } else if (Input.wasPressed('left')) {
      if (this.mapCursor > 0) { this.mapCursor--; Sound.select(); }
    }
    if (Input.wasPressed('jump')) {
      if (this.mapCursor <= this.progress.unlockedIndex) {
        Sound.select();
        this.beginLevel(this.mapCursor);
      }
    }
  }

  updateIntro(dt) {
    this.introTimer -= dt;
    if (this.introTimer <= 0) this.state = 'playing';
  }

  updatePaused(dt) {
    if (Input.wasPressed('pause')) { this.state = 'playing'; Sound.pause(); }
  }

  updateGameOver(dt) {
    if (Input.wasPressed('jump') || Input.wasPressed('pause')) {
      this.goMap();
    }
  }

  updateWin(dt) {
    this.titleBlink += dt;
    if (Input.wasPressed('jump')) this.goTitle();
  }

  updateLevelComplete(dt) {
    this.completeTimer += dt;
    if (this.completeStage === 0 && this.completeTimer > 2.2) {
      this.completeStage = 1;
      this.completeTimer = 0;
    } else if (this.completeStage === 1 && (this.completeTimer > 1.6 || Input.wasPressed('jump'))) {
      if (this.pendingLevelIndex >= allLevelDefs.length - 1) {
        this.state = 'win';
        this.titleBlink = 0;
        Sound.stopMusic();
      } else {
        this.goMap();
      }
    }
  }

  updatePlaying(dt) {
    if (Input.wasPressed('pause')) { this.state = 'paused'; Sound.pause(); return; }

    if (this.player.dead) {
      this.player.update(dt, this.level, this);
      if (this.player.deathTimer > 1.6) {
        this.player.lives--;
        if (this.player.lives <= 0) { this.gameOver(); return; }
        this.respawnInLevel();
      }
      return;
    }

    if (this.flagSliding) {
      this.updateFlagSlide(dt);
      return;
    }

    // Timer
    this.timeAccum += dt;
    if (this.timeAccum >= 1) {
      this.timeAccum -= 1;
      this.timeLeft--;
      if (this.timeLeft <= 0) this.player.die();
    }

    this.player.update(dt, this.level, this);
    if (!this.player.dead) this.checkHazards();

    if (this.level.midpoint && !this.midpointReached && this.player.x >= this.level.midpoint.x * TILE) {
      this.midpointReached = true;
      this.respawnPoint = { x: this.level.midpoint.x * TILE, y: (this.level.midpoint.y + 1) * TILE - SMALL_H };
      Sound.switchPress();
    }

    if (this.player.x >= this.level.goalX * TILE - 10 && !this.flagSliding && !this.player.dead) {
      this.startFlagSlide();
      return;
    }

    for (const e of this.enemies) if (!e.remove) e.update(dt, this.level, this.player);
    this.enemies = this.enemies.filter((e) => !e.remove);

    for (const it of this.items) if (!it.remove) it.update(dt, this.level);
    this.items = this.items.filter((i) => !i.remove);

    for (const fb of this.fireballs) fb.update(dt, this.level);
    this.fireballs = this.fireballs.filter((f) => !f.remove);

    for (const p of this.fx) p.update(dt, this.level);
    this.fx = this.fx.filter((p) => !p.remove);

    if (this.player.wantsFireball) {
      const fx = this.player.facing > 0 ? this.player.right : this.player.left - 14;
      this.fireballs.push(new Fireball(fx, this.player.centerY - 4, this.player.facing));
    }

    this.updateBlockAnimations(dt);
    this.handleCollisions();

    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.camera.follow(this.player);
  }

  startFlagSlide() {
    this.flagSliding = true;
    this.player.frozen = false;
    this.player.vx = 0;
    this.player.vy = 3;
    this.player.x = this.level.goalX * TILE;
    this.flagSlideY = this.player.y;
    Sound.flagpole();
    const bonus = Math.max(0, Math.round((this.timeLeft) * 10));
    this.player.score += bonus;
  }

  updateFlagSlide(dt) {
    this.player.y += 180 * dt;
    const groundY = (this.level.height - 2) * TILE - this.player.h;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.flagSliding = false;
      this.player.facing = 1;
      this.player.frozen = true;
      this.levelComplete();
    }
    this.camera.follow(this.player);
  }

  updateBlockAnimations(dt) {
    for (const [key, meta] of this.level.tileMeta) {
      if (meta.bump > 0) meta.bump = Math.max(0, meta.bump - dt * 6);
      if (meta.falling) {
        if (meta.timer > 0) { meta.timer -= dt; }
        else if (meta.fallT < 1) {
          meta.fallT += dt * 2.2;
          if (meta.fallT >= 1) {
            const [x, y] = key.split(',').map(Number);
            this.level.setTile(x, y, TILE_TYPES.EMPTY);
          }
        }
      }
    }

    // Donut blocks: start falling once the player stands on them.
    const px = Math.floor(this.player.centerX / TILE);
    const py = Math.floor((this.player.bottom + 2) / TILE);
    if (this.player.onGround && this.level.getTile(px, py) === TILE_TYPES.DONUT_BLOCK) {
      const meta = this.level.getMeta(px, py);
      if (!meta.falling) { meta.falling = true; meta.timer = 0.45; meta.fallT = 0; }
    }
  }

  checkHazards() {
    const p = this.player;
    const left = Math.floor(p.x / TILE);
    const right = Math.floor((p.x + p.w - 0.01) / TILE);
    const top = Math.floor(p.y / TILE);
    const bottom = Math.floor((p.y + p.h - 0.01) / TILE);
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (this.level.getTile(tx, ty) === TILE_TYPES.SPIKE) { p.takeHit(); return; }
      }
    }
  }

  breakBrick(tx, ty, vxHint = 0) {
    if (this.level.getTile(tx, ty) !== TILE_TYPES.BRICK) return;
    this.level.setTile(tx, ty, TILE_TYPES.EMPTY);
    const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
    for (let i = 0; i < 4; i++) {
      const dirX = i % 2 === 0 ? -1 : 1;
      const dirY = i < 2 ? -1 : 1;
      this.fx.push(new BrickFragment(cx, cy, dirX * 2.2 + vxHint * 0.1, dirY * 4 - 3));
    }
    this.player.score += 50;
    Sound.breakBlock();
    this.shakeTimer = 0.15;
  }

  onPlayerHitCeiling(player, level) {
    const tx = Math.floor(player.centerX / TILE);
    const ty = Math.floor((player.top - 1) / TILE);
    const id = level.getTile(tx, ty);

    if (id === TILE_TYPES.BRICK) {
      if (player.big) {
        this.breakBrick(tx, ty, 0);
      } else {
        const meta = level.getMeta(tx, ty);
        meta.bump = 1;
        Sound.bump();
      }
      return;
    }

    if (id === TILE_TYPES.QUESTION) {
      const meta = level.getMeta(tx, ty);
      meta.bump = 1;
      const spawn = this.blockSpawns && this.blockSpawns.find((s) => s.x === tx && s.y === ty);
      level.setTile(tx, ty, TILE_TYPES.USED);
      if (spawn) {
        this.spawnBlockItem(spawn, tx, ty, player);
        this.blockSpawns = this.blockSpawns.filter((s) => s !== spawn);
      }
      return;
    }

    Sound.bump();
  }

  spawnBlockItem(spawn, tx, ty, player) {
    if (spawn.type === 'block-coin') {
      this.fx.push(new CoinPopup(tx * TILE + 5, ty * TILE));
      player.coins++;
      player.score += 200;
      this.checkCoinBonus(player);
      Sound.coin();
      return;
    }
    if (spawn.type === 'block-1up') {
      this.items.push(new Mushroom(tx, ty, true));
      return;
    }
    if (spawn.type === 'block-star') {
      this.items.push(new Star(tx, ty));
      return;
    }
    if (spawn.type === 'block-power') {
      if (!player.big) {
        this.items.push(new Mushroom(tx, ty, false));
      } else if (this.level.powerupType === 'cape') {
        this.items.push(new CapeFeather(tx, ty));
      } else {
        this.items.push(new FireFlower(tx, ty));
      }
    }
  }

  checkCoinBonus(player) {
    if (player.coins >= 100) {
      player.coins -= 100;
      player.lives++;
      Sound.oneUp();
    }
  }

  addScorePopup(x, y, text) {
    this.fx.push(new ScorePopup(x, y, text));
  }

  // ---------- Collisions ----------

  handleCollisions() {
    const p = this.player;
    if (p.dead || p.frozen) return;

    // Player vs power-up items (floating coins are handled separately below)
    for (const it of this.items) {
      if (it.remove || it.collected || it.popup || it.kind === 'coin') continue;
      if (overlap(p, it)) {
        it.collected = true;
        it.remove = true;
        p.grantPowerup(it.kind);
        this.addScorePopup(it.centerX, it.y, it.kind === '1up' ? '1UP' : '');
      }
    }

    // Player vs enemies
    for (const e of this.enemies) {
      if (e.dead || e.remove) continue;
      if (!overlap(p, e)) continue;

      if (p.starTimer > 0) {
        this.defeatEnemy(e, p, true);
        continue;
      }

      const stompFromAbove = p.vy > 0 && (p.bottom - e.top) < 18 && p.centerY < e.centerY;

      if (e.kind === 'piranha') {
        if (p.capeFlying) this.defeatEnemy(e, p, true);
        else p.takeHit();
        continue;
      }

      if (e.kind === 'shellback') {
        if (e.inShell && e.shellMoving) {
          if (stompFromAbove) { e.stompedByPlayer(); p.vy = BOUNCE_VY; Sound.stomp(); }
          else p.takeHit();
        } else if (e.inShell && !e.shellMoving) {
          if (stompFromAbove) { p.vy = BOUNCE_VY; Sound.stomp(); }
          else { e.kickBy(p.centerX); p.vx = (p.centerX < e.centerX ? -1 : 1) * 2; }
        } else if (stompFromAbove) {
          e.stompedByPlayer();
          p.vy = BOUNCE_VY;
          this.gainComboScore(p, e);
        } else {
          p.takeHit();
        }
        continue;
      }

      // Grumpkin / Spiky
      const canStomp = e.stompable || p.spinning;
      if (stompFromAbove && canStomp) {
        e.kill(this);
        p.vy = p.spinning ? BOUNCE_VY * 0.85 : BOUNCE_VY;
        this.gainComboScore(p, e);
        Sound.stomp();
      } else {
        p.takeHit();
      }
    }

    // Player vs floating coins
    for (const it of this.items) {
      if (it.remove) continue;
      if (it.kind === 'coin' && !it.collected && overlap(p, it)) {
        it.collected = true;
        it.remove = true;
        p.coins++;
        p.score += 200;
        this.checkCoinBonus(p);
        Sound.coin();
      }
    }

    // Fireballs vs enemies
    for (const fb of this.fireballs) {
      if (fb.remove) continue;
      for (const e of this.enemies) {
        if (e.dead || e.remove) continue;
        if (overlap(fb, e)) {
          this.defeatEnemy(e, p, true);
          fb.remove = true;
          break;
        }
      }
    }

    // Sliding shells vs other enemies
    for (const e of this.enemies) {
      if (e.kind !== 'shellback' || !e.inShell || !e.shellMoving || e.dead) continue;
      for (const other of this.enemies) {
        if (other === e || other.dead || other.remove) continue;
        if (overlap(e, other)) {
          this.defeatEnemy(other, p, true);
        }
      }
    }

    // Fell off the world
    if (p.y > this.level.heightPx() + 60 && !p.dead) p.die();
  }

  defeatEnemy(e, player, withScore) {
    if (e.dead) return;
    if (e.kind === 'shellback') e.kill();
    else if (e.kill) e.kill(this);
    else e.dead = true;
    this.fx.push(new Poof(e.centerX, e.centerY));
    if (withScore) this.gainComboScore(player, e);
  }

  gainComboScore(player, enemy) {
    const values = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
    const val = values[Math.min(this.combo, values.length - 1)];
    player.score += val;
    this.combo++;
    this.comboTimer = 1.4;
    this.addScorePopup(enemy.centerX, enemy.top, String(val));
    if (this.combo >= 8) { player.lives++; Sound.oneUp(); this.combo = 0; }
  }

  // ---------- Render ----------

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    }

    switch (this.state) {
      case 'title':
        UI.drawTitle(ctx, this);
        break;
      case 'map':
        UI.drawMap(ctx, this);
        break;
      case 'gameOver':
        UI.drawGameOver(ctx, this);
        break;
      case 'win':
        UI.drawWin(ctx, this);
        break;
      default:
        this.renderGameplay(ctx);
        if (this.state === 'paused') UI.drawPause(ctx, this);
        if (this.state === 'intro') UI.drawIntro(ctx, this);
        if (this.state === 'levelComplete') UI.drawLevelComplete(ctx, this);
        break;
    }
    ctx.restore();
  }

  renderGameplay(ctx) {
    if (!this.level) return;
    drawBackground(ctx, this.camera, this.level.theme);
    this.drawTiles(ctx);

    for (const it of this.items) if (!it.remove) it.draw(ctx, this.camera);
    for (const e of this.enemies) if (!e.remove) e.draw(ctx, this.camera);
    if (this.player) this.player.draw(ctx, this.camera);
    for (const fb of this.fireballs) fb.draw(ctx, this.camera);
    for (const p of this.fx) p.draw(ctx, this.camera);

    this.drawGoalPole(ctx);
    UI.drawHUD(ctx, this);
  }

  drawTiles(ctx) {
    const startX = Math.max(0, Math.floor(this.camera.x / TILE) - 1);
    const endX = Math.min(this.level.width, Math.ceil((this.camera.x + VIEW_W) / TILE) + 1);
    const startY = Math.max(0, Math.floor(this.camera.y / TILE) - 1);
    const endY = Math.min(this.level.height, Math.ceil((this.camera.y + VIEW_H) / TILE) + 1);

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const id = this.level.grid[ty][tx];
        if (id === TILE_TYPES.EMPTY) continue;
        const meta = this.level.tileMeta.get(`${tx},${ty}`);
        const bumpOffset = meta && meta.bump > 0 ? -6 * meta.bump : 0;
        const sx = tx * TILE - this.camera.x;
        const sy = ty * TILE - this.camera.y + bumpOffset;
        const pulse = Math.floor(this.frame / 18) % 2 === 0;
        drawTile(ctx, id, sx, sy, TILE, {
          pulse,
          falling: meta && meta.falling,
          fallT: meta && meta.fallT,
        });
      }
    }
  }

  drawGoalPole(ctx) {
    const gx = this.level.goalX * TILE - this.camera.x;
    if (gx < -40 || gx > VIEW_W + 40) return;
    const groundY = (this.level.height - 2) * TILE - this.camera.y;
    ctx.save();
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(gx + 14, groundY - 300, 4, 300);
    ctx.beginPath();
    ctx.arc(gx + 16, groundY - 300, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c020';
    ctx.fill();
    const poleTop = groundY - 300 + 10;
    const poleBottom = groundY - 30;
    let fy = poleTop;
    if ((this.flagSliding || this.state === 'levelComplete') && this.player) {
      fy = Math.max(poleTop, Math.min(poleBottom, this.player.y - this.camera.y));
    }
    ctx.fillStyle = '#2ea043';
    ctx.beginPath();
    ctx.moveTo(gx + 18, fy);
    ctx.lineTo(gx + 40, fy + 10);
    ctx.lineTo(gx + 18, fy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
