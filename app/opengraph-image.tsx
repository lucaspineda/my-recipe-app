import { ImageResponse } from 'next/og';

// Route segment config
export const alt = 'Chefinho IA - Criador de receitas com IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Brand colors (see tailwind.config.js)
const CREAM = '#f6e8d3';
const TEAL = '#0f6374';
const ORANGE = '#f6af4c';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CREAM,
          fontFamily: 'sans-serif',
          padding: '80px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 24 }}>🍳</div>
        <div style={{ fontSize: 96, fontWeight: 700, color: TEAL, lineHeight: 1.1 }}>
          Chefinho IA
        </div>
        <div style={{ fontSize: 40, color: ORANGE, fontWeight: 600, marginTop: 12 }}>
          Criador de receitas com IA
        </div>
        <div style={{ fontSize: 32, color: TEAL, marginTop: 32, maxWidth: 900 }}>
          Crie receitas com os ingredientes que você já tem em casa, usando o poder da
          Inteligência Artificial!
        </div>
      </div>
    ),
    { ...size },
  );
}
