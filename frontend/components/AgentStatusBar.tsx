'use client';

interface Props {
  agentName?: string;
  status?: 'idle' | 'thinking' | 'done';
  description?: string;
  agentStatus?: Record<string, 'idle' | 'thinking' | 'done'>;
}

export default function AgentStatusBar({ agentName, status, description, agentStatus }: Props) {
  if (agentStatus) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(agentStatus).map(([name, stat]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${stat === 'thinking' ? '#6366f1' : stat === 'done' ? '#10b981' : 'rgba(255,255,255,0.08)'}` }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{name}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: stat === 'thinking' ? '#a5b4fc' : stat === 'done' ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
              {stat === 'thinking' ? '⚙️ Thinking...' : stat === 'done' ? '✓ Complete' : 'Idle'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (!status || status === 'idle') return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, background: 'rgba(13,13,26,0.9)', border: `1px solid ${status === 'thinking' ? '#6366f1' : '#10b981'}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'thinking' ? '#6366f1' : '#10b981', boxShadow: status === 'thinking' ? '0 0 10px #6366f1' : '0 0 10px #10b981' }} />
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{agentName}</span>
      {description && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{description}</span>}
      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: status === 'thinking' ? '#a5b4fc' : '#34d399' }}>
        {status === 'thinking' ? 'Thinking...' : '✓ Complete'}
      </span>
    </div>
  );
}
