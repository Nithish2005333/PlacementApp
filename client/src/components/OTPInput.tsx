import React, { useEffect, useRef } from 'react'

interface OTPInputProps {
  value: string
  onChange: (next: string) => void
  length?: number
  disabled?: boolean
  cellClassName?: string
  containerClassName?: string
}

export default function OTPInput({ value, onChange, length = 6, disabled, cellClassName = '', containerClassName = '' }: OTPInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length)
  }, [length])

  const normalized = (value || '').toString().replace(/\D/g, '').slice(0, length)
  const digits = normalized.padEnd(length, '').split('')

  return (
    <div className={`flex gap-2 sm:gap-3 justify-center ${containerClassName}`}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          inputMode="numeric"
          type="tel"
          disabled={disabled}
          value={digits[idx] || ''}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            const before = normalized.slice(0, idx)
            const after = normalized.slice(idx + 1)
            const next = (before + v + after).slice(0, length)
            onChange(next)
            if (v && idx < length - 1) inputsRef.current[idx + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              if (!digits[idx]) {
                const prev = Math.max(0, idx - 1)
                inputsRef.current[prev]?.focus()
              } else {
                const before = normalized.slice(0, idx)
                const after = normalized.slice(idx + 1)
                const next = (before + '' + after).slice(0, length)
                onChange(next)
              }
              e.preventDefault()
            } else if (e.key === 'ArrowLeft') {
              inputsRef.current[Math.max(0, idx - 1)]?.focus()
              e.preventDefault()
            } else if (e.key === 'ArrowRight') {
              inputsRef.current[Math.min(length - 1, idx + 1)]?.focus()
              e.preventDefault()
            }
          }}
          onPaste={(e) => {
            const data = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
            if (data) {
              onChange(data.slice(0, length))
              inputsRef.current[Math.min(length - 1, data.length - 1)]?.focus()
              e.preventDefault()
            }
          }}
          className={`otp-cell w-10 h-10 sm:w-12 sm:h-12 text-center rounded-md bg-neutral-800 border border-neutral-700 text-white text-2xl sm:text-3xl font-semibold caret-transparent focus:outline-none focus:border-sky-500 transition-colors ${cellClassName}`}
          style={{
            fontFamily: 'Roboto Mono, Menlo, Consolas, DejaVu Sans Mono, monospace',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            paddingTop: 0,
            paddingBottom: 0,
            textRendering: 'optimizeLegibility'
          }}
          onFocus={(e)=>{ e.currentTarget.style.borderColor = '#22d3ee' }}
          onBlur={(e)=>{ e.currentTarget.style.borderColor = '#3f3f46' }}
        />
      ))}
    </div>
  )
}


