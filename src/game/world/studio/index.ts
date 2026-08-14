import * as THREE from 'three';
import { loadSheet, hasSheet } from '../../../engine/sprites/SpriteLibrary';
import type { AreaWorld, DoorDef, Updatable } from '../area';
import { STUDIO_INTERACTIONS } from '../../data/studioScript';
import {
  bodyOutlineTexture,
  deviceTexture,
  everybodyNobodyTexture,
  floorTexture,
  unfinishedPainting,
  wallTexture,
  wallWritingTexture,
} from './textures';

/**
 * Marlon Graves' neural art studio — the crime scene.
 *
 * An abandoned studio in Sector 7 where Marlon's body was found. The space is
 * intimate: a single room with concrete walls, a cracked tile floor, unfinished
 * paintings on easels, a neural interface device, scattered canvases, and the
 * final artwork "Everybody/Nobody" still on the far wall. The body outline glows
 * faintly on the floor. No rain here, but the hum of the building's power
 * bleeds through, and a single flickering work-light cuts the dark.
 *
 * Layout (x is left-right, z is depth):
 *
 *   z = -8   back wall with "Everybody/Nobody" canvas
 *   z = -6   easels with unfinished paintings
 *   z = -4   neural device on a workbench
 *   z = -2   body outline on floor
 *   z =  0   scattered canvases, paint table
 *   z =  2   exit door (leads back to Sector 7)
 */

const STUDIO_DOORS: DoorDef[] = [
  {
    x: 7, z: 2, radius: 2.5,
    label: 'Exit to Sector 7',
    target: 'sector7',
    spawnX: -14,
    spawnFacing: -1,
  },
];

