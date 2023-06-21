import { edgeTable, triTable } from "./table.js";
import * as THREE from "./node_modules/three/build/three.module.js";

export interface Point {
    position: THREE.Vector3;
    value: number;
    id: number;
}

export interface Face {
    first: THREE.Vector3;
    second: THREE.Vector3;
    third: THREE.Vector3;
}

export let getTestPoints = (size: number, radius: number): Point[] => {
    let result: Point[] = [];
    //Make Points;
    for (let i = 0; i < size; ++i) {
        for (let j = 0; j < size; ++j) {
            for (let k = 0; k < size; ++k) {
                let id = i + j * size + k * size * size;
                let pointTemp: Point = {
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
export let marchingCubeAlgorithum = (
    points: Point[],
    size: number,
    isoLevel: number
): Face[] => {
    let result: Face[] = [];
    // Build the cube index. Which can be put into the WebGPU.
    for (var i = 0; i < size - 1; i++) {
        for (var j = 0; j < size - 1; ++j) {
            for (var k = 0; k < size - 1; ++k) {
                //Find the related point index.
                let vertlist: THREE.Vector3[] = [];
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
                let cubeIndex: number[] = [
                    i * size * size + j * size + k,
                    i * size * size + j * size + k + 1,
                    i * size * size + (j + 1) * size + k,
                    i * size * size + (j + 1) * size + k + 1,
                    (i + 1) * size * size + j * size + k,
                    (i + 1) * size * size + j * size + k + 1,
                    (i + 1) * size * size + (j + 1) * size + k,
                    (i + 1) * size * size + (j + 1) * size + k + 1,
                ];

                let targetIndex: number = 0;
                if (points[cubeIndex[0]].value < isoLevel) targetIndex |= 1;
                if (points[cubeIndex[1]].value < isoLevel) targetIndex |= 2;
                if (points[cubeIndex[2]].value < isoLevel) targetIndex |= 8;
                if (points[cubeIndex[3]].value < isoLevel) targetIndex |= 4;
                if (points[cubeIndex[4]].value < isoLevel) targetIndex |= 16;
                if (points[cubeIndex[5]].value < isoLevel) targetIndex |= 32;
                if (points[cubeIndex[6]].value < isoLevel) targetIndex |= 128;
                if (points[cubeIndex[7]].value < isoLevel) targetIndex |= 64;

                let bits = edgeTable[targetIndex];
                if (bits === 0) continue;
                if (bits & 1)
                    vertlist[0] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[0]].position,
                        points[cubeIndex[1]].position,
                        points[cubeIndex[0]].value,
                        points[cubeIndex[1]].value
                    );
                if (bits & 2)
                    vertlist[1] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[1]].position,
                        points[cubeIndex[3]].position,
                        points[cubeIndex[1]].value,
                        points[cubeIndex[3]].value
                    );
                if (bits & 4)
                    vertlist[2] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[2]].position,
                        points[cubeIndex[3]].position,
                        points[cubeIndex[2]].value,
                        points[cubeIndex[3]].value
                    );
                if (bits & 8)
                    vertlist[3] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[0]].position,
                        points[cubeIndex[2]].position,
                        points[cubeIndex[0]].value,
                        points[cubeIndex[2]].value
                    );
                if (bits & 16)
                    vertlist[4] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[4]].position,
                        points[cubeIndex[5]].position,
                        points[cubeIndex[4]].value,
                        points[cubeIndex[5]].value
                    );
                if (bits & 32)
                    vertlist[5] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[5]].position,
                        points[cubeIndex[7]].position,
                        points[cubeIndex[5]].value,
                        points[cubeIndex[7]].value
                    );
                if (bits & 64)
                    vertlist[6] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[6]].position,
                        points[cubeIndex[7]].position,
                        points[cubeIndex[6]].value,
                        points[cubeIndex[7]].value
                    );
                if (bits & 128)
                    vertlist[7] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[4]].position,
                        points[cubeIndex[6]].position,
                        points[cubeIndex[4]].value,
                        points[cubeIndex[6]].value
                    );
                if (bits & 256)
                    vertlist[8] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[0]].position,
                        points[cubeIndex[4]].position,
                        points[cubeIndex[0]].value,
                        points[cubeIndex[4]].value
                    );
                if (bits & 512)
                    vertlist[9] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[1]].position,
                        points[cubeIndex[5]].position,
                        points[cubeIndex[1]].value,
                        points[cubeIndex[5]].value
                    );
                if (bits & 1024)
                    vertlist[10] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[3]].position,
                        points[cubeIndex[7]].position,
                        points[cubeIndex[3]].value,
                        points[cubeIndex[7]].value
                    );
                if (bits & 2048)
                    vertlist[11] = VertexInterp(
                        isoLevel,
                        points[cubeIndex[2]].position,
                        points[cubeIndex[6]].position,
                        points[cubeIndex[2]].value,
                        points[cubeIndex[6]].value
                    );
                let triTableTarget = triTable[targetIndex];
                let triangles: Face[] = [];
                for (let count = 0; count < 4; ++count) {
                    triangles.push({
                        first: new THREE.Vector3(),
                        second: new THREE.Vector3(),
                        third: new THREE.Vector3(),
                    });
                }
                let triangleCount = 0;
                for (
                    var start = 0;
                    triTable[16 * targetIndex + start] != -1;
                    start += 3
                ) {
                    triangles[start / 3] = {
                        first: vertlist[triTable[16 * targetIndex + start]],
                        second: vertlist[
                            triTable[16 * targetIndex + start + 1]
                        ],
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

let VertexInterp = (
    isolevel: number,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    valp1: number,
    valp2: number
): THREE.Vector3 => {
    let mu: number = 0;
    let p: THREE.Vector3 = { x: 0, y: 0, z: 0 };
    if (Math.abs(isolevel - valp1) < 0.0001) {
        return p1;
    }
    if (Math.abs(isolevel - valp2) < 0.0001) {
        return p2;
    }
    if (Math.abs(valp1 - valp2) < 0.0001) {
        return p1;
    }

    mu = (isolevel - valp1) / (valp2 - valp1);
    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);
    return p;
};
