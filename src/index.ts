import * as THREE from "three";
import TileRetriever from "./TileRetriever";

const scene = new THREE.Scene();

const canvas = document.getElementById("threejs-canvas") as HTMLCanvasElement;

const camera = new THREE.PerspectiveCamera(
  75,
  canvas.width / canvas.height,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

const geometry = new THREE.PlaneGeometry(4.0, 4.0, 256, 256);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x -= Math.PI / 2;
scene.add(plane);

camera.position.z = 5;
camera.position.y = 1.5;

const animate = function () {
  requestAnimationFrame(animate);

  plane.rotation.z += 0.01;

  renderer.render(scene, camera);
};

animate();
TileRetriever.retrieveTile(-75.527, 39.791, 14).then((tileData) => {
  for (let x = 0; x < tileData.width; ++x) {
    for (let y = 0; y < tileData.width; ++y) {
        // console.log(`Height: ${tileData.heightAtCoords(x, y)}`);
    }
  }
});
