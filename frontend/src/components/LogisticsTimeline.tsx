'use client';

export type TimelineMilestone = {
  id: string;
  milestone: string;
  title: string;
  description?: string | null;
  location?: string | null;
  occurredAt: string;
};

export type ProgressStep = {
  status: string;
  label: string;
  completed: boolean;
  active: boolean;
};

type Props = {
  timeline: TimelineMilestone[];
  progress?: { steps: ProgressStep[]; currentStep: number };
  trackingNumber?: string | null;
  carrier?: string | null;
};

export function LogisticsTimeline({ timeline, progress, trackingNumber, carrier }: Props) {
  return (
    <div className="space-y-6">
      {(trackingNumber || carrier) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {carrier && <p><span className="text-slate-500">Carrier:</span> <strong>{carrier}</strong></p>}
          {trackingNumber && (
            <p className="mt-1 font-mono">
              <span className="text-slate-500">Tracking:</span> {trackingNumber}
            </p>
          )}
        </div>
      )}

      {progress && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {progress.steps.map((step, i) => (
            <div key={step.status} className="flex items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.completed
                    ? 'bg-brand-600 text-white'
                    : step.active
                      ? 'bg-amber-400 text-white ring-2 ring-amber-200'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step.completed ? '✓' : i + 1}
              </div>
              {i < progress.steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-8 sm:w-12 ${
                    step.completed ? 'bg-brand-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <ol className="relative border-l-2 border-brand-200 pl-6">
        {timeline.length === 0 ? (
          <li className="text-sm text-slate-500">No tracking events yet.</li>
        ) : (
          timeline.map((m, i) => (
            <li key={m.id} className={`mb-6 ${i === timeline.length - 1 ? '' : ''}`}>
              <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 ring-4 ring-white" />
              <p className="font-semibold text-slate-900">{m.title}</p>
              {m.location && (
                <p className="text-sm text-brand-700">{m.location}</p>
              )}
              {m.description && (
                <p className="mt-1 text-sm text-slate-600">{m.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {new Date(m.occurredAt).toLocaleString()}
              </p>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
