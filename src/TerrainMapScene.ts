import * as THREE from "three";
import TileRetriever from "./TileRetriever";
import Shaders from "./Shaders";

const displacementTextureWidth = 256;
const displacementTextureHeight = 256;

export default class TerrainMapScene {
  private readonly tileRetriever: TileRetriever;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly renderer: THREE.Renderer;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly mesh: THREE.Mesh;
  private readonly sourceTexture: THREE.CanvasTexture;
  private readonly displacementTexture: THREE.DataTexture;
  private readonly displacementTextureData: Float32Array;
  private readonly heightMapGradientMaterial: THREE.ShaderMaterial;

  constructor(outputCanvas: HTMLCanvasElement, tileCanvas: HTMLCanvasElement) {
    this.tileRetriever = new TileRetriever(tileCanvas);
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

    this.heightMapGradientMaterial = new THREE.ShaderMaterial({
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

    this.displacementTexture.generateMipmaps = false;
    this.displacementTexture.flipY = true;

    this.mesh = new THREE.Mesh(this.geometry, this.heightMapGradientMaterial);
    this.mesh.rotation.x -= Math.PI / 2;
    this.scene.add(this.mesh);

    this.camera.position.z = 3.5;
    this.camera.position.y = 2.0;
    this.camera.lookAt(new THREE.Vector3(0,0,0));
  }

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

    this.heightMapGradientMaterial.uniforms["displacementMinHeight"] = {
      value: minHeight
    };

    this.heightMapGradientMaterial.uniforms["displacementMaxHeight"] = {
      value: maxHeight
    };

    const heightRange = maxHeight - minHeight;
    this.heightMapGradientMaterial.uniforms["displacementScale"] = {
      value: 1.5 / (heightRange === 0 ? 1 : heightRange)
    };

    this.displacementTexture.needsUpdate = true;
    this.heightMapGradientMaterial.needsUpdate = true;
    this.sourceTexture.needsUpdate = true;
  }

  update(elapsed: number) {
    this.mesh.rotation.z += (elapsed / 1000) * (Math.PI / 10);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
