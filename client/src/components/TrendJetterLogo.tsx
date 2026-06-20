interface LogoProps {
  color?: string;
  height?: number;
  iconOnly?: boolean;
}

export default function TrendJetterLogo({ color = 'currentColor', height = 28, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    // Just the # mark — for favicons, mobile nav, tight spaces
    const w = height * (50 / 68);
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 70"
        width={w}
        height={height}
        fill="none"
        aria-label="TrendJetter"
      >
        <polygon points="13,4 23,4 15,64 5,64" fill={color} />
        <polygon points="33,4 43,4 35,64 25,64" fill={color} />
        <rect x="1" y="15" width="47" height="10" fill={color} />
        <rect x="1" y="43" width="47" height="10" fill={color} />
      </svg>
    );
  }

  // Full lockup — icon + wordmark
  // viewBox 400×68, aspect ratio ~5.88:1
  const w = height * (400 / 68);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 68"
      width={w}
      height={height}
      fill="none"
      aria-label="TrendJetter"
    >
      {/* Left vertical */}
      <polygon points="13,4 23,4 15,64 5,64" fill={color} />
      {/* Right vertical */}
      <polygon points="33,4 43,4 35,64 25,64" fill={color} />
      {/* Top horizontal */}
      <rect x="1" y="15" width="47" height="10" fill={color} />
      {/* Bottom horizontal */}
      <rect x="1" y="43" width="47" height="10" fill={color} />
      {/* Wordmark */}
      <text
        x="60"
        y="50"
        fontFamily="'Inter Tight', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="42"
        letterSpacing="-1.8"
        fill={color}
      >
        trendjetter
      </text>
    </svg>
  );
}
