var urnValue = "";

const players = [
  { 
    id: "10",
    name: "Manuel Neuer",
    country: "Alemanha",
  },
  { 
    id: "20",
    name: "Kylian Mbappé",
    country: "França",
  },
  { 
    id: "30",
    name: "Vinícius Jr",
    country: "Brasil",
  },
  { 
    id: "40",
    name: "Cristiano Ronaldo",
    country: "Portugal",
  },
  { 
    id: "50",
    name: "Lionel Messi",
    country: "Argentina",
  },
];

const displayNumber1 = document.getElementById("urn--span--n1");
const displayNumber2 = document.getElementById("urn--span--n2");
const displayPlayerImg = document.getElementById("urn--img--player-img");
const displayPlayerName = document.getElementById("urn--span--player-name");
const displayPlayerCountry = document.getElementById("urn--span--player-country");
const displayEndScreen = document.getElementById("urn--div--the-end-screen");
const displayVotingScreen = document.getElementById("urn--div--voting-screen");

document.querySelectorAll("button[data-value]").forEach(button =>
  button.addEventListener("click", () =>
  onNumberClick(button.getAttribute("data-value"))));

document.querySelectorAll("button[data-action]").forEach(button =>
  button.addEventListener("click", () =>
  onActionClick(button.getAttribute("data-action"))));

function onNumberClick(event) {
  if (urnValue.length < 2) {
    urnValue += event;
    updateDisplay("number");
  }
}

function onActionClick(event) {
  switch (event) {
    case "white":
      urnValue = "00";
      break;
    case "confirm":
      break
    default:
      urnValue = "";
      break;
  }

  updateDisplay(event);
}

function updateDisplay(event) {
  const chosedPlayer = players.find(player => player.id === urnValue);
  const falbackText = urnValue.length === 2 ? "Em branco" : "-";

  if (event === "confirm" && urnValue.length === 2) {
    displayVotingScreen.setAttribute("class", "hidden");
    displayEndScreen.setAttribute("class", "flex justify-center items-center");

    setTimeout(resetUrn, 2300);

    return;
  }
  
  displayNumber1.innerHTML = urnValue[0] || "";
  displayNumber2.innerHTML = urnValue[1] || "";
  displayPlayerImg.setAttribute("src", "assets/img/" + chosedPlayer?.id + ".webp");
  displayPlayerName.innerHTML = chosedPlayer?.name || falbackText;
  displayPlayerCountry.innerHTML = chosedPlayer?.country || falbackText; 
}

function resetUrn() {
  urnValue = "";

  displayEndScreen.setAttribute("class", "hidden");
  displayVotingScreen.setAttribute("class", "flex");

  updateDisplay("clear");
}