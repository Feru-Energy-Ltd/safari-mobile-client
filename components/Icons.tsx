// ShieldFlashIcon.jsx
import Svg, { Path, Polygon } from 'react-native-svg';

export default function ShieldFlashIcon({ size = 30, color = '#01B764' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Path
        d="M15 2 L27 6 L27 16 Q27 24 15 29 Q3 24 3 16 L3 6 Z"
        fill={color}
      />
      <Polygon
        points="17,8 11,16 15,16 13,22 19,14 15,14"
        fill="white"
      />
    </Svg>
  );
}