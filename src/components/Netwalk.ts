import uuid from 'node-uuid';
import { vector as Vector } from 'vektor';
import _ from 'underscore';

export interface Node {
  id: string;
  type: string;
  direction: string;
  connections: string[];
  configured: boolean;
  connected: boolean;
  randomized: boolean;
  vector: Vector;
}

export function deepCopyMatrix(matrix: Matrix): Matrix {
    const matr = structuredClone(matrix);
    for (let i=0;i<matr.length;i++) {
        for (let j=0;j<matr[i].length;j++) {
            matr[i][j].vector = new Vector(matrix[i][j].vector.x, matrix[i][j].vector.y);
        }
    }
    return matr;
}

export type Matrix = Node[][];

export default class Netwalk {

  directions: {name: string, vector: Vector}[];
  figures: {type: string, direction: string, connections: string[]}[];

  constructor() {

    this.directions = [
      { name: 'up', vector: new Vector(0, -1) },
      { name: 'down', vector: new Vector(0, 1) },
      { name: 'left', vector: new Vector(-1, 0) },
      { name: 'right', vector: new Vector(1, 0) }
    ];

    const figures = [];

    // Elbows
    figures.push({
      type: 'elbow',
      direction: 'upright',
      connections: ['up', 'right']
    });
    figures.push({
      type: 'elbow',
      direction: 'rightdown',
      connections: ['right', 'down']
    });
    figures.push({
      type: 'elbow',
      direction: 'downleft',
      connections: ['down', 'left']
    });
    figures.push({
      type: 'elbow',
      direction: 'leftup',
      connections: ['left', 'up']
    });

    // Lines
    figures.push({
      type: 'line',
      direction: 'leftright',
      connections: ['left', 'right']
    });
    figures.push({
      type: 'line',
      direction: 'updown',
      connections: ['up', 'down']
    });

    // Tees
    figures.push({
      type: 'tee',
      direction: 'leftupright',
      connections: ['left', 'up', 'right']
    });
    figures.push({
      type: 'tee',
      direction: 'uprightdown',
      connections: ['up', 'right', 'down']
    });
    figures.push({
      type: 'tee',
      direction: 'rightdownleft',
      connections: ['right', 'down', 'left']
    });
    figures.push({
      type: 'tee',
      direction: 'downleftup',
      connections: ['down', 'left', 'up']
    });

    // Computers
    figures.push({
      type: 'computer',
      direction: 'up',
      connections: ['up']
    });
    figures.push({
      type: 'computer',
      direction: 'right',
      connections: ['right']
    });
    figures.push({
      type: 'computer',
      direction: 'down',
      connections: ['down']
    });
    figures.push({
      type: 'computer',
      direction: 'left',
      connections: ['left']
    });

    this.figures = figures;
  }

  isMatrixReady(matrix: Matrix) {
    for (const y in matrix) {
      for (const x in matrix[y]) {
        if (matrix[y][x].connections.length === 0) {
          return false;
        }
      }
    }
    return true;
  }

  isMatrixRandomized(matrix: Matrix) {
    for (const y in matrix) {
      for (const x in matrix[y]) {
        if (!matrix[y][x].randomized) {
          return false;
        }
      }
    }
    return true;
  }

  isMatrixSolved(matrix: Matrix) {
    for (const y in matrix) {
      for (const x in matrix[y]) {
        if (!matrix[y][x].connected) {
          return false;
        }
      }
    }
    return true;
  }

