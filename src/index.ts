let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let context2D: CanvasRenderingContext2D = canvas.getContext("2d");

function drawPoint(x: number, y: number, style: string = "black") {

    context2D.beginPath();
    context2D.rect(x * 20 + x, y * 20 + y, 20, 20);
    context2D.fillStyle = style;
    context2D.fill();
    context2D.closePath();
}

let dungeonGenerator = new DungeonGenerator(40, 40);
let tiles: ITile[] = dungeonGenerator.generate();
for (let i = 0; i < tiles.length; i++) {
    drawPoint(i % dungeonGenerator.width, Math.floor(i / dungeonGenerator.width),
        tiles[i].type === TileType.FLOOR ? "red" : "black");
}
