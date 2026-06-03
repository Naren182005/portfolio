export const vertexShader = `
varying vec2 vUv;
uniform float uHovered;
uniform float uScale;

void main() {
  vUv = uv;
  
  // Very subtle zoom in effect on hover
  vec3 pos = position;
  float scale = 1.0 + (uHovered * uScale);
  // Scale from the center
  pos *= scale;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fragmentShader = `
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uMouse;
uniform float uHovered;
uniform float uRadius;
uniform float uSoftness;
uniform vec2 uResolution;
uniform vec2 uImageResolution1;
uniform vec2 uImageResolution2;

varying vec2 vUv;

void main() {
  // Correct the UVs to maintain aspect ratio (background-size: cover equivalent) for Texture 1
  vec2 ratio1 = vec2(
    min((uResolution.x / uResolution.y) / (uImageResolution1.x / uImageResolution1.y), 1.0),
    min((uResolution.y / uResolution.x) / (uImageResolution1.y / uImageResolution1.x), 1.0)
  );
  
  // Correct the UVs for Texture 2
  vec2 ratio2 = vec2(
    min((uResolution.x / uResolution.y) / (uImageResolution2.x / uImageResolution2.y), 1.0),
    min((uResolution.y / uResolution.x) / (uImageResolution2.y / uImageResolution2.x), 1.0)
  );
  
  vec2 centeredUv = vUv - vec2(0.5);
  vec2 uvCover1 = centeredUv * ratio1 + vec2(0.5);
  vec2 uvCover2 = centeredUv * ratio2 + vec2(0.5);

  // Get the base colors from both textures using the correctly scaled UVs
  vec4 color1 = texture2D(uTexture1, uvCover1);
  
  // Add a slight distortion for the top layer near the mask edge
  
  // Calculate mask
  // Correct mouse distance for aspect ratio of the screen so the mask is perfectly circular
  vec2 screenRatio = vec2(uResolution.x / uResolution.y, 1.0);
  if (uResolution.y > uResolution.x) {
    screenRatio = vec2(1.0, uResolution.y / uResolution.x);
  }
  
  vec2 uvMouse = vUv * screenRatio;
  vec2 cursor = uMouse * screenRatio;

  float dist = distance(uvMouse, cursor);
  
  // Add an effect where the mask scales in when uHovered increases (from 0 to 1)
  float currentRadius = uRadius * uHovered;

  // The mask (1.0 where top image shows, 0.0 where bottom image shows)
  float mask = 1.0 - smoothstep(currentRadius - uSoftness, currentRadius + uSoftness, dist);
  
  // Add a small ripple / distortion on the edge of the mask
  vec2 distortedUv = uvCover2 + (mask * (1.0 - mask)) * 0.05 * uHovered;
  vec4 color2 = texture2D(uTexture2, distortedUv);

  // Mix between color1 and color2 based on the mask
  vec4 finalColor = mix(color1, color2, mask);

  // Add subtle light bloom/glow near the cursor using the cursor distance
  float glow = 1.0 - smoothstep(0.0, currentRadius * 1.5, dist);
  finalColor.rgb += vec3(0.05, 0.08, 0.1) * glow * uHovered;

  gl_FragColor = finalColor;
}
`;
