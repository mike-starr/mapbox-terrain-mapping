export default class Shaders {
  // Displaces vertices per height map and calculates normals.
  public static readonly TerrainMapVertexShader = `
    out vec2 vUv;
    out float height;
    out vec3 terrainNormal;
    uniform sampler2D displacementTexture;
    uniform float displacementTextureSize;

    // Adapted from http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.161.8979&rep=rep1&type=pdf
    vec3 calculateNormal(sampler2D texture, vec2 uv, float textureSize) {
      float l = textureOffset(texture, uv, ivec2(-1, 0)).r;
      float r = textureOffset(texture, uv, ivec2(1, 0)).r;
      float u = textureOffset(texture, uv, ivec2(0, 1)).r;
      float d = textureOffset(texture, uv, ivec2(0, -1)).r;

      // Done in model-space of the plane, which is in the x-y plane
      // with its normal +z.
      vec3 n;
      n.x = (l - r) * textureSize;
      n.y = (d - u) * textureSize;
      n.z = 2.0;
      return normalize(n);
    }

    void main() {
      vUv = uv;

      height = texture(displacementTexture, vec2(uv.x, uv.y)).r;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec4 displacedPosition = worldPosition + vec4(0, height, 0, 0);

      terrainNormal = (modelMatrix * vec4(calculateNormal(displacementTexture, uv, displacementTextureSize), 0.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * displacedPosition;
    }`;

  // Maps height to a color gradient.
  public static readonly TerrainMapGradientFragmentShader = `
    in float height;

    void main() {
      pc_fragColor = vec4(height, 0.1, 1.0 - height, 1.0);
    }`;

  // Colors per texture.
  public static readonly TerrainMapTexturedFragmentShader = `
    in vec2 vUv;
    uniform sampler2D sourceTexture;

    void main() {
      pc_fragColor = texture( sourceTexture, vUv );
    }`;

  // Writes normals as color.
  public static readonly TerrainMapNormalsFragmentShader = `
    in vec3 terrainNormal;

    void main() {
      pc_fragColor = vec4((terrainNormal + 1.0) / 2.0, 1.0);
    }`;

  // Lights the mesh with a single hard-coded directional light.
  public static readonly TerrainMapLightingFragmentShader = `
    in vec3 terrainNormal;

    void main() {
      vec3 lightDirection = normalize(vec3(0.6, -1.0, -0.1));
      vec3 lightColor = vec3(1.0, 1.0, 1.0);
      vec3 lightIntensity = vec3(1.0, 1.0, 1.0);
      vec4 materialDiffuse = vec4(.7, .7, .7, 1.0);

      float diffuseFactor = max(0.0, dot(terrainNormal, -lightDirection));
      vec4 diffuseLightColor = vec4(lightColor * lightIntensity * diffuseFactor, 1.0f);
      pc_fragColor = materialDiffuse * diffuseLightColor;
    }`;
}
