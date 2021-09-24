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

const shadingSelector = document.getElementById(
  "select-shading"
) as HTMLSelectElement;

// Create the scene.
const scene = new TerrainMapScene(outputCanvas, tileCanvas);

// Set up an event listener on the Update button to trigger
// an update of the scene's data.
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

shadingSelector.addEventListener("change", () => {
  switch (shadingSelector.value) {
    case "gradient":
    case "sourceTexture":
      scene.shadingMode = shadingSelector.value;
      break;
    default:
      throw new Error("Invalid shading mode.");
  }
});

// Animation frame callback to update/render the scene.
let lastTime = -1;
const animate = (timestamp: number) => {
  const elapsed = lastTime < 0 ? 0 : timestamp - lastTime;
  lastTime = timestamp;

  scene.update(elapsed);
  scene.render();

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
