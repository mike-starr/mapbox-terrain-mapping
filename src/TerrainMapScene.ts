import * as THREE from "three";
import TileRetriever from "./TileRetriever";
import Shaders from "./Shaders";

type ShadingMode = "gradient" | "sourceTexture";

const displacementTextureWidth = 256;
const displacementTextureHeight = 256;

/**
 * Maintains the threejs scene used to render the hightmap data.
 */
export default class TerrainMapScene {
  private readonly tileRetriever: TileRetriever;
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

  // Material that deforms the mesh colors it based on the
  // selected shading mode.
  private readonly heightMapMaterial: THREE.ShaderMaterial;

  private _shadingMode: ShadingMode = "gradient";

  /**
   * @param outputCanvas Canvas used to render the hight-mapped mesh.
   * @param tileCanvas Canvas used to render the raw tile image retrieved from MapBox.
   */
  constructor(outputCanvas: HTMLCanvasElement, tileCanvas: HTMLCanvasElement) {
    this.tileRetriever = new TileRetriever(tileCanvas);

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

    this.geometry = new THREE.PlaneGeometry(4.0, 4.0, 256, 256);

    this.sourceTexture = new THREE.CanvasTexture(
      tileCanvas,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearMipMapLinearFilter
    );

    this.displacementTextureData = new Float32Array(
      displacementTextureWidth * displacementTextureHeight
    );

    this.displacementTexture = new THREE.DataTexture(
      this.displacementTextureData,
      displacementTextureWidth,
      displacementTextureHeight,
      THREE.RedFormat,
      THREE.FloatType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping
    );

    this.displacementTexture.generateMipmaps = false;

    // The origin of the source image and texture are flipped on the y-axis.
    this.displacementTexture.flipY = true;

    this.heightMapMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sourceTexture: { value: this.sourceTexture },
        displacementTexture: { value: this.displacementTexture },
        displacementMinHeight: { value: 0 },
        displacementMaxHeight: { value: 1 },
        displacementScale: { value: 1 }
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
   * Triggers an update of the rendered tile data. Any failures encountered
   * in the process (error from mapbox API, invalid input, etc.) will result
   * in a zero-height mesh being rendered.
   *
   * @param longitude Longitude of desired location.
   * @param latitude Latitude of desired location.
   * @param zoom Desired zoom level.
   */
  async loadTile(longitude: number, latitude: number, zoom: number) {
    let minHeight = 0;
    let maxHeight = 0;

    try {
      const tileData = await this.tileRetriever.retrieveTile(
        longitude,
        latitude,
        zoom
      );

      minHeight = tileData.minHeight;
      maxHeight = tileData.maxHeight;
      tileData.copyTo(this.displacementTextureData);
    } catch (error) {
      console.log(
        `Failed to retrieve tile at lon: ${longitude} lat: ${latitude} zoom: ${zoom}`
      );
      this.displacementTextureData.fill(0);
    }

    this.heightMapMaterial.uniforms["displacementMinHeight"] = {
      value: minHeight
    };

    this.heightMapMaterial.uniforms["displacementMaxHeight"] = {
      value: maxHeight
    };

    // Height map values are normalized to a range that displays nicely,
    // from 0.0 to 1.5. A value of 1.0 is used when there's no height variation;
    // scaling is irrelevant when all heights are 0.
    const heightRange = maxHeight - minHeight;
    this.heightMapMaterial.uniforms["displacementScale"] = {
      value: 1.5 / (heightRange === 0 ? 1 : heightRange)
    };

    this.displacementTexture.needsUpdate = true;
    this.heightMapMaterial.needsUpdate = true;
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
    this.mesh.rotation.z += (elapsedMs / 1000) * (Math.PI / 10);
  }

  /**
   * Frame render.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
