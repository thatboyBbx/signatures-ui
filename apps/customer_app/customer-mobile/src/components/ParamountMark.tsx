import { SvgXml } from 'react-native-svg';
const mark = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 160 160\"><path fill=\"#fff\" d=\"M138 29c-13 3-22 9-22 21 0 3 1 7 3 11l10-2c-4-8-2-15 8-20z\"/><path fill=\"#fff\" d=\"M102 60c9-7 25-7 34 1 5 4 8 9 7 18-3 24-20 48-41 60-24 14-65 16-94 1-4-2-6-5-3-7 39 2 69-8 83-29 9-14 9-32 14-44z\"/><path d=\"M16 137c38 9 69 0 91-18M102 68c-1 23-11 44-27 55\" stroke=\"#171918\" stroke-opacity=\".25\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/></svg>\n";
export function ParamountMark({ size = 34, color = '#fff' }: { size?: number; color?: string }) {
  return <SvgXml xml={mark.replace(/#fff/g, color)} width={size} height={size} accessibilityLabel="Paramount Signature chilli" />;
}
