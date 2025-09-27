import React, { useEffect } from 'react'

interface FilterSuccessPopupProps {
  show: boolean
  onClose: () => void
}

export default function FilterSuccessPopup({ show, onClose }: FilterSuccessPopupProps) {
  useEffect(() => {
    if (show) {
      console.log('Filter success popup shown')
      // Auto-close timer
      const closeTimer = setTimeout(() => {
        console.log('Filter success popup auto-closing')
        onClose()
      }, 1000)

      return () => {
        clearTimeout(closeTimer)
      }
    }
  }, [show, onClose])

  console.log('FilterSuccessPopup render - show:', show)
  
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
        justifyContent: 'flex-end', // Top-right corner
        padding: '0.75rem', // Reduced padding for mobile
        pointerEvents: 'none' // Allow clicks to pass through overlay
      }}
    >
      <div 
        style={{
          backgroundColor: '#1f1f1f',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem', // Reduced padding for mobile
          border: '2px solid #10b981',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem', // Reduced gap for mobile
          minWidth: '240px', // Min width for mobile
          maxWidth: '320px', // Max width for larger screens
          width: '100%', // Full width on smaller screens
          transform: 'translate(0, 0)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: 'auto' // Allow clicks on the popup itself
        }}
      >
        <div 
          style={{
            width: '1.5rem', // Smaller icon for mobile
            height: '1.5rem', // Smaller icon for mobile
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg
            width="12" // Smaller SVG for mobile
            height="12" // Smaller SVG for mobile
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
        <div style={{ flex: 1, minWidth: 0 }}> {/* Added minWidth: 0 for text wrapping */}
          <p style={{ 
            color: '#f3f4f6', 
            fontSize: '0.8rem', // Smaller font size for mobile
            fontWeight: '500', 
            margin: 0,
            lineHeight: '1.2rem', // Adjusted line height
            wordWrap: 'break-word' // Ensure text wraps
          }}>
            Filters applied successfully!
          </p>
        </div>
      </div>
    </div>
  )
}
