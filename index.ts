import * as THREE from "./node_modules/three/build/three.module.js";
//import * as THREE from "three";
import * as POINT from "./Points.js";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
console.log("Hi");
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BufferGeometry();
let points = POINT.getTestPoints(100, 60);
let faces: POINT.Face[] = POINT.marchingCubeAlgorithum(points, 100, 10);

const vertices_temp: number[] = [];
for (var i = 0; i < faces.length; i++) {
    vertices_temp.push(faces[i].first.x - 50);
    vertices_temp.push(faces[i].first.y - 50);
    vertices_temp.push(faces[i].first.z - 50);
    vertices_temp.push(faces[i].second.x - 50);
    vertices_temp.push(faces[i].second.y - 50);
    vertices_temp.push(faces[i].second.z - 50);
    vertices_temp.push(faces[i].third.x - 50);
    vertices_temp.push(faces[i].third.y - 50);
    vertices_temp.push(faces[i].third.z - 50);
}
const vertices = new Float32Array(vertices_temp);
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
material.wireframe = true;
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 100;
cube.position.x = -50;
cube.position.y = -30;
function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}
animate();
