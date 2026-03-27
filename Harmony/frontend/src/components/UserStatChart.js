import React, {useMemo} from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function UserStatsChart({ stats }) {

  const statsSignature = useMemo(() => {
    return JSON.stringify(stats);
  }, [stats]);
  
  const memoizedChart = useMemo(() => {
        if (!stats || stats.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 200, backgroundColor: '#1a1426', borderRadius: '4px' }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats}>
          <PolarGrid stroke="#4f545c" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#b9bbbe', fontSize: 10 }} />
          <Radar
            name="Préférences"
            dataKey="A"
            stroke="#5865f2" // Couleur "Blurple" Discord
            fill="#5865f2"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
  },[statsSignature]);
  return (
        <div style={{ width: '100%', height: '220px', marginTop: '10px' }}>
            {memoizedChart || <p>Loading...</p>}
        </div>
    );
}

export default UserStatsChart;