  takeStepToBuildMatrix(matrix: Matrix) {

    if (this.isMatrixReady(matrix)) {
      return matrix;
    }

    const rows = matrix.length;
    const columns = matrix[0].length;
    let server = this.getServerNode(matrix);

    if (!server) {

      const x = _.random(0, columns - 1),
          y = _.random(0, rows - 1);

      server = _.extend(matrix[y][x], {
        type: 'server',
        connected: true
      });

      matrix[y][x] = server;

      const neighbors = this.getNeighborsReadyToConnectTo(server, matrix);
      if (neighbors.length > 0) {
        const random_neighbor = neighbors[_.random(neighbors.length - 1)];
        matrix = this.performDoubleSidedConnectBetween(server, random_neighbor, matrix);
      }

      // set server as configured
      matrix[y][x] = _.extend(matrix[y][x], {
        configured: true
      });

      return matrix;
    }

    const unclosedNode = this.getUnclosedNodeConnectedTo(server, matrix);
    if (unclosedNode) {
      const neighbors = this.getNeighborsReadyToConnectTo(unclosedNode, matrix);
      if (neighbors.length > 0) {
        _.each(neighbors, function(neighbor) {
          if (this.nodeCanAcceptNewConnections(unclosedNode, matrix)) {
            matrix = this.performDoubleSidedConnectBetween(unclosedNode, neighbor, matrix);
          }
        }.bind(this));
      }
    }

    return matrix;
  }

  nodeCanAcceptNewConnections(node: Node, matrix: Matrix) {
    if (node.connections.length >= 3) {
      return false;
    }

    return true;
  }

  performDoubleSidedConnectBetween(node1, node2, matrix) {
    const connection_direction = this.getConnectionDirectionBetweenNodes(node1, node2);
    matrix = this.connectNode(node1, connection_direction, matrix);
    matrix = this.connectNode(node2, this.getOppositeDirectionOf(connection_direction), matrix);
    return matrix;
  }

  getNodeTypeOf(node, matrix: Matrix) {
    switch (node.connections.length) {
      case 3:
        return 'tee';
        break;
      case 2:
        if (
            (_.indexOf(node.connections, 'up') !== -1 && _.indexOf(node.connections, 'down') !== -1)
             ||
            (_.indexOf(node.connections, 'left') !== -1 && _.indexOf(node.connections, 'right') !== -1)
           ){
          return 'line';
        }
        return 'elbow';
        break;
      case 1:
        return 'computer';
        break;
    }
  }

  connectNode(node, direction, matrix: Matrix) {
    const x = node.vector.x,
        y = node.vector.y,
        connections = _.union([direction], node.connections);

    matrix[y][x] = node = _.extend(node, {
      direction: this.getDirectionByConnections(connections),
      connections: connections
    });

    matrix[y][x] = node = _.extend(node, {
      type: (node.type === 'server') ? 'server' : this.getNodeTypeOf(node, matrix)
    });

    // set node as "configured" if that is it's 3rd connection
    // or if there are simply no available nodes to connect to
    const neighbors = this.getNeighborsReadyToConnectTo(node, matrix);
    if (neighbors.length === 0 || connections.length === 3) {
      matrix[y][x] = node = _.extend(matrix[y][x], {
        configured: true
      });
    }

    return matrix;
  }

  getDirectionByConnections(connections) {
    if (_.indexOf(connections, 'left') !== -1
        && _.indexOf(connections, 'up') !== -1
        && _.indexOf(connections, 'right') !== -1) {
      return 'leftupright';
    }
    if (_.indexOf(connections, 'up') !== -1
        && _.indexOf(connections, 'right') !== -1
        && _.indexOf(connections, 'down') !== -1) {
      return 'uprightdown';
    }
    if (_.indexOf(connections, 'right') !== -1
        && _.indexOf(connections, 'down') !== -1
        && _.indexOf(connections, 'left') !== -1) {
      return 'rightdownleft';
    }
    if (_.indexOf(connections, 'down') !== -1
        && _.indexOf(connections, 'left') !== -1
        && _.indexOf(connections, 'up') !== -1) {
      return 'downleftup';
    }

    if (_.indexOf(connections, 'up') !== -1
        && _.indexOf(connections, 'right') !== -1) {
      return 'upright';
    }
    if (_.indexOf(connections, 'right') !== -1
        && _.indexOf(connections, 'down') !== -1) {
      return 'rightdown';
    }
    if (_.indexOf(connections, 'down') !== -1
        && _.indexOf(connections, 'left') !== -1) {
      return 'downleft';
    }
    if (_.indexOf(connections, 'left') !== -1
        && _.indexOf(connections, 'up') !== -1) {
      return 'leftup';
    }

    if (_.indexOf(connections, 'up') !== -1
        && _.indexOf(connections, 'down') !== -1) {
      return 'updown';
    }
    if (_.indexOf(connections, 'left') !== -1
        && _.indexOf(connections, 'right') !== -1) {
      return 'leftright';
    }

    if (_.indexOf(connections, 'up') !== -1) {
      return 'up';
    }
    if (_.indexOf(connections, 'right') !== -1) {
      return 'right';
    }
    if (_.indexOf(connections, 'down') !== -1) {
      return 'down';
    }
    if (_.indexOf(connections, 'left') !== -1) {
      return 'left';
    }
  }

