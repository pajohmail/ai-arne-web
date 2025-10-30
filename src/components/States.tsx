export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="card">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ background: '#eee', height: 12, margin: '8px 0', borderRadius: 4 }} />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div role="alert" className="card">{message}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="card muted">{message}</div>;
}


