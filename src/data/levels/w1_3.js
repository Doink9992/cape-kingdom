import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(90, 14);

b.ground(0, 14);
b.ground(20, 34);
b.ground(40, 55);
b.ground(61, 89);

// Cloud-platform stepping stones over the gaps
b.rect(16, 9, 18, 9, 'C');
b.rect(36, 8, 38, 8, 'C');
b.rect(57, 10, 59, 10, 'C');

b.hline(6, 8, 9, 'B');
b.set(7, 9, '?');
b.rect(24, 7, 26, 7, 'C');
b.set(25, 6, '$');
b.hline(43, 45, 9, 'B');
b.set(44, 9, '!');
b.rect(65, 8, 67, 8, 'C');
b.set(66, 7, '?');
b.rect(75, 6, 77, 6, 'C');

b.entity(5, 11, 'g');
b.entity(22, 11, 'w');
b.entity(30, 11, 'k');
b.entity(42, 11, 'w');
b.entity(50, 11, 'y');
b.entity(63, 11, 'K');
b.entity(70, 11, 'w');
b.entity(80, 11, 'g');
b.entity(83, 11, 'y');

[27, 28, 29].forEach((x) => b.set(x, 5, 'c'));

b.midpoint(41, 11);
b.player(2, 11);
b.goal(85, 11);

export default {
  name: '1-3 Wolkenpfad',
  shortName: '1-3',
  theme: 'sky',
  powerupType: 'fire',
  timeLimit: 350,
  rows: b.rows(),
};
