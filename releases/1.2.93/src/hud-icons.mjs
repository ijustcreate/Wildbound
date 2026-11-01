const paths={
  traps:'M3 7l3 5 3-5 3 5 3-5 3 5 3-5M3 17l3-5 3 5 3-5 3 5 3-5 3 5M4 19h16',
  potions:'M9 3h6M10 3v5l-5 7v5h14v-5l-5-7V3M7 14h10',
  arrows:'M5 20L19 6M13 5h7v7M4 14v6h6',
  dash:'M3 7h7M1 12h7M3 17h7M12 4l9 8-9 8 3-8z',
};
export function hudIcon(kind){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[kind]);svg.append(path);return svg;
}
