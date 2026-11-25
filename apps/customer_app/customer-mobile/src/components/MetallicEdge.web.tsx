import { createElement } from 'react';
import { useReducedMotion } from './useReducedMotion';

const css = `
@property --paramount-metal-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@keyframes paramount-metal-turn { to { --paramount-metal-angle: 360deg; } }
.paramount-metal-edge { position:absolute; inset:0; border-radius:inherit; padding:2px;
  pointer-events:none; background:#b6a785;
  mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  mask-composite:exclude; -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor; }
.paramount-metal-edge::after { content:''; position:absolute; inset:0; border-radius:inherit;
  opacity:.6; background:conic-gradient(from var(--paramount-metal-angle),
  #c3c6c4 0%, #fffdf2 8%, #9f9f95 16%, #b49044 28%, #ffe1a0 37%, #96713b 46%,
  #f2f4ee 58%, #858e90 67%, #e7e8de 75%, #c8a963 85%, #fff1ce 94%, #c3c6c4 100%);
  animation:paramount-metal-turn 3.6s linear infinite; }
.paramount-metal-edge[data-static=true]::after { animation:none; }
@media (prefers-reduced-motion:reduce) { .paramount-metal-edge::after { animation:none; } }
`;

/** The mask removes the entire interior; neither layer covers the controls. */
export function MetallicEdge({ width: _width, height: _height, active = true }: { width: number; height: number; active?: boolean }) {
  const reduced = useReducedMotion();
  return <>{createElement('style', null, css)}{createElement('div', {
    className: 'paramount-metal-edge', 'data-static': reduced || !active,
    'aria-hidden': true,
  })}</>;
}
