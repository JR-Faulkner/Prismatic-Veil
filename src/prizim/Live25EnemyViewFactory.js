import Live25EnemyWraithView from './Live25EnemyWraithView.js?v=live25';
import Live30E4HushlingView from './Live30E4HushlingView.js?v=live30e4-center';

export function createEnemyView(scene, enemy) {
  switch (enemy && enemy.viewId) {
    case 'hushling':
      return new Live30E4HushlingView(scene);
    case 'wraith':
    default:
      return new Live25EnemyWraithView(scene);
  }
}
