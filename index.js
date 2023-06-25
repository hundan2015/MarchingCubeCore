import * as THREE from "./node_modules/three/build/three.module.js";
//import * as THREE from "three";
import * as POINT from "./Points.js";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log("Hi");
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const geometry = new THREE.BufferGeometry();
let points = POINT.getTestPoints(100, 60);
let vertices = POINT.marchingCubeAlgorithum(points, 100, 60);
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
material.wireframe = true;
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
vertices = undefined;
camera.position.z = 70;
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
