const form = document.getElementById('form');
const input = document.getElementById('message');
const chat = document.getElementById('chat');

function addMessage(sender, text) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(p);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  addMessage('Tú', message);
  input.value = '';
  try {
    const res = await fetch('/api/chatbotremeex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (data.reply) {
      addMessage('Ana', data.reply);
    } else {
      addMessage('Ana', 'Lo siento, ocurrió un error.');
    }
  } catch (err) {
    addMessage('Ana', 'No pude conectarme al servidor.');
  }
});
