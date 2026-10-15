// Menu compartido por los paneles de administracion e instructor.
(() => {
  const menu = document.getElementById("menu-cuenta");
  const usuario = sesion.usuario();
  if (!menu || !usuario) return;
  const disparador = menu.querySelector("summary");
  const roles = {trabajador: "Trabajador", instructor: "Instructor", admin: "Administrador", superadmin: "Súper administrador"};
  menu.querySelector(".badge-rol-admin").textContent = roles[sesion.rol()] || "Mi cuenta";
  const nombre = String(usuario.nombre || "Mi cuenta").trim() || "Mi cuenta";
  const partes = nombre.split(/\s+/);
  menu.querySelector("[data-cuenta-nombre]").textContent = nombre;
  menu.querySelector("[data-cuenta-nombre-corto]").textContent = partes[0];
  menu.querySelector("[data-cuenta-avatar]").textContent = partes.slice(0, 2).map(p => p[0]).join("").toUpperCase();
  menu.querySelector("[data-cuenta-correo]").textContent = usuario.correo || "";
  disparador.setAttribute("aria-label", "Perfil de " + nombre);
  menu.addEventListener("toggle", () => disparador.setAttribute("aria-expanded", String(menu.open)));
  document.addEventListener("click", evento => {
    if (!menu.contains(evento.target)) menu.open = false;
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && menu.open) {
      menu.open = false;
      disparador.focus();
    }
  });
  menu.addEventListener("focusout", evento => {
    if (evento.relatedTarget && !menu.contains(evento.relatedTarget)) menu.open = false;
  });
  menu.querySelectorAll("a").forEach(enlace => enlace.addEventListener("click", () => { menu.open = false; }));
  // El cierre de sesion conserva el controlador existente de cada panel.
})();
