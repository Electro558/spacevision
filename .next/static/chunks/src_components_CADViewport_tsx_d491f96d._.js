(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/CADViewport.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CADViewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/events-5a94e5eb.esm.js [app-client] (ecmascript) <export C as useThree>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/OrbitControls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$TransformControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/TransformControls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/Grid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoHelper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/GizmoHelper.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$GizmoViewport$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/GizmoViewport.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Environment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/Environment.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cadStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
/* ─── Selectable Mesh ─── */ function SceneMesh(param) {
    let { obj, isSelected, wireframe, onSelect, onPositionChange, onRotationChange, onScaleChange } = param;
    _s();
    const meshRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const geometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SceneMesh.useMemo[geometry]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildGeometry"])(obj.type)
    }["SceneMesh.useMemo[geometry]"], [
        obj.type
    ]);
    if (!obj.visible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
        ref: meshRef,
        geometry: geometry,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        onClick: (e)=>{
            e.stopPropagation();
            if (!obj.locked) onSelect(obj.id);
        },
        userData: {
            objId: obj.id
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                color: obj.color,
                wireframe: wireframe,
                roughness: obj.roughness,
                metalness: obj.metalness,
                flatShading: true,
                emissive: isSelected ? obj.color : "#000000",
                emissiveIntensity: isSelected ? 0.08 : 0
            }, void 0, false, {
                fileName: "[project]/src/components/CADViewport.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            isSelected && !wireframe && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                scale: [
                    1.02,
                    1.02,
                    1.02
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("primitive", {
                        object: geometry.clone(),
                        attach: "geometry"
                    }, void 0, false, {
                        fileName: "[project]/src/components/CADViewport.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshBasicMaterial", {
                        color: "#3b82f6",
                        wireframe: true,
                        transparent: true,
                        opacity: 0.3
                    }, void 0, false, {
                        fileName: "[project]/src/components/CADViewport.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/CADViewport.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/CADViewport.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
_s(SceneMesh, "2fOnDMalIvZA5iFyYBzhKHAJnxI=");
_c = SceneMesh;
/* ─── Transform Gizmo Wrapper ─── */ function TransformGizmo(param) {
    let { selectedObj, mode, snapEnabled, snapValue, onUpdate, orbitRef } = param;
    _s1();
    const transformRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const objRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const geometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TransformGizmo.useMemo[geometry]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cadStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildGeometry"])(selectedObj.type)
    }["TransformGizmo.useMemo[geometry]"], [
        selectedObj.type
    ]);
    // Disable orbit controls while dragging transform
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TransformGizmo.useEffect": ()=>{
            const controls = transformRef.current;
            if (!controls) return;
            const onDragStart = {
                "TransformGizmo.useEffect.onDragStart": ()=>{
                    if (orbitRef.current) orbitRef.current.enabled = false;
                }
            }["TransformGizmo.useEffect.onDragStart"];
            const onDragEnd = {
                "TransformGizmo.useEffect.onDragEnd": ()=>{
                    if (orbitRef.current) orbitRef.current.enabled = true;
                    // Read final transform
                    if (objRef.current) {
                        const p = objRef.current.position;
                        const r = objRef.current.rotation;
                        const s = objRef.current.scale;
                        onUpdate([
                            p.x,
                            p.y,
                            p.z
                        ], [
                            r.x,
                            r.y,
                            r.z
                        ], [
                            s.x,
                            s.y,
                            s.z
                        ]);
                    }
                }
            }["TransformGizmo.useEffect.onDragEnd"];
            controls.addEventListener("dragging-changed", {
                "TransformGizmo.useEffect": (e)=>{
                    if (e.value) onDragStart();
                    else onDragEnd();
                }
            }["TransformGizmo.useEffect"]);
            return ({
                "TransformGizmo.useEffect": ()=>{
                    controls.removeEventListener("dragging-changed", onDragStart);
                    controls.removeEventListener("dragging-changed", onDragEnd);
                }
            })["TransformGizmo.useEffect"];
        }
    }["TransformGizmo.useEffect"], [
        orbitRef,
        onUpdate
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$TransformControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransformControls"], {
        ref: transformRef,
        mode: mode,
        translationSnap: snapEnabled ? snapValue : undefined,
        rotationSnap: snapEnabled ? Math.PI / 12 : undefined,
        scaleSnap: snapEnabled ? 0.1 : undefined,
        size: 0.7,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
            ref: objRef,
            geometry: geometry,
            position: selectedObj.position,
            rotation: selectedObj.rotation,
            scale: selectedObj.scale,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                color: selectedObj.color,
                roughness: selectedObj.roughness,
                metalness: selectedObj.metalness,
                flatShading: true,
                emissive: selectedObj.color,
                emissiveIntensity: 0.08
            }, void 0, false, {
                fileName: "[project]/src/components/CADViewport.tsx",
                lineNumber: 142,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/CADViewport.tsx",
            lineNumber: 135,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/CADViewport.tsx",
        lineNumber: 127,
        columnNumber: 5
    }, this);
}
_s1(TransformGizmo, "yGWdjq0DHtv4FPajZ7vxo6javOw=");
_c1 = TransformGizmo;
/* ─── Scene Ref Pass-through ─── */ function SceneRef(param) {
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
/* ─── Background Click Deselect ─── */ function BackgroundClick(param) {
    let { onDeselect } = param;
    _s3();
    const { gl, camera, scene } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BackgroundClick.useEffect": ()=>{
            const handler = {
                "BackgroundClick.useEffect.handler": (e)=>{
                    const rect = gl.domElement.getBoundingClientRect();
                    const mouse = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"]((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
                    const raycaster = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Raycaster"]();
                    raycaster.setFromCamera(mouse, camera);
                    // Only check user meshes (exclude grid, gizmo, transform controls etc.)
                    const meshes = scene.children.filter({
                        "BackgroundClick.useEffect.handler.meshes": (c)=>c instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"] && c.userData.objId
                    }["BackgroundClick.useEffect.handler.meshes"]);
                    const hits = raycaster.intersectObjects(meshes, true);
                    if (hits.length === 0) {
                        onDeselect();
                    }
                }
            }["BackgroundClick.useEffect.handler"];
            // Use pointerdown to distinguish from drag
            gl.domElement.addEventListener("dblclick", handler);
            return ({
                "BackgroundClick.useEffect": ()=>gl.domElement.removeEventListener("dblclick", handler)
            })["BackgroundClick.useEffect"];
        }
    }["BackgroundClick.useEffect"], [
        gl,
        camera,
        scene,
        onDeselect
    ]);
    return null;
}
_s3(BackgroundClick, "3QXUT5P+V9exRiYtSPcW97lsEQ0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$5a94e5eb$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"]
    ];
});
_c3 = BackgroundClick;
function CADViewport(param) {
    let { objects, selectedId, transformMode, wireframe, snapEnabled, snapValue, gridVisible, onSelect, onDeselect, onTransformUpdate, onSceneReady, className = "" } = param;
    _s4();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const orbitRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CADViewport.useEffect": ()=>setMounted(true)
    }["CADViewport.useEffect"], []);
    const selectedObj = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CADViewport.useMemo[selectedObj]": ()=>objects.find({
                "CADViewport.useMemo[selectedObj]": (o)=>o.id === selectedId
            }["CADViewport.useMemo[selectedObj]"]) || null
    }["CADViewport.useMemo[selectedObj]"], [
        objects,
        selectedId
    ]);
    const handleTransformUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CADViewport.useCallback[handleTransformUpdate]": (pos, rot, scl)=>{
            if (selectedId) onTransformUpdate(selectedId, pos, rot, scl);
        }
    }["CADViewport.useCallback[handleTransformUpdate]"], [
        selectedId,
        onTransformUpdate
    ]);
    const handleScene = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CADViewport.useCallback[handleScene]": (scene)=>{
            if (onSceneReady) onSceneReady(scene);
        }
    }["CADViewport.useCallback[handleScene]"], [
        onSceneReady
    ]);
    if (!mounted) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-surface rounded-xl ".concat(className)
    }, void 0, false, {
        fileName: "[project]/src/components/CADViewport.tsx",
        lineNumber: 242,
        columnNumber: 24
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "canvas-container ".concat(className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Canvas"], {
            camera: {
                position: [
                    4,
                    3,
                    5
                ],
                fov: 45
            },
            onPointerMissed: ()=>onDeselect(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ambientLight", {
                    intensity: 0.45
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 250,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                    position: [
                        5,
                        8,
                        5
                    ],
                    intensity: 1,
                    color: "#e0e7ff",
                    castShadow: true
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 251,
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
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 252,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hemisphereLight", {
                    color: "#e0e7ff",
                    groundColor: "#1b1f27",
                    intensity: 0.2
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 253,
                    columnNumber: 9
                }, this),
                objects.filter((o)=>o.id !== selectedId).map((obj)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneMesh, {
                        obj: obj,
                        isSelected: false,
                        wireframe: wireframe,
                        onSelect: onSelect,
                        onPositionChange: ()=>{},
                        onRotationChange: ()=>{},
                        onScaleChange: ()=>{}
                    }, obj.id, false, {
                        fileName: "[project]/src/components/CADViewport.tsx",
                        lineNumber: 257,
                        columnNumber: 11
                    }, this)),
                selectedObj && !selectedObj.locked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TransformGizmo, {
                    selectedObj: selectedObj,
                    mode: transformMode,
                    snapEnabled: snapEnabled,
                    snapValue: snapValue,
                    onUpdate: handleTransformUpdate,
                    orbitRef: orbitRef
                }, selectedObj.id, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 271,
                    columnNumber: 11
                }, this),
                selectedObj && selectedObj.locked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneMesh, {
                    obj: selectedObj,
                    isSelected: true,
                    wireframe: wireframe,
                    onSelect: onSelect,
                    onPositionChange: ()=>{},
                    onRotationChange: ()=>{},
                    onScaleChange: ()=>{}
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 284,
                    columnNumber: 11
                }, this),
                gridVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Grid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Grid"], {
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
                        -0.01,
                        0
                    ]
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 296,
                    columnNumber: 11
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
                        fileName: "[project]/src/components/CADViewport.tsx",
                        lineNumber: 310,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 309,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Environment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Environment"], {
                    preset: "studio"
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 313,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OrbitControls"], {
                    ref: orbitRef,
                    enablePan: true,
                    enableDamping: true,
                    dampingFactor: 0.1,
                    minDistance: 1,
                    maxDistance: 25,
                    makeDefault: true
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 314,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BackgroundClick, {
                    onDeselect: onDeselect
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 324,
                    columnNumber: 9
                }, this),
                onSceneReady && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneRef, {
                    onScene: handleScene
                }, void 0, false, {
                    fileName: "[project]/src/components/CADViewport.tsx",
                    lineNumber: 325,
                    columnNumber: 26
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/CADViewport.tsx",
            lineNumber: 246,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/CADViewport.tsx",
        lineNumber: 245,
        columnNumber: 5
    }, this);
}
_s4(CADViewport, "4CD0QVAcXSRQZntHfWoIun3t8dg=");
_c4 = CADViewport;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "SceneMesh");
__turbopack_context__.k.register(_c1, "TransformGizmo");
__turbopack_context__.k.register(_c2, "SceneRef");
__turbopack_context__.k.register(_c3, "BackgroundClick");
__turbopack_context__.k.register(_c4, "CADViewport");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/CADViewport.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/CADViewport.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_CADViewport_tsx_d491f96d._.js.map