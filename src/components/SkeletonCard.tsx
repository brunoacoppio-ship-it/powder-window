export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-6 h-4 bg-slate-800 rounded mt-1" />
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 bg-slate-800 rounded" />
              <div className="w-32 h-4 bg-slate-800 rounded" />
            </div>
            <div className="w-10 h-8 bg-slate-800 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-slate-800 rounded-md h-8" />
            ))}
          </div>
          <div className="h-2 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
