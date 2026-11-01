/**
 * Original decorative coastal scene (headlands and waves) drawn in the club colours.
 * It stands in for photography until the club supplies photos it has the right to use.
 */
export function CoastalArt() {
  return (
    <svg className="coastal-art" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path
        d="M0 214 C90 170 170 150 270 176 C340 194 380 214 450 200 C520 186 560 150 640 146 C720 142 780 176 840 222 C870 245 890 268 910 292 L910 360 L0 360 Z"
        fill="var(--primary)"
        opacity="0.16"
      />
      <path
        d="M930 300 C960 262 1000 232 1060 208 C1130 180 1200 190 1270 206 C1340 222 1390 214 1440 190 L1440 360 L930 360 Z"
        fill="var(--primary)"
        opacity="0.2"
      />
      <path
        d="M0 252 C150 222 300 286 470 256 C640 226 800 288 980 256 C1150 226 1290 262 1440 246 L1440 360 L0 360 Z"
        fill="var(--tint)"
        opacity="0.95"
      />
      <path
        d="M0 284 C170 258 330 316 520 288 C700 262 860 318 1050 290 C1210 266 1330 296 1440 282 L1440 360 L0 360 Z"
        fill="var(--primary)"
        opacity="0.38"
      />
      <path
        d="M0 318 C190 298 360 340 560 322 C760 304 920 344 1120 322 C1260 308 1360 326 1440 316 L1440 360 L0 360 Z"
        fill="#ffffff"
      />
    </svg>
  );
}
