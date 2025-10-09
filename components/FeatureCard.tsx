import { ReactNode } from 'react';

interface FeatureCardProps {
  children: ReactNode;
  title: string;
  className?: string;
}

export default function FeatureCard({ children, title, className = '' }: FeatureCardProps) {
  return (
    <div className={`feature-card ${className}`}>
      <h3 className="mb-4">{title}</h3>
      {children}
    </div>
  );
}
