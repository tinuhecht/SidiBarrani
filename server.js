const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const playGame = require('./playGame'); // Import the playGame function
const bidding = require('./bidding'); // Import the bidding funciton
const Player = require('./Player'); // Import player class

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 4000;

// Serve static files from the public directory
app.use(express.static('public'));

// Game state
let goal = 2500;
let players =[]
let playerCount = 4;
let trump = 'Obeabe';
let pointsAnnounced = 155 ;
let pointsMade = 155 ;
let trumpPlayer = 0;
let companion = 1;
let ready = 0;
let answer = 0;

// Initialize a deck of cards (swiss version)
const suits = ['Eichel', 'Schellen', 'Schilten', 'Rosen'];
const vals = ['Ass', 'Koenig', 'Ober', 'Under', 'Banner', 'Neun', 'Acht', 'Sieben', 'Sechs'];
const noVals = [14, 13, 12, 11, 10, 9, 8, 7, 6]; //Easier for sorting and comparing
const deck = [];

for (const suit of suits) {
    for (let ii = 0; ii<9; ii++){
        deck.push({ suit, val: vals[ii], noVal: noVals[ii]});
    }
}

// shuffle deck
function shuffle(array) {
  for (let ii = array.length - 1; ii > 0; ii--) {
    const jj = Math.floor(Math.random() * (ii + 1));
    [array[ii], array[jj]] = [array[jj], array[ii]];  
  }
  return array;
}

// deal cards
function dealCards() {
  let shuffledDeck = shuffle(deck).slice();
  for (player of players){
    player.handCards = shuffledDeck.splice(0, 9);
    player.handCards.sort((a, b) => {
      if (a.suit > b.suit) return 1;
      if (a.suit < b.suit) return -1;
      if (a.noVal > b.noVal) return 1;
      if (a.noVal < b.noVal) return -1;
      return 0;
    });
    player.socket.emit('deal', player.handCards);
    console.log('Ausgeteilt')
  }
}

//delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/////////////
//MAIN PART//
/////////////

// connection of the player and start the game if all connected
io.on('connection', async (socket) => { // async
  if (io.sockets.sockets.size==1){ //new game
    players = [];
    ready = 0;
  }

  if (players.length >= playerCount){
    socket.emit('info', "Sorry, de Tisch isch scho volle", -1);
    socket.removeAllListeners();
    socket.disconnect();
    return;
  }
  players.push(new Player(socket, players.length));
  let position = players.length - 1;
  console.log('New player' + socket.id + ' connected');

  socket.emit('nameRequest'); //request name from player
  players[position].name = await new Promise((resolve) => {
    socket.once('nameSent', (name) => {
      resolve(name);
    });
  });
  ready++;
  socket.emit('info', 'Hoi '+players[position].name+'! muesch no hurti warte bis die andere joined hend', -1);
  socket.emit('tablePosition', position);

  if (ready == playerCount) {
      let success = false;
      let match = false;
      let opponentMatch = false;
      let opponentPoints = 0;
      let multiplier = 1;
      let firstAnnoucer = 0;

      io.emit('eraseTable');
      io.emit('info', players[position].name + ' wählt Zielpunktzahl', -1)
      socket.emit('goalRequest'); //request name from player
      goal = await new Promise((resolve) => {
        socket.once('goalSent', (goal) => {
          resolve(goal);
        });
      });
      io.emit('setGoal', goal)
      while (Math.max(...players.map(player => player.points)) < goal) { //deal cards when all player are connected;
          io.emit('clearTable');
          dealCards();
          for (ii = 0; ii < playerCount; ii++) {
            io.emit('playerJoined', ii, players[ii].name, players[ii].points);
          }
          // bidding
          [trumpPlayer, companion, pointsAnnounced, trump] = await bidding(io, players, firstAnnoucer);
          firstAnnoucer = ++firstAnnoucer % 4;

          // Chlopfe
          io.emit('info', players[trumpPlayer].name+' het '+players[companion].name+' als Mitspieler:in gwählt', 5000);
          await delay(3000);
          io.emit('info', 'Gegner hend d\'Möglichkeit zum chlopfe (Ihsatz x2)', -1);
          io.emit('knockRequest', trumpPlayer, companion);
          answer = 0;
          multiplier = await new Promise((resolve) => {
            players.forEach((player) => {
              player.socket.once('knock', (klick) => {
                console.log('Knock received: ' + klick);
                answer += klick;
                if (answer >= 2) {
                  resolve(2);
                }
                else if (answer == 1) {
                  resolve(1);
                }
              });
            })
          });
          io.emit('eraseTable');
          if (multiplier == 2) {
            io.emit('knockMade');
          }
          else {
            io.emit('info', 'Gegner hed nöd chlopft', 5000);
          }
          await delay(2000);
          io.emit('info', players[trumpPlayer].name + ' fangt ah', -1);

          // playGame
          pointsMade = await playGame(io, players, trumpPlayer, companion, trump); 

          // who won?
          success = pointsMade >= pointsAnnounced;
          match = pointsMade == 157;
          opponentMatch = pointsMade == 0;
          opponentPoints = 157 - pointsMade + !success * multiplier * pointsAnnounced + 100 * opponentMatch;
          announcerPoints = pointsMade + success * multiplier * pointsAnnounced + 100 * match;
          console.log('The announcer made ' + pointsMade + ' points');

          players.map(player => player.points += opponentPoints);
          players[trumpPlayer].points += (announcerPoints - opponentPoints);
          players[companion].points += (announcerPoints - opponentPoints);

          io.emit('clearTable')
          io.emit('info', players[trumpPlayer].name + ' und ' + players[companion].name + ' hend ' + pointsMade + ' Pünkt gmacht.', 3000)
          await delay(3000);
          io.emit('info', 'ahgseid sind ' + pointsAnnounced + ' Pünkt gsi. Das heisst sie bechömed ' + announcerPoints +' Pünkt.', 3000)
          await delay(3000)
      }
      for (ii = 0; ii < playerCount; ii++) {
        io.emit('playerJoined', ii, players[ii].name, players[ii].points);
      }
      io.emit('info', 'Spiel isch verbie, zum neu spiele, Siite neu lade', -1);
      players = [];
      ready = 0;
  }
});


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));