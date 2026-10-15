// recuperar.js — RF-004: recuperar o restablecer contraseña

const formSolicitar = document.getElementById("form-solicitar");
const btnSolicitar = document.getElementById("btn-solicitar");
const pasoSolicitar = document.getElementById("paso-solicitar");
const pasoConfirmacion = document.getElementById("paso-confirmacion");
const btnReenviar = document.getElementById("btn-reenviar");

async function enviarSolicitud(correo) {
  await auth.olvidePassword(correo);
  document.getElementById("correo-mostrado").textContent = correo;
  pasoSolicitar.classList.add("oculto");
  pasoConfirmacion.classList.remove("oculto");
  document.querySelector('[data-paso="2"]').classList.add("activo");
}

formSolicitar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = document.getElementById("correo-recuperar").value.trim();
  if (!correo.includes("@")) return;

  btnSolicitar.disabled = true;
  btnSolicitar.textContent = "Enviando…";
  try {
    await enviarSolicitud(correo);
  } catch (error) {
    window.CicsaToast?.mostrar(error.message || "No se pudo enviar la solicitud.", "error");
  } finally {
    btnSolicitar.disabled = false;
    btnSolicitar.textContent = "Enviar solicitud al administrador";
  }
});

btnReenviar.addEventListener("click", async () => {
  const correo = document.getElementById("correo-mostrado").textContent;
  btnReenviar.disabled = true;
  btnReenviar.textContent = "Enviando…";
  try { await auth.olvidePassword(correo); } catch (error) {
    window.CicsaToast?.mostrar(error.message || "No se pudo reenviar la solicitud.", "error");
    btnReenviar.disabled = false; btnReenviar.textContent = "Reenviar solicitud"; return;
  }
  btnReenviar.textContent = "Solicitud reenviada ✓";
  setTimeout(() => {
    btnReenviar.textContent = "Reenviar solicitud";
    btnReenviar.disabled = false;
  }, 3000);
});