  getNeighborsOf(node, matrix: Matrix) {
    const neighbors = [];
    _.each(this.directions, (function(direction) {
      const neighbor = this.findNodeByVector(node.vector.add(direction.vector), matrix);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }).bind(this));
    return neighbors;
  }

  getNeighborsReadyToConnectTo(node, matrix: Matrix) {
    const neighbors = [];

    if (node.configured) {
      return [];
    }

    _.each(this.directions, (function(direction) {

      // Avoid already connected neighbors
      if (_.indexOf(node.connections, direction) !== -1) {
        return;
      }

      const neighbor = this.findNodeByVector(node.vector.add(direction.vector), matrix);

      if (neighbor
        && !neighbor.configured
        && !this.nodesAreIndirectlyConnected(node, neighbor, matrix)) {
        neighbors.push(neighbor);
      }

    }).bind(this));

    return neighbors;
  }

  nodesAreIndirectlyConnected(node1, node2, matrix: Matrix) {
    const connection_direction = this.getConnectionDirectionBetweenNodes(node1, node2);
    return this.findNodeConnectedTo(node1, node2, connection_direction, matrix);
  }

  findNodeConnectedTo(node1, needle, exceptDirection, matrix: Matrix) {
    if (node1.id === needle.id) {
      return true;
    }

    const connected_neighbors = this.getConnectedNeighborsOf(node1, exceptDirection, matrix);
    if (connected_neighbors.length > 0) {
      for (const i in connected_neighbors) {
        const neighbor = connected_neighbors[i];
        const connection_direction = this.getConnectionDirectionBetweenNodes(node1, neighbor);
        if (this.findNodeConnectedTo(neighbor, needle, this.getOppositeDirectionOf(connection_direction), matrix)) {
          return true;
        }
      }
    }

    return false;
  }

  getUnclosedNodeConnectedTo(node, matrix: Matrix) {
    const nodes = this.getUnclosedNodesConnectedTo(node, null, matrix);
    let picked_node;
    if (nodes.length > 0) {
      picked_node = nodes[_.random(nodes.length - 1)];
    }
    return picked_node;
  }

  getUnclosedNodesConnectedTo(node, exceptDirection, matrix: Matrix) {

    // If this node is not marked as "configured" then it is considered
    // unclosed so we return it
    if (!node.configured) {
      return [node];
    }

    if (this.getNeighborsReadyToConnectTo(node, matrix).length > 0) {
      return [node];
    }

    const unclosed_nodes = [];

    const connected_nodes = this.getConnectedNeighborsOf(node, exceptDirection, matrix)

    _.each(connected_nodes, (function(connected_node) {
      const unclosed_children = this.getUnclosedNodesConnectedTo(connected_node, this.getConnectionDirectionBetweenNodes(connected_node, node), matrix);
      if (unclosed_children) {
        _.each(unclosed_children, function(unclosed_child) {
          unclosed_nodes.push(unclosed_child);
        });
      }
    }).bind(this));

    return unclosed_nodes;
  }

  nodeHasEmptyNeighbors(node, matrix: Matrix) {
    const surrounding_nodes = this.getNeighborsOf(node, matrix);
    for (const i in surrounding_nodes) {
      const neighbor = surrounding_nodes[i];
      if (neighbor.connections.length === 0) {
        return true;
      }
    }
    return false;
  }

