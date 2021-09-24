import TerrainMapScene from "./TerrainMapScene";

const outputCanvas = document.getElementById(
  "threejs-canvas"
) as HTMLCanvasElement;

const tileCanvas = document.getElementById("tile-canvas") as HTMLCanvasElement;

const updateButton = document.getElementById(
  "button-update"
) as HTMLButtonElement;

const longitudeInput = document.getElementById(
  "input-longitude"
) as HTMLInputElement;

const latitudeInput = document.getElementById(
  "input-latitude"
) as HTMLInputElement;

const zoomInput = document.getElementById("input-zoom") as HTMLInputElement;

const scene = new TerrainMapScene(outputCanvas, tileCanvas);

updateButton.addEventListener("click", async () => {
  try {
    updateButton.disabled = true;
    await scene.loadTile(
      parseFloat(longitudeInput.value),
      parseFloat(latitudeInput.value),
      parseFloat(zoomInput.value)
    );
  } finally {
    updateButton.disabled = false;
  }
});

let lastTime = -1;
const animate = (timestamp: number) => {
  const elapsed = lastTime < 0 ? 0 : timestamp - lastTime;
  lastTime = timestamp;

  scene.update(elapsed);
  scene.render();

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
