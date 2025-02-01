const bidding = async(io, players, firstAnnoucer) => {
    let bid = 0;
    let bidPlayer = firstAnnoucer;
    let trump;
    let counter = 0;
    let highestBidder = bidPlayer;

    io.emit('info', players[bidPlayer].name+' seid zerst ah', 5000);
    while ((counter < 3 && bid < 157) || bid <= 0) {
        players[bidPlayer].socket.emit('bidRequest', bid);
        await new Promise((resolve) => {
            players[bidPlayer].socket.once('bid', (bidNumber, bidSuit) => {
                if (bidSuit == "ichLosse") {
                    io.emit('newBid', bid, bidSuit, bidPlayer);
                    bidPlayer = ++bidPlayer % players.length;
                    counter++;
                } else {
                    counter = 0;
                    bid = bidNumber;
                    trump = bidSuit;
                    io.emit('removeBids');
                    io.emit('newBid', bid, bidSuit, bidPlayer);
                    highestBidder = bidPlayer
                    bidPlayer = ++bidPlayer % players.length;
                }
                resolve();
            });
        });
    }
    // chose companion
    io.emit('setTrump', trump);
    io.emit('info', players[highestBidder].name + ' suecht Mitspieler:in us', -1)
    players[highestBidder].socket.emit('removeBids');
    players[highestBidder].socket.emit('chooseCompanion');
    let companion = await new Promise((resolve) => {
        players[highestBidder].socket.once('companionSelected', (companion) => {
            resolve(companion);
        });
    });
    io.emit('eraseTable');
    return [highestBidder, companion, bid, trump];
}


module.exports = bidding;