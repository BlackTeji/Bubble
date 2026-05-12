export const renderProgressRing = ({
    percentage = 0,
    size = 48,
    strokeWidth = 4,
    color = 'var(--color-brand)',
    label = '',
}) => {
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const center = size / 2;

    return `
    <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="var(--color-surface-3)"
        stroke-width="${strokeWidth}"
      />
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 ${center} ${center})"
        style="transition: stroke-dashoffset var(--duration-slow) var(--ease-spring);"
      />
      ${label ? `<text x="${center}" y="${center + 5}" text-anchor="middle" font-size="${size * 0.22}" font-weight="600" fill="var(--color-text-primary)">${label}</text>` : ''}
    </svg>
  `;
};