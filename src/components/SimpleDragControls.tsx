"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { SceneObject } from "@/lib/cadStore";
import { buildGeometry } from "@/lib/cadStore";

interface SimpleDragControlsProps {
  objects: SceneObject[];
  selectedIds: string[];
  snapEnabled: boolean;
  snapValue: number;
  orbitRef: React.RefObject<any>;
  onTransformUpdate: (
    id: string,
    pos: [number, number, number],
    rot: [number, number, number],
    scl: [number, number, number]
  ) => void;
}

export default function SimpleDragControls({
  objects,
  selectedIds,
  snapEnabled,
  snapValue,
  orbitRef,
  onTransformUpdate,
}: SimpleDragControlsProps) {
  const { scene, camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const dragState = useRef<{
    active: boolean;
    isLift: boolean; // Y-axis lift vs XZ drag
    startPositions: Map<string, [number, number, number]>;
    startHit: THREE.Vector3;
  } | null>(null);

  // Force re-render on drag for live position updates
  const [, setDragTick] = useState(0);

  const selectedObjects = useMemo(
    () => objects.filter((o) => selectedIds.includes(o.id)),
    [objects, selectedIds]
  );

  const primaryObj = useMemo(
    () =>
      selectedIds.length > 0
        ? objects.find((o) => o.id === selectedIds[selectedIds.length - 1])
        : null,
    [objects, selectedIds]
  );

  // Compute bounding box for Y-lift handle placement
  const liftHandlePos = useMemo(() => {
    if (!primaryObj) return null;
    const geo = buildGeometry(primaryObj.type, primaryObj.params, primaryObj.smoothness);
    geo.computeBoundingBox();
    const bbox = geo.boundingBox ?? new THREE.Box3();
    const topY =
      primaryObj.position[1] + bbox.max.y * primaryObj.scale[1] + 0.4;
    return new THREE.Vector3(
      primaryObj.position[0],
      topY,
      primaryObj.position[2]
    );
  }, [primaryObj]);

  const snapPos = useCallback(
    (val: number) => {
      if (!snapEnabled) return val;
      return Math.round(val / snapValue) * snapValue;
    },
    [snapEnabled, snapValue]
  );

  // Find selected meshes in the scene
  const getSelectedMeshes = useCallback(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.userData.objId &&
        selectedIds.includes(child.userData.objId)
      ) {
        meshes.push(child);
      }
    });
    return meshes;
  }, [scene, selectedIds]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // left click only

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      // Check if clicking on a selected mesh
      const selectedMeshes = getSelectedMeshes();
      if (selectedMeshes.length === 0) return;

      const hits = raycaster.intersectObjects(selectedMeshes, true);
      if (hits.length === 0) return;

      // Found a hit on a selected object — start drag
      e.stopPropagation();

      if (orbitRef.current) orbitRef.current.enabled = false;

      // Record start positions
      const startPositions = new Map<string, [number, number, number]>();
      selectedObjects.forEach((obj) => {
        startPositions.set(obj.id, [...obj.position]);
      });

      // Set up drag plane at the primary object's Y height
      const primaryY = primaryObj?.position[1] ?? 0;
      dragPlane.set(new THREE.Vector3(0, 1, 0), -primaryY);

      const startHit = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, startHit);

      dragState.current = {
        active: true,
        isLift: false,
        startPositions,
        startHit,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.current?.active) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const currentHit = new THREE.Vector3();

      if (dragState.current.isLift) {
        // Y-axis drag: use a vertical plane facing the camera
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();
        // Create a vertical plane perpendicular to camera's horizontal direction
        const vertPlane = new THREE.Plane();
        const primaryPos = primaryObj?.position ?? [0, 0, 0];
        vertPlane.setFromNormalAndCoplanarPoint(
          camDir,
          new THREE.Vector3(...primaryPos)
        );
        if (!raycaster.ray.intersectPlane(vertPlane, currentHit)) return;

        const deltaY = currentHit.y - dragState.current.startHit.y;

        selectedObjects.forEach((obj) => {
          const startPos = dragState.current!.startPositions.get(obj.id);
          if (!startPos) return;
          const newY = snapPos(startPos[1] + deltaY);
          // Update object position in scene directly for live feedback
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.objId === obj.id) {
              child.position.y = newY;
            }
          });
        });
      } else {
        // XZ drag
        if (!raycaster.ray.intersectPlane(dragPlane, currentHit)) return;

        const deltaX = currentHit.x - dragState.current.startHit.x;
        const deltaZ = currentHit.z - dragState.current.startHit.z;

        selectedObjects.forEach((obj) => {
          const startPos = dragState.current!.startPositions.get(obj.id);
          if (!startPos) return;
          const newX = snapPos(startPos[0] + deltaX);
          const newZ = snapPos(startPos[2] + deltaZ);
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.objId === obj.id) {
              child.position.x = newX;
              child.position.z = newZ;
            }
          });
        });
      }

      setDragTick((t) => t + 1);
    };

    const onPointerUp = () => {
      if (!dragState.current?.active) return;

      // Commit final positions to React state
      selectedObjects.forEach((obj) => {
        const startPos = dragState.current!.startPositions.get(obj.id);
        if (!startPos) return;

        // Read final position from the scene mesh
        let finalPos: [number, number, number] = [...obj.position];
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData.objId === obj.id) {
            finalPos = [child.position.x, child.position.y, child.position.z];
          }
        });

        onTransformUpdate(obj.id, finalPos, obj.rotation, obj.scale);
      });

      dragState.current = null;
      if (orbitRef.current) orbitRef.current.enabled = true;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    gl,
    camera,
    scene,
    raycaster,
    dragPlane,
    selectedIds,
    selectedObjects,
    primaryObj,
    orbitRef,
    onTransformUpdate,
    getSelectedMeshes,
    snapPos,
  ]);

  // Y-lift handle
  if (!primaryObj || !liftHandlePos || selectedIds.length === 0) return null;
  if (primaryObj.locked) return null;

  return (
    <group>
      {/* Y-axis lift handle */}
      <group position={liftHandlePos}>
        {/* Arrow cone */}
        <mesh
          position={[0, 0.15, 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (orbitRef.current) orbitRef.current.enabled = false;

            const startPositions = new Map<string, [number, number, number]>();
            selectedObjects.forEach((obj) => {
              startPositions.set(obj.id, [...obj.position]);
            });

            // Get the camera-facing vertical plane for Y drag
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            camDir.y = 0;
            camDir.normalize();
            const vertPlane = new THREE.Plane();
            vertPlane.setFromNormalAndCoplanarPoint(
              camDir,
              liftHandlePos
            );

            const startHit = new THREE.Vector3();
            const rect = gl.domElement.getBoundingClientRect();
            const pointer = e.nativeEvent as PointerEvent;
            const mouse = new THREE.Vector2(
              ((pointer.clientX - rect.left) / rect.width) * 2 - 1,
              -((pointer.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(vertPlane, startHit);

            dragState.current = {
              active: true,
              isLift: true,
              startPositions,
              startHit,
            };
          }}
        >
          <coneGeometry args={[0.12, 0.3, 8]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Stem line */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
