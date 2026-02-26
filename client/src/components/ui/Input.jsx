import React from 'react';
import { COLORS } from '../../config';

export function Input({ label, value, onChange, placeholder, type = 'text', style, ...props }) {
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    ...style,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: COLORS.textDim, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = COLORS.accent; }}
        onBlur={(e) => { e.target.style.borderColor = COLORS.border; }}
        {...props}
      />
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, style }) {
  const textareaStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    ...style,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: COLORS.textDim, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={textareaStyle}
        onFocus={(e) => { e.target.style.borderColor = COLORS.accent; }}
        onBlur={(e) => { e.target.style.borderColor = COLORS.border; }}
      />
    </div>
  );
}
