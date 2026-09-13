import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(95, 14);

b.ground(0, 26);
b.ground(30, 53);
b.ground(57, 94);

// Small intro staircase of bricks
b.hline(10, 12, 9, 'B');
b.set(11, 9, '?');
b.hline(17, 17, 8, '?');
b.hline(20, 22, 9, 'B');

// Floating coin arc
[12, 13, 14, 15, 16].forEach((x, i) => b.set(x, 6 - Math.round(Math.sin(i * 0.9) * 2), 'c'));

b.set(25, 9, '!');
b.pipe(35, 10, 2, 2);
b.pipe(46, 9, 3, 2);

b.hline(60, 63, 9, 'B');
b.set(61, 9, '?');
b.set(70, 9, '$');

b.entity(20, 11, 'g');
b.entity(24, 11, 'g');
b.entity(41, 11, 'k');
b.entity(52, 11, 'g');
b.entity(66, 11, 'K');
b.entity(80, 11, 'g');
b.entity(82, 11, 'g');

b.midpoint(44, 11);
b.player(2, 11);
b.goal(90, 11);

export default {
  name: '1-1 Wiesenland',
  shortName: '1-1',
  theme: 'overworld',
  powerupType: 'fire',
  timeLimit: 300,
  rows: b.rows(),
};
