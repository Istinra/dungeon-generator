let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let context2D: CanvasRenderingContext2D = canvas.getContext("2d");

const MAP_LENGTH: number = 40;

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

    let w = Math.floor(Math.random() * 3) * 2 + 4;
    let h = Math.floor(Math.random() * 3) * 2 + 4;

    let x = Math.floor(Math.random() * (MAP_LENGTH - w) / 2) * 2;
    let y = Math.floor(Math.random() * (MAP_LENGTH - h) / 2) * 2;

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


enum Direction {
    NORTH = -MAP_LENGTH,
    SOUTH = MAP_LENGTH,
    EAST = 1,
    WEST = -1
}

const directions: number[] = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];

enum TileType { WALL, FLOOR }

interface ITile {
    type: TileType;
    room: boolean;
}

let tiles = new Array<ITile>(MAP_LENGTH * MAP_LENGTH);
for (let i = 0; i < tiles.length; i++) {
    tiles[i] = {type: TileType.WALL, room: false};
}

rooms.forEach(r => {
    ++r.pos.x;
    ++r.pos.y;
    --r.len.x;
    --r.len.y;
    for (let i = r.pos.x; i < r.pos.x + r.len.x; i++) {
        for (let j = r.pos.y; j < r.pos.y + r.len.y; j++) {
            tiles[i + j * MAP_LENGTH].type = TileType.FLOOR;
            tiles[i + j * MAP_LENGTH].room = true;
        }
    }
});

//http://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm

for (let x = 1; x < MAP_LENGTH - 1; x += 2) {
    for (let y = 1; y < MAP_LENGTH - 1; y += 2) {
        if (tiles[x + y * MAP_LENGTH].type === TileType.WALL) {
            buildMaze({x: x, y: y});
        }
    }
}

for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].type === TileType.FLOOR) {
        drawPoint(indexToPos(i), tiles[i].room ? "green" : "red");
    }
}

function buildMaze(startPos: IVec2): void {

    tiles[startPos.x + startPos.y * MAP_LENGTH].type = TileType.FLOOR;

    let cells: IVec2[] = [startPos];

    let previousDir: number = null;

    while (cells.length !== 0) {
        let cell: IVec2 = cells[cells.length - 1];
        let possibleDirections = directions.filter(d => checkDirection(cell, d));

        if (possibleDirections.length === 0) {
            cells.splice(possibleDirections.length - 1, 1);
            previousDir = null;
        } else {
            let dir: number;
            if (possibleDirections.indexOf(previousDir) != -1 && Math.random() >  0.25) {
                dir = previousDir;
            } else {
                dir = possibleDirections[(Math.floor(Math.random() * possibleDirections.length))];
            }
            tiles[cell.x + cell.y * MAP_LENGTH + dir].type = TileType.FLOOR;
            let targetIndex = cell.x + cell.y * MAP_LENGTH + dir * 2;
            tiles[targetIndex].type = TileType.FLOOR;
            cells.push(indexToPos(targetIndex));
            previousDir = dir;

        }
    }

}

function checkDirection(cell: IVec2, direction: Direction): boolean {
    let index = cell.x + cell.y * MAP_LENGTH + direction * 2;
    let boundary: number = index % MAP_LENGTH;
    return boundary > 0 && boundary < 39
        && index > MAP_LENGTH && index < tiles.length - MAP_LENGTH && tiles[index].type === TileType.WALL;
}