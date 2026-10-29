/* ==========================================================================
   Comportamiento del sitio.

     1. Guardado seguro en el navegador
     2. Tema claro / oscuro
     3. Dónde estoy: rótulo de la barra y barra de progreso
     4. Índice: columna plegable en pantalla ancha, desplegable en angosta
     5. Enlace «siguiente sección» al final de cada cierre
     6. /04 — las tres tareas
     7. /05 — tarjetas que se voltean
     8. /11 — espectro de políticas
     9. /12 — imprimir solo la lista de reflexión

   Es un sitio que se lee desplazándose: no hay navegación por saltos ni
   captura de las flechas del teclado. Las flechas hacen lo que hacen en
   cualquier página, y los deslizadores de los modelos las necesitan.

   El contenido de texto está en index.html. Aquí solo hay comportamiento.
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Guardado seguro ----------------------------------------------------
     localStorage puede fallar o volver vacío (ventana privada, datos
     bloqueados, vista previa). Lo único que se guarda son dos preferencias
     de interfaz: el tema y si la columna del índice está plegada. Las
     respuestas de las listas de reflexión NO se guardan: no hay respuestas
     que guardar. */

  var almacen = {
    leer: function (clave) {
      try { return window.localStorage.getItem(clave); }
      catch (e) { return null; }
    },
    escribir: function (clave, valor) {
      try { window.localStorage.setItem(clave, valor); return true; }
      catch (e) { return false; }
    }
  };

  /* 2. Tema ---------------------------------------------------------------- */

  (function tema() {
    var boton = document.getElementById('botonTema');
    if (!boton) { return; }

    var modos = ['auto', 'light', 'dark'];
    var nombres = { auto: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: oscuro' };
    var iconos = { auto: '◐', light: '☀', dark: '☾' };

    var actual = almacen.leer('taller-tema') || 'auto';
    if (modos.indexOf(actual) === -1) { actual = 'auto'; }

    function aplicar() {
      if (actual === 'auto') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', actual);
      }
      boton.textContent = iconos[actual];
      boton.setAttribute('aria-label', nombres[actual]);
      boton.setAttribute('title', nombres[actual]);
    }

    boton.addEventListener('click', function () {
      actual = modos[(modos.indexOf(actual) + 1) % modos.length];
      almacen.escribir('taller-tema', actual);
      aplicar();
    });

    aplicar();
  }());

  /* Nombres de sección: viven en el índice del HTML y se leen de ahí.
     Es la única fuente; renombrar una sección se hace ahí y nada más. */

  var enlacesIndice = Array.prototype.slice.call(document.querySelectorAll('.indice__enlace'));
  var nombres = {};
  var orden = [];
  enlacesIndice.forEach(function (a) {
    var nodo = a.querySelector('.indice__nombre');
    nombres[a.dataset.seccion] = nodo ? nodo.textContent.trim() : '';
    orden.push({ seccion: a.dataset.seccion, href: a.getAttribute('href') });
  });

  /* 3. Dónde estoy ---------------------------------------------------------
     La sección activa es la del último bloque cuyo borde superior ya pasó
     por debajo de la barra. Las posiciones se miden una vez y se vuelven a
     medir solo si la página cambió de alto (al abrir un «Más detalle», al
     girar el teléfono). */

  (function ubicacion() {
    var bloques = Array.prototype.slice.call(document.querySelectorAll('.bloque'));
    if (!bloques.length) { return; }

    var donde = document.getElementById('barraDonde');
    var barraProgreso = document.getElementById('progreso');

    function altoBarra() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--barra-h');
      var n = parseFloat(v);
      if (!n) { return 52; }
      return v.indexOf('rem') !== -1 ? n * 16 : n;
    }

    var tops = [];
    var altoDoc = 0;

    function medir() {
      tops = bloques.map(function (b) {
        return b.getBoundingClientRect().top + window.scrollY;
      });
      altoDoc = document.documentElement.scrollHeight;
    }

    var ultimaSeccion = null;

    function pintar() {
      if (barraProgreso) {
        var alto = document.documentElement.scrollHeight - window.innerHeight;
        var pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
        barraProgreso.style.width = Math.min(100, Math.max(0, pct)) + '%';
      }

      if (document.documentElement.scrollHeight !== altoDoc) { medir(); }

      var limite = window.scrollY + altoBarra() + 12;
      var i = 0;
      for (var k = 0; k < tops.length; k++) {
        if (tops[k] <= limite) { i = k; }
      }

      var sec = bloques[i].dataset.seccion;
      if (sec === ultimaSeccion) { return; }
      ultimaSeccion = sec;

      if (donde) {
        donde.textContent = nombres[sec] ? sec + ' · ' + nombres[sec] : 'Índice';
      }
      enlacesIndice.forEach(function (a) {
        if (a.dataset.seccion === sec) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
    }

    // Limitado por reloj y no por requestAnimationFrame: si el navegador
    // frena los cuadros (pestaña de fondo, ventana oculta), un temporizador
    // sigue llegando y la barra no se queda congelada.
    var ultimoPintado = 0;
    var temporizador = null;

    function alDesplazar() {
      var ahora = Date.now();
      if (ahora - ultimoPintado > 90) {
        ultimoPintado = ahora;
        pintar();
        return;
      }
      if (temporizador) { return; }
      temporizador = window.setTimeout(function () {
        temporizador = null;
        ultimoPintado = Date.now();
        pintar();
      }, 90);
    }

    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', function () { medir(); pintar(); });
    window.addEventListener('load', function () { medir(); pintar(); });
    document.addEventListener('toggle', function (e) {
      if (e.target && e.target.tagName === 'DETAILS') { medir(); pintar(); }
    }, true);

    medir();
    pintar();
  }());

  /* 4. Índice: columna plegable o desplegable --------------------------------
     Es el mismo `<nav>` en los dos casos, y quien manda es su atributo
     `hidden`.

     - Arriba de 68rem es una columna fija a la izquierda que se pliega y se
       despliega, como la lista de sesiones de un editor. El estado se guarda
       y se recupera en la visita siguiente. Se pliega con el botón de la
       propia columna o con el de la barra, y se trae de vuelta con el de la
       barra, que es el único que queda a la vista.
     - Por debajo de ese ancho es el desplegable de siempre: arranca cerrado,
       y se cierra al elegir una sección, al tocar afuera o con Escape.

     `data-indice="oculto"` en el <html> no esconde nada por sí solo: le
     devuelve el ancho al resto de la página cuando la columna se pliega. */

  (function indice() {
    var boton = document.getElementById('botonIndice');
    var panel = document.getElementById('indice');
    var cerrar = document.getElementById('botonCerrarIndice');
    var desdePortada = document.getElementById('botonAbrirIndice');
    if (!boton || !panel) { return; }

    var raiz = document.documentElement;
    var ancho = window.matchMedia('(min-width: 68rem)');

    function esColumna() { return ancho.matches; }

    function mostrar(abierto) {
      panel.hidden = !abierto;
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.title = abierto ? 'Ocultar el índice' : 'Mostrar el índice';
      if (abierto) { raiz.removeAttribute('data-indice'); }
      else { raiz.setAttribute('data-indice', 'oculto'); }
    }

    // Al plegar o desplegar la columna cambia el ancho del texto, así que
    // las posiciones de los bloques que usa la barra dejan de servir.
    function avisar() {
      if (esColumna()) { window.dispatchEvent(new Event('resize')); }
    }

    function alternar(abierto) {
      mostrar(abierto);
      if (esColumna()) {
        almacen.escribir('taller-indice', abierto ? 'visible' : 'oculto');
        avisar();
      }
    }

    function sincronizar() {
      mostrar(esColumna() ? almacen.leer('taller-indice') !== 'oculto' : false);
    }

    boton.addEventListener('click', function () { alternar(panel.hidden); });
    if (cerrar) {
      cerrar.addEventListener('click', function () {
        alternar(false);
        boton.focus();
      });
    }

    if (desdePortada) {
      desdePortada.addEventListener('click', function () {
        alternar(true);
        var primero = panel.querySelector('.indice__enlace');
        if (primero) { primero.focus(); }
      });
    }

    // La columna no se cierra al elegir una sección: queda para seguir
    // navegando. El desplegable sí, porque tapa el texto.
    panel.addEventListener('click', function (e) {
      if (esColumna()) { return; }
      if (e.target.closest('.indice__enlace')) { alternar(false); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden && !esColumna()) {
        alternar(false);
        boton.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (panel.hidden || esColumna()) { return; }
      if (panel.contains(e.target) || boton.contains(e.target)) { return; }
      if (desdePortada && desdePortada.contains(e.target)) { return; }
      alternar(false);
    });

    if (ancho.addEventListener) { ancho.addEventListener('change', sincronizar); }
    else if (ancho.addListener) { ancho.addListener(sincronizar); }

    sincronizar();
  }());

  /* 5. «Siguiente sección» -------------------------------------------------
     Se arma leyendo el índice, para que nunca quede desactualizado si se
     renombra o se reordena una sección. */

  (function siguiente() {
    var cierres = Array.prototype.slice.call(document.querySelectorAll('.bloque--cierre'));
    cierres.forEach(function (cierre) {
      var sec = cierre.dataset.seccion;
      var i = orden.findIndex ? orden.findIndex(function (o) { return o.seccion === sec; })
                              : -1;
      if (i === -1) {
        for (var k = 0; k < orden.length; k++) {
          if (orden[k].seccion === sec) { i = k; break; }
        }
      }
      if (i === -1 || i + 1 >= orden.length) { return; }

      var destino = orden[i + 1];
      var a = document.createElement('a');
      a.className = 'siguiente';
      a.href = destino.href;
      a.innerHTML = '<span class="siguiente__etiqueta">Siguiente · ' + destino.seccion + '</span>' +
                    '<span class="siguiente__nombre"></span>';
      a.querySelector('.siguiente__nombre').textContent = nombres[destino.seccion] || '';

      var caja = cierre.querySelector('.bloque__caja');
      if (caja) { caja.appendChild(a); }
    });
  }());

  /* 6. /04 — las tres tareas -----------------------------------------------
     Tres posiciones, no un recorrido continuo: solo hay tres tareas, así
     que el control solo tiene tres lugares donde pararse. */

  (function tareas() {
    var control = document.getElementById('deslizadorTareas');
    if (!control) { return; }

    var items = Array.prototype.slice.call(document.querySelectorAll('.tareas__item'));
    var salida = document.getElementById('tareasEstado');
    var palabras = ['bien estructurada', 'intermedia', 'poco estructurada'];

    function actualizar() {
      var v = Number(control.value);

      items.forEach(function (li) {
        li.setAttribute('data-activa', Number(li.dataset.posicion) === v ? 'true' : 'false');
      });

      var elegida = items[v];
      control.setAttribute('aria-valuetext', palabras[v] || '');
      if (salida && elegida) {
        salida.textContent = 'Tarea ' + palabras[v] + ': ' +
          elegida.querySelector('.tareas__texto').textContent;
      }
    }

    control.addEventListener('input', actualizar);
    actualizar();
  }());

  /* 7. /05 — tarjetas que se voltean ---------------------------------------- */

  (function dimensiones() {
    var botones = Array.prototype.slice.call(document.querySelectorAll('.dim__boton'));
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var abierta = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', abierta ? 'false' : 'true');
      });
    });
  }());

  /* 8. /11 — espectro de políticas ------------------------------------------ */

  (function politicas() {
    var botones = Array.prototype.slice.call(document.querySelectorAll('.politica__boton'));
    var paneles = Array.prototype.slice.call(document.querySelectorAll('.politica__detalle'));
    if (!botones.length) { return; }

    function mostrar(id) {
      paneles.forEach(function (p) { p.hidden = p.id !== id; });
      botones.forEach(function (b) {
        b.setAttribute('aria-expanded', b.getAttribute('aria-controls') === id ? 'true' : 'false');
      });
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('aria-controls');
        var abierto = b.getAttribute('aria-expanded') === 'true';
        mostrar(abierto ? null : id);
      });
    });

    mostrar(botones[0].getAttribute('aria-controls'));
  }());

  /* 9. /12 y /13 — imprimir solo una lista ---------------------------------
     Hay dos anexos y cada uno tiene su botón. La clase en el body esconde
     todo dentro de @media print salvo el bloque marcado, que es el que
     contiene el botón que se pulsó. No hay respuestas que imprimir: se
     imprimen las preguntas y las casillas vacías, para marcarlas a mano. */

  (function imprimir() {
    var botones = Array.prototype.slice.call(document.querySelectorAll('.imprimir'));
    if (!botones.length) { return; }

    function limpiar() {
      document.body.classList.remove('solo-anexo');
      Array.prototype.slice.call(document.querySelectorAll('.bloque--imprimiendo'))
        .forEach(function (b) { b.classList.remove('bloque--imprimiendo'); });
    }

    botones.forEach(function (boton) {
      boton.addEventListener('click', function () {
        limpiar();
        var bloque = boton.closest ? boton.closest('.bloque') : null;
        if (bloque) { bloque.classList.add('bloque--imprimiendo'); }
        document.body.classList.add('solo-anexo');
        window.print();
      });
    });

    window.addEventListener('afterprint', limpiar);
  }());
}());
