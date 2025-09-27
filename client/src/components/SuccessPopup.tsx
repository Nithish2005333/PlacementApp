import React, { useEffect } from 'react'

interface SuccessPopupProps {
  show: boolean
  onClose: () => void
  message: string
  autoHideDelay?: number // in milliseconds, default 2000ms
}

export default function SuccessPopup({ show, onClose, message, autoHideDelay = 2000 }: SuccessPopupProps) {
  useEffect(() => {
    if (show) {
      console.log('Success popup shown:', message)
      // Auto-close timer
      const closeTimer = setTimeout(() => {
        console.log('Success popup auto-closing')
        onClose()
      }, autoHideDelay)

      return () => {
        clearTimeout(closeTimer)
      }
    }
  }, [show, onClose, message, autoHideDelay])

  console.log('SuccessPopup render - show:', show, 'message:', message)
  
  if (!show) return null

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '0.75rem',
        pointerEvents: 'none'
      }}
    >
      <div 
        style={{
          backgroundColor: '#1f1f1f',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          border: '2px solid #10b981',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '240px',
          maxWidth: '320px',
          width: '100%',
          transform: 'translate(0, 0)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: 'auto'
        }}
      >
        <div 
          style={{
            width: '1.5rem',
            height: '1.5rem',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ 
            color: '#f3f4f6', 
            fontSize: '0.8rem', 
            fontWeight: '500', 
            margin: 0,
            lineHeight: '1.2rem',
            wordWrap: 'break-word'
          }}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#f3f4f6',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '0',
            marginLeft: '0.5rem',
            flexShrink: 0
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
