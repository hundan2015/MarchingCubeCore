import { edgeTable, triTable } from "./table.js";
import * as THREE from "./node_modules/three/build/three.module.js";
export let getTestPoints = (size, radius) => {
    let result = [];
    //Make Points;
    for (let i = 0; i < size; ++i) {
        for (let j = 0; j < size; ++j) {
            for (let k = 0; k < size; ++k) {
                let id = i + j * size + k * size * size;
                let pointTemp = {
                    position: new THREE.Vector3(i, j, k),
                    value: 0,
                    id: 0,
                };
                pointTemp.id = id;
                pointTemp.position = new THREE.Vector3(i, j, k);
                let reletiveX = i - size / 2;
                let reletiveY = j - size / 2;
                let reletiveZ = k - size / 2;
                pointTemp.value =
                    reletiveX * reletiveX +
                        reletiveY * reletiveY +
                        reletiveZ * reletiveZ;
                result.push(pointTemp);
            }
        }
    }
    return result;
};
/* Marching cube algorithum */
export let marchingCubeAlgorithum = (points, size, isoLevel) => {
    let result = [];
    // Build the cube index. Which can be put into the WebGPU.
    for (var i = 0; i < size - 1; i++) {
        for (var j = 0; j < size - 1; ++j) {
            for (var k = 0; k < size - 1; ++k) {
                //Find the related point index.
                let vertlist = [];
                for (let count = 9; count < 12; count++) {
                    vertlist.push(new THREE.Vector3());
                }
                // cube index maybe wrong.
                /* let cubeIndex: number[] = [
                    i * size * size + j * size + k,
                    (i + 1) * size * size + j * size + k,
                    i * size * size + (j + 1) * size + k,
                    (i + 1) * size * size + (j + 1) * size + k,
                    i * size * size + j * size + k + 1,
                    (i + 1) * size * size + j * size + k + 1,
                    i * size * size + (j + 1) * size + k + 1,
                    (i + 1) * size * size + (j + 1) * size + k + 1,
                ]; */
                let cubeIndex = [
                    i * size * size + j * size + k,
                    i * size * size + j * size + k + 1,
                    i * size * size + (j + 1) * size + k,
                    i * size * size + (j + 1) * size + k + 1,
                    (i + 1) * size * size + j * size + k,
                    (i + 1) * size * size + j * size + k + 1,
                    (i + 1) * size * size + (j + 1) * size + k,
                    (i + 1) * size * size + (j + 1) * size + k + 1,
                ];
                let targetIndex = 0;
                if (points[cubeIndex[0]].value < isoLevel)
                    targetIndex |= 1;
                if (points[cubeIndex[1]].value < isoLevel)
                    targetIndex |= 2;
                if (points[cubeIndex[2]].value < isoLevel)
                    targetIndex |= 8;
                if (points[cubeIndex[3]].value < isoLevel)
                    targetIndex |= 4;
                if (points[cubeIndex[4]].value < isoLevel)
                    targetIndex |= 16;
                if (points[cubeIndex[5]].value < isoLevel)
                    targetIndex |= 32;
                if (points[cubeIndex[6]].value < isoLevel)
                    targetIndex |= 128;
                if (points[cubeIndex[7]].value < isoLevel)
                    targetIndex |= 64;
                let bits = edgeTable[targetIndex];
                if (bits === 0)
                    continue;
                if (bits & 1)
                    vertlist[0] = VertexInterp(isoLevel, points[cubeIndex[0]].position, points[cubeIndex[1]].position, points[cubeIndex[0]].id, points[cubeIndex[1]].id);
                if (bits & 2)
                    vertlist[1] = VertexInterp(isoLevel, points[cubeIndex[1]].position, points[cubeIndex[3]].position, points[cubeIndex[1]].id, points[cubeIndex[3]].id);
                if (bits & 4)
                    vertlist[2] = VertexInterp(isoLevel, points[cubeIndex[2]].position, points[cubeIndex[3]].position, points[cubeIndex[2]].id, points[cubeIndex[3]].id);
                if (bits & 8)
                    vertlist[3] = VertexInterp(isoLevel, points[cubeIndex[0]].position, points[cubeIndex[2]].position, points[cubeIndex[0]].id, points[cubeIndex[2]].id);
                if (bits & 16)
                    vertlist[4] = VertexInterp(isoLevel, points[cubeIndex[4]].position, points[cubeIndex[5]].position, points[cubeIndex[4]].id, points[cubeIndex[5]].id);
                if (bits & 32)
                    vertlist[5] = VertexInterp(isoLevel, points[cubeIndex[5]].position, points[cubeIndex[7]].position, points[cubeIndex[5]].id, points[cubeIndex[7]].id);
                if (bits & 64)
                    vertlist[6] = VertexInterp(isoLevel, points[cubeIndex[6]].position, points[cubeIndex[7]].position, points[cubeIndex[6]].id, points[cubeIndex[7]].id);
                if (bits & 128)
                    vertlist[7] = VertexInterp(isoLevel, points[cubeIndex[4]].position, points[cubeIndex[6]].position, points[cubeIndex[4]].id, points[cubeIndex[6]].id);
                if (bits & 256)
                    vertlist[8] = VertexInterp(isoLevel, points[cubeIndex[0]].position, points[cubeIndex[4]].position, points[cubeIndex[0]].id, points[cubeIndex[4]].id);
                if (bits & 512)
                    vertlist[9] = VertexInterp(isoLevel, points[cubeIndex[1]].position, points[cubeIndex[5]].position, points[cubeIndex[1]].id, points[cubeIndex[5]].id);
                if (bits & 1024)
                    vertlist[10] = VertexInterp(isoLevel, points[cubeIndex[3]].position, points[cubeIndex[7]].position, points[cubeIndex[3]].id, points[cubeIndex[7]].id);
                if (bits & 2048)
                    vertlist[11] = VertexInterp(isoLevel, points[cubeIndex[2]].position, points[cubeIndex[6]].position, points[cubeIndex[2]].id, points[cubeIndex[6]].id);
                let triTableTarget = triTable[targetIndex];
                let triangles = [];
                for (let count = 0; count < 4; ++count) {
                    triangles.push({
                        first: new THREE.Vector3(),
                        second: new THREE.Vector3(),
                        third: new THREE.Vector3(),
                    });
                }
                let triangleCount = 0;
                for (var start = 0; triTable[16 * targetIndex + start] != -1; start += 3) {
                    triangles[start / 3] = {
                        first: vertlist[triTable[16 * targetIndex + start]],
                        second: vertlist[triTable[16 * targetIndex + start + 1]],
                        third: vertlist[triTable[16 * targetIndex + start + 2]],
                    };
                    triangleCount++;
                }
                for (var temp = 0; temp < triangles.length; temp++) {
                    result.push(triangles[temp]);
                }
            }
        }
    }
    return result;
};
let VertexInterp = (isolevel, p1, p2, valp1, valp2) => {
    let mu;
    let p;
    if (Math.abs(isolevel - valp1) < 0.0001) {
        return p1;
    }
    if (Math.abs(isolevel - valp2) < 0.0001) {
        return p2;
    }
    if (Math.abs(valp1 - valp1) < 0.0001) {
        return p1;
    }
    mu = (isolevel - valp1) / (valp2 - valp1);
    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);
    return p;
};
