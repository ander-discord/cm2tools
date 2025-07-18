const BlockId = {
    Nor: 0,
    And: 1,
    Or: 2,
    Xor: 3,
    Button: 4,
    TFlipFlop: 5,
    Led: 6,
    Sound: 7,
    Conductor: 8,
    Custom: 9,
    Xand: 10,
    Xnor: 11,
    Random: 12,
    TextBlock: 13,
    Tile: 14,
    Node: 15,
    Delay: 16,
    Antenna: 17,
    Conductor_V2: 18,
    Led_mixer: 19
}

class Save {
    constructor (blocks = [], connections = []) {
        this.blocks = blocks
        this.connections = connections
    }

    addBlock(block, checkDuplicate = false) {
        if (checkDuplicate && this.blocks.find(findBlock =>
            findBlock.x == block.x &&
            findBlock.y == block.y &&
            findBlock.z == block.z)) return;

        this.blocks.push(block)
        return block
    }

    addConnection(connection, checkDuplicate = false) {
        if (checkDuplicate && this.connections.find(findConnection => 
            findConnection.source == connection.source &&
            findConnection.target == connection.target)) return;

        this.connections.push(connection)
        return connection
    }

    removeBlock(block) {
        this.blocks.splice(this.blocks.findIndex(findBlock => findBlock === block), 1)
    }

    removeConnection(connection) {
        this.connections.splice(this.connections.findIndex(findConnection => findConnection === connection), 1)
    }

    export() {
        let saveString = ""

        if (this.blocks.length > 0) {
            for (const block of this.blocks) {
                saveString += `${block.id},${+ block.state},${block.x},${block.y},${block.z},${block.props.join('+')}` // ${block.props.join('+')}
                saveString += ";"
            }

            saveString = saveString.slice(0, saveString.length - 1)
        }

        saveString += "?"

        if (this.connections.length > 0) {
            for (const connection of this.connections) {
                saveString += this.blocks.findIndex(block => block === connection.source) + 1 + ","
                saveString += this.blocks.findIndex(block => block === connection.target) + 1 + ";"
            }

            saveString = saveString.slice(0, saveString.length - 1)
        }

        saveString += "?"

        return saveString
    }

    import(saveString) {
        const [ blocks, connections ] = saveString.split("?")
        const blockPool = []

        if (blocks) {
            for (const blockString of blocks.split(";")) {
                const [ id, numState, x, y, z, extra ] = blockString.split(",")
                const state = !! Number(numState)

                if (id == BlockId.Led) {
                    const [ r, g, b ] = extra.split("+")
                    blockPool.push(this.addBlock(new LedBlock(x, y, z, state, r, g, b)))
                    continue
                }

                if (id == BlockId.Sound) {
                    blockPool.push(this.addBlock(new SoundBlock(x, y, z, state, extra)))
                    continue
                }

                blockPool.push(this.addBlock(new Block(id, x, y, z, state)))
            }
        }

        if (connections) {
            for (const connectionString of connections.split(";")) {
                const [ source, target ] = connectionString.split(",")
                this.addConnection(new Connection(blockPool[source - 1], blockPool[target - 1]))
            }
        }
    }
}

class Block {
    constructor (id, x, y, z, state = false, props = []) {
        this.id = Number(id)
        this.x = Number(x)
        this.y = Number(y)
        this.z = Number(z)
        this.state = state
        this.props = props
    }
}

class Connection {
    constructor (source, target) {
        this.source = source
        this.target = target
    }
}

export { Save, Block, Connection, BlockId }
