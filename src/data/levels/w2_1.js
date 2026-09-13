import { LevelBuilder } from '../LevelBuilder.js';

const b = new LevelBuilder(100, 14);

b.ground(0, 20);
b.ground(24, 44);
b.ground(48, 70);
b.ground(76, 99);

b.rect(10, 9, 12, 9, 'U');
b.hline(15, 17, 8, 'B');
b.set(16, 8, '!');

b.pipe(28, 9, 3, 2);
b.entity(28, 8, 'v');

b.hline(36, 38, 9, 'B');
b.set(37, 9, '?');

b.rect(52, 8, 52, 8, 'C');
b.rect(56, 7, 56, 7, 'C');
b.rect(60, 6, 60, 6, 'C');
b.set(60, 5, '$');

b.pipe(64, 10, 2, 2);
b.entity(64, 9, 'v');

b.hline(80, 82, 9, 'B');
b.set(81, 9, '!');
b.rect(88, 9, 90, 9, 'U');

b.entity(6, 11, 'g');
b.entity(18, 11, 'k');
b.entity(26, 11, 'g');
b.entity(33, 11, 'K');
b.entity(41, 11, 'g');
b.entity(50, 11, 'w');
b.entity(58, 11, 'k');
b.entity(68, 11, 'g');
b.entity(77, 11, 'K');
b.entity(80, 11, 'g');
b.entity(85, 11, 'w');
b.entity(93, 11, 'K');

b.midpoint(48, 11);
b.player(2, 11);
b.goal(95, 11);

export default {
  name: '2-1 Bergpfad',
  shortName: '2-1',
  theme: 'overworld',
  powerupType: 'cape',
  timeLimit: 350,
  rows: b.rows(),
};
