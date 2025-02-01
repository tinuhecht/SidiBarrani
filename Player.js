class Player {
    constructor(socket) {
        this.socket = socket;
        this.cards = [];
        this.points = 0;
        this.tricks = [];
    }
  }
  
  module.exports = Player;