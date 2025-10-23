import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: number;
  color: 'green' | 'orange' | 'red' | 'blue';
  icon?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, color }) => {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__content">
        <div className="stats-card__info">
          <div className="stats-card__value">{value}</div>
          <div className="stats-card__title">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