  markConfiguredNodes(matrix: Matrix) {
    for (const y in matrix) {
      for (const x in matrix[y]) {
        const node = matrix[y][x];
        if (!node.configured && node.connections.length > 0 && !this.nodeHasEmptyNeighbors(node, matrix)) {
          matrix[y][x] = _.extend(matrix[y][x], {
            configured: true
          });
        }
      }
    }
    return matrix;
  }

  initializeMatrix(rows: number, columns: number) {
    const matrix: Matrix = new Array(rows);
    for (let y = 0; y < rows; ++y) {
      matrix[y] = new Array(columns);
      for (let x = 0; x < columns; ++x) {
        matrix[y][x] = {
          id: uuid.v4(),
          type: '',
          direction: '',
          connections: [],
          configured: false,
          connected: false,
          randomized: false,
          vector: new Vector(x, y)
        };
      }
    }
    return matrix as Matrix;
  }

  takeStepToRandomizeMatrix(matrix: Matrix): Matrix {
    const rows = matrix.length,
        columns = matrix[0].length,
        y = _.random(rows - 1),
        x = _.random(columns - 1);

    const node = matrix[y][x];
    if (node.randomized) {
      if (this.isMatrixRandomized(matrix)) {
        return matrix;
      }
      return this.takeStepToRandomizeMatrix(matrix);
    }

    for (let i = 0; i <= _.random(3); i++) {
      matrix = this.rotateNode(matrix[y][x].id, matrix);
    }
    matrix[y][x].randomized = true;

    return matrix;
  }

  randomizeMatrixAsync(matrix, callback, interval) {
    interval = interval || 10;

    const randomize = (function(timestamp) {

      matrix = this.takeStepToRandomizeMatrix(matrix);
      matrix = this.getRecalculatedMatrix(matrix);

      if (typeof callback === 'function') {
        callback(matrix);
      }

      if (!this.isMatrixRandomized(matrix)) {
        setTimeout(function() {
          window.requestAnimationFrame(randomize);
        }, interval);
      }
    }).bind(this);
    window.requestAnimationFrame(randomize);
  }

  randomizeMatrix(matrix: Matrix) {

    while (!this.isMatrixRandomized(matrix)) {
      matrix = this.takeStepToRandomizeMatrix(matrix);
      matrix = this.getRecalculatedMatrix(matrix);
    }

    return matrix;
  }

  generateMatrixAsync(rows, columns, callback, interval) {
    let matrix = this.initializeMatrix(rows, columns);
    interval = interval || 10;

    const generate = (function(timestamp) {

      matrix = this.takeStepToBuildMatrix(matrix);
      matrix = this.markConfiguredNodes(matrix);
      matrix = this.getRecalculatedMatrix(matrix);

      if (typeof callback === 'function') {
        callback(matrix);
      }

      if (!this.isMatrixReady(matrix)) {
        setTimeout(function() {
          window.requestAnimationFrame(generate);
        }, interval);
      }
    }).bind(this);
    window.requestAnimationFrame(generate);
  }

  generateMatrix(rows: number, columns: number) {
    let matrix = this.initializeMatrix(rows, columns);

    while (!this.isMatrixReady(matrix)) {
      matrix = this.takeStepToBuildMatrix(matrix);
      matrix = this.markConfiguredNodes(matrix);
      matrix = this.getRecalculatedMatrix(matrix);
    }

    return matrix;
  }

