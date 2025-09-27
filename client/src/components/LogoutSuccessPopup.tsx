import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface LogoutSuccessPopupProps {
  show: boolean
  onClose: () => void
}

export default function LogoutSuccessPopup({ show, onClose }: LogoutSuccessPopupProps) {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (show) {
      console.log('Logout popup shown')
      // Auto-close timer and redirect
      const closeTimer = setTimeout(() => {
        console.log('Logout popup auto-closing')
        onClose()
        navigate('/', { replace: true })
      }, 1000)

      return () => {
        clearTimeout(closeTimer)
      }
    }
  }, [show, onClose, navigate])

  console.log('LogoutSuccessPopup render - show:', show)
  
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
            Logged out successfully
          </p>
        </div>
      </div>
    </div>
  )
}
