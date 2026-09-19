// Imported from the Swyzzle project (WebGL melt shaders).

const noiseHelpers = `
  float random(vec2 v) {
    return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noiseOverTime(vec2 v, float time) {
    vec2 iUv = floor(v * 12.1) * (1.0 + sin(time));
    vec2 fUv = fract(v * 12.1) * (1.0 + sin(time));
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float noiseWithoutTime(vec2 v) {
    vec2 iUv = floor(v * 10.1);
    vec2 fUv = fract(v * 10.1);
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float noise(vec2 v, float time) {
    vec2 iUv = floor(v * 12.1) * (1.0 + sin(time));
    vec2 fUv = fract(v * 12.1) * (1.0 + sin(time));
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`;

export const vertexShader = `
  attribute vec2 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vUV;
  uniform float uFlipY;

  void main() {
    gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
    vUV = vec2(aTexCoord.x, mix(aTexCoord.y, 1.0 - aTexCoord.y, uFlipY));
  }
`;

export const displayFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uTexture;

  void main() {
    gl_FragColor = texture2D(uTexture, vUV);
  }
`;

export const swyzzleFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
               f.y);
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float distanceFromPointer = length((vUV - uPointer) * aspect);
    float influence = exp(-distanceFromPointer * 13.0);
    vec2 drag = uVelocity * influence * 0.022;

    float bands = noise(vec2(vUV.x * 8.0, vUV.y * 2.0 + uTime * 0.08));
    float melt = smoothstep(0.35, 0.9, bands) * (0.002 + uTime * 0.000035);
    vec2 warped = clamp(vUV - drag + vec2((bands - 0.5) * 0.002, melt), 0.0, 1.0);

    vec4 fresh = texture2D(uImage, warped);
    vec4 previous = texture2D(uFeedback, clamp(warped + vec2(0.0, melt * 0.4), 0.0, 1.0));
    gl_FragColor = mix(fresh, previous, 0.91);
  }
`;

export const fluidFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  void main() {
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float distanceFromPointer = length((vUV - uPointer) * aspect);
    float influence = exp(-distanceFromPointer * 18.0);
    vec2 flow = uVelocity * influence * 0.035;
    flow += vec2(sin(vUV.y * 30.0 + uTime) * pixel.x,
                 cos(vUV.x * 24.0 + uTime * 0.8) * pixel.y) * 2.0;

    vec2 sampleUV = clamp(vUV - flow, 0.0, 1.0);
    vec4 previous = texture2D(uFeedback, sampleUV);
    vec4 fresh = texture2D(uImage, sampleUV);
    gl_FragColor = mix(fresh, previous, 0.965);
  }
`;

export const ogFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${noiseHelpers}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uv, pointer), 0.001);
    vec2 drag = 0.0001 * uVelocity / (dist * dist);

    vec2 transformedUV = vUV + drag;
    transformedUV.y -= uTime / 100000.0 * tan(vUV.x + 0.5 + noiseWithoutTime(sin(vUV.x) * vUV.xy)) * 0.0001 * noiseWithoutTime(vUV);
    transformedUV.x -= uTime / 100000.0 * tan(vUV.x + 0.5 + noiseWithoutTime(tan(vUV.x) * vUV.xy)) * 0.0001 * noiseWithoutTime(vUV);

    vec2 transformedUV2 = vUV + drag;
    transformedUV2.y = transformedUV.y - (vUV.x + noiseOverTime(vUV.xy, uTime)) * 0.01 * noiseOverTime(vUV, uTime);

    vec4 tex = texture2D(uFeedback, transformedUV);
    vec4 texOff2 = texture2D(uFeedback, transformedUV2);
    gl_FragColor = mix(tex, texOff2, 0.01);
  }
`;

