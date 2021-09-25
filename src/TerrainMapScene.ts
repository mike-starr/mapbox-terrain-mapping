import * as THREE from "three";
import Shaders from "./Shaders";
import TileData from "./TileData";

type ShadingMode = "gradient" | "sourceTexture";

const displacementTextureWidth = 256;
const displacementTextureHeight = 256;

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

  // Material that deforms the mesh colors it based on the
  // selected shading mode.
  private readonly heightMapMaterial: THREE.ShaderMaterial;

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
   * Updates the scene with the provided tile data.
   *
   * @param tileData The tile data.
   */
  loadTile(tileData: TileData) {
    tileData.copyTo(this.displacementTextureData);

    this.heightMapMaterial.uniforms["displacementMinHeight"] = {
      value: tileData.minHeight
    };

    this.heightMapMaterial.uniforms["displacementMaxHeight"] = {
      value: tileData.maxHeight
    };

    // Height map values are normalized to a range that displays nicely,
    // from 0.0 to 1.5. A scale value of 1 is used when there's no height variation;
    // scaling is irrelevant when all heights are 0.
    const heightRange = tileData.maxHeight - tileData.minHeight;
    this.heightMapMaterial.uniforms["displacementScale"] = {
      value: heightRange === 0 ? 1 : 1.5 / heightRange
    };

    this.displacementTexture.needsUpdate = true;
    this.heightMapMaterial.needsUpdate = true;
    this.sourceTexture.needsUpdate = true;
  }

  /**
   * Resets the scene to a zero-height map.
   */
  clear() {
    this.heightMapMaterial.uniforms["displacementMinHeight"] = {
      value: 0
    };

    this.heightMapMaterial.uniforms["displacementMaxHeight"] = {
      value: 0
    };

    this.displacementTextureData.fill(0);
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
