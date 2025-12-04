import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

type LoadingStateType = 'idle' | 'loading' | 'success' | 'error';

interface LoadingButtonProps {
  state: LoadingStateType;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  idleText: string;
  onClick?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  'data-testid'?: string;
}

export function LoadingButton({
  state,
  loadingText = 'Carregando...',
  successText = 'Sucesso!',
  errorText = 'Erro',
  idleText,
  onClick,
  onRetry,
  disabled,
  className,
  variant = 'default',
  size = 'default',
  'data-testid': testId,
}: LoadingButtonProps) {
  const handleClick = () => {
    if (state === 'error' && onRetry) {
      onRetry();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={state === 'error' ? 'destructive' : variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      className={className}
      data-testid={testId}
    >
      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </motion.span>
        )}
        {state === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {successText}
          </motion.span>
        )}
        {state === 'error' && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            {onRetry ? <RefreshCw className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {errorText}
          </motion.span>
        )}
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {idleText}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary`} />
      </motion.div>
      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

interface PulseLoaderProps {
  className?: string;
}

export function PulseLoader({ className }: PulseLoaderProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Carregando...' }: FullPageLoaderProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground"
      >
        {message}
      </motion.p>
    </div>
  );
}

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

export function StatusMessage({ type, message, onDismiss }: StatusMessageProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 rounded-lg border ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

interface ProgressIndicatorProps {
  progress: number;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function ProgressIndicator({
  progress,
  showPercentage = true,
  label,
  className,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
