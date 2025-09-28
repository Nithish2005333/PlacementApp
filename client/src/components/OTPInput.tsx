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
    <>
      {/* Mobile Layout - 2 rows of 3 inputs each */}
      <div className={`otp-container-mobile sm:hidden grid grid-cols-3 gap-3 justify-center items-center max-w-full ${containerClassName}`}>
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
            className={`otp-cell w-16 h-16 text-center rounded-lg bg-neutral-800 border-2 border-neutral-700 text-white text-xl font-bold caret-transparent focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 ${cellClassName}`}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              padding: '0',
              textRendering: 'optimizeLegibility',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
            onFocus={(e)=>{ 
              e.currentTarget.style.borderColor = '#22d3ee'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onBlur={(e)=>{ 
              e.currentTarget.style.borderColor = '#3f3f46'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
        ))}
      </div>

      {/* Desktop Layout - Original horizontal style */}
      <div className={`otp-container-desktop hidden sm:flex gap-3 justify-center items-center ${containerClassName}`}>
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
            className={`otp-cell w-12 h-12 text-center rounded-lg bg-neutral-800 border-2 border-neutral-700 text-white text-2xl font-bold caret-transparent focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 ${cellClassName}`}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              padding: '0',
              textRendering: 'optimizeLegibility',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
            onFocus={(e)=>{ 
              e.currentTarget.style.borderColor = '#22d3ee'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onBlur={(e)=>{ 
              e.currentTarget.style.borderColor = '#3f3f46'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
        ))}
      </div>
    </>
  )
}


