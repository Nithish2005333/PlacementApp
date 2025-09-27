import React from 'react'

type FooterProps = {
	fixed?: boolean
}

export default function Footer({ fixed = false }: FooterProps) {
	const year = new Date().getFullYear()
	const baseStyle: React.CSSProperties = {
		width: '100%',
		padding: '12px 16px',
		textAlign: 'center',
		color: '#9ca3af',
		fontSize: 12,
	}
	const fixedStyle: React.CSSProperties = fixed
		? { position: 'fixed', left: 0, right: 0, bottom: 0, background: 'transparent', zIndex: 30 }
		: {}

	return (
		<footer style={{ ...baseStyle, ...fixedStyle }}>
			<span className="hidden sm:inline">Created by Nithishwaran • © {year} AURCC. All rights reserved.</span>
			<span className="sm:hidden" style={{ fontSize: 11, lineHeight: 1.25 }}>Created by Nithishwaran • © {year} AURCC • All rights reserved</span>
		</footer>
	)
}


