import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(70, 14);

b.ground(0, 69);
b.hline(0, 69, 0, 'Z');
b.hline(0, 69, 1, 'Z');

b.hline(8, 8, 12, '^');
b.hline(9, 9, 12, '^');
b.hline(22, 22, 12, '^');
b.hline(23, 23, 12, '^');
b.hline(24, 24, 12, '^');

b.rect(14, 9, 16, 9, 'Z');
b.rect(30, 8, 32, 8, 'Z');
b.rect(29, 12, 33, 13, ' ');
b.rect(30, 11, 30, 11, 'D');
b.rect(32, 11, 32, 11, 'D');
b.rect(42, 9, 42, 9, 'U');
b.rect(46, 9, 46, 9, 'U');
b.rect(50, 9, 50, 9, 'U');

b.hline(35, 37, 12, '^');

b.entity(6, 11, 'K');
b.entity(18, 11, 'K');
b.entity(19, 11, 'g');
b.entity(26, 11, 'g');
b.entity(44, 11, 'K');
b.entity(48, 11, 'g');
b.entity(55, 11, 'K');
b.entity(58, 11, 'g');
b.entity(62, 11, 'K');

b.midpoint(40, 11);
b.player(2, 11);
b.goal(66, 11);

export default {
  name: '1-4 Feuerschloss',
  shortName: '1-4',
  theme: 'castle',
  powerupType: 'fire',
  timeLimit: 300,
  rows: b.rows(),
};
