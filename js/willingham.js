/* ==========================================================================
   Modelo interactivo de memoria — sección /02

   Recreación propia del modelo de memoria de Willingham (2021), con la
   descripción de la memoria de trabajo, los esquemas y los tipos de carga
   que da Kirschner (2002). NO reproduce el dibujo de Caviglioli, Rose,
   Fletcher-Wood y colegas del Institute for Teaching (2019), que es la
   versión visual que popularizó el modelo: la geometría de aquí es propia.

   Es una ILUSTRACIÓN CONCEPTUAL. No calcula nada ni muestra cantidades.
   Si se cambia algo aquí, no introducir porcentajes ni números de medida.

   Decisiones que vale la pena no romper:

   - Los espacios de la memoria de trabajo ilustran estrechez, no una
     medida. Aumentan con el conocimiento previo porque un esquema ya
     formado permite tratar varios elementos como uno solo; no porque la
     memoria de trabajo crezca.
   - La carga extraña ocupa espacios ANTES que el contenido. Es lo que hace
     visible que compite con lo que hay que aprender.
   - Cuando no quedan espacios libres, lo que llega se pierde. Esa es la
     única manera de dibujar un cuello de botella.
   ========================================================================== */

(function () {
  'use strict';

  var raiz = document.getElementById('memoria');
  if (!raiz) { return; }

  var NS = 'http://www.w3.org/2000/svg';
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Estado ------------------------------------------------------------ */

  var estado = {
    conocimiento: 0.45,
    distraccion: 0.35,
    carga: 0.35,
    practica: 0.45
  };

  var ESCENARIOS = {
    'nuevo-claro':   { conocimiento: 0.20, distraccion: 0.25, carga: 0.12, practica: 0.50 },
    'nuevo-confuso': { conocimiento: 0.20, distraccion: 0.60, carga: 0.85, practica: 0.20 },
    'conocido':      { conocimiento: 0.85, distraccion: 0.25, carga: 0.15, practica: 0.85 }
  };

  /* --- Geometría del dibujo ---------------------------------------------- */

  var AMB = { x0: 36, y0: 80, x1: 144, y1: 208 };
  var MT  = { x: 312, y: 144, r: 52 };
  var LTM = { x: 522, y: 68, r: 34 };
  var PUERTA_ATENCION = 206;          // donde se decide si algo se atiende
  var ENTRADA_MT = MT.x - MT.r - 4;

  var el = {
    svg:        raiz.querySelector('#memoriaSvg'),
    ambiente:   raiz.querySelector('#ambientePuntos'),
    espacios:    raiz.querySelector('#mtEspacios'),
    ltm:        raiz.querySelector('#ltmNodos'),
    particulas: raiz.querySelector('#memoriaParticulas'),
    cuenta:     raiz.querySelector('#mtCuenta'),
    lectura:    raiz.querySelector('#memoriaLectura'),
    escenarios: Array.prototype.slice.call(raiz.querySelectorAll('.escenario'))
  };

  var deslizadores = Array.prototype.slice.call(raiz.querySelectorAll('input[type="range"]'));

  /* --- Derivados ---------------------------------------------------------
     La capacidad no crece: lo que crece es cuánto cabe en cada espacio
     cuando hay un esquema que agrupa elementos. El dibujo lo representa
     con más espacios porque es lo que se puede dibujar. */

  function capacidad()  { return 4 + Math.round(estado.conocimiento * 3); }   // 4 .. 7
  function ocupadas()   { return Math.round(estado.carga * capacidad() * 0.85); }
  function libres()     { return Math.max(0, capacidad() - ocupadas()); }

  function probAtender() { return 1 - estado.distraccion * 0.75; }

  function probAprender() {
    var p = 0.15
      + 0.42 * estado.conocimiento
      + 0.33 * estado.practica
      - 0.42 * estado.carga;
    return Math.min(0.92, Math.max(0.05, p));
  }

  /* --- Palabras de nivel (en lugar de números) --------------------------- */

  var PALABRAS = ['muy baja', 'baja', 'media', 'alta', 'muy alta'];
  function nivel(v) { return PALABRAS[Math.min(4, Math.floor(v * 5))]; }

  var PALABRAS_M = ['muy bajo', 'bajo', 'medio', 'alto', 'muy alto'];
  function nivelM(v) { return PALABRAS_M[Math.min(4, Math.floor(v * 5))]; }

  /* --- Dibujo del ambiente ----------------------------------------------- */

  // Posiciones fijas, generadas una vez: si cambiaran en cada render, los
  // puntos saltarían al mover un deslizador.
  var semilla = 7;
  function azar() {
    semilla = (semilla * 1103515245 + 12345) % 2147483648;
    return semilla / 2147483648;
  }
  var posiciones = [];
  for (var i = 0; i < 30; i++) {
    posiciones.push({
      x: AMB.x0 + 6 + azar() * (AMB.x1 - AMB.x0 - 12),
      y: AMB.y0 + 6 + azar() * (AMB.y1 - AMB.y0 - 12),
      r: 3 + azar() * 1.6
    });
  }

  function pintarAmbiente() {
    el.ambiente.textContent = '';
    var total = 10 + Math.round(estado.distraccion * 20);
    var vivos = Math.max(3, Math.round(8 - estado.distraccion * 5));
    for (var k = 0; k < total; k++) {
      var p = posiciones[k % posiciones.length];
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x.toFixed(1));
      c.setAttribute('cy', p.y.toFixed(1));
      c.setAttribute('r', p.r.toFixed(1));
      c.setAttribute('class', k < vivos ? 'amb-punto amb-punto--vivo' : 'amb-punto');
      el.ambiente.appendChild(c);
    }
  }

  /* --- Dibujo de los espacios de la memoria de trabajo -------------------- */

  function pintarEspacios() {
    el.espacios.textContent = '';
    var n = capacidad();
    var ocup = ocupadas();
    var conContenido = Math.min(libres(), enMemoria());

    var arriba = Math.ceil(n / 2);
    var abajo = n - arriba;
    var lado = 15, hueco = 5;

    var puestas = 0;
    [[arriba, MT.y - 11], [abajo, MT.y + 9]].forEach(function (fila) {
      var cuantas = fila[0], y = fila[1];
      var ancho = cuantas * lado + (cuantas - 1) * hueco;
      var x0 = MT.x - ancho / 2;
      for (var j = 0; j < cuantas; j++) {
        var r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', (x0 + j * (lado + hueco)).toFixed(1));
        r.setAttribute('y', y.toFixed(1));
        r.setAttribute('width', lado);
        r.setAttribute('height', lado);
        r.setAttribute('rx', '2');
        var clase = 'mt-espacio';
        if (puestas < ocup) { clase += ' mt-espacio--extrana'; }
        else if (puestas < ocup + conContenido) { clase += ' mt-espacio--contenido'; }
        r.setAttribute('class', clase);
        el.espacios.appendChild(r);
        puestas++;
      }
    });
  }

  /* --- Dibujo de la memoria de largo plazo -------------------------------
     La red crece con el conocimiento previo y con lo que se va aprendiendo
     durante la animación, hasta un tope. */

  var aprendido = 0;
  var APRENDIDO_MAX = 6;

  function pintarLtm() {
    el.ltm.textContent = '';
    var n = 4 + Math.round(estado.conocimiento * 7) + Math.min(aprendido, APRENDIDO_MAX);
    for (var k = 0; k < n; k++) {
      var a = (k / n) * Math.PI * 2 - Math.PI / 2;
      var rr = LTM.r * (0.72 + ((k % 3) * 0.14));
      var x = LTM.x + Math.cos(a) * rr;
      var y = LTM.y + Math.sin(a) * rr;

      var l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', LTM.x); l.setAttribute('y1', LTM.y);
      l.setAttribute('x2', x.toFixed(1)); l.setAttribute('y2', y.toFixed(1));
      l.setAttribute('class', 'ltm-enlace');
      el.ltm.appendChild(l);

      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', '5');
      c.setAttribute('class', 'ltm-nodo');
      el.ltm.appendChild(c);
    }
    var hub = document.createElementNS(NS, 'circle');
    hub.setAttribute('cx', LTM.x); hub.setAttribute('cy', LTM.y);
    hub.setAttribute('r', '11');
    hub.setAttribute('class', 'ltm-hub');
    el.ltm.appendChild(hub);
  }

  /* --- Panel de lectura --------------------------------------------------- */

  function textoLectura() {
    var causa;
    var lib = libres();

    if (lib === 0) {
      causa = '<b>No queda ningún cuadrito libre.</b> La carga extraña ocupa toda la memoria de ' +
              'trabajo disponible: lo que llega del ambiente no tiene dónde entrar, por mucho que ' +
              'se atienda.';
    } else if (estado.carga > 0.6) {
      causa = '<b>Carga extraña alta.</b> Buena parte de la memoria de trabajo se está yendo en ' +
              'descifrar las instrucciones, no en el contenido. Queda poco espacio para lo que hay que ' +
              'aprender.';
    } else if (estado.distraccion > 0.66) {
      causa = '<b>Mucha competencia por la atención.</b> El cuello de botella aparece antes de la ' +
              'memoria de trabajo: casi nada llega a ser seleccionado.';
    } else if (estado.conocimiento > 0.7 && estado.carga < 0.4) {
      causa = '<b>El conocimiento previo está trabajando.</b> Lo que para alguien serían varios ' +
              'elementos sueltos aquí entra como un solo bloque, así que cabe más en el mismo ' +
              'espacio.';
    } else if (estado.conocimiento < 0.3) {
      causa = '<b>Poco conocimiento previo.</b> Cada dato ocupa un cuadrito propio, porque no hay ' +
              'un esquema que los agrupe. El tema se siente más difícil de lo que es.';
    } else if (estado.practica < 0.3) {
      causa = '<b>Poca práctica posterior.</b> Lo que sube a la memoria de largo plazo sin volver ' +
              'a usarse se pierde, y vuelve a costar lo mismo la próxima vez.';
    } else {
      causa = '<b>Situación intermedia.</b> Parte de lo que entra llega a la memoria de largo ' +
              'plazo y parte se olvida.';
    }

    var p = probAprender();
    var efecto;
    if (p > 0.7) {
      efecto = 'De lo que entra, la mayor parte termina aprendida.';
    } else if (p > 0.4) {
      efecto = 'Una parte queda aprendida y otra se olvida.';
    } else {
      efecto = 'Casi todo lo que entra se pierde antes de quedar en la memoria de largo plazo.';
    }

    return causa + ' ' + efecto;
  }

  function textoCuenta() {
    var ocup = ocupadas();
    var lib = libres();
    var t = capacidad() + ' cuadritos en el dibujo: ';
    t += ocup === 0 ? 'ninguno ocupado por las instrucciones' :
         (ocup === 1 ? 'uno ocupado por las instrucciones' : ocup + ' ocupados por las instrucciones');
    t += ', ';
    t += lib === 0 ? 'ninguno libre para el contenido.' :
         (lib === 1 ? 'uno libre para el contenido.' : lib + ' libres para el contenido.');
    return t;
  }

  function descripcionSvg() {
    return 'Modelo de memoria. Conocimiento previo ' + nivelM(estado.conocimiento) +
      ', competencia por la atención ' + nivel(estado.distraccion) +
      ', carga extraña de las instrucciones ' + nivel(estado.carga) +
      ', práctica ' + nivel(estado.practica) + '. ' + textoCuenta();
  }

  /* --- Render ------------------------------------------------------------ */

  function render() {
    pintarAmbiente();
    pintarEspacios();
    pintarLtm();

    el.cuenta.textContent = textoCuenta();
    el.lectura.innerHTML = textoLectura();
    el.svg.setAttribute('aria-label', descripcionSvg());

    deslizadores.forEach(function (d) {
      var v = Number(d.value) / 100;
      var palabra = d.dataset.variable === 'conocimiento' ? nivelM(v) : nivel(v);
      d.setAttribute('aria-valuetext', palabra);
      var salida = raiz.querySelector('#nivel-' + d.dataset.variable);
      if (salida) { salida.textContent = palabra; }
    });

    marcarEscenario();
  }

  function marcarEscenario() {
    el.escenarios.forEach(function (b) {
      var pre = ESCENARIOS[b.dataset.escenario];
      var igual = pre && Object.keys(pre).every(function (k) {
        return Math.abs(pre[k] - estado[k]) < 0.005;
      });
      b.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  /* --- Partículas --------------------------------------------------------- */

  var particulas = [];
  var ultimoSpawn = 0;
  var animando = false;

  function enMemoria() {
    var n = 0;
    particulas.forEach(function (p) { if (p.fase === 'enMt') { n++; } });
    return n;
  }

  function bezier(t, a, c, b) {
    var u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y
    };
  }

  var RUTA_APRENDE = {
    a: { x: 350, y: 112 }, c: { x: 410, y: 66 }, b: { x: LTM.x - 18, y: LTM.y + 6 }
  };
  var RUTA_OLVIDA = {
    a: { x: 284, y: 186 }, c: { x: 262, y: 230 }, b: { x: 228, y: 276 }
  };

  function nacer() {
    var nodo = document.createElementNS(NS, 'circle');
    nodo.setAttribute('r', '4.5');
    nodo.setAttribute('class', 'mem-particula');
    var p0 = posiciones[Math.floor(azar() * posiciones.length)];
    nodo.setAttribute('cx', p0.x.toFixed(1));
    nodo.setAttribute('cy', p0.y.toFixed(1));
    el.particulas.appendChild(nodo);

    particulas.push({
      nodo: nodo, x: p0.x, y: p0.y,
      fase: 'atencion', t: 0, espera: 0,
      reviso: false, opacidad: 1
    });
  }

  function morir(p) {
    p.fase = 'muere';
    p.nodo.setAttribute('class', 'mem-particula mem-particula--perdida');
  }

  function quitar(p) {
    if (p.nodo.parentNode) { p.nodo.parentNode.removeChild(p.nodo); }
    p.borrar = true;
  }

  function paso(p, dt) {
    var v = 0.085 * dt;

    if (p.fase === 'atencion') {
      // Sale del ambiente hacia la puerta de la atención y de ahí a la MT.
      var dx = ENTRADA_MT - p.x;
      var dy = MT.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      p.x += (dx / d) * v;
      p.y += (dy / d) * v;

      if (!p.reviso && p.x >= PUERTA_ATENCION) {
        p.reviso = true;
        if (Math.random() > probAtender()) { morir(p); return; }
      }
      if (p.x >= ENTRADA_MT - 1) {
        if (enMemoria() >= libres()) { morir(p); return; }   // no cabe
        p.fase = 'enMt';
        p.espera = 520;
        p.x = MT.x; p.y = MT.y + 26;
      }
    } else if (p.fase === 'enMt') {
      p.espera -= dt;
      if (p.espera <= 0) {
        if (Math.random() < probAprender()) {
          p.fase = 'aprende'; p.t = 0;
        } else {
          p.fase = 'olvida'; p.t = 0;
        }
      }
    } else if (p.fase === 'aprende') {
      p.t += dt / 1100;
      var a = bezier(Math.min(1, p.t), RUTA_APRENDE.a, RUTA_APRENDE.c, RUTA_APRENDE.b);
      p.x = a.x; p.y = a.y;
      if (p.t >= 1) {
        aprendido = Math.min(APRENDIDO_MAX, aprendido + 1);
        pintarLtm();
        quitar(p);
        return;
      }
    } else if (p.fase === 'olvida') {
      p.t += dt / 900;
      var o = bezier(Math.min(1, p.t), RUTA_OLVIDA.a, RUTA_OLVIDA.c, RUTA_OLVIDA.b);
      p.x = o.x; p.y = o.y;
      p.nodo.setAttribute('opacity', Math.max(0, 1 - p.t).toFixed(2));
      if (p.t >= 1) { quitar(p); return; }
    } else if (p.fase === 'muere') {
      p.opacidad -= 0.04 * (dt / 16);
      if (p.opacidad <= 0) { quitar(p); return; }
      p.nodo.setAttribute('opacity', p.opacidad.toFixed(2));
    }

    p.nodo.setAttribute('cx', p.x.toFixed(1));
    p.nodo.setAttribute('cy', p.y.toFixed(1));
  }

  var anterior = 0;
  var ultimoPintadoEspacios = 0;

  function bucle(ahora) {
    if (!animando) { return; }
    var dt = anterior ? Math.min(ahora - anterior, 50) : 16;
    anterior = ahora;

    if (ahora - ultimoSpawn > 560 && particulas.length < 14) {
      ultimoSpawn = ahora;
      nacer();
    }

    particulas.forEach(function (p) { paso(p, dt); });
    particulas = particulas.filter(function (p) { return !p.borrar; });

    // Los espacios con contenido dependen de cuántas partículas hay dentro.
    if (ahora - ultimoPintadoEspacios > 200) {
      ultimoPintadoEspacios = ahora;
      pintarEspacios();
    }

    requestAnimationFrame(bucle);
  }

  function arrancar() {
    if (sinMovimiento.matches) { detener(); return; }
    if (animando) { return; }
    animando = true;
    anterior = 0;
    requestAnimationFrame(bucle);
  }

  function detener() {
    animando = false;
    particulas.forEach(function (p) {
      if (p.nodo.parentNode) { p.nodo.parentNode.removeChild(p.nodo); }
    });
    particulas = [];
    pintarEspacios();
  }

  /* --- Eventos ------------------------------------------------------------ */

  deslizadores.forEach(function (d) {
    d.addEventListener('input', function () {
      estado[d.dataset.variable] = Number(d.value) / 100;
      render();
    });
  });

  el.escenarios.forEach(function (b) {
    b.addEventListener('click', function () {
      var pre = ESCENARIOS[b.dataset.escenario];
      if (!pre) { return; }
      Object.keys(pre).forEach(function (k) {
        estado[k] = pre[k];
        var d = raiz.querySelector('input[data-variable="' + k + '"]');
        if (d) { d.value = String(Math.round(pre[k] * 100)); }
      });
      aprendido = 0;
      render();
    });
  });

  if (sinMovimiento.addEventListener) {
    sinMovimiento.addEventListener('change', function () {
      if (sinMovimiento.matches) { detener(); } else { arrancar(); }
    });
  }

  // La animación solo corre mientras el modelo está a la vista.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { arrancar(); } else { detener(); }
      });
    }, { threshold: 0.15 }).observe(raiz);
  } else {
    arrancar();
  }

  render();
}());
