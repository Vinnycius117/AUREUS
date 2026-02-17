
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface EvolutionChartProps {
  data: { name: string; value: number; details?: string; change?: number; index?: number }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isNegative = data.change < 0;

    return (
      <div className="bg-[#121212]/95 backdrop-blur-xl border border-primary/30 p-4 rounded-xl shadow-2xl min-w-[220px]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">{label}</p>
          {data.index !== undefined && data.index > 0 && (
            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
              #{data.index}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Lançamento</p>
            <p className="text-sm font-bold text-white leading-tight">{data.details || 'Balanço Acumulado'}</p>
          </div>

          {data.change !== 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Impacto</p>
              <p className={`text-sm font-black ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isNegative ? '' : '+'}{formatCurrency(data.change)}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Saldo no Momento</p>
            <p className="text-lg font-black text-primary tabular-nums">
              {formatCurrency(data.value)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const isFirst = payload.index === 0;
  const isPositive = payload.change > 0;
  const isNegative = payload.change < 0;

  const dotColor = isFirst ? '#c6a84e' : isPositive ? '#34d399' : isNegative ? '#fb7185' : '#c6a84e';

  return (
    <g>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={8} fill={dotColor} fillOpacity={0.15} />
      {/* Outer border */}
      <circle cx={cx} cy={cy} r={5} fill="#0E0E0E" stroke={dotColor} strokeWidth={2.5} />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={2} fill={dotColor} />
    </g>
  );
};

const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;

  const isPositive = payload.change > 0;
  const isNegative = payload.change < 0;
  const dotColor = isPositive ? '#34d399' : isNegative ? '#fb7185' : '#c6a84e';

  return (
    <g>
      {/* Pulse ring */}
      <circle cx={cx} cy={cy} r={14} fill={dotColor} fillOpacity={0.1}>
        <animate attributeName="r" from="10" to="18" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" from="0.15" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={10} fill={dotColor} fillOpacity={0.2} />
      {/* Main dot */}
      <circle cx={cx} cy={cy} r={7} fill={dotColor} stroke="#fff" strokeWidth={2.5} />
    </g>
  );
};

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c6a84e" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#c6a84e" stopOpacity={0.05} />
              <stop offset="95%" stopColor="#c6a84e" stopOpacity={0} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" opacity={0.5} />
          <XAxis hide dataKey="name" />
          <YAxis hide domain={['dataMin - 5000', 'dataMax + 5000']} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#c6a84e', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
          />

          {/* Main Area Fill - Smooth Gradient */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fillOpacity={1}
            fill="url(#colorValue)"
            baseValue="dataMin"
            animationDuration={1500}
          />

          {/* Line Glow Effect */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#c6a84e"
            strokeWidth={4}
            fill="none"
            filter="url(#glow)"
            opacity={0.3}
            animationDuration={1500}
          />

          {/* Crisp Main Line */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#c6a84e"
            strokeWidth={3}
            fill="none"
            animationDuration={1500}
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface DistributionChartProps {
  data: DistributionData[];
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-[300px] w-full mt-4 relative flex items-center justify-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Patrimônio</p>
        <p className="text-xl font-black text-white tabular-nums">{formatCurrency(total)}</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-[#121212]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.name}</p>
                    </div>
                    <p className="text-lg font-black text-white">{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {((item.value / total) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={105}
            paddingAngle={6}
            dataKey="value"
            animationDuration={1500}
            animationBegin={0}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ filter: 'url(#pieGlow)' }}
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

