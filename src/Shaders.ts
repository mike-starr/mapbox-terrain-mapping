export default class Shaders {
  public static readonly TerrainMapVertexShader = `
    //out vec3 vNormal;
    out vec2 vUv;
    out float height;

    uniform sampler2D displacementTexture;
    uniform float displacementMinHeight;
    uniform float displacementScale;

    void main() {
      //  vNormal = normal;
      vUv = uv;

      height = texture(displacementTexture, vec2(uv.x, uv.y)).r;
      vec3 newPosition = position + vec3(0, 0, (height - displacementMinHeight) * displacementScale);
      gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    }`;

  public static readonly TerrainMapGradientFragmentShader = `
    //in vec3 vNormal;
    in vec2 vUv;
    in float height;

    uniform sampler2D sourceTexture;
    uniform float displacementMinHeight;
    uniform float displacementMaxHeight;

    void main() {
      float heightRange = displacementMaxHeight - displacementMinHeight;

      float normalizedHeight = 0.0;
      if (heightRange > 0.0) {
        normalizedHeight = (height - displacementMinHeight) / heightRange;
      }

      pc_fragColor = vec4(normalizedHeight, 0.1, 1.0 - normalizedHeight, 1.0);
      //pc_fragColor = texture( sourceTexture, vUv );
    }`;
}
