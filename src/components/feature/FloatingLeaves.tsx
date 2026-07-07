interface FloatingLeavesProps {
  count?: number;
  className?: string;
}

const animations = ['leaf-float-1', 'leaf-float-2', 'leaf-float-3', 'leaf-float-4', 'leaf-float-5'];
const leafColors = [
  'text-primary-400',
  'text-primary-500',
  'text-accent-500',
  'text-secondary-400',
  'text-primary-600',
];
const leafSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];

export default function FloatingLeaves({ count = 14, className = '' }: FloatingLeavesProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const anim = animations[i % animations.length];
        const color = leafColors[i % leafColors.length];
        const size = leafSizes[i % leafSizes.length];
        const delay = `${(i * 1.7) % 13}s`;
        const left = `${((i * 19 + 7) % 100)}%`;
        return (
          <i
            key={i}
            className={`ri-leaf-fill absolute ${anim} ${color} ${size}`}
            style={{
              left,
              animationDelay: delay,
              top: '-5%',
              opacity: 0,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
            }}
          ></i>
        );
      })}
    </div>
  );
}