  rotateNode(id: string, matrix: Matrix) {
    const node = this.findNodeById(id, matrix);
    if (!node) {
      return matrix;
    }

    const current_direction = node.direction;
    let new_direction = '';
    let new_connections: string[] = [];

    switch (current_direction) {
      // Elbows
      case 'upright':
        new_direction = 'rightdown';
        new_connections = ['right', 'down'];
        break;
      case 'rightdown':
        new_direction = 'downleft';
        new_connections = ['down', 'left'];
        break;
      case 'downleft':
        new_direction = 'leftup';
        new_connections = ['left', 'up'];
        break;
      case 'leftup':
        new_direction = 'upright';
        new_connections = ['up', 'right'];
        break;

      // Tees
      case 'leftupright':
        new_direction = 'uprightdown';
        new_connections = ['up', 'right', 'down'];
        break;
      case 'uprightdown':
        new_direction = 'rightdownleft';
        new_connections = ['right', 'down', 'left'];
        break;
      case 'rightdownleft':
        new_direction = 'downleftup';
        new_connections = ['down', 'left', 'up'];
        break;
      case 'downleftup':
        new_direction = 'leftupright';
        new_connections = ['left', 'up', 'right'];
        break;

      // Computers and server
      case 'up':
        new_direction = 'right';
        new_connections = ['right'];
        break;
      case 'right':
        new_direction = 'down';
        new_connections = ['down'];
        break;
      case 'down':
        new_direction = 'left';
        new_connections = ['left'];
        break;
      case 'left':
        new_direction = 'up';
        new_connections = ['up'];
        break;

      // Lines
      case 'leftright':
        new_direction = 'updown';
        new_connections = ['up', 'down'];
        break;
      case 'updown':
        new_direction = 'leftright';
        new_connections = ['left', 'right'];
        break;
    }

    matrix[node.vector.y][node.vector.x].direction = new_direction;
    matrix[node.vector.y][node.vector.x].connections = new_connections;

    matrix = this.getRecalculatedMatrix(matrix);

    return matrix;
  }

  getRecalculatedMatrix(matrix: Matrix) {
    const connectedNodes = this.getAllNodesConnectedToServer(matrix);

    for (const x in matrix) {
      for (const y in matrix[x]) {
        const node = matrix[x][y];
        if (node.type === 'server' || connectedNodes.findIndex((n) => n.id === node.id) >= 0) {
          matrix[x][y].connected = true;
        } else {
          matrix[x][y].connected = false;
        }
      }
    }

    return matrix;
  }

  getAllNodesConnectedToServer(matrix: Matrix) {
    const server = this.getServerNode(matrix);
    return this.getAllNodesConnectedToNode(server, null, matrix, null);
  }

  getAllNodesConnectedToNode(node: Node, exceptDirection, matrix: Matrix, current_nodes) {
    current_nodes = current_nodes || [];
    const connected_nodes = [];
    const connected_neighbors = this.getConnectedNeighborsOf(node, exceptDirection, matrix);

    if (connected_neighbors.length > 0) {

      _.each(connected_neighbors, function(neighbor) {

        // Stop the recursion if this node was already served before
        if (_.indexOf(current_nodes, neighbor) !== -1) {
          return;
        }

        connected_nodes.push(neighbor);

        const nodes_connected_to_neighbor = this.getAllNodesConnectedToNode(neighbor, this.getConnectionDirectionBetweenNodes(neighbor, node), matrix, _.union(current_nodes, connected_neighbors));

        _.each(nodes_connected_to_neighbor, function(node_connected_to_neighbor) {
          connected_nodes.push(node_connected_to_neighbor);
        });

      }.bind(this));

    }

    return connected_nodes;
  }

  getConnectionDirectionBetweenNodes(node1: Node, node2: Node) {
    const x1 = node1.vector.x,
        x2 = node2.vector.x,
        y1 = node1.vector.y,
        y2 = node2.vector.y;

    if (x1 === x2 && y1 < y2) {
      return 'down';
    } else if (x1 === x2 && y1 > y2) {
      return 'up';
    } else if (y1 === y2 && x1 < x2) {
      return 'right';
    } else if (y1 === y2 && x1 > x2) {
      return 'left';
    }

    return;
  }

  getConnectedNeighborsOf(node: Node, exceptDirection: string, matrix: Matrix) {
    const connectedNodes = [];

    const directions = [
      { name: 'up', vector: new Vector(0, -1) },
      { name: 'down', vector: new Vector(0, 1) },
      { name: 'left', vector: new Vector(-1, 0) },
      { name: 'right', vector: new Vector(1, 0) }
    ];

    _.each(directions, (function(direction) {

      if (exceptDirection === direction.name) {
        return;
      }

      const neighbor = this.findNodeByVector(node.vector.add(direction.vector), matrix);

      if (!neighbor) {
        return;
      }

      if (this.nodesAreConnected(node, neighbor, matrix)) {
        connectedNodes.push(neighbor);
      }
    }).bind(this));

    return connectedNodes;
  }

