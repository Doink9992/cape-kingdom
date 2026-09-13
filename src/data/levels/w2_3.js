import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(95, 14);

b.ground(0, 12);
b.ground(18, 30);
b.ground(36, 48);
b.ground(54, 66);
b.ground(72, 94);

b.rect(15, 9, 16, 9, 'C');
b.rect(33, 8, 34, 8, 'C');
b.rect(51, 8, 52, 8, 'C');
b.rect(69, 9, 70, 9, 'C');

b.hline(5, 7, 9, 'B');
b.set(6, 9, '?');
b.set(23, 8, '!');
b.rect(23, 9, 23, 9, 'U');
b.hline(40, 42, 8, 'B');
b.set(41, 8, '$');
b.rect(58, 8, 60, 8, 'C');
b.set(59, 7, '?');

b.entity(4, 11, 'w');
b.entity(21, 11, 'w');
b.entity(26, 11, 'y');
b.entity(39, 11, 'w');
b.entity(44, 11, 'K');
b.entity(57, 11, 'w');
b.entity(62, 11, 'y');
b.entity(76, 11, 'w');
b.entity(80, 11, 'K');
b.entity(85, 11, 'w');
b.entity(89, 11, 'y');

[42, 43, 44].forEach((x) => b.set(x, 4, 'c'));

b.midpoint(37, 11);
b.player(2, 11);
b.goal(90, 11);

export default {
  name: '2-3 Nachthimmel',
  shortName: '2-3',
  theme: 'night',
  powerupType: 'cape',
  timeLimit: 380,
  rows: b.rows(),
};
