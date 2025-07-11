// frontend/src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  fullScreen = false,
  message = null,
  overlay = false 
}) => {
  // Configuración de tamaños
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-3',
    '2xl': 'w-16 h-16 border-4'
  };

  // Configuración de colores
  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    secondary: 'border-secondary-600 border-t-transparent',
    success: 'border-success-600 border-t-transparent',
    warning: 'border-warning-600 border-t-transparent',
    danger: 'border-danger-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent'
  };

  // Clases del spinner
  const spinnerClasses = `
    ${sizeClasses[size]} 
    ${colorClasses[color]} 
    rounded-full 
    animate-spin
    ${className}
  `;

  // Componente del spinner básico
  const SpinnerElement = () => (
    <div className={spinnerClasses} />
  );

  // Componente con mensaje
  const SpinnerWithMessage = () => (
    <div className="flex flex-col items-center space-y-3">
      <SpinnerElement />
      {message && (
        <p className={`
          text-sm font-medium
          ${color === 'white' ? 'text-white' : 'text-gray-600'}
        `}>
          {message}
        </p>
      )}
    </div>
  );

  // Spinner de pantalla completa
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          {message && (
            <p className="mt-4 text-lg font-medium text-gray-600">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Spinner con overlay
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
        <SpinnerWithMessage />
      </div>
    );
  }

  // Spinner normal
  if (message) {
    return <SpinnerWithMessage />;
  }

  return <SpinnerElement />;
};

// Variantes predefinidas para casos comunes
export const LoadingSpinnerVariants = {
  // Spinner pequeño para botones
  Button: ({ className = '' }) => (
    <LoadingSpinner 
      size="sm" 
      color="white" 
      className={`mr-2 ${className}`} 
    />
  ),

  // Spinner para inputs
  Input: ({ className = '' }) => (
    <LoadingSpinner 
      size="sm" 
      color="gray" 
      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${className}`} 
    />
  ),

  // Spinner para cards
  Card: ({ message = 'Cargando...' }) => (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner 
        size="lg" 
        color="primary" 
        message={message} 
      />
    </div>
  ),

  // Spinner para páginas completas
  Page: ({ message = 'Cargando página...' }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner 
        size="xl" 
        color="primary" 
        message={message} 
      />
    </div>
  ),

  // Spinner para modales
  Modal: ({ message = 'Procesando...' }) => (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner 
        size="lg" 
        color="primary" 
        message={message} 
      />
    </div>
  ),

  // Spinner inline para texto
  Inline: ({ className = '' }) => (
    <LoadingSpinner 
      size="xs" 
      color="primary" 
      className={`inline-block mr-1 ${className}`} 
    />
  ),

  // Spinner de overlay
  Overlay: ({ message = 'Cargando...' }) => (
    <LoadingSpinner 
      size="lg" 
      color="primary" 
      message={message} 
      overlay={true} 
    />
  )
};

// Spinner pulsante para estados alternativos
export const PulseSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600'
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      ${colorClasses[color]} 
      rounded-full 
      animate-pulse
      ${className}
    `} />
  );
};

// Spinner con puntos
export const DotsSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}) => {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`
        ${dotSizes[size]} 
        ${colorClasses[color]} 
        rounded-full 
        animate-bounce
      `} style={{ animationDelay: '0ms' }} />
      <div className={`
        ${dotSizes[size]} 
        ${colorClasses[color]} 
        rounded-full 
        animate-bounce
      `} style={{ animationDelay: '150ms' }} />
      <div className={`
        ${dotSizes[size]} 
        ${colorClasses[color]} 
        rounded-full 
        animate-bounce
      `} style={{ animationDelay: '300ms' }} />
    </div>
  );
};

// Spinner de barra de progreso
export const ProgressSpinner = ({ 
  progress = 0, 
  size = 'md', 
  color = 'primary',
  showPercentage = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const strokeWidths = {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12
  };

  const radius = 45;
  const strokeWidth = strokeWidths[size];
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary-600',
    secondary: 'stroke-secondary-600',
    success: 'stroke-success-600',
    warning: 'stroke-warning-600',
    danger: 'stroke-danger-600'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Círculo de fondo */}
        <circle
          stroke="currentColor"
          className="text-gray-200"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Círculo de progreso */}
        <circle
          stroke="currentColor"
          className={colorClasses[color]}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;