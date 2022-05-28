const socket = io();

const formatDate = (time) => {
  const date = new Date(time);

  return `${date.getHours()}:${date.getMinutes()}`;
};

const messageForm = document.querySelector("#messageForm");
const messageFormInput = document.querySelector("#messageInput");
const messageFormSubmitButton = document.querySelector("#sendButton");
const geolocationButton = document.querySelector("#geolocation");
const messages = document.querySelector("#messages");
const roomName = document.querySelector("#roomName");
const userList = document.querySelector("#userList");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.on("message", ({ text, createdAt, username = "System" }) => {
  if (!text) return;

  messages.innerHTML += `<div>
  <div><b>${username}</b></div>
  ${formatDate(createdAt)} - ${text}
  </div`;
});

socket.on("locationMessage", ({ text, createdAt, username = "System" }) => {
  if (!text) return;

  messages.innerHTML += `<div>
  <div><b>${username}</b></div>
  ${formatDate(
    createdAt
  )} - <a href=${text} target="blank">My current location</a></div>`;
});

socket.on("roomData", ({ users, room }) => {
  roomName.textContent = room;
  console.log(users);

  userList.innerHTML = users
    .map((user) => `<div>${user.username}</div>`)
    .join("");
});

messageForm.onsubmit = (ev) => {
  ev.preventDefault();

  if (!messageFormInput.value) return;

  messageFormSubmitButton.disabled = true;

  socket.emit("sendMessage", messageFormInput.value, (info) => {
    console.log(info);
    messageFormInput.value = "";
    messageFormSubmitButton.disabled = false;
    messageFormInput.focus();
  });
};

geolocationButton.onclick = () => {
  if (!navigator.geolocation) {
    return alert("update your shit");
  }

  geolocationButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    ({ coords: { latitude, longitude } }) => {
      socket.emit("sendLocation", { latitude, longitude }, () => {
        console.log("Location shared");
        geolocationButton.disabled = false;
      });
    }
  );
};

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