export function buildStudioArea(): AreaWorld {
  const scene = new THREE.Scene();
  const updatables: Updatable[] = [];
  const signLights: THREE.PointLight[] = [];
  const viewPoint = new THREE.Vector3(0, 2.4, 16);

  scene.background = new THREE.Color('#06050a');
  scene.fog = new THREE.Fog('#0a0810', 12, 48);

  // ── Floor ──
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture(256, 256),
    roughness: 0.82,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -2);
  floor.userData.noReflect = true;
  scene.add(floor);

  // ── Walls (3D volumes like the exterior) ──
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(256, 128), roughness: 0.9, metalness: 0 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#0a0808', roughness: 0.95 });

  // Back wall (z = -8)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 0.5), [darkMat, darkMat, darkMat, darkMat, wallMat, darkMat]);
  backWall.position.set(0, 3.5, -8.25);
  scene.add(backWall);

  // Left wall (x = -10)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 16), [darkMat, wallMat, darkMat, darkMat, darkMat, darkMat]);
  leftWall.position.set(-10.25, 3.5, -2);
  scene.add(leftWall);

  // Right wall (x = 10) — with a door gap
  const rightWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 8), [darkMat, wallMat, darkMat, darkMat, darkMat, darkMat]);
  rightWallTop.position.set(10.25, 5.5, -8);
  scene.add(rightWallTop);
  const rightWallBot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 16), [darkMat, wallMat, darkMat, darkMat, darkMat, darkMat]);
  rightWallBot.position.set(10.25, 1, -2);
  scene.add(rightWallBot);

  // ── The "Everybody/Nobody" painting on the back wall ──
  const paintingMat = new THREE.MeshBasicMaterial({
    map: everybodyNobodyTexture(),
    transparent: true,
  });
  const painting = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.75), paintingMat);
  painting.position.set(0, 4, -7.95);
  scene.add(painting);
  // Swap in the compiled Aseprite sheet when it exists (single "static" tag),
  // so the centrepiece gets the same art pipeline as the characters.
  void (async () => {
    if (!(await hasSheet('painting'))) return;
    const sheet = await loadSheet('painting');
    if (!sheet) return;
    const tex = sheet.frames[0]?.texture;
    if (!tex) return;
    paintingMat.map?.dispose();
    paintingMat.map = tex;
    paintingMat.needsUpdate = true;
    // Keep the painting's world height; the sheet's aspect sets the width.
    painting.geometry.dispose();
    painting.geometry = new THREE.PlaneGeometry(3.75 * sheet.aspect, 3.75);
  })();
  // Painting frame — dark wood
  const frameMat = new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.85 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 0.1), frameMat);
  frameTop.position.set(0, 5.95, -7.92);
  const frameBot = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 0.1), frameMat);
  frameBot.position.set(0, 2.13, -7.92);
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.9, 0.1), frameMat);
  frameLeft.position.set(-2.7, 4, -7.92);
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.9, 0.1), frameMat);
  frameRight.position.set(2.7, 4, -7.92);
  scene.add(frameTop, frameBot, frameLeft, frameRight);
  // Faint blue glow from the painting — the neural traces
  const paintingLight = new THREE.PointLight('#3060a0', 6, 10, 2);
  paintingLight.position.set(0, 4, -6);
  scene.add(paintingLight);
  signLights.push(paintingLight);

  // ── Easels with unfinished paintings ──
  const easelMat = new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.9 });
  function addEasel(x: number, z: number, variant: number) {
    const group = new THREE.Group();
    // Easel frame — tripod legs
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), easelMat);
    leg1.position.set(-0.3, 1.25, 0.15);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), easelMat);
    leg2.position.set(0.3, 1.25, 0.15);
    const leg3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), easelMat);
    leg3.position.set(0, 1.25, -0.3);
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), easelMat);
    crossbar.position.set(0, 0.6, 0.1);
    group.add(leg1, leg2, leg3, crossbar);
    // Canvas on easel
    const canvasMat = new THREE.MeshBasicMaterial({
      map: unfinishedPainting(variant),
      transparent: true,
    });
    const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), canvasMat);
    canvasMesh.position.set(0, 1.5, 0.05);
    group.add(canvasMesh);
    // Canvas frame edge
    const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.9 });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.05), edgeMat);
    edge.position.set(0, 2.28, 0.06);
    group.add(edge);
    group.position.set(x, 0, z);
    scene.add(group);
  }
  addEasel(-3.5, -6, 0);
  addEasel(3.5, -6, 1);

  // ── Neural device on workbench ──
  const benchMat = new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 0.85 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1), benchMat);
  bench.position.set(3, 0.4, -4);
  scene.add(bench);
  // Device sprite on the bench
  const deviceMat = new THREE.MeshBasicMaterial({
    map: deviceTexture(),
    transparent: true,
    alphaTest: 0.3,
  });
  const device = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), deviceMat);
  device.position.set(3, 0.85, -4);
  scene.add(device);
  // Flickering work light above the bench — a hanging bare bulb
  const workLight = new THREE.PointLight('#ffcc66', 10, 10, 2);
  workLight.position.set(3, 2.8, -3.5);
  scene.add(workLight);
  signLights.push(workLight);
  // Bare bulb mesh
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffdd88' });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bulbMat);
  bulb.position.set(3, 2.8, -3.5);
  scene.add(bulb);
  // Light fixture cord
  const cordMat = new THREE.MeshBasicMaterial({ color: '#0a0806' });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2), cordMat);
  cord.position.set(3, 3.9, -3.5);
  scene.add(cord);
  // Flicker controller
  class FlickerLight implements Updatable {
    private readonly base = 10;
    private target = 1;
    private level = 1;
    update(dt: number) {
      if (Math.random() < dt * 2.5) {
        this.target = Math.random() < 0.1 ? 0.15 + Math.random() * 0.25 : 1;
      }
      this.level += (this.target - this.level) * Math.min(1, dt * 20);
      workLight.intensity = this.base * this.level;
      bulbMat.color.setRGB(1 * this.level, 0.87 * this.level, 0.53 * this.level);
    }
  }
  updatables.push(new FlickerLight());

  // ── Body outline on the floor ──
  const outlineMat = new THREE.MeshBasicMaterial({
    map: bodyOutlineTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outline = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), outlineMat);
  outline.rotation.x = -Math.PI / 2;
  outline.position.set(0, 0.02, -2);
  scene.add(outline);
  // Purple glow from the iridescent residue
  const residueLight = new THREE.PointLight('#6040a0', 3, 5, 2);
  residueLight.position.set(0, 0.5, -2);
  scene.add(residueLight);
  signLights.push(residueLight);

  // ── Workbench with journal ──
  const workbench = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1), benchMat);
  workbench.position.set(-4, 0.4, 0);
  scene.add(workbench);
  // Journal — open, lying flat
  const journalMat = new THREE.MeshBasicMaterial({ color: '#3a2a1a', transparent: true });
  const journalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), journalMat);
  journalMesh.rotation.x = -Math.PI / 2;
  journalMesh.position.set(-4, 0.82, 0);
  scene.add(journalMesh);
  // Journal pages — lighter
  const pageMat = new THREE.MeshBasicMaterial({ color: '#8a7a5a', transparent: true, opacity: 0.7 });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), pageMat);
  page.rotation.x = -Math.PI / 2;
  page.position.set(-4, 0.83, 0);
  scene.add(page);
  // Paint tubes on the workbench
  const tubeColors = ['#cc4433', '#4466cc', '#66aa44'];
  for (let i = 0; i < 3; i++) {
    const tubeMat = new THREE.MeshStandardMaterial({ color: tubeColors[i], roughness: 0.6, metalness: 0.3 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), tubeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(-3.5 + i * 0.3, 0.85, 0.2);
    scene.add(tube);
  }
  // Work light above the workbench — warm, dim
  const workbenchLight = new THREE.PointLight('#ffaa66', 4, 6, 2);
  workbenchLight.position.set(-4, 2.5, 0);
  scene.add(workbenchLight);
  signLights.push(workbenchLight);

  // ── Scattered canvases on the floor ──
  const canvasFloorMat = new THREE.MeshBasicMaterial({
    map: unfinishedPainting(0),
    transparent: true,
  });
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1), canvasFloorMat);
    c.rotation.x = -Math.PI / 2;
    c.rotation.z = Math.random() * Math.PI;
    c.position.set(-1.5 + i * 0.7, 0.01, 0.5 + Math.random() * 0.3);
    scene.add(c);
  }

  // ── Wall writing (left wall) — actual text texture ──
  const writingMat = new THREE.MeshBasicMaterial({
    map: wallWritingTexture(),
    transparent: true,
    opacity: 0.85,
  });
  const writing = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), writingMat);
  writing.position.set(-9.95, 3, -4);
  writing.rotation.y = Math.PI / 2;
  scene.add(writing);

  // ── Exit door (right wall gap) ──
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 2), darkMat);
  doorFrame.position.set(10.2, 2, 2);
  scene.add(doorFrame);
  // Door frame trim
  const trimMat = new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 0.85 });
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 2.1), trimMat);
  trimTop.position.set(10.2, 4, 2);
  scene.add(trimTop);
  // Light spilling from the hallway
  const doorLight = new THREE.PointLight('#ff9a4a', 4, 5, 2);
  doorLight.position.set(9, 2, 2);
  scene.add(doorLight);
  signLights.push(doorLight);

  // ── Ceiling ──
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), darkMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 7, -2);
  ceiling.userData.noReflect = true;
  scene.add(ceiling);
  // Ceiling beam — exposed, running across
  const beamMat = new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.9 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.3), beamMat);
  beam.position.set(0, 6.8, -2);
  scene.add(beam);

  // ── Exposed pipes on the ceiling ──
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#2a2520', roughness: 0.7, metalness: 0.3 });
  const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 16, 6), pipeMat);
  pipe1.rotation.z = Math.PI / 2;
  pipe1.position.set(0, 6.5, -4);
  scene.add(pipe1);
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 16, 6), pipeMat);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.position.set(0, 6.3, 0);
  scene.add(pipe2);
  // Pipe junction
  const junction = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), pipeMat);
  junction.position.set(-5, 6.4, -2);
  scene.add(junction);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight('#1a1a2e', 0.2));
  // Cool fill from the exit direction
  const fillLight = new THREE.DirectionalLight('#2a3a5a', 0.15);
  fillLight.position.set(5, 3, 3);
  scene.add(fillLight);

  return {
    id: 'studio',
    displayName: "MARLON GRAVES' STUDIO",
    scene,
    updatables,
    signLights,
    viewPoint,
    doors: STUDIO_DOORS,
    interactions: STUDIO_INTERACTIONS,
    exterior: false,
    ambient: { color: '#1a1a2e', intensity: 0.2 },
    bounds: { min: -8.5, max: 8.5 },
    cameraTarget: { y: 1.8, z: 0 },
  };
}
