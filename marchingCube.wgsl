struct Point {
    position: vec3<f32>,
    value: f32,
    id: u32,
    pattern: u32
};

struct Triangle {
    first: vec3<f32>,
    second: vec3<f32>,
    third: vec3<f32>,
}

struct ResultCell {
    first: Triangle
    second: Triangle
    third: Triangle
    fourth: Triangle
}

@group(0) @binding(0) let <storage,read> triTable:array<i32>;
@group(0) @binding(1) let <storage,read> edgeTable:array<i32>;
@group(0) @binding(2) let <storage,read> points:array<Point>;
@group(0) @binding(3) let <storage,read> results:array<ResultCell>;
@group(0) @binding(4) let <storage,read> isoLevel:f32;
@group(0) @binding(5) let <storage,read> size:u32;

fn VertexInterp(isoLevel: f32, p1: vec3<f32>, p2: vec3<f32>, valp1: f32, valp2: f32) -> vec3<f32> {
    let p: vec3<f32>;
    if abs(isoLevel - valp1) < 0.0001 {
        return p1;
    }
    if abs(isoLevel - valp2) < 0.0001 {
        return p2;
    }
    if abs(valp1 - valp2) < 0.0001 {
        return p1;
    }
    let mu = (isoLevel - valp1) / (valp2 - valp1);
    p.x = p1.x + mu * (p2.x - p1.x);
    p.y = p1.y + mu * (p2.y - p1.y);
    p.z = p1.z + mu * (p2.z - p1.z);
    return p;
}

    @compute @workgroup_size(64)
fn main(@builtin(global_invocation_id)global_id: vec3<u32>) {
    let id: u32;
    let cubeIndex = array<i32,8>(
        id,
        id + u32(1),
        id + size,
        id + size + u32(1),
        id + size * size,
        id + size * size + u32(1),
        id + size * size + size,
        id + size * size + size + u32(1),
    );

    var targetIndex: i32 = 0;
    if points[u32(cubeIndex[0])].value < isoLevel {
        targetIndex |= 1;
    }
    if points[u32(cubeIndex[1])].value < isoLevel {
        targetIndex |= 2;
    }
    if points[u32(cubeIndex[2])].value < isoLevel {
        targetIndex |= 8;
    }
    if points[u32(cubeIndex[3])].value < isoLevel {
        targetIndex |= 4;
    }
    if points[u32(cubeIndex[4])].value < isoLevel {
        targetIndex |= 16;
    }
    if points[u32(cubeIndex[5])].value < isoLevel {
        targetIndex |= 32;
    }
    if points[u32(cubeIndex[6])].value < isoLevel {
        targetIndex |= 128;
    }
    if points[u32(cubeIndex[7])].value < isoLevel {
        targetIndex |= 64;
    }
    let bits = edgeTable[targetIndex];
    if bits == 0 {
        return;
    }
    var vertlist = array<vec3<f32>,12>();
    vertlist[0] = f32(bits & 1) * VertexInterp(isoLevel, points[(cubeIndex[0])].position, points[(cubeIndex[1])].position, points[u32(cubeIndex[0])].value, points[(cubeIndex[1])].value);
    vertlist[1] = f32(bits & 2) * VertexInterp(isoLevel, points[(cubeIndex[1])].position, points[(cubeIndex[3])].position, points[(cubeIndex[1])].value, points[(cubeIndex[3])].value);
    vertlist[2] = f32(bits & 4) * VertexInterp(isoLevel, points[(cubeIndex[2])].position, points[(cubeIndex[3])].position, points[(cubeIndex[2])].value, points[(cubeIndex[3])].value);
    vertlist[3] = f32(bits & 8) * VertexInterp(isoLevel, points[(cubeIndex[0])].position, points[(cubeIndex[2])].position, points[(cubeIndex[0])].value, points[(cubeIndex[2])].value);
    vertlist[4] = f32(bits & 16) * VertexInterp(isoLevel, points[(cubeIndex[4])].position, points[(cubeIndex[5])].position, points[(cubeIndex[4])].value, points[(cubeIndex[5])].value);
    vertlist[5] = f32(bits & 32) * VertexInterp(isoLevel, points[(cubeIndex[5])].position, points[(cubeIndex[7])].position, points[(cubeIndex[5])].value, points[(cubeIndex[7])].value);
    vertlist[6] = f32(bits & 64) * VertexInterp(isoLevel, points[(cubeIndex[6])].position, points[(cubeIndex[7])].position, points[(cubeIndex[6])].value, points[9].value);
    vertlist[7] = f32(bits & 128) * VertexInterp(isoLevel, points[(cubeIndex[4])].position, points[(cubeIndex[6])].position, points[(cubeIndex[4])].value, points[(cubeIndex[6])].value);
    vertlist[8] = f32(bits & 256) * VertexInterp(isoLevel, points[(cubeIndex[0])].position, points[(cubeIndex[4])].position, points[(cubeIndex[0])].value, points[(cubeIndex[4])].value);
    vertlist[9] = f32(bits & 512) * VertexInterp(isoLevel, points[(cubeIndex[1])].position, points[(cubeIndex[5])].position, points[(cubeIndex[1])].value, points[(cubeIndex[5])].value);
    vertlist[10] = f32(bits & 1024) * VertexInterp(isoLevel, points[(cubeIndex[3])].position, points[(cubeIndex[7])].position, points[(cubeIndex[3])].value, points[(cubeIndex[7])].value);
    vertlist[11] = f32(bits & 2048) * VertexInterp(isoLevel, points[(cubeIndex[2])].position, points[(cubeIndex[6])].position, points[(cubeIndex[2])].value, points[(cubeIndex[6])].value);
    var triangles = array<Triangle,4>();
    for (var start = 0; triTable[16 * targetIndex + start] != -1; start += 3) {
        let tempIndex = (16 * targetIndex) + start;
        triangles[start / 3].first = vertlist[(triTable[tempIndex])];
        triangles[start / 3].second = vertlist[(triTable[tempIndex + 1])];
        triangles[start / 3].third = vertlist[(triTable[tempIndex + 2])];
    }

    results[id].first = triangles[0];
    results[id].second = triangles[1];
    results[id].third = triangles[2];
    results[id].fourth = triangles[3];
}