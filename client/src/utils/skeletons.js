// Skeleton blocks mimic the shape of real content so the page feels
// populated before data arrives. Each matches the approximate dimensions
// of the component it replaces.

const shimmerStyle = `
  background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-md);
`;

export const skeletonLine = (width = '100%', height = '16px') =>
    `<div style="${shimmerStyle} width:${width}; height:${height}; margin-bottom:var(--space-2);" aria-hidden="true"></div>`;

export const skeletonCard = () => `
  <div class="card" aria-hidden="true" style="margin-bottom:var(--space-4)">
    ${skeletonLine('60%', '20px')}
    ${skeletonLine('100%', '14px')}
    ${skeletonLine('80%', '14px')}
  </div>
`;

export const skeletonDashboard = () => `
  <div class="content-container" style="padding: var(--space-8) var(--space-6)" aria-busy="true" aria-label="Loading dashboard">
    <div style="background:var(--color-surface-2);border-radius:var(--radius-lg);padding:var(--space-5);margin-bottom:var(--space-6)">
      ${skeletonLine('40%', '14px')}
      ${skeletonLine('70%', '18px')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-8)">
      ${[1, 2, 3].map(() => `
        <div class="card">
          ${skeletonLine('50%', '12px')}
          ${skeletonLine('80%', '28px')}
        </div>
      `).join('')}
    </div>
    ${skeletonLine('30%', '20px')}
    ${skeletonCard()}
    ${skeletonCard()}
  </div>
`;

export const skeletonLesson = () => `
  <div class="lesson-main" style="margin-top:var(--space-8)" aria-busy="true" aria-label="Loading lesson">
    <div style="margin-bottom:var(--space-8)">
      ${skeletonLine('20%', '20px')}
      ${skeletonLine('70%', '36px')}
    </div>
    <div style="background:var(--color-surface-2);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-6)">
      ${skeletonLine('100%', '14px')}
      ${skeletonLine('100%', '14px')}
      ${skeletonLine('60%', '14px')}
    </div>
    ${skeletonCard()}
    ${skeletonCard()}
  </div>
`;