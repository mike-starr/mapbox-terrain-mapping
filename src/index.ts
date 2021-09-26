import TerrainMapScene from "./TerrainMapScene";
import TileRetriever from "./TileRetriever";

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

const errorMessage = document.getElementById("error-message") as HTMLDivElement;

const scene = new TerrainMapScene(outputCanvas, tileCanvas);
const tileRetriever = new TileRetriever(tileCanvas);

// Set up an event listener on the Update button to trigger
// an update of the scene's data.
updateButton.addEventListener("click", async () => {
  try {
    errorMessage.hidden = true;
    updateButton.disabled = true;

    const tileData = await tileRetriever.retrieveTile(
      parseFloat(longitudeInput.value),
      parseFloat(latitudeInput.value),
      parseFloat(zoomInput.value)
    );

    scene.loadTile(tileData);
  } catch {
    // When a tile fetch fails, clear the source image canvas and
    // tell the scene to zero out the height map.
    tileCanvas
      .getContext("2d")
      ?.clearRect(0, 0, tileCanvas.width, tileCanvas.height);
    scene.reset();
    errorMessage.hidden = false;
  } finally {
    updateButton.disabled = false;
  }
});

// Change shading mode per selector.
shadingSelector.addEventListener("change", () => {
  switch (shadingSelector.value) {
    case "gradient":
    case "sourceTexture":
    case "normals":
    case "lighting":
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
