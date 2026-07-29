'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Map, Clock, CheckSquare, ExternalLink } from 'lucide-react';

function RoadmapContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const router = useRouter();

  const [roadmap, setRoadmap] = useState<any>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sid) {
      api.getLearningPath(sid).then(data => {
        setRoadmap(data);
        const saved = localStorage.getItem(`roadmap_${sid}`);
        if (saved) setChecked(JSON.parse(saved));
      });
    }
  }, [sid]);

  const toggleCheck = (taskId: string) => {
    const newChecked = { ...checked, [taskId]: !checked[taskId] };
    setChecked(newChecked);
    if (sid) localStorage.setItem(`roadmap_${sid}`, JSON.stringify(newChecked));
  };

  if (!sid) return <div className="min-h-screen flex items-center justify-center">Please complete an interview first to get a personalized roadmap.</div>;
  if (!roadmap) return <div className="min-h-screen flex items-center justify-center">Generating your 7-day study plan...</div>;

  const totalTasks = roadmap.plan?.reduce((acc: number, day: any) => acc + day.tasks.length, 0) || 0;
  const completedTasks = Object.values(checked).filter(Boolean).length;
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const daysCompleted = roadmap.plan?.filter((d: any) => d.tasks.every((t: string) => checked[`${d.day}-${t}`])).length || 0;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-6xl mx-auto">
      
      <div className="glass-bright p-6 rounded-2xl border-accent border mb-8 animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Map className="text-accent" /> 7-Day Action Plan</h1>
            <p className="text-text-muted mt-1">Estimated total effort: {roadmap.total_hours} hours</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-heading font-bold text-accent2">{pct}%</div>
            <p className="text-xs text-text-muted">Overall Progress</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-surface2 rounded-full h-2.5 mb-2 overflow-hidden">
          <div className="bg-gradient-to-r from-accent to-accent2 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
        </div>
        <p className="text-xs font-bold text-right text-text-muted">{daysCompleted} of 7 Days Complete</p>

        {roadmap.study_tip && (
          <div className="mt-6 bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] p-4 rounded-xl text-sm text-warning">
            <strong className="font-heading">Coach's Tip:</strong> {roadmap.study_tip}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roadmap.plan?.map((day: any) => {
          const isPriority = roadmap.priority_topic === day.topic;
          const dayCompleted = day.tasks.every((t: string) => checked[`${day.day}-${t}`]);

          return (
            <div key={day.day} className={`glass rounded-2xl p-6 flex flex-col transition-all ${isPriority ? 'border-accent shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''} ${dayCompleted ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="tag tag-indigo text-xs">DAY {day.day}</span>
                <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={12}/> {day.estimated_hours}h</span>
              </div>
              
              <h3 className="text-lg font-bold font-heading mb-1">{day.topic}</h3>
              <p className="text-sm text-accent3 mb-4">{day.focus}</p>
              
              <div className="flex-1 space-y-3 mb-6">
                {day.tasks.map((task: string, i: number) => {
                  const id = `${day.day}-${task}`;
                  return (
                    <label key={i} onClick={() => toggleCheck(id)} className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 rounded border flex-shrink-0 transition-colors ${checked[id] ? 'bg-success border-success text-bg' : 'border-text-muted group-hover:border-accent text-transparent'}`}>
                        <CheckSquare size={16} />
                      </div>
                      <span className={`text-sm leading-snug transition-colors ${checked[id] ? 'text-text-muted line-through' : 'text-text group-hover:text-accent'}`}>{task}</span>
                    </label>
                  );
                })}
              </div>

              {day.resources && day.resources.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-text-dim mb-2">RESOURCES</p>
                  <div className="space-y-1">
                    {day.resources.map((res: { title: string; url: string; type: string }, i: number) => (
                      <a key={i} href={res.url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                        <ExternalLink size={10} /> {res.title || res.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="mt-12 text-center p-8 glass-bright rounded-2xl border border-success animate-fade-in-up">
          <h2 className="text-3xl font-bold text-success mb-2">Mission Accomplished! 🚀</h2>
          <p className="text-text-muted mb-6">You've completed your 7-day training program. You are ready.</p>
          <button className="btn-primary" onClick={() => router.push('/setup')}>Start New Mock Interview</button>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadmapContent />
    </Suspense>
  );
}
