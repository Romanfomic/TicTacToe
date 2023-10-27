function getGameId() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    return params && params.gameId;
}

function copyLink(){
    var divText = document.getElementById('link').innerText;
    var textarea = document.createElement('textarea');
    textarea.value = divText;
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Приглашение скопировано');
}
