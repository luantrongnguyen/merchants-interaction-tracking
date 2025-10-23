import React from 'react';
import { MerchantWithStatus } from '../types/merchant';
import StatsCard from './StatsCard';
import './StatsPanel.css';

interface StatsPanelProps {
  merchants: MerchantWithStatus[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ merchants }) => {
  // Calculate statistics
  const totalMerchants = merchants.length;
  const goodStatus = merchants.filter(m => m.status === 'green').length;
  const attentionStatus = merchants.filter(m => m.status === 'orange').length;
  const contactStatus = merchants.filter(m => m.status === 'red').length;
  
  // Calculate percentages
  const goodPercentage = totalMerchants > 0 ? Math.round((goodStatus / totalMerchants) * 100) : 0;
  const attentionPercentage = totalMerchants > 0 ? Math.round((attentionStatus / totalMerchants) * 100) : 0;
  const contactPercentage = totalMerchants > 0 ? Math.round((contactStatus / totalMerchants) * 100) : 0;

  return (
    <div className="stats-panel">
      <div className="stats-panel__header">
        <h1>Mango Merchants Interaction Tracking</h1>
        <p>Manage and track interactions with merchants</p>
      </div>
      
      <div className="stats-panel__grid">
        <StatsCard
          title="Total Merchants"
          value={totalMerchants}
          color="blue"
        />
        
        <StatsCard
          title={`Good (${goodPercentage}%)`}
          value={goodStatus}
          color="green"
        />
        
        <StatsCard
          title={`Attention (${attentionPercentage}%)`}
          value={attentionStatus}
          color="orange"
        />
        
        <StatsCard
          title={`Contact (${contactPercentage}%)`}
          value={contactStatus}
          color="red"
        />
      </div>
    </div>
  );
};

export default StatsPanel;
