import React from 'react';
import { COLORS } from '../../config';

export function Avatar({ src, name, size = 40, style }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${COLORS.accent}40, ${COLORS.purple}40)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: COLORS.text,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
