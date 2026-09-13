import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(85, 14);

b.ground(0, 37);
b.ground(43, 84);

// Cavern ceiling
b.hline(0, 84, 0, '=');
b.hline(0, 18, 1, '=');
b.hline(24, 40, 1, '=');
b.hline(46, 84, 1, '=');

b.hline(14, 16, 9, 'B');
b.set(15, 9, '?');
b.rect(20, 10, 22, 10, 'U');
b.hline(28, 30, 8, 'B');
b.set(29, 8, '!');

b.rect(38, 11, 39, 11, 'D');
b.rect(41, 11, 42, 11, 'D');

b.hline(50, 52, 9, 'B');
b.set(51, 9, '$');
b.rect(58, 9, 58, 9, 'U');
b.rect(62, 9, 62, 9, 'U');
b.rect(66, 9, 66, 9, 'U');

b.entity(10, 11, 'g');
b.entity(18, 11, 'k');
b.entity(26, 11, 'g');
b.entity(33, 11, 'g');
b.entity(44, 11, 'K');
b.entity(55, 11, 'g');
b.entity(60, 11, 'g');
b.entity(70, 11, 'k');
b.entity(74, 11, 'g');

[5, 6, 7].forEach((x) => b.set(x, 8, 'c'));
[52, 53, 54].forEach((x) => b.set(x, 6, 'c'));

b.midpoint(46, 11);
b.player(2, 11);
b.goal(80, 11);

export default {
  name: '1-2 Höhlenpfad',
  shortName: '1-2',
  theme: 'underground',
  powerupType: 'fire',
  timeLimit: 300,
  rows: b.rows(),
};
