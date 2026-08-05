import EnemyWraithView from './EnemyWraithView.js?v=33';
import EnemyHushlingView from './EnemyHushlingView.js?v=33';

export function createEnemyView(scene, enemy) {
  switch (enemy && enemy.viewId) {
    case 'hushling':
      return new EnemyHushlingView(scene);
    case 'wraith':
    default:
      return new EnemyWraithView(scene);
  }
}
