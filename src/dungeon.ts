interface ITile {
    type: TileType;
    region: number;
}

enum TileType { WALL, FLOOR }

interface IVec2 {
    x: number,
    y: number
}

interface IRect {
    pos: IVec2;
    len: IVec2;
}

class DungeonGenerator {

    private readonly tiles: ITile[];
    private readonly directions: number[] = [
        -this.width, //North
        this.width,  //South
        1,           //East
        -1           //West
    ];

    private currentRegion: number = 1;

    constructor(public readonly width: number, public readonly height: number) {
        this.tiles = new Array<ITile>(width * height);
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = {type: TileType.WALL, region: 0};
        }
    }

    public generate(): ITile[] {
        this.generateRooms();
        this.generateMaze();
        return this.tiles;
    }

    private generateRooms(): void {
        const rooms: IRect[] = [];

        const roomTotal: number = Math.floor((this.width + this.height) / 4);

        for (let attempts = 0; attempts < roomTotal * 4 && rooms.length < roomTotal; attempts++) {

            //Random width and height, should be even to ensure it aligns to the grid
            let w = Math.floor(Math.random() * 3) * 2 + 4;
            let h = Math.floor(Math.random() * 3) * 2 + 4;

            //Position of room, subtracting width and height from upper random bound to ensure it's place in bounds
            let x = Math.floor(Math.random() * (this.width - w) / 2) * 2;
            let y = Math.floor(Math.random() * (this.height - h) / 2) * 2;

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

        rooms.forEach(r => {
            //Shrink the room by one, we only
            ++r.pos.x;
            ++r.pos.y;
            --r.len.x;
            --r.len.y;
            for (let i = r.pos.x; i < r.pos.x + r.len.x; i++) {
                for (let j = r.pos.y; j < r.pos.y + r.len.y; j++) {
                    let tile = this.tiles[this.posToIndex(i, j)];
                    tile.type = TileType.FLOOR;
                    tile.region = this.currentRegion;
                }
            }
            this.currentRegion++;
        });
    }

    //http://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm
    private generateMaze() {
        //Loop through all the walls to build out the maze, increments of 2 since the grid needs walls between gaps
        for (let i = 1; i < this.height * this.width; i += 2) { //TODO could have errors with odd grid sizes
            if (this.tiles[i].type === TileType.WALL) {
                this.growMaze(i);
                this.currentRegion++;
            }
        }
    }

    private growMaze(position: number) {

        let startingCell = this.tiles[position];
        startingCell.type = TileType.WALL;
        startingCell.region = this.currentRegion;

        let cells: number[] = [position];

        let previousDir: number = null;

        while (cells.length !== 0) {
            let cell: number = cells[cells.length - 1];
            let possibleDirections = this.directions.filter(d => this.checkDirection(cell, d));

            if (possibleDirections.length === 0) {
                cells.splice(possibleDirections.length - 1, 1);
                previousDir = null;
            } else {
                let dir: number;
                //The maze generally follows a straight line but has a 25% chance to change
                if (possibleDirections.indexOf(previousDir) != -1 && Math.random() > 0.25) {
                    dir = previousDir;
                } else {
                    dir = possibleDirections[(Math.floor(Math.random() * possibleDirections.length))];
                }
                this.tiles[cell + dir].type = TileType.FLOOR;
                this.tiles[cell + dir].region = this.currentRegion;
                this.tiles[cell + dir * 2].type = TileType.FLOOR;
                this.tiles[cell + dir * 2].region = this.currentRegion;
                cells.push(cell + dir * 2);
                previousDir = dir;
            }
        }
    }

    private checkDirection(cell: number, direction: number): boolean {
        let index = cell + direction * 2;
        let boundary: number = index % this.width;
        return boundary > 0 && boundary < this.width - 1 //Cannot expand into the first or last column
            && index > this.width && index < this.tiles.length - this.width && this.tiles[index].type === TileType.WALL;
    }

    private indexToPos(index: number): IVec2 {
        return {x: index % this.width, y: Math.floor(index / this.height)}
    }

    private posToIndex(x: number, y: number): number {
        return x + y * this.width;
    }

    private posVecToIndex(pos: IVec2): number {
        return pos.x + pos.y * this.width;
    }
}