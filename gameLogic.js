// gameLogic.js

//check if a card is allowed to play and removes it from the hand if it is allowed
function allowedCard(tableCards, leadPlayer, playingCard, handCards, trump){
  const leadCard = tableCards[leadPlayer];
  let returnValue = false;
  if (leadCard == undefined){
    returnValue =  true;
  }
  else if (playingCard.suit == leadCard.suit){
      returnValue = true;
  }
  else if (playingCard.suit == trump ){
      if (!handCards.some(card => card.suit != trump)) {// only trumps in hand
        returnValue = true;
      } // only trumps in hand
      let trumpOrder = [6, 7, 8, 10, 12, 13, 14, 9, 11];
      let tableTrumpCards = tableCards.filter(card => card.suit == trump)
      if (!tableTrumpCards.some(card => trumpOrder.indexOf(card.noVal) > trumpOrder.indexOf(playingCard.noVal))){ //becomes best trump on table
        returnValue = true
      }
  }
  else if (!handCards.some(card => card.suit == leadCard.suit)){ //can't play this suit
    returnValue = true;
  }
  else if (leadCard.suit == trump && handCards.filter(card => card.suit == trump).map(card => card.val) == 'Under'){ // Buur does not need to be played
    returnValue = true;
  }
  if (returnValue){ // if possible, remove card from
    let index = handCards.findIndex(card => card.suit == playingCard.suit && card.val == playingCard.val);
    handCards.splice(index, 1);
    return true;
  }

  return false;
}

//check who makes the trick
function trick(tableCards, leadPlayer, trump){

  let gameVals = new Array(4);
  const noVals = tableCards.map(card => card.noVal);
  const suits = tableCards.map(card => card.suit);
  gameVals = (suits.map(suit => 10*(suit == trump) + 1*(trump != suits[leadPlayer]) * (suit == suits[leadPlayer]))); //zero points for all we can't use, * 10 for trumps
  gameVals = gameVals.map((gameVal, index) => gameVal * noVals[index]);
  gameVals = gameVals.map(gameVal => (gameVal == 90 || gameVal == 110)*100 + gameVal); // make "nell" and "Buur" stronger

  if (trump == 'Undeufe'){ // smallest nonzero number wins for undeufe
    let minVal = Math.min(...gameVals.filter(val => val !== 0));
    return gameVals.indexOf(minVal);
  }
  return gameVals.indexOf(Math.max(...gameVals));
}

//calculate points of tricks and add it to the points, while removing the tricks
function calculatePoints(cards, trump,){

  let points = 0;
  for (let ii = 0; ii < cards.length; ii++) {
    switch (cards[ii].noVal){
      case 6:
          points += 11 * (trump == 'Undeufe');
          break
      case 8:
          points += 8 * (trump == 'Undeufe' || trump == 'Obeabe');
          break
      case 9:
          points += 14 * (trump == cards[ii].suit);
          break
      case 10:
          points += 10;
          break
      case 11:
          points += (2 + 18 * (trump == cards[ii].suit));
          break
      case 12:
          points += 3;
          break
      case 13:
          points += 4;
          break;
      case 14:
          points += 11 * (trump != 'Undeufe');
          break;
    }
  }
  return points;
}

module.exports = {allowedCard, trick, calculatePoints};