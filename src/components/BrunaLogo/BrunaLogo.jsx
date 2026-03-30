export default function BrunaLogo({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', height: '100%' }}
    >
      {/* Abstract Madonna/Crown Shape on the left */}
      <path d="M110 50 C 110 40, 120 30, 130 30 C 140 30, 150 40, 150 50 L 155 80 L 160 120 C 160 130, 140 150, 120 150 C 100 150, 90 130, 100 120 L 105 80 Z" fill="currentColor" />
      <path d="M120 15 C 120 5, 130 0, 135 5 C 140 10, 130 25, 120 25 Z" fill="currentColor" />
      <path d="M90 120 C 110 120, 130 140, 125 160 C 120 180, 90 180, 80 160 C 70 140, 70 120, 90 120 Z" fill="currentColor" />
      
      {/* Delicate lines and dots to mimic the intricate design */}
      <circle cx="120" cy="55" r="3" fill="var(--night)" />
      <circle cx="140" cy="55" r="3" fill="var(--night)" />
      <path d="M115 80 Q 130 90 140 80" stroke="var(--night)" strokeWidth="2" fill="none" />
      
      {/* Text "FESTA DELLA BRUNA" on the right */}
      <g fontFamily="var(--font-serif)" fontSize="32" fontWeight="600" fill="currentColor" letterSpacing="0.05em">
        <text x="180" y="70">FESTA</text>
        <text x="180" y="110">DELLA</text>
        <text x="180" y="150">BRUNA</text>
      </g>
    </svg>
  );
}
