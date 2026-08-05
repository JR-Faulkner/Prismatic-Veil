import EnemyWraithView from './EnemyWraithView.js?v=35';
import EnemyHushlingView from './EnemyHushlingView.js?v=35';

export function createEnemyView(scene, enemy) {
  switch (enemy && enemy.viewId) {
    case 'hushling':
      return new EnemyHushlingView(scene);
    case 'wraith':
    default:
      return new EnemyWraithView(scene);
  }
}
