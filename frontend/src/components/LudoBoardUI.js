import React, { useMemo, useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export const LUDO_RAVE_THEME = {
  screenBg: '#070714',
  boardBg: '#09081B',
  boardBgDeep: '#0D0B21',
  tileBg: '#0B091E',
  tileInnerBg: '#100D29',
  tileBorder: '#2B1E54',
  houses: [
    {
      idx: 0,
      name: 'Pink',
      color: '#FF007F',
      bright: '#FF7CC2',
      mid: '#C90066',
      tint: 'rgba(255, 0, 127, 0.28)',
      stretchTint: 'rgba(255, 0, 127, 0.85)',
    },
    {
      idx: 1,
      name: 'Cyan',
      color: '#00FFFF',
      bright: '#96FFFF',
      mid: '#00A8BE',
      tint: 'rgba(0, 255, 255, 0.24)',
      stretchTint: 'rgba(0, 255, 255, 0.85)',
    },
    {
      idx: 2,
      name: 'Yellow',
      color: '#FFD700',
      bright: '#FFF48F',
      mid: '#E0A800',
      tint: 'rgba(255, 215, 0, 0.30)',
      stretchTint: 'rgba(255, 215, 0, 0.88)',
    },
    {
      idx: 3,
      name: 'Green',
      color: '#39FF14',
      bright: '#A2FF8E',
      mid: '#1CB800',
      tint: 'rgba(57, 255, 20, 0.25)',
      stretchTint: 'rgba(57, 255, 20, 0.85)',
    },
  ],
};

export const LUDO_STACK_OFFSETS = [
  { x: -0.22, y: -0.22 },
  { x: 0.22, y: 0.22 },
  { x: -0.22, y: 0.22 },
  { x: 0.22, y: -0.22 },
];

export const LUDO_MID_SAFE_STAR_COLORS = {
  '8_2': '#FF007F',
  '8_3': '#FF007F',
  '2_6': '#FFD700',
  '3_6': '#FFD700',
  '6_11': '#39FF14',
  '6_12': '#39FF14',
  '11_8': '#FFD700',
  '12_8': '#FFD700',
};

const ARROW_ROTATIONS = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

const buildStarPoints = (cx = 50, cy = 50, outerR = 42, innerR = 18.5) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
};

const SAFE_STAR_POINTS = buildStarPoints(50, 50, 38, 16.5);
const TOKEN_OUTER_STAR_POINTS = buildStarPoints(50, 50, 41, 19);
const TOKEN_INNER_STAR_POINTS = buildStarPoints(50, 50, 21.5, 10.5);

