import React, { useMemo } from 'react';
import { calculateStreak, getUserLevel, calculateAchievements } from '../../utils/gamification';

/**
 * Streak counter + user level + achievement badges, all computed
 * client-side from the expenses (and optional budget progress) already
 * loaded by the page — no extra backend calls or tables.
 */
function GamificationPanel({ expenses = [], budgetsProgress = [] }) {
  const streak = useMemo(() => calculateStreak(expenses), [expenses]);
  const level = useMemo(() => getUserLevel(expenses.length), [expenses.length]);
  const achievements = useMemo(
    () => calculateAchievements({ expenses, budgetsProgress }),
    [expenses, budgetsProgress]
  );

  return (
    <div className="gamification-panel">
      <div className="gamification-stat streak-stat">
        <span className="gamification-stat-icon" aria-hidden="true">🔥</span>
        <div>
          <div className="gamification-stat-value">{streak}</div>
          <div className="gamification-stat-label">
            {streak === 1 ? 'Día seguido' : 'Días seguidos'}
          </div>
        </div>
      </div>

      <div className="gamification-stat level-stat">
        <span className="gamification-stat-icon" aria-hidden="true">{level.icon}</span>
        <div className="level-stat-body">
          <div className="gamification-stat-value">{level.name}</div>
          <div className="level-progress-bar">
            <div className="level-progress-fill" style={{ width: `${level.progress}%` }} />
          </div>
          <div className="gamification-stat-label">
            {level.next
              ? `${level.count}/${level.next.min} para ${level.next.name}`
              : `${level.count} gastos registrados`}
          </div>
        </div>
      </div>

      <div className="achievements-row">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`achievement-badge ${a.unlocked ? 'unlocked' : 'locked'}`}
            title={a.label}
          >
            <span className="achievement-icon" aria-hidden="true">{a.icon}</span>
            <span className="achievement-label">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GamificationPanel;