export const blendmeltFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${noiseHelpers}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 speedTexel = vUV + 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, vUV);
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
    vec2 transformedUV = vUV;
    transformedUV.x += length(texel.rgb) * noiseOverTime(vUV, uTime) * sin(uTime) * pixel.x;
    transformedUV.y += length(texel.rgb) * noiseOverTime(vUV, uTime) * sin(uTime / 3.1414) * pixel.y;

    gl_FragColor = mix(texture2D(uFeedback, speedTexel), texture2D(uFeedback, transformedUV), 0.5);
  }
`;

export const rgbFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${noiseHelpers}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 velocity = 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, vUV);
    vec4 texelr = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.001 + vUV + velocity);
    vec4 texelg = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.0011 + vUV + velocity * 1.2);
    vec4 texelb = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.0012 + vUV + velocity * 1.1);
    vec4 texel2 = vec4(texelr.r, texelg.g, texelb.b, 1.0);
    gl_FragColor = mix(texel, texel2, 0.95);
  }
`;

export const subtleFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${noiseHelpers}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 speedUV = vUV + 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, speedUV);
    vec4 texel2 = texture2D(uFeedback, fract(vUV * 0.999 + 0.001 * noise(vUV, uTime)));
    gl_FragColor = mix(texel, texel2, 0.3);
  }
`;

export const gameOfStrifeFragmentShader = `
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  vec4 maxNeighbor(vec4 center, vec4 n0, vec4 n1, vec4 n2, vec4 n3, vec4 n4, vec4 n5, vec4 n6, vec4 n7) {
    vec4 result = center;
    result = length(n0) > length(result) ? n0 : result;
    result = length(n1) > length(result) ? n1 : result;
    result = length(n2) > length(result) ? n2 : result;
    result = length(n3) > length(result) ? n3 : result;
    result = length(n4) > length(result) ? n4 : result;
    result = length(n5) > length(result) ? n5 : result;
    result = length(n6) > length(result) ? n6 : result;
    result = length(n7) > length(result) ? n7 : result;
    return result;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));

    vec4 n0 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, 1.0));
    vec4 n1 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, 0.0));
    vec4 n2 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, -1.0));
    vec4 n3 = texture2D(uFeedback, vUV + pixel * vec2(0.0, 1.0));
    vec4 n4 = texture2D(uFeedback, vUV + pixel * vec2(0.0, -1.0));
    vec4 n5 = texture2D(uFeedback, vUV + pixel * vec2(1.0, 1.0));
    vec4 n6 = texture2D(uFeedback, vUV + pixel * vec2(1.0, 0.0));
    vec4 n7 = texture2D(uFeedback, vUV + pixel * vec2(1.0, -1.0));

    vec4 tex = texture2D(uFeedback, vUV);
    float population = length((n0 + n1 + n2 + n3 + n4 + n5 + n6 + n7).rgb);
    bool alive = length(tex.rgb) > 0.2;
    vec4 outColor = tex;

    if (alive) {
      if (population < 2.0) outColor = tex / 1.05;
      else if (population < 4.0) outColor = mix(tex, maxNeighbor(tex, n0, n1, n2, n3, n4, n5, n6, n7), 0.5);
      else outColor = tex / 1.05;
    } else if (population > 2.0 && population < 4.0) {
      outColor = mix(tex, maxNeighbor(tex, n0, n1, n2, n3, n4, n5, n6, n7), 0.5);
    } else {
      outColor = tex / 1.05;
    }

    if (distance(pointer, uv) < 0.01) {
      outColor = vec4(1.0);
    }

    gl_FragColor = outColor;
  }
`;

export const effectShaders = {
  swyzzle: swyzzleFragmentShader,
  fluid: fluidFragmentShader,
  og: ogFragmentShader,
  blendmelt: blendmeltFragmentShader,
  rgb: rgbFragmentShader,
  subtle: subtleFragmentShader,
  gameOfStrife: gameOfStrifeFragmentShader,
};

export const nearestNeighborEffects = new Set(['gameOfStrife']);
