// Restablecimiento de contraseñas desde las acciones de Altas.
async function abrirRestablecerPassword(id, origen = document.activeElement) {
  permisos.exigir("password");
  const usuario = listaUsuarios.find(u => Number(u.id) === Number(id));
  if (!usuario || !permisos.gestionarUsuario(usuario)) throw new Error("El usuario ya no está disponible.");
  if (document.getElementById("modal-restablecer-password")) return;
  const modal = document.createElement("dialog");
  modal.id = "modal-restablecer-password";
  modal.className = "insignia-modal altas-password-modal";
  modal.setAttribute("aria-labelledby", "restablecer-password-titulo");
  modal.innerHTML = `<h2 id="restablecer-password-titulo">Restablecer contraseña</h2>
    <p><strong>${escaparHtml(usuario.nombre)}</strong><br>${escaparHtml(usuario.correo)}</p>
    <form>
      <div class="campo"><label for="restablecer-password-nueva">Nueva contraseña</label><input id="restablecer-password-nueva" type="password" autocomplete="new-password" required></div>
      <div class="campo"><label for="restablecer-password-confirmar">Confirmar nueva contraseña</label><input id="restablecer-password-confirmar" type="password" autocomplete="new-password" required></div>
      <p data-password-estado role="status" aria-live="polite"></p>
      <div class="insignia-form-acciones"><button type="button" class="btn btn-secundario" data-password-cancelar>Cancelar</button><button type="submit" class="btn btn-primario">Guardar contraseña</button></div>
    </form>`;
  const form = modal.querySelector("form");
  const estado = modal.querySelector("[data-password-estado]");
  const guardar = form.querySelector('[type="submit"]');
  const cancelar = modal.querySelector("[data-password-cancelar]");
  let guardando = false;
  cancelar.addEventListener("click", () => { if (!guardando) modal.close(); });
  modal.addEventListener("cancel", evento => { if (guardando) evento.preventDefault(); });
  modal.addEventListener("close", () => {
    form.reset(); modal.remove();
    if (origen?.isConnected) origen.focus();
    else document.getElementById("buscar-usuarios")?.focus();
  }, {once: true});
  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (guardando) return;
    const nueva = modal.querySelector("#restablecer-password-nueva").value.trim();
    const confirmar = modal.querySelector("#restablecer-password-confirmar").value.trim();
    if (!nueva) { estado.textContent = "Escribe la nueva contraseña."; return; }
    if (nueva !== confirmar) { estado.textContent = "Las contraseñas no coinciden."; return; }
    guardando = true; guardar.disabled = true; cancelar.disabled = true;
    estado.textContent = "Guardando contraseña...";
    try {
      const solicitudes = await solicitudesReset.listar();
      const pendientes = solicitudes.filter(s => Number(s.usuarioId) === Number(usuario.id) && s.estado === "pendiente");
      if (pendientes.length) {
        for (const solicitud of pendientes) await solicitudesReset.resolver(solicitud.id, nueva);
      } else await usuarios.cambiarPassword(usuario.id, nueva);
      mostrarToastAdmin("Contraseña actualizada correctamente.", "exito");
      guardando = false; modal.close();
      await cargarTodo();
    } catch (error) { estado.textContent = error.message || "No se pudo restablecer la contraseña."; }
    finally { guardando = false; guardar.disabled = false; cancelar.disabled = false; }
  });
  document.body.append(modal);
  modal.showModal();
  modal.querySelector("#restablecer-password-nueva").focus();
}
