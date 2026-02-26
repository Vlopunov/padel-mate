import React from 'react';
import { COLORS } from '../../config';

export function Select({ label, value, onChange, options, placeholder, style }) {
  const selectStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%237A8299' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
    ...style,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: COLORS.textDim, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: COLORS.card, color: COLORS.text }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
