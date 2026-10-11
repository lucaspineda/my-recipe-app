import { useId } from 'react';

const petal = 'M24 24 Q31 14 24 5 Q17 14 24 24 Z';

// Hydraulic floor tile (ladrilho hidráulico) pattern in the brand colors.
// Corner circles are drawn on each tile's corners so four neighbours complete them.
export default function Ladrilho({ size = 56, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');

  return (
    <svg aria-hidden="true" className={className} width="100%" height="100%">
      <defs>
        <pattern id={`ladrilho-${id}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <g transform={`scale(${size / 48})`}>
            <rect width="48" height="48" fill="#0f6374" />
            {[
              [0, 0],
              [48, 0],
              [0, 48],
              [48, 48],
            ].map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="13" fill="#f6e8d3" />
                <circle cx={cx} cy={cy} r="9.5" fill="#0f6374" />
                <circle cx={cx} cy={cy} r="4" fill="#f6af4c" />
              </g>
            ))}
            {[0, 90, 180, 270].map((angle) => (
              <path key={angle} d={petal} fill="#f6e8d3" transform={`rotate(${angle} 24 24)`} />
            ))}
            {[45, 135, 225, 315].map((angle) => (
              <circle key={angle} cx="24" cy="12" r="1.8" fill="#f6af4c" transform={`rotate(${angle} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="3.5" fill="#f6af4c" />
            <rect width="48" height="48" fill="none" stroke="#0a4c59" strokeWidth="0.8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#ladrilho-${id})`} />
    </svg>
  );
}
