// ─────────────────────────────────────────────────────────────
//  SEVEN VALET — Design Tokens
//  Aesthetic: Seven.club x Gray Wellness
//  Cream/off-white on deep black. Editorial. No emojis.
// ─────────────────────────────────────────────────────────────

import { StyleSheet } from "react-native";

export const Colors = {
  // Backgrounds
  bg:           "#080808",
  surface:      "#101010",
  surfaceHigh:  "#181818",
  surfaceRaised:"#202020",

  // Borders
  border:       "rgba(255,255,255,0.06)",
  borderMid:    "rgba(255,255,255,0.10)",
  borderHigh:   "rgba(255,255,255,0.16)",

  // Typography
  text:         "#F2EDE4",       // warm cream — Seven's palette
  textSub:      "#8A8478",       // warm mid-gray
  textMuted:    "#3D3A35",       // dark muted

  // Accent — restrained gold
  gold:         "#C8A96E",
  goldLight:    "#DEC08A",
  goldMuted:    "rgba(200,169,110,0.12)",
  goldBorder:   "rgba(200,169,110,0.25)",

  // Status — desaturated, refined
  green:        "#6BAF8A",
  greenMuted:   "rgba(107,175,138,0.12)",
  greenBorder:  "rgba(107,175,138,0.25)",

  red:          "#B87070",
  redMuted:     "rgba(184,112,112,0.12)",
  redBorder:    "rgba(184,112,112,0.25)",

  blue:         "#7A9EBF",
  blueMuted:    "rgba(122,158,191,0.12)",
  blueBorder:   "rgba(122,158,191,0.25)",

  amber:        "#C4975A",
  amberMuted:   "rgba(196,151,90,0.12)",
  amberBorder:  "rgba(196,151,90,0.25)",

  stone:        "#6B6560",
  stoneMuted:   "rgba(107,101,96,0.15)",
};

export const STATUS_CONFIG = {
  pending:    { label: "Requested",  color: Colors.amber, bg: Colors.amberMuted, border: Colors.amberBorder, icon: "⏳" },
  accepted:   { label: "Accepted",   color: Colors.blue,  bg: Colors.blueMuted,  border: Colors.blueBorder,  icon: "✓"  },
  parking:    { label: "Parking",    color: Colors.gold,  bg: Colors.goldMuted,  border: Colors.goldBorder,  icon: "🚗" },
  parked:     { label: "Parked",     color: Colors.green, bg: Colors.greenMuted, border: Colors.greenBorder, icon: "P"  },
  retrieving: { label: "Retrieving", color: Colors.blue,  bg: Colors.blueMuted,  border: Colors.blueBorder,  icon: "↑"  },
  ready:      { label: "Ready",      color: Colors.green, bg: Colors.greenMuted, border: Colors.greenBorder, icon: "✓"  },
  completed:  { label: "Completed",  color: Colors.stone, bg: Colors.stoneMuted, border: "rgba(107,101,96,0.2)", icon: "—" },
};

export const ROLE_CONFIG = {
  Driver:      { label: "Valet Driver",  color: Colors.blue  },
  "Team Leader":{ label: "Team Leader",  color: Colors.gold  },
  Admin:       { label: "Administrator", color: Colors.green  },
  // lowercase aliases for internal use
  driver:      { label: "Valet Driver",  color: Colors.blue  },
  leader:      { label: "Team Leader",   color: Colors.gold  },
  admin:       { label: "Administrator", color: Colors.green  },
};

export const Typography = StyleSheet.create({
  display:  { fontSize: 32, fontWeight: "300", color: Colors.text,    letterSpacing: -0.5 },
  heading1: { fontSize: 24, fontWeight: "300", color: Colors.text,    letterSpacing: -0.3 },
  heading2: { fontSize: 18, fontWeight: "400", color: Colors.text,    letterSpacing: -0.2 },
  heading3: { fontSize: 15, fontWeight: "500", color: Colors.text                        },
  body:     { fontSize: 14, fontWeight: "400", color: Colors.text                        },
  bodySmall:{ fontSize: 13, fontWeight: "400", color: Colors.textSub                     },
  label:    { fontSize: 10, fontWeight: "600", color: Colors.textMuted, letterSpacing: 1.5, textTransform: "uppercase" as const },
  caption:  { fontSize: 11, fontWeight: "400", color: Colors.textMuted                   },
  mono:     { fontSize: 13, fontWeight: "400", color: Colors.textSub,  letterSpacing: 0.5 },
});

export const Radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 };
export const Space  = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };
