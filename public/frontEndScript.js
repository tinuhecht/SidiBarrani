const socket = io();
        
        const playerCardsDiv = document.getElementById('playerCards');
        const tableDiv = document.getElementById('table');
        const playerLeftCardsDiv = document.getElementById('playerLeftCards');
        const playerTopCardsDiv = document.getElementById('playerTopCards');
        const playerRightCardsDiv = document.getElementById('playerRightCards');
        const playerInfoDiv = document.getElementById('playerInfo');
        const playerLeftInfoDiv = document.getElementById('playerLeftInfo');
        const playerTopInfoDiv = document.getElementById('playerTopInfo');
        const playerRightInfoDiv = document.getElementById('playerRightInfo');
        const goalInfoDiv = document.getElementById('goalInfo')

        let currentTurn = 0;
        var tablePos = null;

        //receiving table position
        socket.on('tablePosition', (position) => { tablePos = position }); //receiving position

        //erase table
        socket.on('eraseTable', () => {tableDiv.innerHTML = ''});

/////////////////////////////////////////////////
//// Table sockets ///////////////////////////////
/////////////////////////////////////////////////
        
        //show information for some time x
        socket.on('info', (message, time) => {
            const infoDiv = document.createElement('div');
            infoDiv.innerText = message;
            infoDiv.className = 'info-message'; // Add the CSS class
            tableDiv.appendChild(infoDiv);
            console.log('info received');
            if (time !== null && time !== -1){ // -1 means infinite time
                setTimeout(() => {
                    tableDiv.removeChild(infoDiv);
                }, time);
            };
        });

        //remove information
        socket.on('clearTable', () => {
            tableDiv.innerHTML = '';
        });

        //type in name and send it to server
        socket.on('nameRequest', () => {
            const inputField = document.createElement('input'); //inputwindow
            inputField.placeholder = 'Tipp doch din Name ih und druck enter';
                tableDiv.appendChild(inputField);
                inputField.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    socket.emit('nameSent', inputField.value);
                    tableDiv.removeChild(inputField); // Remove the input field after sending the name
                }
            });
        });
        //type in goal and send it to server
        socket.on('goalRequest', () => {
            const inputField = document.createElement('input'); //inputwindow
            inputField.className = 'bidInputField';
            inputField.type = 'number';  // make sure that input is a number
            inputField.placeholder = 'Zielpunktzahl ihgeh und Enter drucke';
            inputField.step = 100;
            tableDiv.appendChild(inputField);
                inputField.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    socket.emit('goalSent', inputField.value);
                    tableDiv.removeChild(inputField); // Remove the input field after sending the name
                }
            })
        });

        //set goal for div
        socket.on('setGoal', (goal) => {
            const goalText = document.createElement('p');
            goalText.innerText = 'Ziel: ' + goal;
            goalInfoDiv.appendChild(goalText)
        })

        //ask for bid
        socket.on('bidRequest', (lastbid) => {
            const bidTrumpsDiv = document.createElement('div');  //bidTable
            bidTrumpsDiv.className = 'bidTrumps';
            
            const inputField = document.createElement('input'); //inputwindow
            inputField.className = 'bidInputField';
            inputField.type = 'number';  // make sure that input is a number
            inputField.placeholder = 'wievil machsch?';
            inputField.value = lastbid;
            if (inputField.value < 100){
                inputField.step = 10;
            }
            else {
                inputField.step = 5;
            }
            tableDiv.appendChild(inputField);
            let modes = ['Eichel', 'Rosen', 'Schellen', 'Schilten', 'Obeabe', 'Undeufe', 'ichLosse'];
            for (let mode of modes){
                createBidButton(mode, bidTrumpsDiv, inputField, lastbid);
            }
            tableDiv.appendChild(bidTrumpsDiv);
        });

        //new bid received
        socket.on('newBid', (bid, suit, position) => {
            const playerBidDiv = document.createElement('div');
            playerBidDiv.className = 'playerBid';
            const playerBidSuitDiv = document.createElement('div');
            playerBidSuitDiv.className = 'playerBidSuit';
            const img = document.createElement('img');
            img.src = 'images/'+ suit.toLowerCase() +'.png';
            playerBidSuitDiv.appendChild(img);
            playerBidDiv.appendChild(playerBidSuitDiv);
            if (suit != 'ichLosse'){ //add points if it is not "ich losse"
                const playerBidPointsDiv = document.createElement('div');
                playerBidPointsDiv.className = 'playerBidPoints';
                playerBidPointsDiv.innerText = bid;
                playerBidDiv.appendChild(playerBidPointsDiv);
            }
            console.log('received from ' + position + ' suit: '+ suit + ' bid: '+ bid + img.src);
            tableDiv.appendChild(playerBidDiv);
            playerBidDiv.style.position = 'absolute';
            switch ((((position-tablePos)%4)+4)%4) {
                case 0:
                    playerBidDiv.style.bottom = '1%';
                    break;
                case 1:
                    playerBidDiv.style.right = '1%';
                    break;
                case 2:
                    playerBidDiv.style.top = '1%';
                    break;
                case 3:
                    playerBidDiv.style.left = '1%';
                    break;
                default:
                    break;
            }
        });

        //remove old bids
        socket.on('removeBids', () => {
            const playerBids = document.getElementsByClassName('playerBid');    
            while (playerBids.length > 0) { //remove old bids
                tableDiv.removeChild(playerBids[0]);
            }
        });
        
        //choose companion
        socket.on('chooseCompanion', () => {
            console.log('now choose companion');
            for (let ii = 1; ii < 4; ii++){
                createCompanionButton(ii);
                console.log('button+ '+ii);
            }
        });
        socket.on('setTrump', (trump) => {
            if (goalInfoDiv.childElementCount >= 2) {
                goalInfoDiv.removeChild(goalInfoDiv.lastElementChild); //remove last one
            }
            const trumpText = document.createElement('p');
            trumpText.innerText = 'Trumpf: ' + trump;
            goalInfoDiv.appendChild(trumpText)
        })

        //update table
        socket.on('updateTable', (playingPlayer, card, erase) => {
            if (erase) {
                let direction;
                switch ((((playingPlayer-tablePos)%4)+4)%4) {
                    case 0:
                        direction = 'fade-out-down';
                        break;
                    case 1:
                        direction = 'fade-out-left';
                        break;
                    case 2:
                        direction = 'fade-out-up';
                        break;
                    case 3:
                        direction = 'fade-out-right';
                        break;
                }
                // Apply fade-out effect with the chosen direction
                Array.from(tableDiv.children).forEach((child) => {
                    child.classList.add(direction); // Add direction-specific class

                    // Remove the element after the animation ends
                    child.addEventListener('animationend', () => {
                        tableDiv.removeChild(child);
                    });
                });
            }
            console.log(playingPlayer, card);
            const tableCardDiv = document.createElement('div');
            tableCardDiv.className = 'tableCard';
            const img = document.createElement('img');
            img.src = getCardImage(card);
            img.alt = `${card.value} ${card.suit}`;
            tableCardDiv.appendChild(img);
            switch ((((playingPlayer-tablePos)%4)+4)%4) {
            case 0:
            tableCardDiv.style.transform = `translate(0, 50%) rotate(0deg)`;
            break;
            case 1:
                tableCardDiv.style.transform = `translate(50%, 0) rotate(90deg)`;
                break;
            case 2:
                tableCardDiv.style.transform = `translate(0, -50%) rotate(180deg)`;            
                break;
            case 3:
                tableCardDiv.style.transform = `translate(-50%, 0) rotate(270deg)`;
                break;
            default:
                break;
            }
            tableDiv.appendChild(tableCardDiv);
        });

/////////////////////////////////////////////////
//// Knock sockets //////////////////////////////
/////////////////////////////////////////////////

        //knock request
        socket.on('knockRequest', (trumpPlayer, companion) => {
            if (tablePos != trumpPlayer && tablePos != companion){
                const knockButtonsDiv = document.createElement('div');
                knockButtonsDiv.className = 'knockButtons';
                //Yes Button
                const knockButtonYes = document.createElement('button');
                const buttonImgYes = document.createElement('img');
                buttonImgYes.src = 'images/yes.png';
                knockButtonYes.appendChild(buttonImgYes);
                knockButtonYes.onclick = () => {
                    socket.emit('knock', 2);
                    tableDiv.removeChild(knockButtonsDiv);
                }
                knockButtonsDiv.appendChild(knockButtonYes);
                //No Button
                const knockButtonNo = document.createElement('button');
                const buttonImgNo = document.createElement('img');
                buttonImgNo.src = 'images/no.png';
                knockButtonNo.appendChild(buttonImgNo);
                knockButtonNo.onclick = () => {
                    socket.emit('knock', 0.5);
                    tableDiv.removeChild(knockButtonsDiv);
                }
                knockButtonsDiv.appendChild(knockButtonNo);
                tableDiv.appendChild(knockButtonsDiv);
            }
        });

        socket.on('knockMade', () => {
            const knockImg = document.createElement('img');
            knockImg.className = 'knockImg';
            knockImg.src = 'images/knock.png';
            tableDiv.innerHTML = '';
            tableDiv.appendChild(knockImg);
        });


/////////////////////////////////////////////////
//// Player sockets /////////////////////////////
/////////////////////////////////////////////////

        //player joined
        socket.on('playerJoined', (position, name, points) => {
            const playerNameDiv = document.createElement('div');
            const playerPointsDiv = document.createElement('div');
            playerNameDiv.innerText = name+':';
            playerPointsDiv.innerText = points;
            const playerHandCardsDiv = document.createElement('div');
            playerHandCardsDiv.className = 'playerHandCards';
            for (let ii = 0; ii < 9; ii++){
                const img = document.createElement('img');
                img.src = 'images/backsideCard.png';
                img.className = 'backsideCard'
                playerHandCardsDiv.appendChild(img);
            }
            switch ((((position-tablePos)%4)+4)%4) {
                case 0:
                    playerInfoDiv.innerHTML = '';
                    playerInfoDiv.appendChild(playerNameDiv);
                    playerInfoDiv.appendChild(playerPointsDiv);
                    break;
                case 1:
                    playerRightInfoDiv.innerHTML = '';
                    playerRightCardsDiv.innerHTML = '';
                    playerRightInfoDiv.appendChild(playerNameDiv);
                    playerRightInfoDiv.appendChild(playerPointsDiv);
                    playerRightCardsDiv.appendChild(playerHandCardsDiv.cloneNode(true));
                    break;
                case 2:
                    playerTopInfoDiv.innerHTML = '';
                    playerTopCardsDiv.innerHTML = '';
                    playerTopInfoDiv.appendChild(playerNameDiv);
                    playerTopInfoDiv.appendChild(playerPointsDiv);
                    playerTopCardsDiv.appendChild(playerHandCardsDiv.cloneNode(true));
                    break;
                case 3:
                    playerLeftInfoDiv.innerHTML = '';
                    playerLeftCardsDiv.innerHTML = '';
                    playerLeftInfoDiv.appendChild(playerNameDiv);
                    playerLeftInfoDiv.appendChild(playerPointsDiv);
                    playerLeftCardsDiv.appendChild(playerHandCardsDiv.cloneNode(true));
                    break;
                default:
                    break;
            }
        });

        //receiving hand
        socket.on('deal', (hand) => {
            console.log(hand);
            hand.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                const img = document.createElement('img'); // create image element
                img.src = getCardImage(card); // call function to get image
                img.alt = `${card.value} ${card.suit}`;
                cardDiv.appendChild(img);
                playerCardsDiv.appendChild(cardDiv); //add card to hand
                cardDiv.onclick = () => {
                    socket.emit('playCard', card, (response) => {
                        console.log('Response received:', response); // Debugging-console.log
                        if (response.success) {
                            playerCardsDiv.removeChild(cardDiv); // remove card from hand
                            console.log('Karte entfernt:', card);
                        } else {
                            console.log('Karten spielen fehlgeschlagen:', response);
                        }
                    });
                };
            });
        });

        

        //remove player Card
        socket.on('removePlayerCard', (position) => {
            let playerHandCardsDiv;
            switch ((((position-tablePos)%4)+4)%4) {
                case 1:
                    playerHandCardsDiv = playerRightCardsDiv.querySelector('.playerHandCards');
                    break;
                case 2:
                    playerHandCardsDiv = playerTopCardsDiv.querySelector('.playerHandCards');
                    break;
                case 3:
                    playerHandCardsDiv = playerLeftCardsDiv.querySelector('.playerHandCards');
                    break;
                default:
                    break;
            }
            playerHandCardsDiv.firstElementChild.remove()
        });

        //update scores
        socket.on('scoreUpdate', (position, score) => {
            switch ((((position-tablePos)%4)+4)%4) {
                case 0:
                    playerInfoDiv.querySelector('.playerPointsDiv').innerText = score;
                    break
                case 1:
                    playerRightInfoDiv.querySelector('.playerPointsDiv').innerText = score;
                    break;
                case 2:
                    playerTopInfoDiv.querySelector('.playerPointsDiv').innerText = score;
                    break;
                case 3:
                    playerLeftInfoDiv.querySelector('.playerPointsDiv').innerText = score;
                    break;
                default:
                    break;
            }
            playerInfoDiv.querySelector('.playerPointsDiv').innerText = scores[ii++%4];
            playerRightInfoDiv.querySelector('.playerPointsDiv').innerText = scores[ii++%4];
            playerTopInfoDiv.querySelector('.playerPointsDiv').innerText = scores[ii++%4];
            playerLeftInfoDiv.querySelector('.playerPointsDiv').innerText = scores[ii++%4];
        });


/////////////////////////////////////////////////
//// Auxilary functions/////////////////////////
/////////////////////////////////////////////////
        // get card image from suit and value
        function getCardImage(card) {
            const basePath = 'images/';
            const value = card.val.toLowerCase(); 
            const suit = card.suit.toLowerCase(); 
            return `${basePath}${suit}-${value}.png`; // example: images/eichel-under.png
        }

        // Create Button for companion selection
        function createCompanionButton(positionOffset){
            const button = document.createElement('button');
            button.className = 'companionSelectionButton'
            const buttonImg = document.createElement('img');
            buttonImg.src = 'images/positionOffset'+ positionOffset +'.png';  // adapt path of images
            console.log(buttonImg.src);
            button.appendChild(buttonImg);
            button.onclick = () => {
                socket.emit('companionSelected', (positionOffset+tablePos)%4);
                tableDiv.innerHTML = '';
            }
            switch (positionOffset) {
                case 1:
                    button.style.right = '1%';
                    break;
                case 2:
                    button.style.top = '1%';
                    break;
                case 3:
                    button.style.left = '1%';
                    break;
                default:
                    break;
            }
            tableDiv.appendChild(button);
        }

        // Create Button for bidTable
        function createBidButton(name, bidTrumpsDiv, inputField, lastbid){

                const button = document.createElement('button');
                // create picture of button
                const buttonImg = document.createElement('img');
                buttonImg.src = 'images/'+ name.toLowerCase() +'.png';  // adapt path of images
                console.log(buttonImg.src);
                button.appendChild(buttonImg);
                if (name == 'ichLosse'){ //add points if it is not "ich losse"
                    const textNode = document.createTextNode(" Ich losse!"); // Create a text node
                    button.appendChild(textNode); // Append the text node to the button
                    tableDiv.appendChild(button);
                    button.className = 'ichLosseButton';
                }
                else{
                    bidTrumpsDiv.appendChild(button);
                    button.className = 'trumpButton';
                }

                button.onclick = () => {
                    lastBidNo = Number(lastbid);
                    inputFieldNo = Number(inputField.value);

                    if (name == 'ichLosse'){ //ich losse
                        socket.emit('bid', lastbid, name);
                        tableDiv.removeChild(bidTrumpsDiv);
                        tableDiv.removeChild(inputField);
                        tableDiv.removeChild(button);
                    }
                    else{ //announment
                        if (inputFieldNo >= 157){ //match
                                tableDiv.innerHTML = '';
                                socket.emit('bid', 157, name);
                            }
                            else if ((inputFieldNo >= 100 && inputFieldNo%5 != 0) || (inputFieldNo < 100 && inputFieldNo%10 != 0)){
                                alert('Bis 100 nur in 10er Schritt erhöhe, ab 100 sind 5er Schritt erlaubt');
                            }
                            else if (inputFieldNo >= lastBidNo+10 || (inputFieldNo >= 100 && inputFieldNo >= lastBidNo+5 )){
                                console.log('inputfield: '+inputFieldNo + ' lastbid:'+lastBidNo);
                                socket.emit('bid', inputFieldNo, name);
                                tableDiv.innerHTML = '';
                            }
                            else{
                                console.log('inputfield: '+inputFieldNo + ' lastbid:'+lastBidNo);
                                console.log('Type of lastbid:', typeof lastBidNo);
                                console.log('Type of inputfield:', typeof inputFieldNo);
                                alert('bis 100 um mindestens 10 erhöhe, ab 100 gaht au 5' );
                                }
                        };
                        
                }
                
        }