import * as THREE from "three";
import Shaders from "./Shaders";

type ShadingMode = "gradient" | "sourceTexture" | "normals" | "lighting";

const displacementTextureSize = 256;
const planeLength = 4;

/**
 * Maintains the threejs scene used to render the hightmap data.
 */
export default class TerrainMapScene {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly renderer: THREE.Renderer;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly mesh: THREE.Mesh;

  // Stores the raw image from MapBox.
  private readonly sourceTexture: THREE.CanvasTexture;

  // Stores the height map data processed from the raw image.
  private readonly displacementTexture: THREE.DataTexture;
  private readonly displacementTextureData: Float32Array;

  // Material that deforms the mesh and colors it based on the
  // selected shading mode.
  private readonly heightMapMaterial: THREE.ShaderMaterial;

  // Selected shading mode.
  private _shadingMode: ShadingMode = "gradient";

  /**
   * @param outputCanvas Canvas used to render the hight-mapped mesh.
   */
  constructor(outputCanvas: HTMLCanvasElement, tileCanvas: HTMLCanvasElement) {
    // Initialize all the persistent threejs objects.
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: outputCanvas
    });

    this.camera = new THREE.PerspectiveCamera(
      75,
      outputCanvas.width / outputCanvas.height,
      0.1,
      1000
    );

    this.geometry = new THREE.PlaneGeometry(planeLength, planeLength, 256, 256);

    this.sourceTexture = new THREE.CanvasTexture(
      tileCanvas,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearMipMapLinearFilter
    );

    this.displacementTextureData = new Float32Array(
      displacementTextureSize * displacementTextureSize
    );

    this.displacementTexture = new THREE.DataTexture(
      this.displacementTextureData,
      displacementTextureSize,
      displacementTextureSize,
      THREE.RedFormat,
      THREE.FloatType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter
    );

    this.displacementTexture.generateMipmaps = false;

    // The origin of the source image and texture are flipped on the y-axis.
    this.displacementTexture.flipY = true;

    this.heightMapMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sourceTexture: { value: this.sourceTexture },
        displacementTexture: { value: this.displacementTexture },
        displacementTexelAspect: { value: displacementTextureSize / planeLength }
      },
      vertexShader: Shaders.TerrainMapVertexShader,
      fragmentShader: Shaders.TerrainMapGradientFragmentShader
    });

    this.mesh = new THREE.Mesh(this.geometry, this.heightMapMaterial);

    // Rotate the mesh so that the height increases with the y-axis.
    this.mesh.rotation.x -= Math.PI / 2;
    this.scene.add(this.mesh);

    // Position/orient the camera to center the mesh.
    this.camera.position.z = 3.5;
    this.camera.position.y = 2.0;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  /**
   * Updates the scene with the provided tile data.
   *
   * @param tileImageData The tile data.
   */
  loadTile(tileImageData: ImageData) {
    // Convert the image data to a height map, storing the minimum
    // and maximum heights in the process.
    let minHeight = this.heightFromPixels(
      tileImageData.data[0],
      tileImageData.data[1],
      tileImageData.data[2]
    );
    let maxHeight = minHeight;

    for (let i = 0; i < this.displacementTextureData.length; ++i) {
      const imageDataArrayOffset = i * 4;

      this.displacementTextureData[i] = this.heightFromPixels(
        tileImageData.data[imageDataArrayOffset],
        tileImageData.data[imageDataArrayOffset + 1],
        tileImageData.data[imageDataArrayOffset + 2]
      );

      minHeight = Math.min(minHeight, this.displacementTextureData[i]);
      maxHeight = Math.max(maxHeight, this.displacementTextureData[i]);
    }

    // Normalize the height map from [0.0, 1.0].
    const heightRange = maxHeight - minHeight;
    const normalizationFactor = heightRange === 0 ? 1 : heightRange;
    for (let i = 0; i < this.displacementTextureData.length; ++i) {
      this.displacementTextureData[i] =
        (this.displacementTextureData[i] - minHeight) / normalizationFactor;
    }

    this.displacementTexture.needsUpdate = true;
    this.heightMapMaterial.needsUpdate = true;
    this.sourceTexture.needsUpdate = true;
  }

  /**
   * Resets the scene to a zero-height map.
   */
  reset() {
    this.displacementTextureData.fill(0);
    this.displacementTexture.needsUpdate = true;
    this.sourceTexture.needsUpdate = true;
  }

  set shadingMode(shadingMode: ShadingMode) {
    if (shadingMode === this._shadingMode) {
      return;
    }

    this._shadingMode = shadingMode;

    switch (shadingMode) {
      case "gradient":
        this.heightMapMaterial.fragmentShader =
          Shaders.TerrainMapGradientFragmentShader;
        break;
      case "sourceTexture":
        this.heightMapMaterial.fragmentShader =
          Shaders.TerrainMapTexturedFragmentShader;
        break;
      case "normals":
        this.heightMapMaterial.fragmentShader =
          Shaders.TerrainMapNormalsFragmentShader;
        break;
      case "lighting":
        this.heightMapMaterial.fragmentShader =
          Shaders.TerrainMapLightingFragmentShader;
        break;
      default:
        throw new Error("Invalid shading mode.");
    }

    this.heightMapMaterial.needsUpdate = true;
  }

  /**
   * Frame update.
   *
   * @param elapsedMs Frame time in milliseconds.
   */
  update(elapsedMs: number) {
    this.mesh.rotation.z += elapsedMs * 0.001 * (Math.PI * 0.1);
  }

  /**
   * Frame render.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Calculates height of a single pixel per the MapBox API:
   * https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
   *
   * @param r Red channel of pixel.
   * @param g Green channel of pixel.
   * @param b Blue channel of pixel.
   * @returns The height encoded in the supplied pixel.
   */
  private heightFromPixels(r: number, g: number, b: number): number {
    return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
  }
}
