import Live25EnemyWraithView from './Live25EnemyWraithView.js?v=live25';
import EnemyHushlingView from '../EnemyHushlingView.js?v=40';

export function createEnemyView(scene, enemy) {
  switch (enemy && enemy.viewId) {
    case 'hushling':
      return new EnemyHushlingView(scene);
    case 'wraith':
    default:
      return new Live25EnemyWraithView(scene);
  }
}
