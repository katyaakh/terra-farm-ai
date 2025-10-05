interface TerranautAvatarProps {
  className?: string;
}

const TerranautAvatar = ({ className = "" }: TerranautAvatarProps) => {
  return (
    <div className={`rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ${className}`}>
      <span className="text-primary-foreground font-bold text-sm">T</span>
    </div>
  );
};

export default TerranautAvatar;