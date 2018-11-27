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

interface IConnector {
    index: number;
    regions: number[]
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
        this.connectRoomsToMaze();
        this.cullMaze();
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
        for (let y = 1; y < this.height - 1; y += 2) {
            for (let x = 1; x < this.width - 1; x += 2) {
                let pos: number = this.posToIndex(x, y);
                if (this.tiles[pos].type === TileType.WALL) {
                    this.growMaze(pos);
                    this.currentRegion++;
                }
            }
        }
    }

    private growMaze(position: number) {

        let startingCell = this.tiles[position];
        startingCell.type = TileType.FLOOR;
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

    private connectRoomsToMaze(): void {
        let connectors: IConnector[] = this.generateConnectors();
        let unconnectedRegions: number[] = [];

        for (let i = 1; i < this.currentRegion; i++) {
            unconnectedRegions.push(i);
        }

        while (unconnectedRegions.length > 1) {

            let connector: IConnector = connectors[Math.floor(Math.random() * connectors.length)];

            this.tiles[connector.index].type = TileType.FLOOR;

            //From
            let regions: number[] = connector.regions;
            //To
            let sources: number[] = regions.slice(1);

            //Sources are about to be merged into main region, so they become connected
            for (let source of sources) {
                if (unconnectedRegions.indexOf(source) !== -1) {
                    unconnectedRegions.splice(unconnectedRegions.indexOf(source), 1);
                }
            }

            for (let i = 0; i < connectors.length; i++) {
                let connector: IConnector = connectors[i];
                let uniqueRegions: number[] = [];
                for (let region of connector.regions) {
                    //If we merged a region, set it to the region the old region to the one it was merged into
                    if (sources.indexOf(region) !== -1) {
                        region = regions[0];
                    }
                    //Avoid duplicates
                    if (uniqueRegions.indexOf(region) === -1) {
                        uniqueRegions.push(region);
                    }
                }
                //Should connect at least two unconnected regions
                if (uniqueRegions.length > 1) {
                    connector.regions = uniqueRegions;
                } else {
                    //Small chance for a connector remain so that there isn't always just one door to every room
                    if (Math.random() < 0.02) {
                        this.tiles[connector.index].type = TileType.FLOOR;
                    }
                    connectors.splice(i, 1);
                    --i;
                }
            }
        }
    }

    private generateConnectors(): IConnector[] {
        let connectors: IConnector[] = [];

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                let currentIndex = this.posToIndex(x, y);
                let currentTile = this.tiles[currentIndex];
                if (currentTile.type === TileType.WALL) {
                    let surrounding: number[] = [];
                    for (let dir of this.directions) {
                        let adjacentRegion = this.tiles[currentIndex + dir].region;
                        if (adjacentRegion > 0 && surrounding.indexOf(adjacentRegion) === -1) {
                            surrounding.push(adjacentRegion);
                        }
                    }
                    if (surrounding.length > 1) {
                        connectors.push({index: currentIndex, regions: surrounding});
                    }
                }
            }
        }

        return connectors;
    }


    private cullMaze(): void {
        for (let passes = 0; passes < 10; passes++) {
            for (let i = this.width; i < this.tiles.length - this.width; i++) {
                if (this.tiles[i].type === TileType.WALL || i % this.width < 1) {
                    continue;
                }
                let count: number = 0;
                for (let dir of this.directions) {
                    if (this.tiles[i + dir].type == TileType.WALL) {
                        ++count;
                    }
                }
                if (count > 2) {
                    this.tiles[i].type = TileType.WALL;
                }
            }
        }
    }

    private posToIndex(x: number, y: number): number {
        return x + y * this.width;
    }
}