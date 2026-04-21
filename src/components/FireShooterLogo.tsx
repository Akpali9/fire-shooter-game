import { Flame } from 'lucide-react';

interface Props {
  className?: string;
  showText?: boolean;
}

export const FireShooterLogo = ({ className = "w-12 h-12", showText = true }: Props) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Flame className={`${className} text-fire-accent animate-glow`} />
        <div className="absolute inset-0 bg-fire-accent blur-xl opacity-30 rounded-full"></div>
      </div>
      {showText && (
        <span className="font-orbitron text-2xl font-bold bg-gradient-fire bg-clip-text text-transparent">
          FIRE SHOOTER
        </span>
      )}
    </div>
  );
};
