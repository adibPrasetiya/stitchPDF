interface AlertProps {
  message: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}

export default function Alert({ message, type = 'info', className = '' }: AlertProps) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type} mt-3 mb-0 ${className}`}>
      {message}
    </div>
  );
}
