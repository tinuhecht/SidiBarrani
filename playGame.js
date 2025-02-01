// playGame.js

const {allowedCard, trick, calculatePoints} = require('./gameLogic'); // Import the allowedCard function

const playGame = async (io, players, trumpPlayer, companion, trump) => {

    console.log('Game started with players:', players);
    let leadPlayer = trumpPlayer;
    let playingPlayer = leadPlayer;
    let winner = leadPlayer;

    players.map(player => player.tricks = []);

    for (let ii = 9; ii > 0; ii--) {
        const tableCards = new Array(players.length);
        let jj = players.length;
        while (jj >0){
            // Warten auf die Karte des aktuellen Spielers
            await new Promise((resolve) => {
                const waitForCard = () => {
                    players[playingPlayer].socket.once('playCard', (card, callback) => {
                    if (allowedCard(tableCards, leadPlayer, card, players[playingPlayer].handCards, trump)){
                        console.log("karte ", card, " wurde gespielt")
                        tableCards[playingPlayer] = card;
                        io.emit('updateTable', playingPlayer, card, playingPlayer == leadPlayer);
                        callback({ success: true });  // client can remove card from his hand
                        io.emit('removePlayerCard', playingPlayer); // remove card for other players
                        jj--;
                        playingPlayer = ++playingPlayer % players.length; //next players turn
                        resolve(); // Promise wird aufgelöst, wenn die Karte gespielt wurde  
                    }
                    else {
                    console.log("player tried to play card ", card, " , this is not allowed")
                    waitForCard(); //Rekursive Iteration,
                    }
                });
            };
            waitForCard(); //erstes mal aufrufen der Funktion
            console.log("promise solved")
            });

        }
        winner = trick(tableCards, leadPlayer, trump);
        players[winner].tricks.push(...tableCards);
        console.log("player ", winner, " hat gewonnen")
        leadPlayer = winner;
        playingPlayer = winner; //winner from last round can start new round
    };
        
    return(calculatePoints(players[trumpPlayer].tricks.concat(players[companion].tricks), trump) + 5*(winner == trumpPlayer || winner == companion)); //tricks and 5 extra for last trick
}

module.exports = playGame;