  nodesAreConnected(node1, node2, matrix) {
    const xdiff = Math.abs(node1.vector.x - node2.vector.x);
    const ydiff = Math.abs(node1.vector.y - node2.vector.y);
    if (xdiff > 0 && ydiff > 0) {
      return false;
    }

    const conn1 = node1.connections;
    const conn2 = node2.connections;

    const node1IsOnHigherRow = node1.vector.y < node2.vector.y;
    const node2IsOnHigherRow = node1.vector.y > node2.vector.y;
    const nodesAreOnSameRow = node1.vector.y === node2.vector.y;
    const node1IsOnFartherColumn = node1.vector.x > node2.vector.x;
    const node2IsOnFartherColumn = node1.vector.x < node2.vector.x;
    const nodesAreOnSameColumn = node1.vector.x === node2.vector.x;

    if (conn1.findIndex((c) => c === 'up') >= 0
        && conn2.findIndex((c) => c === 'down') >= 0
        && node2IsOnHigherRow
        && nodesAreOnSameColumn) {
      // console.log("Node " + node1.vector.x + "," + node1.vector.y + " is connected with " + node2.vector.x + "," + node2.vector.y + " because of UP to DOWN connection", node1, node2);
      return true;
    }
    
    if (conn1.findIndex((c) => c === 'down') >= 0
        && conn2.findIndex((c) => c === 'up') >= 0
        && node1IsOnHigherRow
        && nodesAreOnSameColumn) {
      // console.log("Node " + node1.vector.x + "," + node1.vector.y + " is connected with " + node2.vector.x + "," + node2.vector.y + " because of DOWN to UP connection", node1, node2);
      return true;
    }
    if (conn1.findIndex((c) => c === 'left') >= 0
        && conn2.findIndex((c) => c === 'right') >= 0
        && node1IsOnFartherColumn
        && nodesAreOnSameRow) {
      // console.log("Node " + node1.vector.x + "," + node1.vector.y + " is connected with " + node2.vector.x + "," + node2.vector.y + " because of LEFT to RIGHT connection", node1, node2);
      return true;
    }
    if (conn1.findIndex((c) => c === 'right') >= 0
        && conn2.findIndex((c) => c === 'left') >= 0
        && node2IsOnFartherColumn
        && nodesAreOnSameRow) {
      // console.log("Node " + node1.vector.x + "," + node1.vector.y + " is connected with " + node2.vector.x + "," + node2.vector.y + " because of RIGHT to LEFT connection", node1, node2);
      return true;
    }


    return false;
  }

  getOppositeDirectionOf(direction) {
    switch(direction) {
      case 'up':
        return 'down';
        break;
      case 'down':
        return 'up';
        break;
      case 'left':
        return 'right';
        break;
      case 'right':
        return 'left';
        break;
    }
  }

  inBounds(vector, matrix) {
    const totalRows = matrix.length;
    if (totalRows === 0) {
      return false;
    }
    const totalColumns = matrix[0].length;
    const x = vector.x;
    const y = vector.y;
    return x >= 0 && y >= 0 && x < totalColumns && y < totalRows;
  }

  getServerNode(matrix) {

    for (const x in matrix) {
      for (const y in matrix[x]) {
        const node = matrix[x][y];
        if (node.type === 'server') {
          return node;
        }
      }
    }

    return null;
  }

  findNodeById(id: string, matrix: Matrix) {
    for (const x in matrix) {
      for (const y in matrix[x]) {
        const node = matrix[x][y];
        if (node.id === id) {
          return node;
        }
      }
    }

    console.warn('Failed to find node', matrix, id);
  }

  findNodeByVector(vector, matrix) {
    if (!this.inBounds(vector, matrix)) {
      return null;
    }

    if (!matrix[vector.y] && !matrix[vector.y][vector.x]) {
      return null;
    }

    return matrix[vector.y][vector.x];
  }

}
