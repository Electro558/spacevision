module.exports = [
"[project]/src/utils/stlExporter.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "exportToSTL",
    ()=>exportToSTL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2d$stdlib$2f$exporters$2f$STLExporter$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three-stdlib/exporters/STLExporter.js [app-ssr] (ecmascript)");
;
function exportToSTL(scene, filename = "model.stl") {
    const exporter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2d$stdlib$2f$exporters$2f$STLExporter$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STLExporter"]();
    const result = exporter.parse(scene, {
        binary: true
    });
    const buffer = new ArrayBuffer(result.byteLength);
    new Uint8Array(buffer).set(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
    const blob = new Blob([
        buffer
    ], {
        type: "application/octet-stream"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
}),
"[project]/src/lib/cadStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* ─── CAD Scene State Management ─── */ __turbopack_context__.s([
    "DEFAULT_STATE",
    ()=>DEFAULT_STATE,
    "buildGeometry",
    ()=>buildGeometry,
    "createObject",
    ()=>createObject,
    "duplicateObject",
    ()=>duplicateObject,
    "generateFromPrompt",
    ()=>generateFromPrompt,
    "newId",
    ()=>newId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
;
let _idCounter = 0;
function newId() {
    return `obj_${Date.now()}_${_idCounter++}`;
}
const DEFAULT_STATE = {
    objects: [],
    selectedId: null,
    transformMode: "translate",
    wireframe: false,
    snapEnabled: false,
    snapValue: 0.5,
    gridVisible: true
};
function createObject(type, overrides) {
    const names = {
        box: "Cube",
        sphere: "Sphere",
        cylinder: "Cylinder",
        cone: "Cone",
        torus: "Torus",
        torusKnot: "Torus Knot",
        dodecahedron: "Dodecahedron",
        octahedron: "Octahedron",
        plane: "Plane",
        capsule: "Capsule"
    };
    // Count existing objects of same type for naming
    return {
        id: newId(),
        name: names[type] || "Object",
        type,
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
            1,
            1
        ],
        color: "#6b8caf",
        metalness: 0.3,
        roughness: 0.5,
        visible: true,
        locked: false,
        ...overrides
    };
}
function duplicateObject(obj) {
    return {
        ...obj,
        id: newId(),
        name: `${obj.name} Copy`,
        position: [
            obj.position[0] + 0.5,
            obj.position[1],
            obj.position[2] + 0.5
        ]
    };
}
function buildGeometry(type) {
    switch(type){
        case "box":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](1, 1, 1);
        case "sphere":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SphereGeometry"](0.5, 32, 32);
        case "cylinder":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.5, 0.5, 1, 32);
        case "cone":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConeGeometry"](0.5, 1, 32);
        case "torus":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TorusGeometry"](0.4, 0.15, 16, 48);
        case "torusKnot":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TorusKnotGeometry"](0.4, 0.12, 128, 32);
        case "dodecahedron":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DodecahedronGeometry"](0.5, 0);
        case "octahedron":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OctahedronGeometry"](0.5, 0);
        case "plane":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](1, 1);
        case "capsule":
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CapsuleGeometry"](0.3, 0.5, 8, 16);
        default:
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](1, 1, 1);
    }
}
function generateFromPrompt(prompt) {
    const lower = prompt.toLowerCase();
    const objects = [];
    let baseColor = "#6b8caf";
    let metalness = 0.3;
    let roughness = 0.5;
    // Color detection
    if (/red/.test(lower)) baseColor = "#dc2626";
    else if (/blue/.test(lower)) baseColor = "#2563eb";
    else if (/green/.test(lower)) baseColor = "#16a34a";
    else if (/gold|yellow/.test(lower)) {
        baseColor = "#ca8a04";
        metalness = 0.8;
        roughness = 0.2;
    } else if (/purple|violet/.test(lower)) baseColor = "#7c3aed";
    else if (/pink/.test(lower)) baseColor = "#db2777";
    else if (/orange/.test(lower)) baseColor = "#ea580c";
    else if (/white/.test(lower)) baseColor = "#e2e8f0";
    else if (/black|dark/.test(lower)) baseColor = "#334155";
    else if (/silver|metal|chrome/.test(lower)) {
        baseColor = "#94a3b8";
        metalness = 0.9;
        roughness = 0.1;
    } else if (/wood|wooden/.test(lower)) {
        baseColor = "#92400e";
        metalness = 0;
        roughness = 0.8;
    }
    const add = (name, type, pos, scale, color, rot, met, rough)=>{
        objects.push(createObject(type, {
            name,
            position: pos,
            rotation: rot || [
                0,
                0,
                0
            ],
            scale,
            color: color || baseColor,
            metalness: met ?? metalness,
            roughness: rough ?? roughness
        }));
    };
    // ─── HOUSE ───
    if (/house|home|cabin|cottage/.test(lower)) {
        add("Walls", "box", [
            0,
            0.6,
            0
        ], [
            1.4,
            1.2,
            1.2
        ]);
        add("Roof", "cone", [
            0,
            1.55,
            0
        ], [
            1.3,
            0.7,
            1.3
        ], "#78350f");
        add("Door", "box", [
            0,
            0.3,
            0.61
        ], [
            0.3,
            0.5,
            0.04
        ], "#451a03");
        add("Window L", "box", [
            -0.4,
            0.7,
            0.61
        ], [
            0.25,
            0.25,
            0.04
        ], "#7dd3fc");
        add("Window R", "box", [
            0.4,
            0.7,
            0.61
        ], [
            0.25,
            0.25,
            0.04
        ], "#7dd3fc");
        add("Chimney", "box", [
            0.45,
            1.6,
            -0.2
        ], [
            0.2,
            0.5,
            0.2
        ], "#78716c");
        add("Ground", "box", [
            0,
            -0.05,
            0
        ], [
            2,
            0.1,
            1.8
        ], "#65a30d");
    } else if (/castle|tower|fortress|medieval/.test(lower)) {
        add("Main Tower", "cylinder", [
            0,
            1,
            0
        ], [
            0.6,
            2,
            0.6
        ], "#78716c");
        add("Tower Roof", "cone", [
            0,
            2.3,
            0
        ], [
            0.7,
            0.6,
            0.7
        ], "#dc2626");
        add("Left Tower", "cylinder", [
            -0.8,
            0.7,
            0
        ], [
            0.35,
            1.4,
            0.35
        ], "#a8a29e");
        add("Right Tower", "cylinder", [
            0.8,
            0.7,
            0
        ], [
            0.35,
            1.4,
            0.35
        ], "#a8a29e");
        add("Left Roof", "cone", [
            -0.8,
            1.65,
            0
        ], [
            0.45,
            0.5,
            0.45
        ], "#dc2626");
        add("Right Roof", "cone", [
            0.8,
            1.65,
            0
        ], [
            0.45,
            0.5,
            0.45
        ], "#dc2626");
        add("Wall", "box", [
            0,
            0.3,
            0.5
        ], [
            2,
            0.6,
            0.15
        ], "#78716c");
        add("Gate", "box", [
            0,
            0.2,
            0.58
        ], [
            0.3,
            0.4,
            0.04
        ], "#451a03");
    } else if (/car|sedan|vehicle|automobile|sports car/.test(lower)) {
        add("Body", "box", [
            0,
            0.25,
            0
        ], [
            2,
            0.4,
            0.9
        ], baseColor, undefined, 0.7, 0.2);
        add("Cabin", "box", [
            0.1,
            0.6,
            0
        ], [
            1,
            0.35,
            0.8
        ], "#1e293b", undefined, 0.3, 0.1);
        add("Hood", "box", [
            -0.65,
            0.4,
            0
        ], [
            0.4,
            0.1,
            0.75
        ], baseColor, [
            0,
            0,
            -0.15
        ], 0.7, 0.2);
        add("Wheel FL", "cylinder", [
            -0.6,
            0.05,
            0.5
        ], [
            0.2,
            0.12,
            0.2
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ], 0.2, 0.8);
        add("Wheel FR", "cylinder", [
            0.6,
            0.05,
            0.5
        ], [
            0.2,
            0.12,
            0.2
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ], 0.2, 0.8);
        add("Wheel RL", "cylinder", [
            -0.6,
            0.05,
            -0.5
        ], [
            0.2,
            0.12,
            0.2
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ], 0.2, 0.8);
        add("Wheel RR", "cylinder", [
            0.6,
            0.05,
            -0.5
        ], [
            0.2,
            0.12,
            0.2
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ], 0.2, 0.8);
        add("Headlight L", "sphere", [
            -1,
            0.3,
            0.3
        ], [
            0.06,
            0.06,
            0.06
        ], "#fef08a");
        add("Headlight R", "sphere", [
            -1,
            0.3,
            -0.3
        ], [
            0.06,
            0.06,
            0.06
        ], "#fef08a");
    } else if (/rocket|spaceship|spacecraft|shuttle/.test(lower)) {
        add("Fuselage", "cylinder", [
            0,
            0.8,
            0
        ], [
            0.35,
            1.8,
            0.35
        ], "#e2e8f0");
        add("Nose Cone", "cone", [
            0,
            2.1,
            0
        ], [
            0.35,
            0.7,
            0.35
        ], "#dc2626");
        add("Fin 1", "box", [
            0.35,
            0.15,
            0
        ], [
            0.02,
            0.5,
            0.35
        ], "#ef4444", [
            0,
            0,
            0.3
        ]);
        add("Fin 2", "box", [
            -0.35,
            0.15,
            0
        ], [
            0.02,
            0.5,
            0.35
        ], "#ef4444", [
            0,
            Math.PI,
            -0.3
        ]);
        add("Fin 3", "box", [
            0,
            0.15,
            0.35
        ], [
            0.35,
            0.5,
            0.02
        ], "#ef4444", [
            0.3,
            0,
            0
        ]);
        add("Fin 4", "box", [
            0,
            0.15,
            -0.35
        ], [
            0.35,
            0.5,
            0.02
        ], "#ef4444", [
            -0.3,
            0,
            0
        ]);
        add("Engine", "cylinder", [
            0,
            -0.15,
            0
        ], [
            0.25,
            0.2,
            0.25
        ], "#475569", undefined, 0.8, 0.2);
        add("Window", "sphere", [
            0,
            1.4,
            0.33
        ], [
            0.12,
            0.12,
            0.05
        ], "#38bdf8");
        add("Exhaust", "cone", [
            0,
            -0.45,
            0
        ], [
            0.2,
            0.4,
            0.2
        ], "#f97316", [
            Math.PI,
            0,
            0
        ]);
    } else if (/cat|kitten|kitty/.test(lower)) {
        const c = baseColor === "#6b8caf" ? "#f97316" : baseColor;
        add("Body", "sphere", [
            0,
            0.4,
            0
        ], [
            0.5,
            0.4,
            0.35
        ], c);
        add("Head", "sphere", [
            0,
            0.75,
            0.25
        ], [
            0.28,
            0.28,
            0.25
        ], c);
        add("Ear L", "cone", [
            -0.12,
            1,
            0.25
        ], [
            0.08,
            0.15,
            0.06
        ], c, [
            0,
            0,
            0.15
        ]);
        add("Ear R", "cone", [
            0.12,
            1,
            0.25
        ], [
            0.08,
            0.15,
            0.06
        ], c, [
            0,
            0,
            -0.15
        ]);
        add("Eye L", "sphere", [
            -0.08,
            0.8,
            0.47
        ], [
            0.04,
            0.04,
            0.03
        ], "#22c55e");
        add("Eye R", "sphere", [
            0.08,
            0.8,
            0.47
        ], [
            0.04,
            0.04,
            0.03
        ], "#22c55e");
        add("Nose", "sphere", [
            0,
            0.73,
            0.49
        ], [
            0.03,
            0.02,
            0.02
        ], "#fda4af");
        add("Tail", "cylinder", [
            0,
            0.55,
            -0.4
        ], [
            0.04,
            0.5,
            0.04
        ], c, [
            0.8,
            0,
            0
        ]);
        add("Paw FL", "sphere", [
            -0.2,
            0.08,
            0.15
        ], [
            0.1,
            0.08,
            0.1
        ], c);
        add("Paw FR", "sphere", [
            0.2,
            0.08,
            0.15
        ], [
            0.1,
            0.08,
            0.1
        ], c);
        add("Paw RL", "sphere", [
            -0.15,
            0.08,
            -0.15
        ], [
            0.1,
            0.08,
            0.1
        ], c);
        add("Paw RR", "sphere", [
            0.15,
            0.08,
            -0.15
        ], [
            0.1,
            0.08,
            0.1
        ], c);
    } else if (/dog|puppy|hound/.test(lower)) {
        const d = baseColor === "#6b8caf" ? "#92400e" : baseColor;
        add("Body", "sphere", [
            0,
            0.45,
            0
        ], [
            0.55,
            0.4,
            0.35
        ], d);
        add("Head", "sphere", [
            0,
            0.7,
            0.35
        ], [
            0.25,
            0.25,
            0.22
        ], d);
        add("Snout", "box", [
            0,
            0.63,
            0.55
        ], [
            0.15,
            0.12,
            0.15
        ], d);
        add("Nose", "sphere", [
            0,
            0.65,
            0.63
        ], [
            0.04,
            0.03,
            0.03
        ], "#1e1e1e");
        add("Ear L", "sphere", [
            -0.18,
            0.8,
            0.3
        ], [
            0.12,
            0.18,
            0.05
        ], d, [
            0,
            0,
            0.3
        ]);
        add("Ear R", "sphere", [
            0.18,
            0.8,
            0.3
        ], [
            0.12,
            0.18,
            0.05
        ], d, [
            0,
            0,
            -0.3
        ]);
        add("Tail", "cylinder", [
            0,
            0.7,
            -0.35
        ], [
            0.04,
            0.35,
            0.04
        ], d, [
            0.5,
            0,
            0
        ]);
        add("Leg FL", "cylinder", [
            -0.2,
            0.15,
            0.15
        ], [
            0.06,
            0.3,
            0.06
        ], d);
        add("Leg FR", "cylinder", [
            0.2,
            0.15,
            0.15
        ], [
            0.06,
            0.3,
            0.06
        ], d);
        add("Leg RL", "cylinder", [
            -0.2,
            0.15,
            -0.15
        ], [
            0.06,
            0.3,
            0.06
        ], d);
        add("Leg RR", "cylinder", [
            0.2,
            0.15,
            -0.15
        ], [
            0.06,
            0.3,
            0.06
        ], d);
    } else if (/dragon/.test(lower)) {
        const dr = baseColor === "#6b8caf" ? "#16a34a" : baseColor;
        add("Body", "sphere", [
            0,
            0.5,
            0
        ], [
            0.6,
            0.5,
            0.4
        ], dr);
        add("Head", "sphere", [
            0,
            0.8,
            0.5
        ], [
            0.25,
            0.22,
            0.3
        ], dr);
        add("Snout", "cone", [
            0,
            0.75,
            0.8
        ], [
            0.12,
            0.25,
            0.1
        ], dr, [
            Math.PI / 2,
            0,
            0
        ]);
        add("Horn L", "cone", [
            -0.12,
            1.05,
            0.45
        ], [
            0.04,
            0.2,
            0.04
        ], "#78716c", [
            0.3,
            0,
            0.2
        ]);
        add("Horn R", "cone", [
            0.12,
            1.05,
            0.45
        ], [
            0.04,
            0.2,
            0.04
        ], "#78716c", [
            0.3,
            0,
            -0.2
        ]);
        add("Wing L", "box", [
            -0.7,
            0.9,
            0
        ], [
            0.8,
            0.02,
            0.5
        ], dr, [
            0,
            0.3,
            0.5
        ]);
        add("Wing R", "box", [
            0.7,
            0.9,
            0
        ], [
            0.8,
            0.02,
            0.5
        ], dr, [
            0,
            -0.3,
            -0.5
        ]);
        add("Tail", "cylinder", [
            0,
            0.35,
            -0.5
        ], [
            0.1,
            0.6,
            0.1
        ], dr, [
            0.6,
            0,
            0
        ]);
        add("Tail Tip", "cone", [
            0,
            0.15,
            -0.85
        ], [
            0.12,
            0.2,
            0.08
        ], dr, [
            2,
            0,
            0
        ]);
        add("Eye L", "sphere", [
            -0.1,
            0.88,
            0.73
        ], [
            0.04,
            0.03,
            0.03
        ], "#fbbf24");
        add("Eye R", "sphere", [
            0.1,
            0.88,
            0.73
        ], [
            0.04,
            0.03,
            0.03
        ], "#fbbf24");
        add("Leg FL", "cylinder", [
            -0.25,
            0.12,
            0.15
        ], [
            0.08,
            0.25,
            0.08
        ], dr);
        add("Leg FR", "cylinder", [
            0.25,
            0.12,
            0.15
        ], [
            0.08,
            0.25,
            0.08
        ], dr);
        add("Leg RL", "cylinder", [
            -0.25,
            0.12,
            -0.15
        ], [
            0.08,
            0.25,
            0.08
        ], dr);
        add("Leg RR", "cylinder", [
            0.25,
            0.12,
            -0.15
        ], [
            0.08,
            0.25,
            0.08
        ], dr);
    } else if (/gear|mechanical|cog|machine|engine/.test(lower)) {
        add("Main Gear", "torus", [
            0,
            0.5,
            0
        ], [
            0.8,
            0.8,
            0.8
        ], "#94a3b8", [
            Math.PI / 2,
            0,
            0
        ], 0.9, 0.1);
        add("Hub", "cylinder", [
            0,
            0.5,
            0
        ], [
            0.25,
            0.2,
            0.25
        ], "#64748b", undefined, 0.9, 0.1);
        add("Axle", "cylinder", [
            0,
            0.5,
            0
        ], [
            0.08,
            0.4,
            0.08
        ], "#334155");
        for(let i = 0; i < 8; i++){
            const angle = i * Math.PI * 2 / 8;
            add(`Tooth ${i + 1}`, "box", [
                Math.sin(angle) * 0.55,
                0.5,
                Math.cos(angle) * 0.55
            ], [
                0.12,
                0.18,
                0.25
            ], "#94a3b8", [
                0,
                -angle,
                0
            ], 0.9, 0.1);
        }
        add("Small Gear", "torus", [
            0.8,
            0.5,
            0.6
        ], [
            0.4,
            0.4,
            0.4
        ], "#cbd5e1", [
            Math.PI / 2,
            0,
            0
        ], 0.8, 0.2);
    } else if (/trophy|cup|award|prize/.test(lower)) {
        const tc = baseColor === "#6b8caf" ? "#ca8a04" : baseColor;
        add("Base", "cylinder", [
            0,
            0.06,
            0
        ], [
            0.4,
            0.12,
            0.4
        ], tc, undefined, 0.8, 0.2);
        add("Stem", "cylinder", [
            0,
            0.3,
            0
        ], [
            0.08,
            0.4,
            0.08
        ], tc, undefined, 0.8, 0.2);
        add("Cup", "cylinder", [
            0,
            0.75,
            0
        ], [
            0.35,
            0.5,
            0.35
        ], tc, undefined, 0.8, 0.2);
        add("Handle L", "torus", [
            -0.4,
            0.75,
            0
        ], [
            0.15,
            0.15,
            0.15
        ], tc, [
            0,
            0,
            Math.PI / 2
        ], 0.8, 0.2);
        add("Handle R", "torus", [
            0.4,
            0.75,
            0
        ], [
            0.15,
            0.15,
            0.15
        ], tc, [
            0,
            0,
            Math.PI / 2
        ], 0.8, 0.2);
        add("Star", "octahedron", [
            0,
            1.15,
            0
        ], [
            0.12,
            0.12,
            0.12
        ], "#fef08a", undefined, 0.7, 0.3);
    } else if (/crystal|gem|diamond|jewel|gemstone/.test(lower)) {
        const cc = baseColor === "#6b8caf" ? "#22d3ee" : baseColor;
        const crystals = [
            {
                h: 1.4,
                r: 0.18,
                x: 0,
                z: 0,
                rz: 0
            },
            {
                h: 1.0,
                r: 0.14,
                x: 0.25,
                z: 0.1,
                rz: 0.2
            },
            {
                h: 0.8,
                r: 0.12,
                x: -0.2,
                z: 0.15,
                rz: -0.15
            },
            {
                h: 0.6,
                r: 0.1,
                x: 0.1,
                z: -0.2,
                rz: 0.1
            },
            {
                h: 1.1,
                r: 0.15,
                x: -0.15,
                z: -0.15,
                rz: -0.1
            }
        ];
        crystals.forEach((c, i)=>{
            add(`Crystal ${i + 1}`, "cone", [
                c.x,
                c.h / 2 - 0.1,
                c.z
            ], [
                c.r,
                c.h,
                c.r
            ], cc, [
                0,
                0,
                c.rz
            ], 0.3, 0.1);
        });
        add("Rock Base", "dodecahedron", [
            0,
            -0.15,
            0
        ], [
            0.5,
            0.2,
            0.5
        ], "#57534e");
    } else if (/tree|pine|oak/.test(lower)) {
        add("Trunk", "cylinder", [
            0,
            0.5,
            0
        ], [
            0.12,
            1,
            0.12
        ], "#78350f");
        add("Foliage 1", "cone", [
            0,
            1.5,
            0
        ], [
            0.8,
            0.8,
            0.8
        ], "#16a34a");
        add("Foliage 2", "cone", [
            0,
            1.9,
            0
        ], [
            0.65,
            0.7,
            0.65
        ], "#22c55e", [
            0,
            0.5,
            0
        ]);
        add("Foliage 3", "cone", [
            0,
            2.25,
            0
        ], [
            0.45,
            0.6,
            0.45
        ], "#4ade80", [
            0,
            1,
            0
        ]);
    } else if (/mountain|terrain|landscape|hill/.test(lower)) {
        add("Mountain Main", "cone", [
            0,
            0.5,
            0
        ], [
            1,
            1.2,
            1
        ], "#57534e");
        add("Snow Cap", "cone", [
            0,
            0.9,
            0
        ], [
            0.4,
            0.35,
            0.4
        ], "#e2e8f0");
        add("Mountain 2", "cone", [
            0.8,
            0.3,
            0.3
        ], [
            0.7,
            0.7,
            0.7
        ], "#78716c", [
            0,
            0.5,
            0
        ]);
        add("Mountain 3", "cone", [
            -0.7,
            0.25,
            -0.2
        ], [
            0.6,
            0.5,
            0.5
        ], "#78716c", [
            0,
            1,
            0
        ]);
        add("Ground", "box", [
            0,
            -0.05,
            0
        ], [
            3,
            0.1,
            2.5
        ], "#65a30d");
    } else if (/chair|seat/.test(lower)) {
        const ch = baseColor === "#6b8caf" ? "#92400e" : baseColor;
        add("Seat", "box", [
            0,
            0.5,
            0
        ], [
            0.6,
            0.06,
            0.6
        ], ch);
        add("Backrest", "box", [
            0,
            0.85,
            -0.27
        ], [
            0.55,
            0.65,
            0.06
        ], ch);
        add("Leg FL", "cylinder", [
            -0.25,
            0.22,
            0.25
        ], [
            0.03,
            0.45,
            0.03
        ], "#78350f");
        add("Leg FR", "cylinder", [
            0.25,
            0.22,
            0.25
        ], [
            0.03,
            0.45,
            0.03
        ], "#78350f");
        add("Leg RL", "cylinder", [
            -0.25,
            0.22,
            -0.25
        ], [
            0.03,
            0.45,
            0.03
        ], "#78350f");
        add("Leg RR", "cylinder", [
            0.25,
            0.22,
            -0.25
        ], [
            0.03,
            0.45,
            0.03
        ], "#78350f");
    } else if (/table|desk/.test(lower)) {
        const tb = baseColor === "#6b8caf" ? "#92400e" : baseColor;
        add("Top", "box", [
            0,
            0.7,
            0
        ], [
            1.4,
            0.06,
            0.8
        ], tb);
        add("Leg FL", "cylinder", [
            -0.6,
            0.33,
            0.35
        ], [
            0.04,
            0.65,
            0.04
        ], "#78350f");
        add("Leg FR", "cylinder", [
            0.6,
            0.33,
            0.35
        ], [
            0.04,
            0.65,
            0.04
        ], "#78350f");
        add("Leg RL", "cylinder", [
            -0.6,
            0.33,
            -0.35
        ], [
            0.04,
            0.65,
            0.04
        ], "#78350f");
        add("Leg RR", "cylinder", [
            0.6,
            0.33,
            -0.35
        ], [
            0.04,
            0.65,
            0.04
        ], "#78350f");
    } else if (/robot|mech|android/.test(lower)) {
        add("Torso", "box", [
            0,
            0.6,
            0
        ], [
            0.6,
            0.7,
            0.4
        ], "#94a3b8", undefined, 0.7, 0.3);
        add("Head", "box", [
            0,
            1.15,
            0
        ], [
            0.35,
            0.3,
            0.3
        ], "#cbd5e1", undefined, 0.7, 0.3);
        add("Eye L", "sphere", [
            -0.08,
            1.2,
            0.16
        ], [
            0.05,
            0.05,
            0.03
        ], "#3b82f6");
        add("Eye R", "sphere", [
            0.08,
            1.2,
            0.16
        ], [
            0.05,
            0.05,
            0.03
        ], "#3b82f6");
        add("Antenna", "cylinder", [
            0,
            1.4,
            0
        ], [
            0.02,
            0.2,
            0.02
        ], "#475569");
        add("Antenna Tip", "sphere", [
            0,
            1.52,
            0
        ], [
            0.04,
            0.04,
            0.04
        ], "#ef4444");
        add("Arm L", "cylinder", [
            -0.45,
            0.6,
            0
        ], [
            0.06,
            0.5,
            0.06
        ], "#64748b", [
            0,
            0,
            0.2
        ], 0.7, 0.3);
        add("Arm R", "cylinder", [
            0.45,
            0.6,
            0
        ], [
            0.06,
            0.5,
            0.06
        ], "#64748b", [
            0,
            0,
            -0.2
        ], 0.7, 0.3);
        add("Leg L", "cylinder", [
            -0.15,
            0.1,
            0
        ], [
            0.08,
            0.3,
            0.08
        ], "#64748b", undefined, 0.7, 0.3);
        add("Leg R", "cylinder", [
            0.15,
            0.1,
            0
        ], [
            0.08,
            0.3,
            0.08
        ], "#64748b", undefined, 0.7, 0.3);
    } else if (/flower|rose|daisy|tulip/.test(lower)) {
        const pc = baseColor === "#6b8caf" ? "#f472b6" : baseColor;
        add("Stem", "cylinder", [
            0,
            0.5,
            0
        ], [
            0.03,
            1,
            0.03
        ], "#16a34a");
        for(let i = 0; i < 6; i++){
            const angle = i * Math.PI * 2 / 6;
            add(`Petal ${i + 1}`, "sphere", [
                Math.sin(angle) * 0.2,
                1.05,
                Math.cos(angle) * 0.2
            ], [
                0.15,
                0.08,
                0.1
            ], pc, [
                0,
                angle,
                0.5
            ]);
        }
        add("Center", "sphere", [
            0,
            1.05,
            0
        ], [
            0.1,
            0.1,
            0.1
        ], "#fbbf24");
        add("Leaf L", "sphere", [
            -0.15,
            0.4,
            0
        ], [
            0.15,
            0.06,
            0.08
        ], "#22c55e", [
            0,
            0,
            0.5
        ]);
        add("Leaf R", "sphere", [
            0.15,
            0.6,
            0
        ], [
            0.15,
            0.06,
            0.08
        ], "#22c55e", [
            0,
            0,
            -0.5
        ]);
    } else if (/airplane|plane|jet|aircraft/.test(lower)) {
        add("Fuselage", "cylinder", [
            0,
            0,
            0
        ], [
            0.2,
            1.8,
            0.2
        ], "#e2e8f0", [
            0,
            0,
            Math.PI / 2
        ]);
        add("Nose", "sphere", [
            -0.9,
            0,
            0
        ], [
            0.2,
            0.2,
            0.2
        ], "#e2e8f0");
        add("Wings", "box", [
            0,
            0,
            0
        ], [
            0.5,
            0.04,
            2.2
        ], "#94a3b8");
        add("Tail Fin", "box", [
            0.8,
            0.25,
            0
        ], [
            0.3,
            0.4,
            0.04
        ], baseColor, [
            0,
            0,
            0.3
        ]);
        add("Tail Wing", "box", [
            0.8,
            0,
            0
        ], [
            0.2,
            0.03,
            0.6
        ], "#94a3b8");
        add("Engine L", "cylinder", [
            0.1,
            -0.15,
            0.5
        ], [
            0.1,
            0.3,
            0.1
        ], "#64748b", [
            0,
            0,
            Math.PI / 2
        ]);
        add("Engine R", "cylinder", [
            0.1,
            -0.15,
            -0.5
        ], [
            0.1,
            0.3,
            0.1
        ], "#64748b", [
            0,
            0,
            Math.PI / 2
        ]);
        add("Cockpit", "sphere", [
            -0.7,
            0.1,
            0
        ], [
            0.15,
            0.1,
            0.15
        ], "#38bdf8");
    } else if (/living room|bedroom|room|interior|scandinavian/.test(lower)) {
        add("Floor", "box", [
            0,
            -0.02,
            0
        ], [
            3,
            0.04,
            2.5
        ], "#d4a373");
        add("Back Wall", "box", [
            0,
            0.75,
            -1.2
        ], [
            3,
            1.5,
            0.05
        ], "#faf5ee");
        add("Side Wall", "box", [
            -1.5,
            0.75,
            0
        ], [
            0.05,
            1.5,
            2.5
        ], "#faf5ee");
        add("Sofa Base", "box", [
            0,
            0.25,
            -0.7
        ], [
            1.4,
            0.3,
            0.6
        ], /beige/.test(lower) ? "#d4a373" : "#94a3b8");
        add("Sofa Back", "box", [
            0,
            0.45,
            -0.95
        ], [
            1.4,
            0.25,
            0.15
        ], /beige/.test(lower) ? "#c2956b" : "#787a8b");
        add("Table Top", "box", [
            0,
            0.2,
            -0.1
        ], [
            0.7,
            0.04,
            0.4
        ], "#78350f");
        add("Table Leg L", "cylinder", [
            -0.25,
            0.09,
            0
        ], [
            0.03,
            0.18,
            0.03
        ], "#451a03");
        add("Table Leg R", "cylinder", [
            0.25,
            0.09,
            0
        ], [
            0.03,
            0.18,
            0.03
        ], "#451a03");
        add("Window", "box", [
            0,
            0.9,
            -1.17
        ], [
            0.8,
            0.7,
            0.02
        ], "#bae6fd");
        add("Lamp Pole", "cylinder", [
            0.9,
            0.3,
            -0.7
        ], [
            0.02,
            0.6,
            0.02
        ], "#475569");
        add("Lamp Shade", "cone", [
            0.9,
            0.65,
            -0.7
        ], [
            0.15,
            0.12,
            0.15
        ], "#fef3c7", [
            Math.PI,
            0,
            0
        ]);
    } else if (/abstract|sculpture|art|modern/.test(lower)) {
        add("Main Form", "torusKnot", [
            0,
            0.8,
            0
        ], [
            0.5,
            0.5,
            0.5
        ], baseColor, undefined, 0.6, 0.3);
        add("Sphere", "sphere", [
            0.5,
            0.3,
            0
        ], [
            0.2,
            0.2,
            0.2
        ], baseColor);
        add("Dodecahedron", "dodecahedron", [
            -0.4,
            0.3,
            0.3
        ], [
            0.18,
            0.18,
            0.18
        ], baseColor, [
            0.5,
            0.3,
            0
        ]);
        add("Base", "cylinder", [
            0,
            0.03,
            0
        ], [
            0.5,
            0.06,
            0.5
        ], "#334155");
    } else if (/mushroom|fungus/.test(lower)) {
        const mc = baseColor === "#6b8caf" ? "#dc2626" : baseColor;
        add("Stem", "cylinder", [
            0,
            0.35,
            0
        ], [
            0.12,
            0.7,
            0.12
        ], "#fef3c7");
        add("Cap", "sphere", [
            0,
            0.8,
            0
        ], [
            0.45,
            0.25,
            0.45
        ], mc);
        add("Spot 1", "sphere", [
            -0.15,
            0.92,
            0.1
        ], [
            0.05,
            0.04,
            0.05
        ], "#fef3c7");
        add("Spot 2", "sphere", [
            0.1,
            0.95,
            -0.1
        ], [
            0.05,
            0.04,
            0.05
        ], "#fef3c7");
        add("Small Stem", "cylinder", [
            0.3,
            0.15,
            0.2
        ], [
            0.06,
            0.3,
            0.06
        ], "#fef3c7", [
            0,
            0,
            0.15
        ]);
        add("Small Cap", "sphere", [
            0.33,
            0.35,
            0.2
        ], [
            0.18,
            0.1,
            0.18
        ], mc);
    } else if (/sword|blade|weapon|dagger/.test(lower)) {
        add("Blade", "box", [
            0,
            1,
            0
        ], [
            0.08,
            1.2,
            0.02
        ], "#e2e8f0", undefined, 0.9, 0.1);
        add("Blade Tip", "cone", [
            0,
            1.65,
            0
        ], [
            0.04,
            0.12,
            0.01
        ], "#e2e8f0", undefined, 0.9, 0.1);
        add("Guard", "box", [
            0,
            0.38,
            0
        ], [
            0.25,
            0.04,
            0.06
        ], "#ca8a04", undefined, 0.7, 0.3);
        add("Grip", "cylinder", [
            0,
            0.2,
            0
        ], [
            0.04,
            0.3,
            0.04
        ], "#78350f");
        add("Pommel", "sphere", [
            0,
            0.04,
            0
        ], [
            0.06,
            0.06,
            0.06
        ], "#ca8a04", undefined, 0.7, 0.3);
    } else if (/person|man|woman|human|figure|character/.test(lower)) {
        add("Head", "sphere", [
            0,
            1.4,
            0
        ], [
            0.2,
            0.22,
            0.2
        ], "#d4a373");
        add("Torso", "box", [
            0,
            0.95,
            0
        ], [
            0.45,
            0.65,
            0.25
        ], baseColor);
        add("Arm L", "cylinder", [
            -0.35,
            0.95,
            0
        ], [
            0.06,
            0.55,
            0.06
        ], baseColor, [
            0,
            0,
            0.15
        ]);
        add("Arm R", "cylinder", [
            0.35,
            0.95,
            0
        ], [
            0.06,
            0.55,
            0.06
        ], baseColor, [
            0,
            0,
            -0.15
        ]);
        add("Leg L", "cylinder", [
            -0.12,
            0.3,
            0
        ], [
            0.08,
            0.6,
            0.08
        ], "#334155");
        add("Leg R", "cylinder", [
            0.12,
            0.3,
            0
        ], [
            0.08,
            0.6,
            0.08
        ], "#334155");
    } else if (/cube|box/.test(lower)) {
        add("Cube", "box", [
            0,
            0.5,
            0
        ], [
            1,
            1,
            1
        ], baseColor);
    } else if (/sphere|ball|orb|globe/.test(lower)) {
        add("Sphere", "sphere", [
            0,
            0.5,
            0
        ], [
            1,
            1,
            1
        ], baseColor);
    } else if (/cylinder|pipe|tube/.test(lower)) {
        add("Cylinder", "cylinder", [
            0,
            0.5,
            0
        ], [
            0.5,
            1,
            0.5
        ], baseColor);
    } else if (/torus|donut|ring/.test(lower)) {
        add("Torus", "torus", [
            0,
            0.5,
            0
        ], [
            1,
            1,
            1
        ], baseColor, [
            Math.PI / 2,
            0,
            0
        ]);
    } else if (/pyramid/.test(lower)) {
        add("Pyramid", "cone", [
            0,
            0.5,
            0
        ], [
            1,
            1,
            1
        ], baseColor);
    } else if (/temple|shrine|ancient|greek|roman/.test(lower)) {
        add("Base 1", "box", [
            0,
            0.05,
            0
        ], [
            2,
            0.1,
            1.4
        ], baseColor || "#d4c5a9");
        add("Base 2", "box", [
            0,
            0.2,
            0
        ], [
            1.8,
            0.1,
            1.2
        ], baseColor || "#d4c5a9");
        for(let i = 0; i < 5; i++){
            const x = -0.7 + i * 0.35;
            add(`Column F${i + 1}`, "cylinder", [
                x,
                0.85,
                0.45
            ], [
                0.08,
                1.2,
                0.08
            ], "#e7e5e4");
            add(`Column B${i + 1}`, "cylinder", [
                x,
                0.85,
                -0.45
            ], [
                0.08,
                1.2,
                0.08
            ], "#e7e5e4");
        }
        add("Roof", "box", [
            0,
            1.5,
            0
        ], [
            1.9,
            0.08,
            1.3
        ], "#d6d3d1");
        add("Pediment", "cone", [
            0,
            1.8,
            0
        ], [
            1.2,
            0.5,
            0.8
        ], "#d6d3d1");
    } else if (/boat|ship|yacht/.test(lower)) {
        add("Hull", "box", [
            0,
            0.15,
            0
        ], [
            1.8,
            0.3,
            0.7
        ], baseColor);
        add("Bow", "cone", [
            -1.1,
            0.15,
            0
        ], [
            0.35,
            0.4,
            0.35
        ], baseColor, [
            0,
            0,
            -Math.PI / 2
        ]);
        add("Cabin", "box", [
            0.2,
            0.5,
            0
        ], [
            0.7,
            0.4,
            0.5
        ], "#e2e8f0");
        add("Mast", "cylinder", [
            -0.2,
            0.9,
            0
        ], [
            0.03,
            1.2,
            0.03
        ], "#78716c");
        add("Sail", "cone", [
            -0.2,
            1,
            0.15
        ], [
            0.5,
            0.8,
            0.02
        ], "#fafafa");
    } else if (/truck|lorry|pickup/.test(lower)) {
        add("Cab", "box", [
            -0.5,
            0.5,
            0
        ], [
            0.8,
            0.7,
            0.9
        ], baseColor);
        add("Bed", "box", [
            0.5,
            0.3,
            0
        ], [
            1.2,
            0.4,
            0.95
        ], "#475569");
        add("Bed Wall L", "box", [
            0.5,
            0.55,
            0.45
        ], [
            1.2,
            0.1,
            0.05
        ], "#475569");
        add("Bed Wall R", "box", [
            0.5,
            0.55,
            -0.45
        ], [
            1.2,
            0.1,
            0.05
        ], "#475569");
        add("Wheel FL", "cylinder", [
            -0.5,
            0.05,
            0.5
        ], [
            0.22,
            0.14,
            0.22
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ]);
        add("Wheel FR", "cylinder", [
            0.5,
            0.05,
            0.5
        ], [
            0.22,
            0.14,
            0.22
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ]);
        add("Wheel RL", "cylinder", [
            -0.5,
            0.05,
            -0.5
        ], [
            0.22,
            0.14,
            0.22
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ]);
        add("Wheel RR", "cylinder", [
            0.5,
            0.05,
            -0.5
        ], [
            0.22,
            0.14,
            0.22
        ], "#1e293b", [
            Math.PI / 2,
            0,
            0
        ]);
    } else {
        add("Object", "dodecahedron", [
            0,
            0.5,
            0
        ], [
            0.8,
            0.8,
            0.8
        ], baseColor, [
            0.3,
            0.5,
            0
        ], 0.5, 0.3);
        add("Base", "box", [
            0,
            0.03,
            0
        ], [
            1,
            0.06,
            1
        ], "#334155");
    }
    return objects;
}
}),
"[project]/src/app/generate/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GeneratePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-ssr] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$redo$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Redo2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/redo-2.js [app-ssr] (ecmascript) <export default as Redo2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$undo$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Undo2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/undo-2.js [app-ssr] (ecmascript) <export default as Undo2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-ssr] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/box.js [app-ssr] (ecmascript) <export default as Box>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-ssr] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Triangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle.js [app-ssr] (ecmascript) <export default as Triangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cylinder$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cylinder$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/cylinder.js [app-ssr] (ecmascript) <export default as Cylinder>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-ssr] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-ssr] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/move.js [app-ssr] (ecmascript) <export default as Move>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-cw.js [app-ssr] (ecmascript) <export default as RotateCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize-2.js [app-ssr] (ecmascript) <export default as Maximize2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-ssr] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [app-ssr] (ecmascript) <export default as Wrench>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.js [app-ssr] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock.js [app-ssr] (ecmascript) <export default as Lock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Unlock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lock-open.js [app-ssr] (ecmascript) <export default as Unlock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOffIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-ssr] (ecmascript) <export default as EyeOffIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$3x3$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid3x3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grid-3x3.js [app-ssr] (ecmascript) <export default as Grid3x3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$magnet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Magnet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/magnet.js [app-ssr] (ecmascript) <export default as Magnet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-ssr] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings-2.js [app-ssr] (ecmascript) <export default as Settings2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mouse-pointer.js [app-ssr] (ecmascript) <export default as MousePointer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stlExporter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/stlExporter.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cadStore.ts [app-ssr] (ecmascript)");
;
"use client";
;
;
;
;
;
;
;
const CADViewport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/src/components/CADViewport.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
/* ─── Search Params Reader ─── */ function SearchParamsReader({ onPrompt }) {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const p = searchParams.get("prompt");
        if (p) onPrompt(p);
    }, [
        searchParams,
        onPrompt
    ]);
    return null;
}
/* ─── Number Input Component ─── */ function NumInput({ label, value, onChange, step = 0.1, color }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `text-[10px] font-bold w-3 ${color || "text-gray-500"}`,
                children: label
            }, void 0, false, {
                fileName: "[project]/src/app/generate/page.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "number",
                value: Number(value.toFixed(3)),
                onChange: (e)=>onChange(parseFloat(e.target.value) || 0),
                step: step,
                className: "w-full px-1.5 py-1 rounded bg-surface-dark border border-surface-border text-[11px] text-white text-center font-mono focus:outline-none focus:border-brand/50"
            }, void 0, false, {
                fileName: "[project]/src/app/generate/page.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/generate/page.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
/* ─── Color Presets ─── */ const COLOR_PRESETS = [
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#e2e8f0",
    "#94a3b8",
    "#334155",
    "#78350f",
    "#6b8caf",
    "#22d3ee",
    "#f472b6",
    "#fbbf24"
];
function GeneratePage() {
    // ─── Scene State ───
    const [objects, setObjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedId, setSelectedId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [transformMode, setTransformMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("translate");
    const [wireframe, setWireframe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [snapEnabled, setSnapEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [snapValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0.5);
    const [gridVisible, setGridVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    // ─── UI State ───
    const [rightPanel, setRightPanel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("properties");
    const [showOutliner, setShowOutliner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [prompt, setPrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [chatInput, setChatInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [chatMessages, setChatMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            role: "ai",
            text: "SpaceVision CAD Workspace ready.\n\nUse the prompt bar to generate models from text, or add primitives from the toolbar. Select objects to move, rotate, and scale them.\n\nKeyboard shortcuts:\nG — Move  |  R — Rotate  |  S — Scale\nDel — Delete  |  D — Duplicate\nCtrl+Z — Undo  |  Ctrl+Y — Redo"
        }
    ]);
    const chatEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // ─── History (Undo/Redo) ───
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        {
            objects: [],
            selectedId: null
        }
    ]);
    const [historyIndex, setHistoryIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const sceneRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Derived state
    const selectedObj = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>objects.find((o)=>o.id === selectedId) || null, [
        objects,
        selectedId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [
        chatMessages
    ]);
    // ─── History Management ───
    const pushHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((newObjects, newSelectedId)=>{
        setHistory((prev)=>{
            const trimmed = prev.slice(0, historyIndex + 1);
            return [
                ...trimmed,
                {
                    objects: newObjects,
                    selectedId: newSelectedId
                }
            ];
        });
        setHistoryIndex((prev)=>prev + 1);
    }, [
        historyIndex
    ]);
    const undo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (historyIndex <= 0) return;
        const entry = history[historyIndex - 1];
        setObjects(entry.objects);
        setSelectedId(entry.selectedId);
        setHistoryIndex((prev)=>prev - 1);
    }, [
        history,
        historyIndex
    ]);
    const redo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (historyIndex >= history.length - 1) return;
        const entry = history[historyIndex + 1];
        setObjects(entry.objects);
        setSelectedId(entry.selectedId);
        setHistoryIndex((prev)=>prev + 1);
    }, [
        history,
        historyIndex
    ]);
    // ─── Object Operations ───
    const updateObjects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((newObjects, newSelectedId)=>{
        setObjects(newObjects);
        const sel = newSelectedId !== undefined ? newSelectedId : selectedId;
        if (newSelectedId !== undefined) setSelectedId(sel);
        pushHistory(newObjects, sel);
    }, [
        selectedId,
        pushHistory
    ]);
    const addPrimitive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((type)=>{
        const obj = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createObject"])(type);
        const newObjects = [
            ...objects,
            obj
        ];
        setObjects(newObjects);
        setSelectedId(obj.id);
        pushHistory(newObjects, obj.id);
    }, [
        objects,
        pushHistory
    ]);
    const deleteSelected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!selectedId) return;
        const newObjects = objects.filter((o)=>o.id !== selectedId);
        setObjects(newObjects);
        setSelectedId(null);
        pushHistory(newObjects, null);
    }, [
        objects,
        selectedId,
        pushHistory
    ]);
    const duplicateSelected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!selectedObj) return;
        const dupe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["duplicateObject"])(selectedObj);
        const newObjects = [
            ...objects,
            dupe
        ];
        setObjects(newObjects);
        setSelectedId(dupe.id);
        pushHistory(newObjects, dupe.id);
    }, [
        objects,
        selectedObj,
        pushHistory
    ]);
    const updateSelectedProp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, value)=>{
        if (!selectedId) return;
        const newObjects = objects.map((o)=>o.id === selectedId ? {
                ...o,
                [key]: value
            } : o);
        setObjects(newObjects);
        pushHistory(newObjects, selectedId);
    }, [
        objects,
        selectedId,
        pushHistory
    ]);
    const handleTransformUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, pos, rot, scl)=>{
        const newObjects = objects.map((o)=>o.id === id ? {
                ...o,
                position: pos,
                rotation: rot,
                scale: scl
            } : o);
        setObjects(newObjects);
        pushHistory(newObjects, id);
    }, [
        objects,
        pushHistory
    ]);
    // ─── Generation ───
    const handleGenerate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setChatMessages((prev)=>[
                ...prev,
                {
                    role: "user",
                    text: prompt
                },
                {
                    role: "ai",
                    text: "Generating..."
                }
            ]);
        setTimeout(()=>{
            const newParts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateFromPrompt"])(prompt);
            const newObjects = [
                ...objects,
                ...newParts
            ];
            setObjects(newObjects);
            setSelectedId(null);
            pushHistory(newObjects, null);
            setIsGenerating(false);
            setChatMessages((prev)=>[
                    ...prev.slice(0, -1),
                    {
                        role: "ai",
                        text: `✅ Generated ${newParts.length} objects from: "${prompt}"\n\nClick any part to select it. Use Move/Rotate/Scale to edit. Each part is individually editable — full CAD control.`
                    }
                ]);
        }, 800);
    }, [
        prompt,
        isGenerating,
        objects,
        pushHistory
    ]);
    const handleIncomingPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((p)=>{
        setPrompt(p);
        setIsGenerating(true);
        setChatMessages((prev)=>[
                ...prev,
                {
                    role: "user",
                    text: p
                },
                {
                    role: "ai",
                    text: "Generating..."
                }
            ]);
        setTimeout(()=>{
            const newParts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateFromPrompt"])(p);
            setObjects(newParts);
            setSelectedId(null);
            pushHistory(newParts, null);
            setIsGenerating(false);
            setChatMessages((prev)=>[
                    ...prev.slice(0, -1),
                    {
                        role: "ai",
                        text: `✅ Generated ${newParts.length} objects from: "${p}"\n\nEach part is selectable. Click to select, then Move/Rotate/Scale to edit.`
                    }
                ]);
        }, 800);
    }, [
        pushHistory
    ]);
    const handleChatSend = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput("");
        setChatMessages((prev)=>[
                ...prev,
                {
                    role: "user",
                    text: msg
                }
            ]);
        // If it looks like a generation prompt
        if (/^(make|create|generate|build|model|design|add a|add an)\s/i.test(msg) || objects.length === 0 && msg.length > 5) {
            setPrompt(msg);
            setChatMessages((prev)=>[
                    ...prev,
                    {
                        role: "ai",
                        text: "Generating..."
                    }
                ]);
            setTimeout(()=>{
                const newParts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateFromPrompt"])(msg);
                const newObjects = [
                    ...objects,
                    ...newParts
                ];
                setObjects(newObjects);
                setSelectedId(null);
                pushHistory(newObjects, null);
                setChatMessages((prev)=>[
                        ...prev.slice(0, -1),
                        {
                            role: "ai",
                            text: `✅ Generated ${newParts.length} objects. Each part is individually selectable and editable.`
                        }
                    ]);
            }, 800);
        } else {
            setTimeout(()=>{
                setChatMessages((prev)=>[
                        ...prev,
                        {
                            role: "ai",
                            text: "Use the prompt bar to generate models, or add primitives from the left toolbar. Select objects to edit their properties in the right panel."
                        }
                    ]);
            }, 300);
        }
    }, [
        chatInput,
        objects,
        pushHistory
    ]);
    const handleExportSTL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (sceneRef.current) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stlExporter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["exportToSTL"])(sceneRef.current, "spacevision_model.stl");
            setChatMessages((prev)=>[
                    ...prev,
                    {
                        role: "ai",
                        text: "📥 Exported spacevision_model.stl"
                    }
                ]);
        }
    }, []);
    const handleClearScene = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setObjects([]);
        setSelectedId(null);
        setPrompt("");
        pushHistory([], null);
        setChatMessages((prev)=>[
                ...prev,
                {
                    role: "ai",
                    text: "Scene cleared."
                }
            ]);
    }, [
        pushHistory
    ]);
    // ─── Keyboard Shortcuts ───
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            // Don't intercept when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "g" || e.key === "G") {
                setTransformMode("translate");
                e.preventDefault();
            } else if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
                setTransformMode("rotate");
                e.preventDefault();
            } else if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
                setTransformMode("scale");
                e.preventDefault();
            } else if (e.key === "Delete" || e.key === "Backspace") {
                deleteSelected();
                e.preventDefault();
            } else if (e.key === "d" || e.key === "D") {
                duplicateSelected();
                e.preventDefault();
            } else if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
                undo();
                e.preventDefault();
            } else if (e.key === "y" && (e.ctrlKey || e.metaKey) || e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
                redo();
                e.preventDefault();
            } else if (e.key === "Escape") {
                setSelectedId(null);
                e.preventDefault();
            } else if (e.key === "x") {
                setSnapEnabled((prev)=>!prev);
                e.preventDefault();
            } else if (e.key === "w") {
                setWireframe((prev)=>!prev);
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handler);
        return ()=>window.removeEventListener("keydown", handler);
    }, [
        deleteSelected,
        duplicateSelected,
        undo,
        redo
    ]);
    // ─── Primitives ───
    const primitiveTypes = [
        {
            type: "box",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"],
            label: "Cube"
        },
        {
            type: "sphere",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"],
            label: "Sphere"
        },
        {
            type: "cylinder",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cylinder$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Cylinder$3e$__["Cylinder"],
            label: "Cylinder"
        },
        {
            type: "cone",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Triangle$3e$__["Triangle"],
            label: "Cone"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen pt-14 bg-surface-dark flex overflow-hidden select-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
                fallback: null,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SearchParamsReader, {
                    onPrompt: handleIncomingPrompt
                }, void 0, false, {
                    fileName: "[project]/src/app/generate/page.tsx",
                    lineNumber: 306,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/generate/page.tsx",
                lineNumber: 305,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-11 bg-surface border-r border-surface-border flex flex-col items-center py-2 gap-0.5 shrink-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setSelectedId(null),
                        title: "Select (Esc)",
                        className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${!selectedId ? "text-gray-500" : "text-gray-400 hover:text-white hover:bg-surface-lighter"}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer$3e$__["MousePointer"], {
                            className: "w-3.5 h-3.5"
                        }, void 0, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 319,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-5 border-t border-surface-border my-1"
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    [
                        {
                            mode: "translate",
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__["Move"],
                            label: "Move (G)",
                            key: "G"
                        },
                        {
                            mode: "rotate",
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCw$3e$__["RotateCw"],
                            label: "Rotate (R)",
                            key: "R"
                        },
                        {
                            mode: "scale",
                            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__["Maximize2"],
                            label: "Scale (S)",
                            key: "S"
                        }
                    ].map((tool)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setTransformMode(tool.mode),
                            title: tool.label,
                            className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${transformMode === tool.mode ? "bg-brand text-white" : "text-gray-500 hover:text-white hover:bg-surface-lighter"}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(tool.icon, {
                                className: "w-3.5 h-3.5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 340,
                                columnNumber: 13
                            }, this)
                        }, tool.mode, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 330,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-5 border-t border-surface-border my-1"
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setWireframe(!wireframe),
                        title: `Wireframe (W): ${wireframe ? "ON" : "OFF"}`,
                        className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${wireframe ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-white hover:bg-surface-lighter"}`,
                        children: wireframe ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                            className: "w-3.5 h-3.5"
                        }, void 0, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 354,
                            columnNumber: 24
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                            className: "w-3.5 h-3.5"
                        }, void 0, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 354,
                            columnNumber: 61
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 347,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setSnapEnabled(!snapEnabled),
                        title: `Snap (X): ${snapEnabled ? "ON" : "OFF"}`,
                        className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${snapEnabled ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-white hover:bg-surface-lighter"}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$magnet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Magnet$3e$__["Magnet"], {
                            className: "w-3.5 h-3.5"
                        }, void 0, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 364,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 357,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setGridVisible(!gridVisible),
                        title: `Grid: ${gridVisible ? "ON" : "OFF"}`,
                        className: `w-8 h-8 rounded-md flex items-center justify-center transition-all ${gridVisible ? "text-gray-400" : "text-gray-600"} hover:text-white hover:bg-surface-lighter`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$3x3$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid3x3$3e$__["Grid3x3"], {
                            className: "w-3.5 h-3.5"
                        }, void 0, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 374,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 367,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-5 border-t border-surface-border my-1"
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 377,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[7px] text-gray-600 font-bold tracking-wider",
                        children: "ADD"
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this),
                    primitiveTypes.map((prim)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>addPrimitive(prim.type),
                            title: `Add ${prim.label}`,
                            className: "w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(prim.icon, {
                                className: "w-3.5 h-3.5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 388,
                                columnNumber: 13
                            }, this)
                        }, prim.type, false, {
                            fileName: "[project]/src/app/generate/page.tsx",
                            lineNumber: 382,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 392,
                        columnNumber: 9
                    }, this),
                    selectedId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: duplicateSelected,
                                title: "Duplicate (D)",
                                className: "w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                    className: "w-3.5 h-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/generate/page.tsx",
                                    lineNumber: 398,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 397,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: deleteSelected,
                                title: "Delete (Del)",
                                className: "w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                    className: "w-3.5 h-3.5"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/generate/page.tsx",
                                    lineNumber: 401,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 400,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/generate/page.tsx",
                lineNumber: 310,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex flex-col min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-9 bg-surface border-b border-surface-border flex items-center justify-between px-3 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 text-xs text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"], {
                                        className: "w-3 h-3 text-brand"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 412,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold text-gray-300 text-[11px]",
                                        children: "Workspace"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 413,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-600",
                                        children: "|"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 414,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] text-gray-500",
                                        children: [
                                            objects.length,
                                            " objects"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 415,
                                        columnNumber: 13
                                    }, this),
                                    selectedObj && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-600",
                                                children: "→"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 418,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[11px] text-brand font-medium",
                                                children: selectedObj.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 419,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 411,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: undo,
                                        disabled: historyIndex <= 0,
                                        title: "Undo (Ctrl+Z)",
                                        className: "p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter disabled:opacity-30 transition-all",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$undo$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Undo2$3e$__["Undo2"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 425,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 424,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: redo,
                                        disabled: historyIndex >= history.length - 1,
                                        title: "Redo (Ctrl+Y)",
                                        className: "p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter disabled:opacity-30 transition-all",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$redo$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Redo2$3e$__["Redo2"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 428,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 427,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-px h-4 bg-surface-border mx-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 430,
                                        columnNumber: 13
                                    }, this),
                                    objects.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: handleExportSTL,
                                                className: "flex items-center gap-1 px-2 py-1 rounded bg-brand hover:bg-brand-hover text-white text-[11px] font-medium transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                        className: "w-3 h-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Export STL"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 433,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: handleClearScene,
                                                className: "flex items-center gap-1 px-2 py-1 rounded bg-surface-lighter hover:bg-surface-border text-gray-300 text-[11px] font-medium transition-colors",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                        className: "w-3 h-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 438,
                                                        columnNumber: 19
                                                    }, this),
                                                    "Clear"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 437,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-px h-4 bg-surface-border mx-1"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 443,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setRightPanel(rightPanel === "properties" ? "chat" : "properties"),
                                        title: rightPanel === "properties" ? "Switch to Chat" : "Switch to Properties",
                                        className: "p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter transition-all",
                                        children: rightPanel === "properties" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 449,
                                            columnNumber: 46
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings2$3e$__["Settings2"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 449,
                                            columnNumber: 90
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 444,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 423,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 410,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex min-h-0",
                        children: [
                            showOutliner && objects.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-48 bg-surface border-r border-surface-border flex flex-col shrink-0 overflow-hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-7 border-b border-surface-border flex items-center justify-between px-2 shrink-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] font-semibold text-gray-400 flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"], {
                                                        className: "w-3 h-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 19
                                                    }, this),
                                                    " Scene (",
                                                    objects.length,
                                                    ")"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 461,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setShowOutliner(false),
                                                className: "text-gray-600 hover:text-gray-300 transition-colors",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                    className: "w-3 h-3"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 465,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 464,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 460,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 overflow-y-auto",
                                        children: objects.map((obj)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSelectedId(obj.id === selectedId ? null : obj.id),
                                                className: `w-full flex items-center gap-1.5 px-2 py-1 text-left transition-all ${obj.id === selectedId ? "bg-brand/15 text-brand" : "text-gray-400 hover:bg-surface-lighter hover:text-white"}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-2.5 h-2.5 rounded-sm shrink-0",
                                                        style: {
                                                            backgroundColor: obj.color
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 479,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] truncate flex-1",
                                                        children: obj.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 480,
                                                        columnNumber: 21
                                                    }, this),
                                                    !obj.visible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOffIcon$3e$__["EyeOffIcon"], {
                                                        className: "w-2.5 h-2.5 text-gray-600 shrink-0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 481,
                                                        columnNumber: 38
                                                    }, this),
                                                    obj.locked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                        className: "w-2.5 h-2.5 text-gray-600 shrink-0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 482,
                                                        columnNumber: 36
                                                    }, this)
                                                ]
                                            }, obj.id, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 470,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 468,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 459,
                                columnNumber: 13
                            }, this),
                            (!showOutliner || objects.length === 0) && objects.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowOutliner(true),
                                className: "w-6 bg-surface border-r border-surface-border flex items-center justify-center text-gray-600 hover:text-gray-300 shrink-0 transition-colors",
                                title: "Show Scene Outliner",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    className: "w-3 h-3"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/generate/page.tsx",
                                    lineNumber: 496,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 491,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 relative cad-grid",
                                children: [
                                    isGenerating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-dark/70 z-10",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "w-8 h-8 text-brand animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 504,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-400",
                                                children: "Generating geometry..."
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 505,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 503,
                                        columnNumber: 15
                                    }, this),
                                    objects.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CADViewport, {
                                        objects: objects,
                                        selectedId: selectedId,
                                        transformMode: transformMode,
                                        wireframe: wireframe,
                                        snapEnabled: snapEnabled,
                                        snapValue: snapValue,
                                        gridVisible: gridVisible,
                                        onSelect: setSelectedId,
                                        onDeselect: ()=>setSelectedId(null),
                                        onTransformUpdate: handleTransformUpdate,
                                        onSceneReady: (scene)=>{
                                            sceneRef.current = scene;
                                        },
                                        className: "w-full h-full"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 flex flex-col items-center justify-center gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-16 h-16 rounded-2xl bg-surface-lighter/30 border border-surface-border flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"], {
                                                    className: "w-8 h-8 text-gray-600"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 527,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 526,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-400 font-medium mb-1",
                                                        children: "Empty workspace"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 530,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-600 max-w-xs",
                                                        children: "Type a prompt below to generate a model, or add primitives from the toolbar"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 531,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 529,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 525,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-0 left-0 right-0 p-2.5 z-20",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "max-w-xl mx-auto flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: prompt,
                                                    onChange: (e)=>setPrompt(e.target.value),
                                                    onKeyDown: (e)=>{
                                                        if (e.key === "Enter") handleGenerate();
                                                    },
                                                    placeholder: "Describe a 3D model... (e.g. 'a house with a red roof')",
                                                    className: "flex-1 px-3 py-2 rounded-lg bg-surface/95 backdrop-blur-sm border border-surface-border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 transition-colors shadow-lg"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 539,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: handleGenerate,
                                                    disabled: !prompt.trim() || isGenerating,
                                                    className: "px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg",
                                                    children: [
                                                        isGenerating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                            className: "w-3.5 h-3.5 animate-spin"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 552,
                                                            columnNumber: 35
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                                            className: "w-3.5 h-3.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 552,
                                                            columnNumber: 86
                                                        }, this),
                                                        "Generate"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 547,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 538,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 537,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 501,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-64 bg-surface border-l border-surface-border flex flex-col shrink-0 overflow-hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-7 border-b border-surface-border flex shrink-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setRightPanel("properties"),
                                                className: `flex-1 text-[10px] font-semibold transition-all ${rightPanel === "properties" ? "text-brand bg-brand/5 border-b border-brand" : "text-gray-500 hover:text-white"}`,
                                                children: "Properties"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 563,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setRightPanel("chat"),
                                                className: `flex-1 text-[10px] font-semibold transition-all ${rightPanel === "chat" ? "text-brand bg-brand/5 border-b border-brand" : "text-gray-500 hover:text-white"}`,
                                                children: "AI Chat"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 571,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 562,
                                        columnNumber: 13
                                    }, this),
                                    rightPanel === "properties" ? /* ─── Properties Panel ─── */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 overflow-y-auto p-2.5 space-y-3",
                                        children: selectedObj ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 588,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            value: selectedObj.name,
                                                            onChange: (e)=>updateSelectedProp("name", e.target.value),
                                                            className: "w-full mt-1 px-2 py-1.5 rounded bg-surface-dark border border-surface-border text-[11px] text-white focus:outline-none focus:border-brand/50"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 589,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 587,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 599,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[11px] text-gray-300 mt-1 capitalize",
                                                            children: selectedObj.type
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 600,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 598,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Position"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 605,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid grid-cols-3 gap-1 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "X",
                                                                    color: "text-red-400",
                                                                    value: selectedObj.position[0],
                                                                    onChange: (v)=>updateSelectedProp("position", [
                                                                            v,
                                                                            selectedObj.position[1],
                                                                            selectedObj.position[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 607,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Y",
                                                                    color: "text-green-400",
                                                                    value: selectedObj.position[1],
                                                                    onChange: (v)=>updateSelectedProp("position", [
                                                                            selectedObj.position[0],
                                                                            v,
                                                                            selectedObj.position[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 608,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Z",
                                                                    color: "text-blue-400",
                                                                    value: selectedObj.position[2],
                                                                    onChange: (v)=>updateSelectedProp("position", [
                                                                            selectedObj.position[0],
                                                                            selectedObj.position[1],
                                                                            v
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 609,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 606,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 604,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Rotation (rad)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 615,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid grid-cols-3 gap-1 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "X",
                                                                    color: "text-red-400",
                                                                    value: selectedObj.rotation[0],
                                                                    step: 0.05,
                                                                    onChange: (v)=>updateSelectedProp("rotation", [
                                                                            v,
                                                                            selectedObj.rotation[1],
                                                                            selectedObj.rotation[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 617,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Y",
                                                                    color: "text-green-400",
                                                                    value: selectedObj.rotation[1],
                                                                    step: 0.05,
                                                                    onChange: (v)=>updateSelectedProp("rotation", [
                                                                            selectedObj.rotation[0],
                                                                            v,
                                                                            selectedObj.rotation[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 618,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Z",
                                                                    color: "text-blue-400",
                                                                    value: selectedObj.rotation[2],
                                                                    step: 0.05,
                                                                    onChange: (v)=>updateSelectedProp("rotation", [
                                                                            selectedObj.rotation[0],
                                                                            selectedObj.rotation[1],
                                                                            v
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 619,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 616,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 614,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Scale"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 625,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid grid-cols-3 gap-1 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "X",
                                                                    color: "text-red-400",
                                                                    value: selectedObj.scale[0],
                                                                    onChange: (v)=>updateSelectedProp("scale", [
                                                                            v,
                                                                            selectedObj.scale[1],
                                                                            selectedObj.scale[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 627,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Y",
                                                                    color: "text-green-400",
                                                                    value: selectedObj.scale[1],
                                                                    onChange: (v)=>updateSelectedProp("scale", [
                                                                            selectedObj.scale[0],
                                                                            v,
                                                                            selectedObj.scale[2]
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 628,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NumInput, {
                                                                    label: "Z",
                                                                    color: "text-blue-400",
                                                                    value: selectedObj.scale[2],
                                                                    onChange: (v)=>updateSelectedProp("scale", [
                                                                            selectedObj.scale[0],
                                                                            selectedObj.scale[1],
                                                                            v
                                                                        ])
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 629,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 626,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 624,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Color"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 635,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "color",
                                                                    value: selectedObj.color,
                                                                    onChange: (e)=>updateSelectedProp("color", e.target.value),
                                                                    className: "w-7 h-7 rounded border border-surface-border cursor-pointer bg-transparent"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 637,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: selectedObj.color,
                                                                    onChange: (e)=>updateSelectedProp("color", e.target.value),
                                                                    className: "flex-1 px-2 py-1 rounded bg-surface-dark border border-surface-border text-[10px] text-white font-mono focus:outline-none focus:border-brand/50"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 643,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 636,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex flex-wrap gap-1 mt-1.5",
                                                            children: COLOR_PRESETS.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>updateSelectedProp("color", c),
                                                                    className: `w-4 h-4 rounded-sm border transition-all ${selectedObj.color === c ? "border-white scale-110" : "border-surface-border hover:border-gray-500"}`,
                                                                    style: {
                                                                        backgroundColor: c
                                                                    }
                                                                }, c, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 652,
                                                                    columnNumber: 27
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 650,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 634,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[9px] font-bold text-gray-500 uppercase tracking-wider",
                                                            children: "Material"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 666,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-1.5 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-[10px] text-gray-400",
                                                                            children: "Metalness"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 669,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-[10px] text-gray-500 font-mono",
                                                                            children: selectedObj.metalness.toFixed(2)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 670,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 668,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "range",
                                                                    min: "0",
                                                                    max: "1",
                                                                    step: "0.05",
                                                                    value: selectedObj.metalness,
                                                                    onChange: (e)=>updateSelectedProp("metalness", parseFloat(e.target.value)),
                                                                    className: "w-full h-1 accent-brand"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 672,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-[10px] text-gray-400",
                                                                            children: "Roughness"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 679,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-[10px] text-gray-500 font-mono",
                                                                            children: selectedObj.roughness.toFixed(2)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 680,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 678,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "range",
                                                                    min: "0",
                                                                    max: "1",
                                                                    step: "0.05",
                                                                    value: selectedObj.roughness,
                                                                    onChange: (e)=>updateSelectedProp("roughness", parseFloat(e.target.value)),
                                                                    className: "w-full h-1 accent-brand"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 682,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 667,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 665,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>updateSelectedProp("visible", !selectedObj.visible),
                                                            className: `flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${selectedObj.visible ? "bg-surface-lighter text-gray-300" : "bg-yellow-500/10 text-yellow-400"}`,
                                                            children: [
                                                                selectedObj.visible ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 699,
                                                                    columnNumber: 48
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 699,
                                                                    columnNumber: 78
                                                                }, this),
                                                                selectedObj.visible ? "Visible" : "Hidden"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 693,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>updateSelectedProp("locked", !selectedObj.locked),
                                                            className: `flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${selectedObj.locked ? "bg-red-500/10 text-red-400" : "bg-surface-lighter text-gray-300"}`,
                                                            children: [
                                                                selectedObj.locked ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lock$3e$__["Lock"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 708,
                                                                    columnNumber: 47
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lock$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Unlock$3e$__["Unlock"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 708,
                                                                    columnNumber: 78
                                                                }, this),
                                                                selectedObj.locked ? "Locked" : "Unlocked"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 702,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 692,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2 pt-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: duplicateSelected,
                                                            className: "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-surface-lighter hover:bg-surface-border text-gray-300 text-[10px] font-medium transition-all",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 716,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " Duplicate"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 715,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: deleteSelected,
                                                            className: "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-medium transition-all",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                    className: "w-3 h-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 719,
                                                                    columnNumber: 25
                                                                }, this),
                                                                " Delete"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 718,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 714,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col items-center justify-center h-full text-center px-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer$3e$__["MousePointer"], {
                                                    className: "w-6 h-6 text-gray-600 mb-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 725,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[11px] text-gray-500 mb-1 font-medium",
                                                    children: "No object selected"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 726,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] text-gray-600",
                                                    children: "Click an object in the viewport or outliner to edit its properties"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 727,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-4 space-y-1 text-left w-full",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-[9px] font-bold text-gray-600 uppercase tracking-wider",
                                                            children: "Shortcuts"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 729,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gray-500",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "G"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 731,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Move"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 731,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "R"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 732,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Rotate"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 732,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "S"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 733,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Scale"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 733,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "W"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 734,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Wireframe"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 734,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "D"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 735,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Duplicate"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 735,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "Del"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 736,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Delete"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 736,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "X"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 737,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Snap"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 737,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "Esc"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 738,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Deselect"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 738,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "⌘Z"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 739,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Undo"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 739,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                                                            className: "text-brand",
                                                                            children: "⌘Y"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                                            lineNumber: 740,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        " Redo"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                                    lineNumber: 740,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 730,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 728,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/generate/page.tsx",
                                            lineNumber: 724,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/generate/page.tsx",
                                        lineNumber: 583,
                                        columnNumber: 15
                                    }, this) : /* ─── Chat Panel ─── */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0",
                                                children: [
                                                    chatMessages.map((msg, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed whitespace-pre-line ${msg.role === "user" ? "bg-brand/20 text-blue-100 rounded-br-sm" : "bg-surface-lighter text-gray-300 rounded-bl-sm"}`,
                                                                children: msg.text
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/generate/page.tsx",
                                                                lineNumber: 752,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, i, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 751,
                                                            columnNumber: 21
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        ref: chatEndRef
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/generate/page.tsx",
                                                        lineNumber: 761,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 749,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-2 border-t border-surface-border shrink-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-1.5",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            value: chatInput,
                                                            onChange: (e)=>setChatInput(e.target.value),
                                                            onKeyDown: (e)=>{
                                                                if (e.key === "Enter") handleChatSend();
                                                            },
                                                            placeholder: "Describe a model...",
                                                            className: "flex-1 px-2.5 py-1.5 rounded bg-surface-lighter border border-surface-border text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-brand/50"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 765,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: handleChatSend,
                                                            disabled: !chatInput.trim(),
                                                            className: "p-1.5 rounded bg-brand hover:bg-brand-hover disabled:opacity-50 text-white transition-colors",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                                                className: "w-3 h-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/generate/page.tsx",
                                                                lineNumber: 774,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/generate/page.tsx",
                                                            lineNumber: 773,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/generate/page.tsx",
                                                    lineNumber: 764,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/generate/page.tsx",
                                                lineNumber: 763,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 560,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 455,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-5 bg-surface border-t border-surface-border flex items-center px-3 text-[9px] text-gray-600 gap-4 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Objects: ",
                                    objects.length
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 785,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Mode: ",
                                    transformMode
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 786,
                                columnNumber: 11
                            }, this),
                            snapEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-yellow-500",
                                children: [
                                    "Snap: ",
                                    snapValue
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 787,
                                columnNumber: 27
                            }, this),
                            wireframe && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-blue-400",
                                children: "Wireframe"
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 788,
                                columnNumber: 25
                            }, this),
                            selectedObj && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-brand",
                                children: [
                                    selectedObj.name,
                                    " (",
                                    selectedObj.type,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 789,
                                columnNumber: 27
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-auto",
                                children: "SpaceVision CAD"
                            }, void 0, false, {
                                fileName: "[project]/src/app/generate/page.tsx",
                                lineNumber: 790,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/generate/page.tsx",
                        lineNumber: 784,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/generate/page.tsx",
                lineNumber: 408,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/generate/page.tsx",
        lineNumber: 304,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_fdcd8bb4._.js.map