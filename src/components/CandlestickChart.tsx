import React, { useState, useRef, useEffect } from 'react';
import { Candle, UserTerminalConfig } from '../types';
import { formatDateLabel } from '../utils/dateHelpers';
import { TrendingUp, TrendingDown, Volume2, Info, Maximize2 } from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  timeframe: 'Daily' | 'Weekly' | 'Monthly';
  config?: UserTerminalConfig;
}

export default function CandlestickChart({ candles, timeframe, config }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 380 });
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showCrosshair, setShowCrosshair] = useState(false);

  // Theme support
  const getThemeColors = (preset?: 'standard' | 'emerald' | 'cyber' | 'amber' | 'gold') => {
    switch (preset) {
      case 'cyber':
        return { green: '#22d3ee', red: '#f43f5e', greenBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', redBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'amber':
        return { green: '#fbbf24', red: '#ec4899', greenBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', redBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20' };
      case 'gold':
        return { green: '#fbbf24', red: '#a78bfa', greenBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', redBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
      case 'emerald':
        return { green: '#34d399', red: '#f43f5e', greenBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', redBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'standard':
      default:
        return { green: '#10b981', red: '#f43f5e', greenBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', redBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
  };

  const themeColors = getThemeColors(config?.themePreset);

  // Resize observer to make chart responsive
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain reasonable aspect ratio
      const height = Math.max(340, Math.min(420, window.innerHeight * 0.45));
      setDimensions({ width: Math.max(300, width), height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // When candles data changes, default hover info to the last candle (the current state)
  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  if (candles.length === 0) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center bg-slate-950/40 border border-slate-800/50 rounded-xl p-6 text-slate-500">
        <Info className="w-8 h-8 mb-2 stroke-slate-700" />
        <p className="font-sans text-sm">Not enough history to generate candles.</p>
        <p className="text-xs text-slate-600 mt-1">Check-in some habits or add habits with history to view data.</p>
      </div>
    );
  }

  // Margin spacing
  const padding = { top: 30, bottom: 40, left: 20, right: 65 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Find min and max of price values (Y-axis bounds) including indicators to avoid clipping
  const highValues = candles.map(c => {
    const vals = [c.high];
    if (config?.showIndicators) {
      if (c.sma !== undefined) vals.push(c.sma);
      if (c.ema !== undefined) vals.push(c.ema);
    }
    return Math.max(...vals);
  });

  const lowValues = candles.map(c => {
    const vals = [c.low];
    if (config?.showIndicators) {
      if (c.sma !== undefined) vals.push(c.sma);
      if (c.ema !== undefined) vals.push(c.ema);
    }
    return Math.min(...vals);
  });

  let yMax = Math.max(...highValues);
  let yMin = Math.min(...lowValues);

  // Add 10% breathing room to Y-axis
  let yRange = yMax - yMin;
  if (yRange === 0) {
    yMin = yMin - 150;
    yMax = yMax + 150;
  } else {
    yMin = Math.max(0, yMin - yRange * 0.15); // Don't let index drop below 0 if possible
    yMax = yMax + yRange * 0.15;
  }

  // Map value to Y coordinate
  const getY = (val: number) => {
    const pct = (val - yMin) / (yMax - yMin);
    return padding.top + (1 - pct) * chartHeight;
  };

  // Map index to X coordinate
  const getX = (idx: number) => {
    if (candles.length === 1) {
      return padding.left + chartWidth / 2;
    }
    const pct = idx / (candles.length - 1);
    return padding.left + pct * chartWidth;
  };

  // Map Y coordinate back to price value (for horizontal crosshair label)
  const getValueFromY = (y: number) => {
    const relativeY = y - padding.top;
    const pct = 1 - relativeY / chartHeight;
    return yMin + pct * (yMax - yMin);
  };

  // Handle Mouse movements for crosshair & snaps
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    setShowCrosshair(true);

    // Calculate nearest candle index
    if (x >= padding.left && x <= dimensions.width - padding.right) {
      const relativeX = x - padding.left;
      const step = chartWidth / (candles.length > 1 ? candles.length - 1 : 1);
      const approxIndex = Math.round(relativeX / step);
      const idx = Math.max(0, Math.min(candles.length - 1, approxIndex));
      
      setHoveredIndex(idx);
      setHoveredCandle(candles[idx]);
    } else {
      setHoveredIndex(null);
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setShowCrosshair(false);
    setHoveredCandle(null);
    setHoveredIndex(null);
  };

  // Generate ticks for Y axis
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount }).map((_, idx) => {
    return yMin + (idx / (yTicksCount - 1)) * (yMax - yMin);
  });

  // Calculate volume scaling factor (bottom 20% of chart)
  const maxVolume = Math.max(...candles.map(c => c.volume), 1);
  const getVolumeHeight = (vol: number) => {
    const maxBarHeight = chartHeight * 0.20;
    return (vol / maxVolume) * maxBarHeight;
  };

  // Compute SVG paths for technical indicators
  const getIndicatorPath = (selector: (c: Candle) => number | undefined) => {
    const points = candles
      .map((candle, idx) => {
        const val = selector(candle);
        if (val === undefined || isNaN(val)) return null;
        return `${getX(idx).toFixed(1)},${getY(val).toFixed(1)}`;
      })
      .filter((pt): pt is string => pt !== null);

    if (points.length === 0) return '';
    return `M ${points.join(' L ')}`;
  };

  const smaPath = config?.showIndicators ? getIndicatorPath(c => c.sma) : '';
  const emaPath = config?.showIndicators ? getIndicatorPath(c => c.ema) : '';

  return (
    <div className="bg-slate-950/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden" id="candlestick_chart_panel">
      
      {/* TradingView-Style Interactive Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
        {activeCandle && (
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {/* Asset Identifier & Current Close */}
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white tracking-wider text-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-800/60">
                  HABIT/INDEX
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {timeframe.toUpperCase()}
                </span>
              </div>

              {/* OHLC Values */}
              <div className="flex items-center gap-3 text-[11px] font-mono select-none">
                <span className="text-slate-500 font-sans">O:<span className="text-slate-300 ml-0.5 font-mono">{activeCandle.open.toFixed(0)}</span></span>
                <span className="text-slate-500 font-sans">H:<span className="text-slate-300 ml-0.5 font-mono">{activeCandle.high.toFixed(0)}</span></span>
                <span className="text-slate-500 font-sans">L:<span className="text-slate-300 ml-0.5 font-mono">{activeCandle.low.toFixed(0)}</span></span>
                <span className="text-slate-500 font-sans">C:<span className={`${activeCandle.isGreen ? 'text-emerald-400' : 'text-rose-500'} font-semibold ml-0.5 font-mono`}>{activeCandle.close.toFixed(0)}</span></span>
                
                {/* Change Badge */}
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  activeCandle.isGreen ? themeColors.greenBg : themeColors.redBg
                }`}>
                  {activeCandle.isGreen ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {activeCandle.changePercent >= 0 ? '+' : ''}{activeCandle.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Technical Indicator Overlay Value Labels */}
            {config?.showIndicators && (
              <div className="flex gap-4 text-[10px] font-mono tracking-wide opacity-80 mt-0.5">
                {activeCandle.sma !== undefined && (
                  <span className="text-sky-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    SMA({config.smaPeriod}): <span className="text-slate-200 font-bold">{activeCandle.sma.toFixed(1)}</span>
                  </span>
                )}
                {activeCandle.ema !== undefined && (
                  <span className="text-pink-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                    EMA({config.emaPeriod}): <span className="text-slate-200 font-bold">{activeCandle.ema.toFixed(1)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Time Period Label */}
        {activeCandle && (
          <div className="flex items-center gap-2 font-sans text-xs text-slate-400 font-medium">
            <span className={`w-2 h-2 rounded-full animate-pulse ${activeCandle.isGreen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {activeCandle.timeLabel}
            {hoveredCandle && <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800/40">HOVER</span>}
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full relative select-none">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair overflow-visible"
        >
          {/* 1. Horizontal Gridlines & Price Ticks */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={`grid-y-${idx}`} className="opacity-40">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth={0.8}
                  strokeDasharray="2,4"
                />
                <text
                  x={dimensions.width - padding.right + 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="start"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* 2. Vertical Date Ticks (X-axis ticks) */}
          {candles.map((candle, idx) => {
            const nth = Math.max(1, Math.ceil(candles.length / 6));
            if (idx % nth !== 0 && idx !== candles.length - 1) return null;
            
            const x = getX(idx);
            return (
              <g key={`grid-x-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={dimensions.height - padding.bottom}
                  stroke="#334155"
                  strokeWidth={0.8}
                  strokeDasharray="2,4"
                  opacity={0.3}
                />
                <text
                  x={x}
                  y={dimensions.height - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  textAnchor="middle"
                >
                  {timeframe === 'Daily' ? formatDateLabel(candle.rawDate, 'short') : candle.timeLabel.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* 3. Bottom Volume Bars (Completing Habits count) */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const volHeight = getVolumeHeight(candle.volume);
            const y = dimensions.height - padding.bottom - volHeight;
            const barWidth = Math.max(2, (chartWidth / candles.length) * 0.4);

            return (
              <rect
                key={`vol-${idx}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={volHeight}
                fill={candle.isGreen ? themeColors.green : themeColors.red}
                opacity={hoveredIndex === idx ? 0.35 : 0.12}
                rx={1}
              />
            );
          })}

          {/* 4. Candlesticks (Wicks and Bodies) */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            
            const bodyWidth = Math.max(3, (chartWidth / candles.length) * 0.65);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));
            const color = candle.isGreen ? themeColors.green : themeColors.red;

            const isHovered = hoveredIndex === idx;
            const candleStroke = isHovered ? '#ffffff' : color;
            const bodyFill = color;

            return (
              <g key={`candle-${idx}`} className="transition-all duration-150">
                {/* Wick/Shadow Line */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleStroke}
                  strokeWidth={1.5}
                />
                
                {/* Candle Body Rect */}
                <rect
                  x={x - bodyWidth / 2}
                  y={bodyTop}
                  width={bodyWidth}
                  height={bodyHeight}
                  fill={bodyFill}
                  stroke={candleStroke}
                  strokeWidth={isHovered ? 1.5 : 0}
                  rx={1.5}
                />
              </g>
            );
          })}

          {/* Technical Indicator Overlays */}
          {config?.showIndicators && smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#38bdf8" // sky-400
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />
          )}

          {/* EMA Path Overlay */}
          {config?.showIndicators && emaPath && (
            <path
              d={emaPath}
              fill="none"
              stroke="#f472b6" // pink-400
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />
          )}

          {/* 5. Interactive Crosshair Lines (TradingView look) */}
          {showCrosshair && (
            <g>
              {/* Vertical Snapping Line */}
              {hoveredIndex !== null && (
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={dimensions.height - padding.bottom}
                  stroke="#475569"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
              )}

              {/* Horizontal Hover Line */}
              {mousePos.y >= padding.top && mousePos.y <= dimensions.height - padding.bottom && (
                <g>
                  <line
                    x1={padding.left}
                    y1={mousePos.y}
                    x2={dimensions.width - padding.right}
                    y2={mousePos.y}
                    stroke="#475569"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  {/* Floating Price Tooltip Tag on Y-axis */}
                  <rect
                    x={dimensions.width - padding.right}
                    y={mousePos.y - 9}
                    width={50}
                    height={18}
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth={1}
                    rx={2}
                  />
                  <text
                    x={dimensions.width - padding.right + 6}
                    y={mousePos.y + 3}
                    fill="#ffffff"
                    fontSize={9}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {getValueFromY(mousePos.y).toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {showCrosshair && hoveredCandle && hoveredIndex !== null && (
          <div 
            className="absolute bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-lg shadow-xl pointer-events-none text-[11px] font-mono text-slate-200 z-30 shadow-black"
            style={{
              left: `${Math.min(dimensions.width - 170, Math.max(10, getX(hoveredIndex) - 80))}px`,
              top: `${Math.max(10, getY(hoveredCandle.high) - 85)}px`
            }}
          >
            <div className="font-sans font-semibold text-white border-b border-slate-800/60 pb-1 mb-1">
              {hoveredCandle.timeLabel}
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <span>Open:</span>
              <span className="text-right text-white font-semibold">{hoveredCandle.open.toFixed(0)}</span>
              <span>Close:</span>
              <span className="text-right text-white font-semibold">{hoveredCandle.close.toFixed(0)}</span>
              <span>High:</span>
              <span className="text-right text-white font-semibold">{hoveredCandle.high.toFixed(0)}</span>
              <span>Low:</span>
              <span className="text-right text-white font-semibold">{hoveredCandle.low.toFixed(0)}</span>
              
              {hoveredCandle.sma !== undefined && (
                <>
                  <span className="text-sky-400">SMA:</span>
                  <span className="text-right text-sky-400 font-semibold">{hoveredCandle.sma.toFixed(0)}</span>
                </>
              )}
              {hoveredCandle.ema !== undefined && (
                <>
                  <span className="text-pink-400">EMA:</span>
                  <span className="text-right text-pink-400 font-semibold">{hoveredCandle.ema.toFixed(0)}</span>
                </>
              )}

              <span>Volume:</span>
              <span className="text-right text-emerald-400 font-semibold">{hoveredCandle.volume} done</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800/40">
        <span className="flex items-center gap-1.5 font-sans">
          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
          Volume represents daily completed habits. {config?.showIndicators ? "Technical indicators are plotted over close prices." : ""}
        </span>
        <span className="font-sans text-slate-500 hidden sm:inline">
          Y-axis: Index Price
        </span>
      </div>
    </div>
  );
}
