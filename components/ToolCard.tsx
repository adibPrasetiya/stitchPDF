import Link from 'next/link';
import { ReactNode } from 'react';

interface ToolCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
  iconBgColor?: string;
}

export default function ToolCard({
  icon,
  title,
  description,
  href,
  comingSoon = false,
  iconBgColor = '#e3f2fd',
}: ToolCardProps) {
  const CardContent = () => (
    <div className={`tool-card ${comingSoon ? 'tool-card-disabled' : ''}`}>
      {comingSoon && (
        <div className="tool-card-badge">
          <span className="badge bg-warning text-dark">Coming Soon</span>
        </div>
      )}
      <div className="tool-card-icon" style={{ backgroundColor: iconBgColor }}>
        {icon}
      </div>
      <h5 className="tool-card-title">{title}</h5>
      <p className="tool-card-description">{description}</p>
    </div>
  );

  if (comingSoon || !href) {
    return <CardContent />;
  }

  return (
    <Link href={href} className="text-decoration-none">
      <CardContent />
    </Link>
  );
}
