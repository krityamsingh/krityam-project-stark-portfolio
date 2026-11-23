import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragmentShader = `
uniform float uTime;
uniform vec2 uPointer;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = (vUv - .5) * 2.0;
  float r = length(uv);
  float a = atan(uv.y,uv.x);
  float turbulence = sin(a * 9.0 + uTime * .37) * .019
                   + sin(a * 21.0 - uTime * .28) * .009;
  float orbit = .54 + turbulence;
  float corona = exp(-pow((r - orbit) * 10., 2.));
  float inner = exp(-pow((r - .40) * 18., 2.));
  float exterior = exp(-pow((r - .70) * 7., 2.)) * .33;
  float details = .72 + .28 * sin(22.0*a + 7.0*r + uTime*.65);
  float light = corona * details + inner * .43 + exterior * .38;
  vec3 ember = vec3(1.0,.30,.15);
  vec3 violet = vec3(.40,.35,.78);
  vec3 col = mix(violet,ember,smoothstep(-.7,.9,sin(a*2. + uTime*.09)));
  col *= light * 1.15;
  col += vec3(.018,.025,.053) * smoothstep(.41,.23,r);
  float edge = 1.0 - smoothstep(.78,1.,r);
  float alpha = edge * clamp(light * 1.45 + smoothstep(.5,.27,r)*.97,0.,1.);
  gl_FragColor=vec4(col,alpha);
}`;

function PortalSystem() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
  }), []);
  const points = useMemo(() => {
    const values = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const t = i * 2.399963;
      const radius = 2.1 + (i % 87) * .038;
      values[i * 3] = Math.cos(t) * radius;
      values[i * 3 + 1] = Math.sin(t) * radius;
      values[i * 3 + 2] = -1.3 + (i % 19) * .13;
    }
    return values;
  }, []);
  useFrame(({ clock, pointer }, delta) => {
    const time = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * .18, 2, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * .12, 2, delta);
    }
    if (inner.current) inner.current.rotation.z = time * .025;
    if (material.current) {
      material.current.uniforms.uTime.value = time;
      material.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
    }
  });
  return <group ref={group}>
    <Float speed={1.1} floatIntensity={.14} rotationIntensity={.075}>
      <mesh scale={3.1} rotation={[0,0,.08]}>
        <planeGeometry args={[2,2]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader}
          fragmentShader={fragmentShader} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={inner}>
        {[0,1,2,3].map((n) => (
          <mesh key={n} rotation={[.12 + n*.13, -.08 + n*.08, n*1.32]} >
            <torusGeometry args={[1.65+n*.21, .0045+n*.0008, 5, 180, Math.PI*1.57]} />
            <meshBasicMaterial color={n%2 ? '#dc6e59' : '#9b8fe3'} transparent opacity={.3-n*.035} />
          </mesh>
        ))}
      </group>
      <mesh>
        <torusGeometry args={[1.30, .018, 8, 128]} />
        <meshBasicMaterial color="#ab7469" transparent opacity={.18} />
      </mesh>
    </Float>
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]} /></bufferGeometry>
      <pointsMaterial color="#c9b1ae" size={.011} sizeAttenuation transparent opacity={.6} depthWrite={false} />
    </points>
  </group>;
}
export default function Hologram(){
  return <div className="three-stage" aria-label="Interactive animated Three.js portal">
    <Canvas camera={{position:[0,0,9.2],fov:49}} dpr={[1,1.7]} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}}>
      <ambientLight intensity={.7} />
      <pointLight position={[3,1,4]} color="#dc5b43" intensity={22} />
      <pointLight position={[-3,-2,3]} color="#8076dc" intensity={14} />
      <PortalSystem />
      <Stars radius={60} depth={20} count={280} factor={2} fade speed={.24} />
    </Canvas>
  </div>;
}