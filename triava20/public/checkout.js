document.addEventListener('DOMContentLoaded', () => {
  const orderDateEl = document.getElementById('order-date');
  if (orderDateEl) {
    const now = new Date();
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const day = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const formatted = `${day} de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}, ${year}`;
    orderDateEl.textContent = formatted;
  }
});
