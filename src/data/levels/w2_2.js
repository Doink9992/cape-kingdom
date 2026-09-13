import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(92, 14);

b.ground(0, 22);
b.ground(28, 48);
b.ground(54, 72);
b.ground(78, 91);

b.hline(0, 91, 0, '=');
b.hline(0, 91, 1, '=');

b.hline(9, 11, 9, 'B');
b.set(10, 9, '?');
b.rect(16, 8, 16, 8, 'U');
b.rect(19, 7, 19, 7, 'U');

b.rect(30, 12, 36, 13, ' ');
b.rect(31, 11, 31, 11, 'D');
b.rect(33, 11, 33, 11, 'D');
b.rect(35, 11, 35, 11, 'D');
b.hline(40, 42, 9, 'B');
b.set(41, 9, '!');

b.hline(57, 57, 12, '^');
b.hline(58, 58, 12, '^');
b.rect(62, 9, 64, 9, 'U');
b.set(63, 8, '$');

b.rect(80, 9, 82, 9, 'B');
b.set(81, 9, '?');

b.entity(6, 11, 'g');
b.entity(15, 11, 'k');
b.entity(20, 11, 'g');
b.entity(38, 11, 'K');
b.entity(45, 11, 'g');
b.entity(60, 11, 'y');
b.entity(66, 11, 'k');
b.entity(70, 11, 'g');
b.entity(84, 11, 'K');
b.entity(87, 11, 'g');

[12, 13, 14].forEach((x) => b.set(x, 5, 'c'));

b.midpoint(54, 11);
b.player(2, 11);
b.goal(88, 11);

export default {
  name: '2-2 Kristallhöhle',
  shortName: '2-2',
  theme: 'underground',
  powerupType: 'cape',
  timeLimit: 350,
  rows: b.rows(),
};
