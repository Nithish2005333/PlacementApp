import React, { useEffect, useRef, useState } from 'react'

interface OTPInputProps {
  value: string
  onChange: (next: string) => void
  length?: number
  disabled?: boolean
  cellClassName?: string
  containerClassName?: string
  hasError?: boolean
  onError?: (hasError: boolean) => void
}

export default function OTPInput({ 
  value, 
  onChange, 
  length = 6, 
  disabled, 
  cellClassName = '', 
  containerClassName = '',
  hasError = false,
  onError
}: OTPInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length)
  }, [length])

  const normalized = (value || '').toString().replace(/\D/g, '').slice(0, length)
  const digits = normalized.padEnd(length, '').split('')

  // Auto-focus first empty field (left to right) - only when value changes
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex(digit => !digit)
    if (firstEmptyIndex !== -1) {
      setFocusedIndex(firstEmptyIndex)
      // Use multiple approaches for better mobile focus
      setTimeout(() => {
        inputsRef.current[firstEmptyIndex]?.focus()
      }, 50)
      setTimeout(() => {
        inputsRef.current[firstEmptyIndex]?.focus()
      }, 150)
    }
    // Don't auto-focus when all fields are filled - let user control focus
  }, [digits, length])


  const handleInputChange = (idx: number, inputValue: string) => {
    const v = inputValue.replace(/\D/g, '').slice(-1)
              const before = normalized.slice(0, idx)
              const after = normalized.slice(idx + 1)
              const next = (before + v + after).slice(0, length)
              onChange(next)
    
    // Clear error when user starts typing
    if (onError && hasError) {
      onError(false)
    }
    
    // Auto-advance to next field - improved for mobile
    if (v && idx < length - 1) {
      // Use setTimeout for better mobile compatibility
      setTimeout(() => {
        const nextInput = inputsRef.current[idx + 1]
        if (nextInput) {
          nextInput.focus()
          setFocusedIndex(idx + 1)
        }
      }, 10)
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
              if (e.key === 'Backspace') {
                if (!digits[idx]) {
                  const prev = Math.max(0, idx - 1)
                  inputsRef.current[prev]?.focus()
        setFocusedIndex(prev)
                } else {
                  const before = normalized.slice(0, idx)
                  const after = normalized.slice(idx + 1)
                  const next = (before + '' + after).slice(0, length)
                  onChange(next)
                }
                e.preventDefault()
              } else if (e.key === 'ArrowLeft') {
      const prev = Math.max(0, idx - 1)
      inputsRef.current[prev]?.focus()
      setFocusedIndex(prev)
                e.preventDefault()
              } else if (e.key === 'ArrowRight') {
      const next = Math.min(length - 1, idx + 1)
      inputsRef.current[next]?.focus()
      setFocusedIndex(next)
                e.preventDefault()
              }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
              const data = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
              if (data) {
                onChange(data.slice(0, length))
      const focusIndex = Math.min(length - 1, data.length - 1)
      inputsRef.current[focusIndex]?.focus()
      setFocusedIndex(focusIndex)
                e.preventDefault()
    }
  }

  const handleFocus = (idx: number) => {
    setFocusedIndex(idx)
  }

  return (
    <>
      {/* Mobile Layout - Same functionality as PC but with dash design */}
      <div className={`otp-dash-container sm:hidden flex gap-2 sm:gap-4 justify-center items-center max-w-full px-2 ${containerClassName}`}>
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digits[idx] || ''}
            onChange={(e) => handleInputChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(idx)}
            className={`
              ultra-simple-otp w-12 sm:w-14 h-14 sm:h-16 text-center text-white font-bold text-2xl sm:text-3xl
              bg-transparent border-0 border-b-3 sm:border-b-4 transition-all duration-200
              focus:outline-none focus:border-blue-500 focus:scale-105
              ${hasError ? 'border-red-500 text-red-500' : 'border-gray-400'}
              ${focusedIndex === idx ? 'border-blue-500' : ''}
              ${cellClassName}
            `}
            style={{
              fontFamily: 'monospace',
              caretColor: '#3b82f6',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield',
              textAlign: 'center',
              lineHeight: '1',
              padding: '0',
              margin: '0',
              color: hasError ? '#ef4444' : '#ffffff',
              minWidth: '44px', // Ensure touch-friendly size
              minHeight: '44px'
            }}
          />
        ))}
      </div>

      {/* Desktop Layout - Box Style */}
      <div className={`otp-box-container hidden sm:flex gap-3 justify-center items-center ${containerClassName}`}>
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            inputMode="numeric"
            type="tel"
            disabled={disabled}
            value={digits[idx] || ''}
            onChange={(e) => handleInputChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(idx)}
            className={`
              otp-box-input w-12 h-12 text-center rounded-lg bg-neutral-800 border-2 border-neutral-700 text-white text-2xl font-bold 
              focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200
              ${hasError ? 'border-red-500 text-red-500' : 'border-neutral-700'}
              ${focusedIndex === idx ? 'border-sky-500' : ''}
              ${cellClassName}
            `}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              padding: '0',
              textRendering: 'optimizeLegibility',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield',
              caretColor: '#0ea5e9'
            }}
          />
        ))}
      </div>
    </>
  )
}