export const LudoSafeStar = React.memo(({ size, color = '#FFD700', onColoredTile = false }) => {
  const strokeColor = onColoredTile ? '#FFFFFF' : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Polygon
        points={SAFE_STAR_POINTS}
        fill="none"
        stroke={color}
        strokeWidth={13}
        strokeOpacity={0.38}
        strokeLinejoin="round"
      />
      <Polygon
        points={SAFE_STAR_POINTS}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeOpacity={0.72}
        strokeLinejoin="round"
      />
      <Polygon
        points={SAFE_STAR_POINTS}
        fill={onColoredTile ? 'rgba(7,7,20,0.34)' : 'rgba(7,7,20,0.22)'}
        stroke={strokeColor}
        strokeWidth={4.4}
        strokeOpacity={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export const LudoDirectionArrow = React.memo(({ direction = 'up', size, color }) => {
  const rot = ARROW_ROTATIONS[direction] || 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <G transform={`rotate(${rot} 50 50)`}>
        <Path
          d="M50 82 L50 22 M25 46 L50 20 L75 46"
          fill="none"
          stroke={color}
          strokeWidth={18}
          strokeOpacity={0.28}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M50 82 L50 22 M25 46 L50 20 L75 46"
          fill="none"
          stroke={color}
          strokeWidth={10.5}
          strokeOpacity={0.96}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M50 80 L50 23 M26 45 L50 21 L74 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3.4}
          strokeOpacity={0.78}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
});

export const NeonStarToken = React.memo(({ color = '#FF007F', size, isMovable = false }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `starCore_${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <Stop offset="45%" stopColor={color} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      {isMovable && (
        <Circle
          cx="50"
          cy="50"
          r="45.5"
          fill={color}
          fillOpacity="0.18"
          stroke="#FFFFFF"
          strokeOpacity="0.92"
          strokeWidth="4"
        />
      )}
      <Polygon
        points={TOKEN_OUTER_STAR_POINTS}
        fill="none"
        stroke="#05040E"
        strokeWidth={isMovable ? 9.5 : 8}
        strokeLinejoin="round"
      />
      <Polygon
        points={TOKEN_OUTER_STAR_POINTS}
        fill="none"
        stroke={color}
        strokeOpacity={isMovable ? 0.65 : 0.34}
        strokeWidth={isMovable ? 11 : 5}
        strokeLinejoin="round"
      />
      <Polygon
        points={TOKEN_OUTER_STAR_POINTS}
        fill={`url(#${gradId})`}
        stroke={isMovable ? '#FFFFFF' : '#E8E4FF'}
        strokeOpacity={isMovable ? 0.96 : 0.52}
        strokeWidth={isMovable ? 3.2 : 1.8}
        strokeLinejoin="round"
      />
      <Polygon
        points={TOKEN_INNER_STAR_POINTS}
        fill="#FFFFFF"
        fillOpacity={isMovable ? 0.88 : 0.72}
      />
      <Circle cx="50" cy="50" r="6.5" fill="#FFFFFF" fillOpacity="0.95" />
    </Svg>
  );
});

const EQU_WEIGHTS = [54, 42, 30, 18];

export const LudoHomeBase = React.memo(({
  color,
  size,
  top,
  left,
  label,
  avatarEmoji,
  isActive = false,
  renderPadContent,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bgGradId = `hbBg_${uid}`;
  const padCenters = useMemo(() => [
    { id: 0, cx: 45, cy: 45, topPct: '25%', leftPct: '25%' },
    { id: 1, cx: 135, cy: 45, topPct: '25%', leftPct: '75%' },
    { id: 2, cx: 45, cy: 135, topPct: '75%', leftPct: '25%' },
    { id: 3, cx: 135, cy: 135, topPct: '75%', leftPct: '75%' },
  ], []);

  const padInteractiveSize = size * 0.22;

  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        zIndex: 1,
        overflow: 'hidden',
      }}
      pointerEvents="box-none"
    >
      <Svg width={size} height={size} viewBox="0 0 180 180" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgLinearGradient id={bgGradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#070714" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0D0B21" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Deep midnight-ultraviolet panel */}
        <Rect x="2" y="2" width="176" height="176" rx="18" fill={`url(#${bgGradId})`} />

        {/* Subtle inner neon radial wash */}
        <Rect x="10" y="10" width="160" height="160" rx="14" fill={color} fillOpacity={isActive ? 0.08 : 0.03} />

        {/* Outer glow bloom + double-lined neon tube border */}
        <Rect
          x="7"
          y="7"
          width="166"
          height="166"
          rx="16"
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 8 : 5.5}
          strokeOpacity={isActive ? 0.42 : 0.2}
        />
        <Rect
          x="7"
          y="7"
          width="166"
          height="166"
          rx="16"
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 3.2 : 2.5}
          strokeOpacity={isActive ? 1 : 0.88}
        />
        <Rect
          x="7"
          y="7"
          width="166"
          height="166"
          rx="16"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.9"
          strokeOpacity={isActive ? 0.72 : 0.42}
        />
        <Rect
          x="13.5"
          y="13.5"
          width="153"
          height="153"
          rx="12"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeOpacity={isActive ? 0.92 : 0.65}
        />

        {/* Rave chevron frame ticks along top & bottom rails */}
        {[48, 53, 58, 122, 127, 132].map((xPos, idx) => (
          <React.Fragment key={`ht_${idx}`}>
            <Line x1={xPos} y1="7.5" x2={xPos + (xPos < 90 ? 3 : -3)} y2="13" stroke={color} strokeWidth="1.4" strokeOpacity="0.7" />
            <Line x1={xPos} y1="172.5" x2={xPos + (xPos < 90 ? 3 : -3)} y2="167" stroke={color} strokeWidth="1.4" strokeOpacity="0.7" />
          </React.Fragment>
        ))}

        {/* Geometric rave equalizer spectrum bars on all 4 inner edges */}
        {EQU_WEIGHTS.map((len, i) => {
          const offset = 20 + i * 3.8;
          const op = (0.55 - i * 0.08).toFixed(2);
          const half = len / 2;
          return (
            <React.Fragment key={`eq_${i}`}>
              {/* Top & Bottom */}
              <Line x1={90 - half} y1={offset} x2={90 + half} y2={offset} stroke={color} strokeWidth="1.4" strokeOpacity={op} strokeLinecap="round" />
              <Line x1={90 - half} y1={180 - offset} x2={90 + half} y2={180 - offset} stroke={color} strokeWidth="1.4" strokeOpacity={op} strokeLinecap="round" />
              {/* Left & Right */}
              <Line x1={offset} y1={90 - half} x2={offset} y2={90 + half} stroke={color} strokeWidth="1.4" strokeOpacity={op} strokeLinecap="round" />
              <Line x1={180 - offset} y1={90 - half} x2={180 - offset} y2={90 + half} stroke={color} strokeWidth="1.4" strokeOpacity={op} strokeLinecap="round" />
            </React.Fragment>
          );
        })}

        {/* Subtle diamond crosshair accent in base center */}
        <Polygon
          points="90,82 98,90 90,98 82,90"
          fill="none"
          stroke={color}
          strokeWidth="1.1"
          strokeOpacity="0.28"
        />

        {/* 4 Circular 2x2 Token Pads — strictly matching this base's house color */}
        {padCenters.map(pad => (
          <React.Fragment key={pad.id}>
            <Circle cx={pad.cx} cy={pad.cy} r="20.5" fill="none" stroke={color} strokeWidth="6" strokeOpacity="0.24" />
            <Circle cx={pad.cx} cy={pad.cy} r="17.5" fill="#060512" stroke={color} strokeWidth="2.8" strokeOpacity="0.96" />
            <Circle cx={pad.cx} cy={pad.cy} r="16.2" fill="none" stroke="#FFFFFF" strokeWidth="0.9" strokeOpacity="0.52" />
            <Circle cx={pad.cx} cy={pad.cy} r="8.5" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
          </React.Fragment>
        ))}
      </Svg>

      {/* Optional interactive token slots aligned over each 2x2 pad (used by OnlineLudoScreen) */}
      {renderPadContent && padCenters.map(pad => (
        <View
          key={`slot_${pad.id}`}
          style={{
            position: 'absolute',
            top: pad.topPct,
            left: pad.leftPct,
            width: padInteractiveSize,
            height: padInteractiveSize,
            marginLeft: -padInteractiveSize / 2,
            marginTop: -padInteractiveSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          {renderPadContent(pad.id, padInteractiveSize)}
        </View>
      ))}

      {/* Compact player name / seat label pill along bottom rim */}
      {(label || avatarEmoji) ? (
        <View
          style={{
            position: 'absolute',
            bottom: 3,
            left: 8,
            right: 8,
            alignItems: 'center',
            zIndex: 3,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              backgroundColor: 'rgba(7, 7, 20, 0.9)',
              borderWidth: 1,
              borderColor: isActive ? color : `${color}77`,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 6,
            }}
          >
            {avatarEmoji ? <Text style={{ fontSize: 10 }}>{avatarEmoji}</Text> : null}
            {label ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 9,
                  fontWeight: 'bold',
                  color,
                  letterSpacing: 0.3,
                  maxWidth: size * 0.72,
                }}
              >
                {label}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
});

const CHEVRON_STEPS = [0.22, 0.42, 0.62, 0.79];

const lerpPt = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const buildChevronPath = (c1, c2, apex, t) => {
  const p1 = lerpPt(c1, apex, t);
  const p2 = lerpPt(c2, apex, t);
  const tip = lerpPt([(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2], apex, t + 0.16);
  return `M${p1[0].toFixed(1)},${p1[1].toFixed(1)} L${tip[0].toFixed(1)},${tip[1].toFixed(1)} L${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
};

export const LudoCenterGoal = React.memo(({ size, top, left }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const centerCoreId = `ludoCenterCore_${uid}`;
  const triangles = useMemo(() => [
    // Cyan (Left arm): top-left, bottom-left -> center
    { color: '#00FFFF', c1: [2, 3], c2: [2, 117], apex: [60, 60] },
    // Yellow (Top arm): top-left, top-right -> center
    { color: '#FFD700', c1: [3, 2], c2: [117, 2], apex: [60, 60] },
    // Green (Right arm): top-right, bottom-right -> center
    { color: '#39FF14', c1: [118, 3], c2: [118, 117], apex: [60, 60] },
    // Pink (Bottom arm): bottom-left, bottom-right -> center
    { color: '#FF007F', c1: [3, 118], c2: [117, 118], apex: [60, 60] },
  ], []);

  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        backgroundColor: '#070714',
        zIndex: 2,
        overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id={centerCoreId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="24%" stopColor="#F5D0FE" stopOpacity="0.95" />
            <Stop offset="52%" stopColor="#A855F7" stopOpacity="0.52" />
            <Stop offset="100%" stopColor="#070714" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="120" height="120" fill="#070714" />

        {triangles.map((tri, idx) => {
          const outerPts = `${tri.c1[0]},${tri.c1[1]} ${tri.c2[0]},${tri.c2[1]} ${tri.apex[0]},${tri.apex[1]}`;
          const midBase = [(tri.c1[0] + tri.c2[0]) / 2, (tri.c1[1] + tri.c2[1]) / 2];
          return (
            <React.Fragment key={idx}>
              <Polygon points={outerPts} fill={tri.color} fillOpacity="0.22" />
              <Polygon points={outerPts} fill="none" stroke={tri.color} strokeWidth="5.5" strokeOpacity="0.34" strokeLinejoin="round" />
              <Polygon points={outerPts} fill="none" stroke={tri.color} strokeWidth="2.2" strokeOpacity="0.98" strokeLinejoin="round" />
              <Polygon points={outerPts} fill="none" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.45" strokeLinejoin="round" />

              {/* Converging nested neon chevrons */}
              {CHEVRON_STEPS.map((step, sIdx) => (
                <Path
                  key={sIdx}
                  d={buildChevronPath(tri.c1, tri.c2, tri.apex, step)}
                  fill="none"
                  stroke={tri.color}
                  strokeWidth={1.4}
                  strokeOpacity={(0.78 - sIdx * 0.1).toFixed(2)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Center ray inside each triangle */}
              <Line
                x1={midBase[0]}
                y1={midBase[1]}
                x2={tri.apex[0]}
                y2={tri.apex[1]}
                stroke={tri.color}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            </React.Fragment>
          );
        })}

        {/* Central glowing energy core */}
        <Circle cx="60" cy="60" r="24" fill={`url(#${centerCoreId})`} />
        <Circle cx="60" cy="60" r="6" fill="#FFFFFF" fillOpacity="0.98" />
      </Svg>
    </View>
  );
});

export const LudoTrackTile = React.memo(({
  size,
  startColor = null,
  homeColColor = null,
  isSafeStar = false,
  safeStarColor = '#FFD700',
  directionArrow = null, // { direction: 'up'|'right'|'down'|'left', color }
  children,
}) => {
  const houseMatch = homeColColor
    ? LUDO_RAVE_THEME.houses.find(h => h.color.toUpperCase() === homeColColor.toUpperCase())
    : null;
  const startMatch = startColor
    ? LUDO_RAVE_THEME.houses.find(h => h.color.toUpperCase() === startColor.toUpperCase())
    : null;

  const isColored = Boolean(houseMatch || startMatch);
  const borderColor = houseMatch
    ? houseMatch.bright
    : startMatch
      ? startMatch.color
      : LUDO_RAVE_THEME.tileBorder;

  return (
    <View
      style={[
        styles.tileBase,
        {
          width: size,
          height: size,
          backgroundColor: houseMatch
            ? houseMatch.color
            : startMatch
              ? LUDO_RAVE_THEME.tileBg
              : LUDO_RAVE_THEME.tileBg,
          borderColor,
          borderWidth: isColored ? 1.2 : 0.8,
          shadowColor: houseMatch ? houseMatch.color : startMatch ? startMatch.color : 'transparent',
          shadowOpacity: houseMatch ? 0.65 : startMatch ? 0.45 : 0,
          shadowRadius: houseMatch ? 6 : startMatch ? 4 : 0,
        },
      ]}
    >
      {/* Glassmorphic bevel & inner surface for standard track tiles */}
      {!houseMatch && (
        <View
          style={[
            styles.glassBevel,
            startMatch && {
              backgroundColor: startMatch.tint,
              borderTopColor: 'rgba(255,255,255,0.34)',
              borderLeftColor: 'rgba(255,255,255,0.2)',
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.glassSheen} />
        </View>
      )}

      {/* Luminous backlit gradient fill for 5-tile home stretch */}
      {houseMatch && (
        <LinearGradient
          colors={[houseMatch.bright, houseMatch.color, houseMatch.mid]}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.9, y: 0.95 }}
          style={styles.homeStretchGradient}
          pointerEvents="none"
        >
          <View style={styles.homeStretchCoreGlow} />
        </LinearGradient>
      )}

      {isSafeStar && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.centeredFill}>
            <LudoSafeStar
              size={size * 0.68}
              color={safeStarColor}
              onColoredTile={Boolean(startMatch && startMatch.idx === 2)}
            />
          </View>
        </View>
      )}

      {directionArrow && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.centeredFill}>
            <LudoDirectionArrow
              direction={directionArrow.direction}
              size={size * 0.68}
              color={directionArrow.color}
            />
          </View>
        </View>
      )}

      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  tileBase: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  glassBevel: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: 3,
    backgroundColor: '#0E0C23',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(182, 168, 255, 0.20)',
    borderLeftColor: 'rgba(182, 168, 255, 0.11)',
    borderBottomColor: 'rgba(4, 3, 12, 0.78)',
    borderRightColor: 'rgba(4, 3, 12, 0.58)',
    overflow: 'hidden',
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
  },
  homeStretchGradient: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  homeStretchCoreGlow: {
    flex: 1,
    margin: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderLeftColor: 'rgba(255,255,255,0.28)',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  centeredFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
