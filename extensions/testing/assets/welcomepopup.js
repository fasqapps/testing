function setCookie(name, value, minutes) {
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const [cookieName, cookieValue] = cookies[i].split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

function showPopup() {
  if (!getCookie('saCloseWelcome')) {
    document.getElementById("popup").style.display = "flex";
  }
}

function closePopup() {
  setCookie('saCloseWelcome', 'true', 7);
  document.getElementById("popup").style.display = "none";
}

function showOffer() {
  document.getElementById("popup-content-initial").style.display = "none";
  document.getElementById("popup-content-offer").style.display = "block";
}


window.onload = function () {
  setTimeout(showPopup, 1000);
};