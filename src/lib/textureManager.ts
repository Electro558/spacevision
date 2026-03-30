"use client";

import * as THREE from "three";

const loader = new THREE.TextureLoader();

const cache = new Map<string, THREE.Texture>();

const TEXTURE_CONFIG: Record<string, { path: string; repeat: [number, number] }> = {
  wood: { path: "/textures/wood.jpg", repeat: [2, 2] },
  brushedMetal: { path: "/textures/brushedMetal.jpg", repeat: [3, 3] },
  brick: { path: "/textures/brick.jpg", repeat: [2, 2] },
  stone: { path: "/textures/stone.jpg", repeat: [2, 2] },
};

export const AVAILABLE_TEXTURES: string[] = Object.keys(TEXTURE_CONFIG);

export function getTexture(key: string): THREE.Texture | null {
  if (!key || key === "none" || !(key in TEXTURE_CONFIG)) {
    return null;
  }

  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const config = TEXTURE_CONFIG[key];
  const texture = loader.load(config.path);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(config.repeat[0], config.repeat[1]);

  cache.set(key, texture);
  return texture;
}

export function disposeTextures(): void {
  cache.forEach((texture) => {
    texture.dispose();
  });
  cache.clear();
}
