let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let context2D: CanvasRenderingContext2D = canvas.getContext("2d");

const MAP_LENGTH = 40;

interface IVec2 {
    x: number,
    y: number
}

interface IRect {
    pos: IVec2;
    len: IVec2;
}

function drawRect(rect: IRect, style: string = "black") {
    context2D.beginPath();
    for (let i = rect.pos.x; i < rect.pos.x + rect.len.x; i++) {
        for (let j = rect.pos.y; j < rect.pos.y + rect.len.y; j++) {
            context2D.rect(i * 20 + i, j * 20 + j, 20, 20);
        }
    }
    context2D.fillStyle = style;
    context2D.fill();
    context2D.closePath();
}

function drawPoint(pos: IVec2, style: string = "black") {
    context2D.beginPath();
    context2D.rect(pos.x * 20 + pos.x, pos.y * 20 + pos.y, 20, 20);
    context2D.fillStyle = style;
    context2D.fill();
    context2D.closePath();
}

function indexToPos(index: number): IVec2 {
    return {x: index % MAP_LENGTH, y: Math.floor(index / MAP_LENGTH)}
}

drawRect({
        pos: {x: 0, y: 0},
        len: {x: MAP_LENGTH, y: MAP_LENGTH}
    }
);

let rooms: IRect[] = [];

for (let attempts = 0; attempts < 120 && rooms.length < 20; attempts++) {

    let w = Math.floor(Math.random() * 6) + 4;
    let h = Math.floor(Math.random() * 6) + 4;

    let x = Math.floor(Math.random() * (MAP_LENGTH - w));
    let y = Math.floor(Math.random() * (MAP_LENGTH - h));

    let room: IRect = {
        pos: {x: x, y: y},
        len: {x: w, y: h}
    };

    if (!rooms.some(test =>
        room.pos.x + room.len.x > test.pos.x && room.pos.x < test.pos.x + test.len.x &&
        room.pos.y + room.len.y > test.pos.y && room.pos.y < test.pos.y + test.len.y
    )) {
        rooms.push(room);
    }
}

//http://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm

enum Direction { NORTH, SOUTH, EAST, WEST }

enum TileType { WALL, FLOOR }

interface ITile {
    type: TileType;
}

let tiles = new Array<ITile>(MAP_LENGTH * MAP_LENGTH);
for (let i = 0; i < tiles.length; i++) {
    tiles[i] = {type: TileType.WALL};
}

rooms.forEach(r => {
    ++r.pos.x;
    ++r.pos.y;
    --r.len.x;
    --r.len.y;
    for (let i = r.pos.x; i < r.pos.x + r.len.x; i++) {
        for (let j = r.pos.y; j < r.pos.y + r.len.y; j++) {
            tiles[i + j * MAP_LENGTH].type = TileType.FLOOR;
        }
    }
});

function carveMaze(pos: IVec2) {

}

for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].type == TileType.WALL) {
        carveMaze(indexToPos(i));
    }
}


for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].type === TileType.FLOOR) {
        drawPoint(indexToPos(i), "red");
    }
}

