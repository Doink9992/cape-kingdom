import { Grumpkin } from './enemies/Grumpkin.js';
import { Shellback } from './enemies/Shellback.js';
import { Spiky } from './enemies/Spiky.js';
import { Piranha } from './enemies/Piranha.js';
import { Coin } from './items/Coin.js';

export function spawnFromLevel(level) {
  const enemies = [];
  const items = [];
  const blockSpawns = [];

  for (const s of level.entitySpawns) {
    switch (s.type) {
      case 'grumpkin': enemies.push(new Grumpkin(s.x, s.y)); break;
      case 'shellback-green': enemies.push(new Shellback(s.x, s.y, { color: 'green' })); break;
      case 'shellback-red': enemies.push(new Shellback(s.x, s.y, { color: 'red' })); break;
      case 'shellback-winged': enemies.push(new Shellback(s.x, s.y, { color: 'green', winged: true })); break;
      case 'spiky': enemies.push(new Spiky(s.x, s.y)); break;
      case 'piranha': enemies.push(new Piranha(s.x, s.y)); break;
      case 'coin': items.push(new Coin(s.x, s.y)); break;
      case 'block-coin':
      case 'block-power':
      case 'block-1up':
      case 'block-star':
        blockSpawns.push(s);
        break;
      default: break;
    }
  }

  return { enemies, items, blockSpawns };
}
