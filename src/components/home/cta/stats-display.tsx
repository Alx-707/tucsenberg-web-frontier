interface StatsDisplayProps {
  stats: Array<{ value: string; label: string }>;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='text-center'
        >
          <div className='text-foreground text-2xl font-bold sm:text-3xl'>
            {stat.value}
          </div>
          <div className='text-muted-foreground text-sm'>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
