import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(100, 14);

b.ground(0, 20);
b.ground(26, 46);
b.ground(52, 62);
b.ground(68, 99);

b.hline(0, 99, 0, 'Z');
b.hline(0, 99, 1, 'Z');

b.hline(9, 9, 12, '^');
b.hline(10, 10, 12, '^');
b.hline(11, 11, 12, '^');

b.rect(17, 9, 19, 9, 'Z');

b.rect(23, 12, 25, 13, ' ');
b.rect(23, 11, 23, 11, 'D');
b.rect(25, 11, 25, 11, 'D');

b.hline(30, 32, 9, 'B');
b.set(31, 9, '?');
b.rect(38, 8, 38, 8, 'U');
b.rect(41, 7, 41, 7, 'U');
b.rect(44, 6, 44, 6, 'U');
b.set(44, 5, '$');

b.hline(56, 56, 12, '^');
b.hline(57, 57, 12, '^');
b.hline(58, 58, 12, '^');

b.rect(64, 12, 66, 13, ' ');
b.rect(64, 11, 64, 11, 'D');
b.rect(66, 11, 66, 11, 'D');

b.hline(73, 75, 9, 'B');
b.set(74, 9, '!');
b.rect(80, 9, 82, 9, 'Z');
b.hline(88, 88, 12, '^');
b.hline(89, 89, 12, '^');
b.hline(90, 90, 12, '^');

b.entity(5, 11, 'K');
b.entity(15, 11, 'k');
b.entity(28, 11, 'K');
b.entity(34, 11, 'g');
b.entity(40, 11, 'K');
b.entity(45, 11, 'g');
b.entity(53, 11, 'K');
b.entity(59, 11, 'y');
b.entity(70, 11, 'g');
b.entity(76, 11, 'K');
b.entity(84, 11, 'y');
b.entity(92, 11, 'K');
b.entity(95, 11, 'g');

b.midpoint(52, 11);
b.player(2, 11);
b.goal(96, 11);

export default {
  name: '2-4 Dunkler Thronsaal',
  shortName: '2-4',
  theme: 'castle',
  powerupType: 'cape',
  timeLimit: 380,
  rows: b.rows(),
};
