import React from 'react'

const CircularLoader = ({ size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-spin">
      <circle
        className="text-gray-200"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-blue-500"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
        style={{
          animation: 'dash 1.5s ease-in-out infinite',
          transformOrigin: 'center'
        }}
      />
    </svg>
  )
}

export default CircularLoader
