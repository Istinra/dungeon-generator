let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let context2D: CanvasRenderingContext2D = canvas.getContext("2d");

const MAP_LENGTH = 40;

function drawRect(x: number, y: number, w: number, h: number, style: string = "black") {
    context2D.beginPath();
    for (let i = x; i < x + w; i++) {
        for (let j = y; j < y + h; j++) {
            context2D.rect(i * 20 + i, j * 20 + j, 20, 20);
        }
    }
    context2D.fillStyle = style;
    context2D.fill();
    context2D.closePath();
}

drawRect(0, 0, MAP_LENGTH, MAP_LENGTH);

interface IRoom {
    x: number;
    y: number;
    width: number;
    height: number;
}

let rooms: IRoom[] = [];

for (let attempts = 0; attempts < 120 && rooms.length < 20; attempts++) {

    let w = Math.floor(Math.random() * 6) + 4;
    let h = Math.floor(Math.random() * 6) + 4;

    let x = Math.floor(Math.random() * (MAP_LENGTH - w));
    let y = Math.floor(Math.random() * (MAP_LENGTH - h));

    let room: IRoom = {
        x: x,
        y: y,
        width: w,
        height: h
    };

    if (!rooms.some(test =>
        room.x + room.width > test.x && room.x < test.x + test.width &&
        room.y + room.height > test.y && room.y < test.y + test.height
    )) {
        rooms.push(room);
    }
}

rooms.forEach(r => drawRect(r.x + 1, r.y + 1, r.width - 1, r.height - 1, "white"));

//http://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm