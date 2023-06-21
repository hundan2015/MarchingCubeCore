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
@group(0) @binding(0) let <storage,read> points:array<Point>;

@unifrom
//var size:u32;
@unifrom
//var isoLevel:f32;

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

    var isoLevel: f32;
    var size: u32;
    var <storage,read> edgeTable: array<i32>;
    var <storage,read> triTable: array<i32>;
    let cubeIndex = array<i32,8>(
        global_id.x,
        global_id + u32(1),
        global_id.x + size,
        global_id.x + size + u32(1),
        global_id.x + size * size,
        global_id.x + size * size + u32(1),
        global_id.x + size * size + size,
        global_id.x + size * size + size + u32(1),
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
    if (bits & 1) != 0 {
    }
    if (bits & 2) != 0 {
    }
    if (bits & 4) != 0 {
    }
    if (bits & 8) != 0 {
    }
    if (bits & 16) != 0 {
    }
    if (bits & 32) != 0 {
    }
    if (bits & 64) != 0 {
    }
    if (bits & 128) != 0 {
    }
    if (bits & 256) != 0 {
    }
    if (bits & 1024) != 0 {
    }
    if (bits & 2048) != 0 {
    }
    var triangles = array<Triangle,4>();
    for (var start = 0; triTable[16 * targetIndex + start] != -1; start += 3) {
        let tempIndex = (16 * targetIndex) + start;
        triangles[start / 3].first = vertlist[(triTable[tempIndex])];
        triangles[start / 3].second = vertlist[(triTable[tempIndex + 1])];
        triangles[start / 3].third = vertlist[(triTable[tempIndex + 2])];
    }
}