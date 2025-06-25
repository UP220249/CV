let nombreUsuario = "";
let salaActual = null;
let peliculaActual = null;
let xmlSalas = null;

function iniciarSesion() {
  const user = document.getElementById("usuario").value;
  const pass = document.getElementById("contrasena").value;
  if (user && pass) {
    nombreUsuario = user;
    document.getElementById("login").style.display = "none";
    document.getElementById("salas").style.display = "block";
    document.getElementById("logout").style.display = "block";
    cargarSalas();
    document.getElementById("comprarBtn").style.display = "none";
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

function cerrarSesion() {
  nombreUsuario = "";
  document.getElementById("login").style.display = "block";
  document.getElementById("salas").style.display = "none";
  document.getElementById("logout").style.display = "none";
  document.getElementById("ticket").style.display = "none";
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
  document.getElementById("loginError").style.display = "none";
  document.getElementById("salasContainer").innerHTML = "";
  document.getElementById("peliculasContainer").innerHTML = "";
  document.getElementById("asientosContainer").innerHTML = "";
  document.getElementById("comprarBtn").style.display = "none";
}

function cargarSalas() {
  fetch("peliculas.xml")
    .then(res => res.text())
    .then(str => {
      const parser = new DOMParser();
      xmlSalas = parser.parseFromString(str, "application/xml");
      const salas = xmlSalas.getElementsByTagName("sala");
      const container = document.getElementById("salasContainer");
      container.innerHTML = "";
      const label = document.createElement("label");
      label.textContent = "Sala:";
      label.setAttribute("for", "salaSelect");
      container.appendChild(label);

      const select = document.createElement("select");
      select.id = "salaSelect";
      select.className = "pelicula-select";
      for (let s of salas) {
        const option = document.createElement("option");
        option.value = s.getAttribute("id");
        option.textContent = s.getAttribute("nombre");
        select.appendChild(option);
      }
      select.onchange = () => {
        salaActual = select.value;
        cargarPeliculasPorSala();
        document.getElementById("comprarBtn").style.display = "none";
        document.getElementById("ticket").style.display = "none";
      };
      container.appendChild(select);

      // Selecciona la primera sala por defecto
      salaActual = select.value;
      cargarPeliculasPorSala();
    });
}

function cargarPeliculasPorSala() {
  const salas = xmlSalas.getElementsByTagName("sala");
  let sala = null;
  for (let s of salas) {
    if (s.getAttribute("id") === salaActual) {
      sala = s;
      break;
    }
  }
  const pelis = sala.getElementsByTagName("pelicula");
  const container = document.getElementById("peliculasContainer");
  container.innerHTML = "";
  const label = document.createElement("label");
  label.textContent = "Película:";
  label.setAttribute("for", "peliculaSelect");
  container.appendChild(label);

  const select = document.createElement("select");
  select.id = "peliculaSelect";
  select.className = "pelicula-select";
  for (let p of pelis) {
    const option = document.createElement("option");
    option.value = salaActual + "-" + p.getAttribute("id");
    option.textContent = p.getElementsByTagName("titulo")[0].textContent + " - " + p.getAttribute("categoria");
    select.appendChild(option);
  }
  select.onchange = () => {
    peliculaActual = select.value;
    generarAsientos();
    document.getElementById("comprarBtn").style.display = "none";
    document.getElementById("ticket").style.display = "none";
  };
  container.appendChild(select);

  // Selecciona la primera película por defecto
  peliculaActual = select.value;
  generarAsientos();
}

function getOcupadosPorPelicula() {
  // Estructura: { salaId-peliculaId: { "A-1": "usuario", ... } }
  return JSON.parse(localStorage.getItem("ocupadosPorPelicula") || "{}");
}

function setOcupadosPorPelicula(data) {
  localStorage.setItem("ocupadosPorPelicula", JSON.stringify(data));
}

function generarAsientos() {
  const cont = document.getElementById("asientosContainer");
  cont.innerHTML = "";
  const filas = ["A", "B", "C", "D"];
  let contador = 0;
  const ocupadosPorPelicula = getOcupadosPorPelicula();
  const ocupados = ocupadosPorPelicula[peliculaActual] || {};

  for (let fila of filas) {
    for (let i = 1; i <= 5; i++) {
      const key = `${fila}-${i}`;
      const div = document.createElement("div");
      div.className = "asiento disponible";
      div.dataset.fila = fila;
      div.dataset.numero = i;
      div.title = `Fila ${fila}, Asiento ${i}`;

      if (ocupados[key]) {
        div.classList.remove("disponible");
        div.classList.add("ocupado");
        div.title += ` (Ocupado por ${ocupados[key]})`;
      }

      div.onclick = function () {
        if (div.classList.contains("ocupado")) return;
        div.classList.toggle("reservado");
        // Mostrar botón comprar si hay al menos un asiento reservado
        const reservados = document.querySelectorAll(".asiento.reservado");
        document.getElementById("comprarBtn").style.display = reservados.length > 0 ? "inline-block" : "none";
      };
      cont.appendChild(div);
      contador++;
      if (contador >= 20) break;
    }
    if (contador >= 20) break;
    // const br = document.createElement("div");
    // br.style.height = "8px";
    // cont.appendChild(br);
  }
}

function comprar() {
  const reservados = document.querySelectorAll(".asiento.reservado");
  if (reservados.length === 0) return;
  let total = reservados.length * 75;
  let detalles = "Usuario: " + nombreUsuario + "<br>";
  const salaSelect = document.getElementById("salaSelect");
  const peliculaSelect = document.getElementById("peliculaSelect");
  if (salaSelect && peliculaSelect) {
    detalles += "Sala: " + salaSelect.options[salaSelect.selectedIndex].text + "<br>";
    detalles += "Película: " + peliculaSelect.options[peliculaSelect.selectedIndex].text + "<br>";
  }

  // Guardar ocupados en localStorage
  const ocupadosPorPelicula = getOcupadosPorPelicula();
  if (!ocupadosPorPelicula[peliculaActual]) ocupadosPorPelicula[peliculaActual] = {};
  reservados.forEach(a => {
    detalles += `Fila ${a.dataset.fila}, Asiento ${a.dataset.numero}<br>`;
    a.classList.remove("reservado");
    a.classList.remove("disponible");
    a.classList.add("ocupado");
    ocupadosPorPelicula[peliculaActual][`${a.dataset.fila}-${a.dataset.numero}`] = nombreUsuario;
    a.title = `Fila ${a.dataset.fila}, Asiento ${a.dataset.numero} (Ocupado por ${nombreUsuario})`;
  });
  setOcupadosPorPelicula(ocupadosPorPelicula);

  document.getElementById("detallesBoleto").innerHTML = detalles;
  document.getElementById("totalPago").textContent = "Total: $" + total;
  document.getElementById("ticket").style.display = "block";
  document.getElementById("comprarBtn").style.display = "none";
  generarAsientos(); // Refresca para bloquear los asientos ocupados
}