(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/ModelViewer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ModelViewer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/events-5a94e5eb.esm.js [app-client] (ecmascript) <export D as useFrame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/events-5a94e5eb.esm.js [app-client] (ecmascript) <export C as useThree>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/OrbitControls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/Grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoHelper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/GizmoHelper.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoViewport$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/GizmoViewport.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Center$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/Center.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Environment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/Environment.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function analyzePrompt(prompt) {
    const lower = prompt.toLowerCase();
    let baseColor = "#6b8caf";
    let accentColor = "#3b82f6";
    let metalness = 0.4;
    let roughness = 0.5;
    let scale = 1;
    const parts = [];
    // Color detection
    if (/red/.test(lower)) {
        baseColor = "#dc2626";
        accentColor = "#ef4444";
    } else if (/blue/.test(lower)) {
        baseColor = "#2563eb";
        accentColor = "#60a5fa";
    } else if (/green/.test(lower)) {
        baseColor = "#16a34a";
        accentColor = "#4ade80";
    } else if (/gold|yellow/.test(lower)) {
        baseColor = "#ca8a04";
        accentColor = "#fbbf24";
        metalness = 0.8;
        roughness = 0.2;
    } else if (/purple|violet/.test(lower)) {
        baseColor = "#7c3aed";
        accentColor = "#a78bfa";
    } else if (/pink/.test(lower)) {
        baseColor = "#db2777";
        accentColor = "#f472b6";
    } else if (/orange/.test(lower)) {
        baseColor = "#ea580c";
        accentColor = "#fb923c";
    } else if (/white/.test(lower)) {
        baseColor = "#e2e8f0";
        accentColor = "#f8fafc";
    } else if (/black|dark/.test(lower)) {
        baseColor = "#334155";
        accentColor = "#475569";
    } else if (/silver|metal|chrome/.test(lower)) {
        baseColor = "#94a3b8";
        accentColor = "#cbd5e1";
        metalness = 0.9;
        roughness = 0.1;
    } else if (/wood|wooden/.test(lower)) {
        baseColor = "#92400e";
        accentColor = "#b45309";
        metalness = 0.0;
        roughness = 0.8;
    }
    // ─── HOUSE / BUILDING ───
    if (/house|home|cabin|cottage/.test(lower)) {
        // Main body
        parts.push({
            shape: "box",
            position: [
                0,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.4,
                1.2,
                1.2
            ],
            color: baseColor
        });
        // Roof
        parts.push({
            shape: "cone",
            position: [
                0,
                1.55,
                0
            ],
            rotation: [
                0,
                Math.PI / 4,
                0
            ],
            scale: [
                1.3,
                0.7,
                1.3
            ],
            color: "#78350f",
            args: [
                0.5,
                1,
                4
            ]
        });
        // Door
        parts.push({
            shape: "box",
            position: [
                0,
                0.3,
                0.61
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.3,
                0.5,
                0.04
            ],
            color: "#451a03"
        });
        // Windows
        parts.push({
            shape: "box",
            position: [
                -0.4,
                0.7,
                0.61
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.25,
                0.04
            ],
            color: "#7dd3fc"
        });
        parts.push({
            shape: "box",
            position: [
                0.4,
                0.7,
                0.61
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.25,
                0.04
            ],
            color: "#7dd3fc"
        });
        // Chimney
        parts.push({
            shape: "box",
            position: [
                0.45,
                1.6,
                -0.2
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.2,
                0.5,
                0.2
            ],
            color: "#78716c"
        });
        // Ground/platform
        parts.push({
            shape: "box",
            position: [
                0,
                -0.05,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                2,
                0.1,
                1.8
            ],
            color: "#65a30d"
        });
        scale = 0.9;
    } else if (/castle|tower|fortress|medieval/.test(lower)) {
        // Main tower
        parts.push({
            shape: "cylinder",
            position: [
                0,
                1,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.6,
                2,
                0.6
            ],
            color: "#78716c"
        });
        // Tower top
        parts.push({
            shape: "cone",
            position: [
                0,
                2.3,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.7,
                0.6,
                0.7
            ],
            color: "#dc2626"
        });
        // Side towers
        parts.push({
            shape: "cylinder",
            position: [
                -0.8,
                0.7,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                1.4,
                0.35
            ],
            color: "#a8a29e"
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.8,
                0.7,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                1.4,
                0.35
            ],
            color: "#a8a29e"
        });
        parts.push({
            shape: "cone",
            position: [
                -0.8,
                1.65,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.45,
                0.5,
                0.45
            ],
            color: "#dc2626"
        });
        parts.push({
            shape: "cone",
            position: [
                0.8,
                1.65,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.45,
                0.5,
                0.45
            ],
            color: "#dc2626"
        });
        // Wall
        parts.push({
            shape: "box",
            position: [
                0,
                0.3,
                0.5
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                2,
                0.6,
                0.15
            ],
            color: "#78716c"
        });
        // Gate
        parts.push({
            shape: "box",
            position: [
                0,
                0.2,
                0.58
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.3,
                0.4,
                0.04
            ],
            color: "#451a03"
        });
        scale = 0.7;
    } else if (/temple|shrine|ancient|greek|roman/.test(lower)) {
        // Base platform
        parts.push({
            shape: "box",
            position: [
                0,
                0.05,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                2,
                0.1,
                1.4
            ],
            color: baseColor || "#d4c5a9"
        });
        parts.push({
            shape: "box",
            position: [
                0,
                0.2,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.8,
                0.1,
                1.2
            ],
            color: baseColor || "#d4c5a9"
        });
        // Columns
        for(let x = -0.7; x <= 0.7; x += 0.35){
            parts.push({
                shape: "cylinder",
                position: [
                    x,
                    0.85,
                    0.45
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.08,
                    1.2,
                    0.08
                ],
                color: "#e7e5e4"
            });
            parts.push({
                shape: "cylinder",
                position: [
                    x,
                    0.85,
                    -0.45
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.08,
                    1.2,
                    0.08
                ],
                color: "#e7e5e4"
            });
        }
        // Roof/pediment
        parts.push({
            shape: "box",
            position: [
                0,
                1.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.9,
                0.08,
                1.3
            ],
            color: "#d6d3d1"
        });
        parts.push({
            shape: "cone",
            position: [
                0,
                1.8,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.2,
                0.5,
                0.8
            ],
            args: [
                0.5,
                1,
                3
            ]
        });
        scale = 0.8;
    } else if (/car|sedan|vehicle|automobile|sports car/.test(lower)) {
        // Body
        parts.push({
            shape: "box",
            position: [
                0,
                0.25,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                2,
                0.4,
                0.9
            ],
            color: baseColor,
            metalness: 0.7,
            roughness: 0.2
        });
        // Cabin
        parts.push({
            shape: "box",
            position: [
                0.1,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1,
                0.35,
                0.8
            ],
            color: "#1e293b",
            metalness: 0.3,
            roughness: 0.1
        });
        // Hood slope
        parts.push({
            shape: "box",
            position: [
                -0.65,
                0.4,
                0
            ],
            rotation: [
                0,
                0,
                -0.15
            ],
            scale: [
                0.4,
                0.1,
                0.75
            ],
            color: baseColor,
            metalness: 0.7,
            roughness: 0.2
        });
        // Wheels
        const wheelPositions = [
            [
                -0.6,
                0.05,
                0.5
            ],
            [
                0.6,
                0.05,
                0.5
            ],
            [
                -0.6,
                0.05,
                -0.5
            ],
            [
                0.6,
                0.05,
                -0.5
            ]
        ];
        wheelPositions.forEach((pos)=>{
            parts.push({
                shape: "cylinder",
                position: pos,
                rotation: [
                    Math.PI / 2,
                    0,
                    0
                ],
                scale: [
                    0.2,
                    0.12,
                    0.2
                ],
                color: "#1e293b",
                roughness: 0.8
            });
            parts.push({
                shape: "cylinder",
                position: pos,
                rotation: [
                    Math.PI / 2,
                    0,
                    0
                ],
                scale: [
                    0.12,
                    0.13,
                    0.12
                ],
                color: "#94a3b8",
                metalness: 0.8
            });
        });
        // Headlights
        parts.push({
            shape: "sphere",
            position: [
                -1,
                0.3,
                0.3
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.06,
                0.06
            ],
            color: "#fef08a"
        });
        parts.push({
            shape: "sphere",
            position: [
                -1,
                0.3,
                -0.3
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.06,
                0.06
            ],
            color: "#fef08a"
        });
        // Taillights
        parts.push({
            shape: "sphere",
            position: [
                1,
                0.3,
                0.3
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.06,
                0.06
            ],
            color: "#ef4444"
        });
        parts.push({
            shape: "sphere",
            position: [
                1,
                0.3,
                -0.3
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.06,
                0.06
            ],
            color: "#ef4444"
        });
        scale = 0.8;
    } else if (/truck|lorry|pickup/.test(lower)) {
        // Cab
        parts.push({
            shape: "box",
            position: [
                -0.5,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.8,
                0.7,
                0.9
            ],
            color: baseColor
        });
        // Bed
        parts.push({
            shape: "box",
            position: [
                0.5,
                0.3,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.2,
                0.4,
                0.95
            ],
            color: "#475569"
        });
        // Bed walls
        parts.push({
            shape: "box",
            position: [
                0.5,
                0.55,
                0.45
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.2,
                0.1,
                0.05
            ],
            color: "#475569"
        });
        parts.push({
            shape: "box",
            position: [
                0.5,
                0.55,
                -0.45
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.2,
                0.1,
                0.05
            ],
            color: "#475569"
        });
        // Wheels
        [
            [
                -0.5,
                0.05,
                0.5
            ],
            [
                0.5,
                0.05,
                0.5
            ],
            [
                -0.5,
                0.05,
                -0.5
            ],
            [
                0.5,
                0.05,
                -0.5
            ]
        ].forEach((pos)=>{
            parts.push({
                shape: "cylinder",
                position: pos,
                rotation: [
                    Math.PI / 2,
                    0,
                    0
                ],
                scale: [
                    0.22,
                    0.14,
                    0.22
                ],
                color: "#1e293b"
            });
        });
        scale = 0.8;
    } else if (/rocket|spaceship|spacecraft|shuttle/.test(lower)) {
        // Body
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.8,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                1.8,
                0.35
            ],
            color: "#e2e8f0"
        });
        // Nose cone
        parts.push({
            shape: "cone",
            position: [
                0,
                2.1,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                0.7,
                0.35
            ],
            color: "#dc2626"
        });
        // Fins
        for(let i = 0; i < 4; i++){
            const angle = i * Math.PI / 2;
            const x = Math.sin(angle) * 0.35;
            const z = Math.cos(angle) * 0.35;
            parts.push({
                shape: "box",
                position: [
                    x,
                    0.15,
                    z
                ],
                rotation: [
                    0,
                    angle,
                    0.3
                ],
                scale: [
                    0.02,
                    0.5,
                    0.35
                ],
                color: "#ef4444"
            });
        }
        // Engine nozzle
        parts.push({
            shape: "cylinder",
            position: [
                0,
                -0.15,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.2,
                0.25
            ],
            color: "#475569",
            metalness: 0.8
        });
        // Window
        parts.push({
            shape: "sphere",
            position: [
                0,
                1.4,
                0.33
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.12,
                0.05
            ],
            color: "#38bdf8"
        });
        // Engine flame
        parts.push({
            shape: "cone",
            position: [
                0,
                -0.45,
                0
            ],
            rotation: [
                Math.PI,
                0,
                0
            ],
            scale: [
                0.2,
                0.4,
                0.2
            ],
            color: "#f97316"
        });
        scale = 0.7;
    } else if (/airplane|plane|jet|aircraft/.test(lower)) {
        // Fuselage
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0,
                0
            ],
            rotation: [
                0,
                0,
                Math.PI / 2
            ],
            scale: [
                0.2,
                1.8,
                0.2
            ],
            color: "#e2e8f0"
        });
        // Nose
        parts.push({
            shape: "sphere",
            position: [
                -0.9,
                0,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.2,
                0.2,
                0.2
            ],
            color: "#e2e8f0"
        });
        // Wings
        parts.push({
            shape: "box",
            position: [
                0,
                0,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.04,
                2.2
            ],
            color: "#94a3b8"
        });
        // Tail vertical
        parts.push({
            shape: "box",
            position: [
                0.8,
                0.25,
                0
            ],
            rotation: [
                0,
                0,
                0.3
            ],
            scale: [
                0.3,
                0.4,
                0.04
            ],
            color: accentColor
        });
        // Tail horizontal
        parts.push({
            shape: "box",
            position: [
                0.8,
                0,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.2,
                0.03,
                0.6
            ],
            color: "#94a3b8"
        });
        // Engines
        parts.push({
            shape: "cylinder",
            position: [
                0.1,
                -0.15,
                0.5
            ],
            rotation: [
                0,
                0,
                Math.PI / 2
            ],
            scale: [
                0.1,
                0.3,
                0.1
            ],
            color: "#64748b"
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.1,
                -0.15,
                -0.5
            ],
            rotation: [
                0,
                0,
                Math.PI / 2
            ],
            scale: [
                0.1,
                0.3,
                0.1
            ],
            color: "#64748b"
        });
        // Windows
        parts.push({
            shape: "sphere",
            position: [
                -0.7,
                0.1,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.15,
                0.1,
                0.15
            ],
            color: "#38bdf8"
        });
        scale = 0.7;
    } else if (/boat|ship|yacht|vessel/.test(lower)) {
        // Hull
        parts.push({
            shape: "box",
            position: [
                0,
                0.15,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.8,
                0.3,
                0.7
            ],
            color: baseColor
        });
        // Pointed bow
        parts.push({
            shape: "cone",
            position: [
                -1.1,
                0.15,
                0
            ],
            rotation: [
                0,
                0,
                -Math.PI / 2
            ],
            scale: [
                0.35,
                0.4,
                0.35
            ],
            args: [
                0.5,
                1,
                3
            ],
            color: baseColor
        });
        // Cabin
        parts.push({
            shape: "box",
            position: [
                0.2,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.7,
                0.4,
                0.5
            ],
            color: "#e2e8f0"
        });
        // Mast
        parts.push({
            shape: "cylinder",
            position: [
                -0.2,
                0.9,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.03,
                1.2,
                0.03
            ],
            color: "#78716c"
        });
        // Sail
        parts.push({
            shape: "cone",
            position: [
                -0.2,
                1,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.8,
                0.02
            ],
            args: [
                0.5,
                1,
                3
            ],
            color: "#fafafa"
        });
        scale = 0.7;
    } else if (/cat|kitten|kitty/.test(lower)) {
        const catColor = baseColor === "#6b8caf" ? "#f97316" : baseColor;
        // Body
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.4,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.4,
                0.35
            ],
            color: catColor
        });
        // Head
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.75,
                0.25
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.28,
                0.28,
                0.25
            ],
            color: catColor
        });
        // Ears
        parts.push({
            shape: "cone",
            position: [
                -0.12,
                1,
                0.25
            ],
            rotation: [
                0,
                0,
                0.15
            ],
            scale: [
                0.08,
                0.15,
                0.06
            ],
            color: catColor
        });
        parts.push({
            shape: "cone",
            position: [
                0.12,
                1,
                0.25
            ],
            rotation: [
                0,
                0,
                -0.15
            ],
            scale: [
                0.08,
                0.15,
                0.06
            ],
            color: catColor
        });
        // Eyes
        parts.push({
            shape: "sphere",
            position: [
                -0.08,
                0.8,
                0.47
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.04,
                0.03
            ],
            color: "#22c55e"
        });
        parts.push({
            shape: "sphere",
            position: [
                0.08,
                0.8,
                0.47
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.04,
                0.03
            ],
            color: "#22c55e"
        });
        // Nose
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.73,
                0.49
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.03,
                0.02,
                0.02
            ],
            color: "#fda4af"
        });
        // Tail
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.55,
                -0.4
            ],
            rotation: [
                0.8,
                0,
                0
            ],
            scale: [
                0.04,
                0.5,
                0.04
            ],
            color: catColor
        });
        // Paws
        parts.push({
            shape: "sphere",
            position: [
                -0.2,
                0.08,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.08,
                0.1
            ],
            color: catColor
        });
        parts.push({
            shape: "sphere",
            position: [
                0.2,
                0.08,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.08,
                0.1
            ],
            color: catColor
        });
        parts.push({
            shape: "sphere",
            position: [
                -0.15,
                0.08,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.08,
                0.1
            ],
            color: catColor
        });
        parts.push({
            shape: "sphere",
            position: [
                0.15,
                0.08,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.08,
                0.1
            ],
            color: catColor
        });
        scale = 1.2;
    } else if (/dog|puppy|hound/.test(lower)) {
        const dogColor = baseColor === "#6b8caf" ? "#92400e" : baseColor;
        // Body
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.45,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.55,
                0.4,
                0.35
            ],
            color: dogColor
        });
        // Head
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.7,
                0.35
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.25,
                0.22
            ],
            color: dogColor
        });
        // Snout
        parts.push({
            shape: "box",
            position: [
                0,
                0.63,
                0.55
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.15,
                0.12,
                0.15
            ],
            color: dogColor
        });
        // Nose
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.65,
                0.63
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.03,
                0.03
            ],
            color: "#1e1e1e"
        });
        // Ears (floppy)
        parts.push({
            shape: "sphere",
            position: [
                -0.18,
                0.8,
                0.3
            ],
            rotation: [
                0,
                0,
                0.3
            ],
            scale: [
                0.12,
                0.18,
                0.05
            ],
            color: dogColor
        });
        parts.push({
            shape: "sphere",
            position: [
                0.18,
                0.8,
                0.3
            ],
            rotation: [
                0,
                0,
                -0.3
            ],
            scale: [
                0.12,
                0.18,
                0.05
            ],
            color: dogColor
        });
        // Tail
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.7,
                -0.35
            ],
            rotation: [
                0.5,
                0,
                0
            ],
            scale: [
                0.04,
                0.35,
                0.04
            ],
            color: dogColor
        });
        // Legs
        parts.push({
            shape: "cylinder",
            position: [
                -0.2,
                0.15,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.3,
                0.06
            ],
            color: dogColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.2,
                0.15,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.3,
                0.06
            ],
            color: dogColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                -0.2,
                0.15,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.3,
                0.06
            ],
            color: dogColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.2,
                0.15,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.3,
                0.06
            ],
            color: dogColor
        });
        scale = 1.1;
    } else if (/dragon/.test(lower)) {
        // Body
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.6,
                0.5,
                0.4
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        // Head
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.8,
                0.5
            ],
            rotation: [
                0.2,
                0,
                0
            ],
            scale: [
                0.25,
                0.22,
                0.3
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        // Snout
        parts.push({
            shape: "cone",
            position: [
                0,
                0.75,
                0.8
            ],
            rotation: [
                Math.PI / 2,
                0,
                0
            ],
            scale: [
                0.12,
                0.25,
                0.1
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        // Horns
        parts.push({
            shape: "cone",
            position: [
                -0.12,
                1.05,
                0.45
            ],
            rotation: [
                0.3,
                0,
                0.2
            ],
            scale: [
                0.04,
                0.2,
                0.04
            ],
            color: "#78716c"
        });
        parts.push({
            shape: "cone",
            position: [
                0.12,
                1.05,
                0.45
            ],
            rotation: [
                0.3,
                0,
                -0.2
            ],
            scale: [
                0.04,
                0.2,
                0.04
            ],
            color: "#78716c"
        });
        // Wings
        parts.push({
            shape: "box",
            position: [
                -0.7,
                0.9,
                0
            ],
            rotation: [
                0,
                0.3,
                0.5
            ],
            scale: [
                0.8,
                0.02,
                0.5
            ],
            color: baseColor === "#6b8caf" ? "#15803d" : accentColor
        });
        parts.push({
            shape: "box",
            position: [
                0.7,
                0.9,
                0
            ],
            rotation: [
                0,
                -0.3,
                -0.5
            ],
            scale: [
                0.8,
                0.02,
                0.5
            ],
            color: baseColor === "#6b8caf" ? "#15803d" : accentColor
        });
        // Tail
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.35,
                -0.5
            ],
            rotation: [
                0.6,
                0,
                0
            ],
            scale: [
                0.1,
                0.6,
                0.1
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        parts.push({
            shape: "cone",
            position: [
                0,
                0.15,
                -0.85
            ],
            rotation: [
                2,
                0,
                0
            ],
            scale: [
                0.12,
                0.2,
                0.08
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        // Eyes
        parts.push({
            shape: "sphere",
            position: [
                -0.1,
                0.88,
                0.73
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.03,
                0.03
            ],
            color: "#fbbf24"
        });
        parts.push({
            shape: "sphere",
            position: [
                0.1,
                0.88,
                0.73
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.03,
                0.03
            ],
            color: "#fbbf24"
        });
        // Legs
        parts.push({
            shape: "cylinder",
            position: [
                -0.25,
                0.12,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.25,
                0.08
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.25,
                0.12,
                0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.25,
                0.08
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                -0.25,
                0.12,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.25,
                0.08
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.25,
                0.12,
                -0.15
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.25,
                0.08
            ],
            color: baseColor === "#6b8caf" ? "#16a34a" : baseColor
        });
        scale = 0.9;
    } else if (/tree|pine|oak/.test(lower)) {
        // Trunk
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                1,
                0.12
            ],
            color: "#78350f"
        });
        // Foliage layers
        parts.push({
            shape: "cone",
            position: [
                0,
                1.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.8,
                0.8,
                0.8
            ],
            color: "#16a34a"
        });
        parts.push({
            shape: "cone",
            position: [
                0,
                1.9,
                0
            ],
            rotation: [
                0,
                0.5,
                0
            ],
            scale: [
                0.65,
                0.7,
                0.65
            ],
            color: "#22c55e"
        });
        parts.push({
            shape: "cone",
            position: [
                0,
                2.25,
                0
            ],
            rotation: [
                0,
                1,
                0
            ],
            scale: [
                0.45,
                0.6,
                0.45
            ],
            color: "#4ade80"
        });
        scale = 0.7;
    } else if (/flower|rose|daisy|tulip|bloom/.test(lower)) {
        // Stem
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.03,
                1,
                0.03
            ],
            color: "#16a34a"
        });
        // Petals
        const petalColor = baseColor === "#6b8caf" ? "#f472b6" : baseColor;
        for(let i = 0; i < 6; i++){
            const angle = i * Math.PI * 2 / 6;
            parts.push({
                shape: "sphere",
                position: [
                    Math.sin(angle) * 0.2,
                    1.05,
                    Math.cos(angle) * 0.2
                ],
                rotation: [
                    0,
                    angle,
                    0.5
                ],
                scale: [
                    0.15,
                    0.08,
                    0.1
                ],
                color: petalColor
            });
        }
        // Center
        parts.push({
            shape: "sphere",
            position: [
                0,
                1.05,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.1,
                0.1
            ],
            color: "#fbbf24"
        });
        // Leaves
        parts.push({
            shape: "sphere",
            position: [
                -0.15,
                0.4,
                0
            ],
            rotation: [
                0,
                0,
                0.5
            ],
            scale: [
                0.15,
                0.06,
                0.08
            ],
            color: "#22c55e"
        });
        parts.push({
            shape: "sphere",
            position: [
                0.15,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                -0.5
            ],
            scale: [
                0.15,
                0.06,
                0.08
            ],
            color: "#22c55e"
        });
        scale = 1;
    } else if (/gear|mechanical|cog|machine|engine/.test(lower)) {
        // Main gear (torus)
        parts.push({
            shape: "torus",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                Math.PI / 2,
                0,
                0
            ],
            scale: [
                0.8,
                0.8,
                0.8
            ],
            color: "#94a3b8",
            metalness: 0.9,
            roughness: 0.1
        });
        // Center hub
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.2,
                0.25
            ],
            color: "#64748b",
            metalness: 0.9
        });
        // Center hole
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.1,
                0.25,
                0.1
            ],
            color: "#334155"
        });
        // Gear teeth (spokes)
        for(let i = 0; i < 8; i++){
            const angle = i * Math.PI * 2 / 8;
            parts.push({
                shape: "box",
                position: [
                    Math.sin(angle) * 0.55,
                    0.5,
                    Math.cos(angle) * 0.55
                ],
                rotation: [
                    0,
                    -angle,
                    0
                ],
                scale: [
                    0.12,
                    0.18,
                    0.25
                ],
                color: "#94a3b8",
                metalness: 0.9,
                roughness: 0.1
            });
        }
        // Small gear
        parts.push({
            shape: "torus",
            position: [
                0.8,
                0.5,
                0.6
            ],
            rotation: [
                Math.PI / 2,
                0,
                0
            ],
            scale: [
                0.4,
                0.4,
                0.4
            ],
            color: "#cbd5e1",
            metalness: 0.8
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.8,
                0.5,
                0.6
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.15,
                0.12
            ],
            color: "#475569",
            metalness: 0.9
        });
        scale = 0.9;
    } else if (/trophy|cup|award|prize/.test(lower)) {
        const trophyColor = baseColor === "#6b8caf" ? "#ca8a04" : baseColor;
        // Base
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.06,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.4,
                0.12,
                0.4
            ],
            color: trophyColor,
            metalness: 0.8,
            roughness: 0.2
        });
        // Stem
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.3,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.4,
                0.08
            ],
            color: trophyColor,
            metalness: 0.8,
            roughness: 0.2
        });
        // Cup body
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.75,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                0.5,
                0.35
            ],
            color: trophyColor,
            metalness: 0.8,
            roughness: 0.2,
            args: [
                0.5,
                0.35,
                1,
                32
            ]
        });
        // Handles
        parts.push({
            shape: "torus",
            position: [
                -0.4,
                0.75,
                0
            ],
            rotation: [
                0,
                0,
                Math.PI / 2
            ],
            scale: [
                0.15,
                0.15,
                0.15
            ],
            color: trophyColor,
            metalness: 0.8
        });
        parts.push({
            shape: "torus",
            position: [
                0.4,
                0.75,
                0
            ],
            rotation: [
                0,
                0,
                Math.PI / 2
            ],
            scale: [
                0.15,
                0.15,
                0.15
            ],
            color: trophyColor,
            metalness: 0.8
        });
        // Star on top
        parts.push({
            shape: "octahedron",
            position: [
                0,
                1.15,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.12,
                0.12
            ],
            color: "#fef08a",
            metalness: 0.7
        });
        scale = 1;
    } else if (/crystal|gem|diamond|jewel|prism|gemstone/.test(lower)) {
        const crystalColor = baseColor === "#6b8caf" ? "#22d3ee" : baseColor;
        // Main crystal cluster
        const crystalData = [
            {
                h: 1.4,
                r: 0.18,
                x: 0,
                z: 0,
                rotZ: 0
            },
            {
                h: 1.0,
                r: 0.14,
                x: 0.25,
                z: 0.1,
                rotZ: 0.2
            },
            {
                h: 0.8,
                r: 0.12,
                x: -0.2,
                z: 0.15,
                rotZ: -0.15
            },
            {
                h: 0.6,
                r: 0.1,
                x: 0.1,
                z: -0.2,
                rotZ: 0.1
            },
            {
                h: 1.1,
                r: 0.15,
                x: -0.15,
                z: -0.15,
                rotZ: -0.1
            },
            {
                h: 0.5,
                r: 0.09,
                x: 0.3,
                z: -0.1,
                rotZ: 0.25
            },
            {
                h: 0.7,
                r: 0.11,
                x: -0.3,
                z: 0,
                rotZ: -0.2
            }
        ];
        crystalData.forEach((c)=>{
            parts.push({
                shape: "cone",
                position: [
                    c.x,
                    c.h / 2 - 0.1,
                    c.z
                ],
                rotation: [
                    0,
                    0,
                    c.rotZ
                ],
                scale: [
                    c.r,
                    c.h,
                    c.r
                ],
                color: crystalColor,
                metalness: 0.3,
                roughness: 0.1,
                args: [
                    0.5,
                    1,
                    6
                ]
            });
        });
        // Base rock
        parts.push({
            shape: "dodecahedron",
            position: [
                0,
                -0.15,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.2,
                0.5
            ],
            color: "#57534e"
        });
        scale = 0.9;
    } else if (/mountain|terrain|landscape|hill|island/.test(lower)) {
        // Mountains
        parts.push({
            shape: "cone",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1,
                1.2,
                1
            ],
            color: "#57534e"
        });
        parts.push({
            shape: "cone",
            position: [
                0,
                0.9,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.4,
                0.35,
                0.4
            ],
            color: "#e2e8f0"
        }); // Snow cap
        parts.push({
            shape: "cone",
            position: [
                0.8,
                0.3,
                0.3
            ],
            rotation: [
                0,
                0.5,
                0
            ],
            scale: [
                0.7,
                0.7,
                0.7
            ],
            color: "#78716c"
        });
        parts.push({
            shape: "cone",
            position: [
                -0.7,
                0.25,
                -0.2
            ],
            rotation: [
                0,
                1,
                0
            ],
            scale: [
                0.6,
                0.5,
                0.5
            ],
            color: "#78716c"
        });
        // Ground
        parts.push({
            shape: "box",
            position: [
                0,
                -0.05,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                3,
                0.1,
                2.5
            ],
            color: "#65a30d"
        });
        // Trees (small cones)
        [
            [
                -0.3,
                0.12,
                0.7
            ],
            [
                0.5,
                0.12,
                0.6
            ],
            [
                -0.6,
                0.12,
                0.5
            ],
            [
                0.8,
                0.12,
                -0.5
            ]
        ].forEach((pos)=>{
            parts.push({
                shape: "cone",
                position: pos,
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.1,
                    0.25,
                    0.1
                ],
                color: "#166534"
            });
        });
        scale = 0.7;
    } else if (/chair|seat|stool/.test(lower)) {
        // Seat
        parts.push({
            shape: "box",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.6,
                0.06,
                0.6
            ],
            color: baseColor === "#6b8caf" ? "#92400e" : baseColor
        });
        // Backrest
        parts.push({
            shape: "box",
            position: [
                0,
                0.85,
                -0.27
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.55,
                0.65,
                0.06
            ],
            color: baseColor === "#6b8caf" ? "#92400e" : baseColor
        });
        // Legs
        [
            [
                -0.25,
                0.22,
                0.25
            ],
            [
                0.25,
                0.22,
                0.25
            ],
            [
                -0.25,
                0.22,
                -0.25
            ],
            [
                0.25,
                0.22,
                -0.25
            ]
        ].forEach((pos)=>{
            parts.push({
                shape: "cylinder",
                position: pos,
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.03,
                    0.45,
                    0.03
                ],
                color: baseColor === "#6b8caf" ? "#78350f" : baseColor
            });
        });
        scale = 1.1;
    } else if (/table|desk/.test(lower)) {
        // Top
        parts.push({
            shape: "box",
            position: [
                0,
                0.7,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.4,
                0.06,
                0.8
            ],
            color: baseColor === "#6b8caf" ? "#92400e" : baseColor
        });
        // Legs
        [
            [
                -0.6,
                0.33,
                0.35
            ],
            [
                0.6,
                0.33,
                0.35
            ],
            [
                -0.6,
                0.33,
                -0.35
            ],
            [
                0.6,
                0.33,
                -0.35
            ]
        ].forEach((pos)=>{
            parts.push({
                shape: "cylinder",
                position: pos,
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.04,
                    0.65,
                    0.04
                ],
                color: baseColor === "#6b8caf" ? "#78350f" : baseColor
            });
        });
        scale = 0.9;
    } else if (/robot|mech|android/.test(lower)) {
        // Body
        parts.push({
            shape: "box",
            position: [
                0,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.6,
                0.7,
                0.4
            ],
            color: "#94a3b8",
            metalness: 0.7,
            roughness: 0.3
        });
        // Head
        parts.push({
            shape: "box",
            position: [
                0,
                1.15,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.35,
                0.3,
                0.3
            ],
            color: "#cbd5e1",
            metalness: 0.7
        });
        // Eyes
        parts.push({
            shape: "sphere",
            position: [
                -0.08,
                1.2,
                0.16
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.05,
                0.05,
                0.03
            ],
            color: "#3b82f6"
        });
        parts.push({
            shape: "sphere",
            position: [
                0.08,
                1.2,
                0.16
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.05,
                0.05,
                0.03
            ],
            color: "#3b82f6"
        });
        // Antenna
        parts.push({
            shape: "cylinder",
            position: [
                0,
                1.4,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.02,
                0.2,
                0.02
            ],
            color: "#475569"
        });
        parts.push({
            shape: "sphere",
            position: [
                0,
                1.52,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.04,
                0.04
            ],
            color: "#ef4444"
        });
        // Arms
        parts.push({
            shape: "cylinder",
            position: [
                -0.45,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                0.2
            ],
            scale: [
                0.06,
                0.5,
                0.06
            ],
            color: "#64748b",
            metalness: 0.7
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.45,
                0.6,
                0
            ],
            rotation: [
                0,
                0,
                -0.2
            ],
            scale: [
                0.06,
                0.5,
                0.06
            ],
            color: "#64748b",
            metalness: 0.7
        });
        // Hands
        parts.push({
            shape: "sphere",
            position: [
                -0.55,
                0.32,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.08,
                0.08
            ],
            color: "#94a3b8",
            metalness: 0.7
        });
        parts.push({
            shape: "sphere",
            position: [
                0.55,
                0.32,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.08,
                0.08
            ],
            color: "#94a3b8",
            metalness: 0.7
        });
        // Legs
        parts.push({
            shape: "cylinder",
            position: [
                -0.15,
                0.1,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.3,
                0.08
            ],
            color: "#64748b",
            metalness: 0.7
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.15,
                0.1,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                0.3,
                0.08
            ],
            color: "#64748b",
            metalness: 0.7
        });
        // Feet
        parts.push({
            shape: "box",
            position: [
                -0.15,
                -0.04,
                0.03
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.04,
                0.15
            ],
            color: "#475569",
            metalness: 0.7
        });
        parts.push({
            shape: "box",
            position: [
                0.15,
                -0.04,
                0.03
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.04,
                0.15
            ],
            color: "#475569",
            metalness: 0.7
        });
        scale = 0.9;
    } else if (/sword|blade|weapon|dagger/.test(lower)) {
        // Blade
        parts.push({
            shape: "box",
            position: [
                0,
                1.0,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.08,
                1.2,
                0.02
            ],
            color: "#e2e8f0",
            metalness: 0.9,
            roughness: 0.1
        });
        // Blade tip
        parts.push({
            shape: "cone",
            position: [
                0,
                1.65,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.12,
                0.01
            ],
            color: "#e2e8f0",
            metalness: 0.9,
            roughness: 0.1
        });
        // Guard
        parts.push({
            shape: "box",
            position: [
                0,
                0.38,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.25,
                0.04,
                0.06
            ],
            color: "#ca8a04",
            metalness: 0.7
        });
        // Grip
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.2,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.04,
                0.3,
                0.04
            ],
            color: "#78350f"
        });
        // Pommel
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.04,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.06,
                0.06,
                0.06
            ],
            color: "#ca8a04",
            metalness: 0.7
        });
        scale = 0.9;
    } else if (/mushroom|fungus|toadstool/.test(lower)) {
        const capColor = baseColor === "#6b8caf" ? "#dc2626" : baseColor;
        // Stem
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.35,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.12,
                0.7,
                0.12
            ],
            color: "#fef3c7"
        });
        // Cap
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.8,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.45,
                0.25,
                0.45
            ],
            color: capColor
        });
        // Spots on cap
        [
            [
                -0.15,
                0.92,
                0.1
            ],
            [
                0.1,
                0.95,
                -0.1
            ],
            [
                0,
                0.88,
                0.2
            ],
            [
                -0.1,
                0.93,
                -0.15
            ]
        ].forEach((pos)=>{
            parts.push({
                shape: "sphere",
                position: pos,
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.05,
                    0.04,
                    0.05
                ],
                color: "#fef3c7"
            });
        });
        // Small mushroom
        parts.push({
            shape: "cylinder",
            position: [
                0.3,
                0.15,
                0.2
            ],
            rotation: [
                0,
                0,
                0.15
            ],
            scale: [
                0.06,
                0.3,
                0.06
            ],
            color: "#fef3c7"
        });
        parts.push({
            shape: "sphere",
            position: [
                0.33,
                0.35,
                0.2
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.18,
                0.1,
                0.18
            ],
            color: capColor
        });
        scale = 1;
    } else if (/abstract|sculpture|art|modern/.test(lower)) {
        parts.push({
            shape: "torusKnot",
            position: [
                0,
                0.8,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.5,
                0.5
            ],
            color: baseColor,
            metalness: 0.6,
            roughness: 0.3
        });
        parts.push({
            shape: "sphere",
            position: [
                0.5,
                0.3,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.2,
                0.2,
                0.2
            ],
            color: accentColor
        });
        parts.push({
            shape: "dodecahedron",
            position: [
                -0.4,
                0.3,
                0.3
            ],
            rotation: [
                0.5,
                0.3,
                0
            ],
            scale: [
                0.18,
                0.18,
                0.18
            ],
            color: accentColor
        });
        // Base
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.03,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                0.06,
                0.5
            ],
            color: "#334155"
        });
        scale = 0.9;
    } else if (/cube|box/.test(lower)) {
        parts.push({
            shape: "box",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0.2,
                0.4,
                0
            ],
            scale: [
                0.8,
                0.8,
                0.8
            ],
            color: baseColor
        });
        scale = 1;
    } else if (/sphere|ball|orb|globe/.test(lower)) {
        parts.push({
            shape: "sphere",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.7,
                0.7,
                0.7
            ],
            color: baseColor
        });
        scale = 1;
    } else if (/cylinder|pipe|tube/.test(lower)) {
        parts.push({
            shape: "cylinder",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.5,
                1,
                0.5
            ],
            color: baseColor
        });
        scale = 1;
    } else if (/torus|donut|ring/.test(lower)) {
        parts.push({
            shape: "torus",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                Math.PI / 2,
                0,
                0
            ],
            scale: [
                0.6,
                0.6,
                0.6
            ],
            color: baseColor
        });
        scale = 1;
    } else if (/pyramid/.test(lower)) {
        parts.push({
            shape: "cone",
            position: [
                0,
                0.5,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.8,
                1,
                0.8
            ],
            color: baseColor,
            args: [
                0.5,
                1,
                4
            ]
        });
        scale = 1;
    } else if (/living room|bedroom|room|interior|scandinavian/.test(lower)) {
        // Floor
        parts.push({
            shape: "box",
            position: [
                0,
                -0.02,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                3,
                0.04,
                2.5
            ],
            color: "#d4a373"
        });
        // Back wall
        parts.push({
            shape: "box",
            position: [
                0,
                0.75,
                -1.2
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                3,
                1.5,
                0.05
            ],
            color: "#faf5ee"
        });
        // Side wall
        parts.push({
            shape: "box",
            position: [
                -1.5,
                0.75,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.05,
                1.5,
                2.5
            ],
            color: "#faf5ee"
        });
        // Sofa
        parts.push({
            shape: "box",
            position: [
                0,
                0.25,
                -0.7
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.4,
                0.3,
                0.6
            ],
            color: /beige/.test(lower) ? "#d4a373" : "#94a3b8"
        });
        parts.push({
            shape: "box",
            position: [
                0,
                0.45,
                -0.95
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                1.4,
                0.25,
                0.15
            ],
            color: /beige/.test(lower) ? "#c2956b" : "#78798b"
        });
        // Coffee table
        parts.push({
            shape: "box",
            position: [
                0,
                0.2,
                -0.1
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.7,
                0.04,
                0.4
            ],
            color: "#78350f"
        });
        parts.push({
            shape: "cylinder",
            position: [
                -0.25,
                0.09,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.03,
                0.18,
                0.03
            ],
            color: "#451a03"
        });
        parts.push({
            shape: "cylinder",
            position: [
                0.25,
                0.09,
                0
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.03,
                0.18,
                0.03
            ],
            color: "#451a03"
        });
        // Window on back wall
        parts.push({
            shape: "box",
            position: [
                0,
                0.9,
                -1.17
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.8,
                0.7,
                0.02
            ],
            color: "#bae6fd"
        });
        // Lamp
        parts.push({
            shape: "cylinder",
            position: [
                0.9,
                0.3,
                -0.7
            ],
            rotation: [
                0,
                0,
                0
            ],
            scale: [
                0.02,
                0.6,
                0.02
            ],
            color: "#475569"
        });
        parts.push({
            shape: "cone",
            position: [
                0.9,
                0.65,
                -0.7
            ],
            rotation: [
                Math.PI,
                0,
                0
            ],
            scale: [
                0.15,
                0.12,
                0.15
            ],
            color: "#fef3c7"
        });
        scale = 0.6;
    } else {
        // Try to identify if it describes a person
        if (/person|man|woman|human|figure|character/.test(lower)) {
            // Head
            parts.push({
                shape: "sphere",
                position: [
                    0,
                    1.4,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.2,
                    0.22,
                    0.2
                ],
                color: "#d4a373"
            });
            // Torso
            parts.push({
                shape: "box",
                position: [
                    0,
                    0.95,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.45,
                    0.65,
                    0.25
                ],
                color: baseColor
            });
            // Arms
            parts.push({
                shape: "cylinder",
                position: [
                    -0.35,
                    0.95,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0.15
                ],
                scale: [
                    0.06,
                    0.55,
                    0.06
                ],
                color: baseColor
            });
            parts.push({
                shape: "cylinder",
                position: [
                    0.35,
                    0.95,
                    0
                ],
                rotation: [
                    0,
                    0,
                    -0.15
                ],
                scale: [
                    0.06,
                    0.55,
                    0.06
                ],
                color: baseColor
            });
            // Legs
            parts.push({
                shape: "cylinder",
                position: [
                    -0.12,
                    0.3,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.08,
                    0.6,
                    0.08
                ],
                color: "#334155"
            });
            parts.push({
                shape: "cylinder",
                position: [
                    0.12,
                    0.3,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.08,
                    0.6,
                    0.08
                ],
                color: "#334155"
            });
            scale = 0.8;
        } else {
            // Generic abstract model for anything else
            parts.push({
                shape: "dodecahedron",
                position: [
                    0,
                    0.6,
                    0
                ],
                rotation: [
                    0.3,
                    0.5,
                    0
                ],
                scale: [
                    0.6,
                    0.6,
                    0.6
                ],
                color: baseColor,
                metalness: 0.5,
                roughness: 0.3
            });
            parts.push({
                shape: "sphere",
                position: [
                    0,
                    0.6,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.4,
                    0.4,
                    0.4
                ],
                color: accentColor,
                metalness: 0.3,
                roughness: 0.5
            });
            parts.push({
                shape: "box",
                position: [
                    0,
                    0.03,
                    0
                ],
                rotation: [
                    0,
                    0,
                    0
                ],
                scale: [
                    0.8,
                    0.06,
                    0.8
                ],
                color: "#334155"
            });
            scale = 1;
        }
    }
    return {
        parts,
        baseColor,
        accentColor,
        metalness,
        roughness,
        scale
    };
}
/* ─── Part Renderer ─── */ function ModelPart(param) {
    let { config, wireframe } = param;
    _s();
    const geometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ModelPart.useMemo[geometry]": ()=>{
            switch(config.shape){
                case "box":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](1, 1, 1);
                case "sphere":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SphereGeometry"](0.5, 24, 24);
                case "cylinder":
                    {
                        if (config.args && config.args.length >= 4) {
                            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](config.args[0], config.args[1], config.args[2], config.args[3]);
                        }
                        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.5, 0.5, 1, 24);
                    }
                case "cone":
                    {
                        if (config.args && config.args.length >= 3) {
                            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConeGeometry"](config.args[0], config.args[1], config.args[2]);
                        }
                        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConeGeometry"](0.5, 1, 24);
                    }
                case "torus":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.5, 0.15, 16, 48);
                case "torusKnot":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusKnotGeometry"](0.5, 0.15, 128, 32);
                case "dodecahedron":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DodecahedronGeometry"](0.5, 0);
                case "octahedron":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OctahedronGeometry"](0.5, 0);
                case "capsule":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CapsuleGeometry"](0.3, 0.5, 8, 16);
                case "plane":
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](1, 1);
                default:
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](1, 1, 1);
            }
        }
    }["ModelPart.useMemo[geometry]"], [
        config.shape,
        config.args
    ]);
    var _config_roughness, _config_metalness;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
        geometry: geometry,
        position: config.position,
        rotation: config.rotation,
        scale: config.scale,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
            color: config.color || "#6b8caf",
            wireframe: wireframe,
            roughness: (_config_roughness = config.roughness) !== null && _config_roughness !== void 0 ? _config_roughness : 0.5,
            metalness: (_config_metalness = config.metalness) !== null && _config_metalness !== void 0 ? _config_metalness : 0.4,
            flatShading: true
        }, void 0, false, {
            fileName: "[project]/src/components/ModelViewer.tsx",
            lineNumber: 583,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ModelViewer.tsx",
        lineNumber: 577,
        columnNumber: 5
    }, this);
}
_s(ModelPart, "02hlve5eMynmluEywvGvnlLCucU=");
_c = ModelPart;
/* ─── Generated Model ─── */ function GeneratedModel(param) {
    let { prompt, wireframe } = param;
    _s1();
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GeneratedModel.useMemo[config]": ()=>analyzePrompt(prompt)
    }["GeneratedModel.useMemo[config]"], [
        prompt
    ]);
    const groupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Gentle idle float animation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "GeneratedModel.useFrame": (state)=>{
            if (groupRef.current) {
                groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
            }
        }
    }["GeneratedModel.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Center$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Center"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
            ref: groupRef,
            scale: config.scale,
            children: config.parts.map((part, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModelPart, {
                    config: part,
                    wireframe: wireframe
                }, i, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 610,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/ModelViewer.tsx",
            lineNumber: 608,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ModelViewer.tsx",
        lineNumber: 607,
        columnNumber: 5
    }, this);
}
_s1(GeneratedModel, "zNoTQ6ckSGug7lIR5G+Ek0kJ6Dg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
});
_c1 = GeneratedModel;
/* ─── Scene Reference ─── */ function SceneRef(param) {
    let { onScene } = param;
    _s2();
    const { scene } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SceneRef.useEffect": ()=>{
            onScene(scene);
        }
    }["SceneRef.useEffect"], [
        scene,
        onScene
    ]);
    return null;
}
_s2(SceneRef, "UhCC8wDD2cMyItT8qLKLhYRbhzM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"]
    ];
});
_c2 = SceneRef;
function ModelViewer(param) {
    let { prompt, className = "", wireframe = false, onSceneReady } = param;
    _s3();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ModelViewer.useEffect": ()=>setMounted(true)
    }["ModelViewer.useEffect"], []);
    const handleScene = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ModelViewer.useCallback[handleScene]": (scene)=>{
            if (onSceneReady) onSceneReady(scene);
        }
    }["ModelViewer.useCallback[handleScene]"], [
        onSceneReady
    ]);
    if (!mounted) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-surface rounded-xl ".concat(className)
    }, void 0, false, {
        fileName: "[project]/src/components/ModelViewer.tsx",
        lineNumber: 643,
        columnNumber: 24
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "canvas-container ".concat(className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Canvas"], {
            camera: {
                position: [
                    3,
                    2,
                    4
                ],
                fov: 45
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ambientLight", {
                    intensity: 0.5
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 648,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                    position: [
                        5,
                        8,
                        5
                    ],
                    intensity: 1,
                    color: "#e0e7ff"
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 649,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                    position: [
                        -3,
                        4,
                        -3
                    ],
                    intensity: 0.3,
                    color: "#bfdbfe"
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 650,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GeneratedModel, {
                    prompt: prompt,
                    wireframe: wireframe
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 652,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Grid"], {
                    args: [
                        20,
                        20
                    ],
                    cellSize: 0.5,
                    cellThickness: 0.5,
                    cellColor: "#334155",
                    sectionSize: 2,
                    sectionThickness: 1,
                    sectionColor: "#475569",
                    fadeDistance: 15,
                    position: [
                        0,
                        -1.2,
                        0
                    ]
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 654,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoHelper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GizmoHelper"], {
                    alignment: "bottom-right",
                    margin: [
                        60,
                        60
                    ],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoViewport$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GizmoViewport"], {
                        labelColor: "white",
                        axisHeadScale: 0.8
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModelViewer.tsx",
                        lineNumber: 667,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 666,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Environment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Environment"], {
                    preset: "studio"
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 670,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OrbitControls"], {
                    enablePan: true,
                    minDistance: 1.5,
                    maxDistance: 15,
                    makeDefault: true
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 671,
                    columnNumber: 9
                }, this),
                onSceneReady && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneRef, {
                    onScene: handleScene
                }, void 0, false, {
                    fileName: "[project]/src/components/ModelViewer.tsx",
                    lineNumber: 677,
                    columnNumber: 26
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ModelViewer.tsx",
            lineNumber: 647,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ModelViewer.tsx",
        lineNumber: 646,
        columnNumber: 5
    }, this);
}
_s3(ModelViewer, "0DrBpU3cP96tLB1H+PkZ6na8txk=");
_c3 = ModelViewer;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "ModelPart");
__turbopack_context__.k.register(_c1, "GeneratedModel");
__turbopack_context__.k.register(_c2, "SceneRef");
__turbopack_context__.k.register(_c3, "ModelViewer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ModelViewer.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/ModelViewer.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_ModelViewer_tsx_a0af6a5b._.js.map