import { Game } from './engine/Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();

// Expose for debugging in the browser console.
window.__game = game;
