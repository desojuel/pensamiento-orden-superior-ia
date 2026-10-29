/* ==========================================================================
   Modelo interactivo de externalización digital — sección /09
   Adaptado de Skulmowski (2023), Figura 1. CC BY 4.0. Adaptada y traducida.

   Es una ILUSTRACIÓN CONCEPTUAL. No calcula nada ni muestra cantidades:
   los deslizadores mueven tamaños y proporciones para explicar el modelo.
   Si se cambia algo aquí, no introducir porcentajes ni números en pantalla.

   Decisiones de fidelidad, tomadas del artículo:

   - Las dos cargas se alojan EN la memoria de trabajo, así que sus radios
     son independientes del límite de capacidad y pueden superarlo. Antes
     el dibujo se reescalaba para que todo entrara siempre, y eso borraba
     la única relación que el modelo necesita mostrar.
   - La carga intrínseca y la extraña se dibujan pegadas, sin hueco entre
     ellas, como en la figura original.
   - La capacidad percibida es un factor aparte de la capacidad real: puede
     quedar por dentro o por fuera de ella.
   - Los círculos NO significan contención. El propio autor advierte que la
     figura no implica que la carga intrínseca esté «contenida» dentro de la
     extraña, sino que la extraña actúa como barrera. Esa advertencia está
     escrita en la página, junto al dibujo.
   ========================================================================== */

(function () {
  'use strict';

  var raiz = document.getElementById('modelo');
  if (!raiz) { return; }

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Estado ------------------------------------------------------------ */

  var estado = {
    intrinseca: 0.45,
    extrana: 0.30,
    capacidad: 0.65,
    percibida: 0.65,
    valor: 0.60
  };

  var ESCENARIOS = {
    clara:    { intrinseca: 0.35, extrana: 0.12, capacidad: 0.78, percibida: 0.80, valor: 0.80 },
    confusa:  { intrinseca: 0.80, extrana: 0.85, capacidad: 0.50, percibida: 0.45, valor: 0.40 },
    nopuede:  { intrinseca: 0.50, extrana: 0.35, capacidad: 0.62, percibida: 0.10, valor: 0.50 }
  };

  /* --- Geometría ---------------------------------------------------------
     Radios independientes, sin reescalado. Máximo 122 en un lienzo de
     320 × 330 con centro en (160, 148): las cargas pueden desbordar el
     límite de capacidad sin salirse del dibujo. */

  var CX = 160, CY = 148;
  var geo = {};

  function calcularGeometria() {
    var rIntr  = 18 + estado.intrinseca * 52;   //  18 .. 70
    var grosor =  6 + estado.extrana   * 36;    //   6 .. 42
    var rExt   = rIntr + grosor;                //  24 .. 112
    var rPerc  = 46 + estado.percibida * 76;    //  46 .. 122
    var rWm    = 46 + estado.capacidad * 76;    //  46 .. 122

    geo = {
      intrinseca: rIntr,
      extrana: rExt,
      percibida: rPerc,
      capacidad: rWm,
      // El límite que gobierna la conducta es el percibido, pero cualquiera
      // de los dos que quede por debajo de la carga indica que no hay margen.
      desborda: rExt > Math.min(rWm, rPerc)
    };
  }

  /* --- Probabilidades (internas, nunca se muestran) ----------------------
     Los cinco factores del modelo, con el valor atribuido operando al revés
     que los otros cuatro. */

  function probDescarga() {
    var p = 0.08
      + 0.20 * estado.intrinseca
      + 0.20 * estado.extrana
      + 0.17 * (1 - estado.capacidad)
      + 0.17 * (1 - estado.percibida)
      + 0.22 * (1 - estado.valor);
    return Math.min(0.94, Math.max(0.05, p));
  }

  function probBarrera() {
    // La carga extraña estorba en los tres puntos del modelo.
    return estado.extrana * 0.55;
  }

  /* --- Elementos --------------------------------------------------------- */

  var el = {
    fondo:     raiz.querySelector('#fondoWm'),
    extrana:   raiz.querySelector('#discoExtrana'),
    intr:      raiz.querySelector('#nucleoIntrinseco'),
    percibida: raiz.querySelector('#anilloPercibida'),
    wm:        raiz.querySelector('#anilloWm'),
    diagrama:  raiz.querySelector('#diagrama'),
    svg:       raiz.querySelector('#diagramaSvg'),
    capaPart:  raiz.querySelector('#particulas'),
    memoria:   raiz.querySelector('#memoriaPuntos'),
    lectura:   raiz.querySelector('#lecturaTexto'),
    escenarios: Array.prototype.slice.call(raiz.querySelectorAll('.escenario'))
  };

  var deslizadores = Array.prototype.slice.call(raiz.querySelectorAll('input[type="range"]'));

  /* --- Palabras de nivel (en lugar de números) --------------------------- */

  // Cinco palabras y no tres: el dibujo cambia de forma continua, así que
  // el rótulo tiene que moverse junto con el deslizador. Con tres, el
  // control parecía tener posiciones que no hacían nada.
  var PALABRAS = ['muy baja', 'baja', 'media', 'alta', 'muy alta'];
  function nivel(v) { return PALABRAS[Math.min(4, Math.floor(v * 5))]; }

  /* --- Memoria de largo plazo --------------------------------------------
     Lo que baja por la ruta biológica queda como conocimiento; de lo que
     sale por la derecha solo queda un puntero. */

  var memoria = [];          // 'saber' | 'puntero'
  var MEMORIA_MAX = 14;

  function agregarMemoria(tipo) {
    memoria.push(tipo);
    if (memoria.length > MEMORIA_MAX) { memoria.shift(); }
    pintarMemoria();
  }

  function pintarMemoria() {
    el.memoria.textContent = '';
    memoria.forEach(function (tipo) {
      var d = document.createElement('span');
      d.className = 'punto punto--' + tipo;
      d.setAttribute('role', 'presentation');
      el.memoria.appendChild(d);
    });
  }

  function memoriaEstatica() {
    // Para prefers-reduced-motion: una composición representativa, sin animar.
    memoria = [];
    var p = probDescarga();
    var barrera = probBarrera();
    for (var i = 0; i < MEMORIA_MAX; i++) {
      var pasa = (i / MEMORIA_MAX) >= barrera * 0.6;
      if (!pasa) { continue; }
      memoria.push((i / MEMORIA_MAX) < p ? 'puntero' : 'saber');
    }
    pintarMemoria();
  }

  /* --- Panel de lectura --------------------------------------------------- */

  function textoLectura() {
    var p = probDescarga();
    var causa;

    if (geo.desborda && estado.extrana > 0.5) {
      causa = '<b>Las dos cargas desbordan el límite.</b> Ya no queda margen libre en la memoria ' +
              'de trabajo, y buena parte de lo que lo ocupa es carga extraña: lo que agrega el ' +
              'diseño de la tarea, no el contenido.';
    } else if (geo.desborda) {
      causa = '<b>No queda margen.</b> El contenido ocupa toda la memoria de trabajo disponible ' +
              'o toda la que la persona cree tener.';
    } else if (estado.percibida > estado.capacidad + 0.25) {
      causa = '<b>Se cree con más margen del que tiene.</b> La línea punteada queda por fuera de ' +
              'la continua: descargará menos de lo que le convendría, y puede sobreestimar lo que ' +
              'realmente aprendió.';
    } else if (estado.extrana > 0.66) {
      causa = '<b>Carga extraña alta.</b> Estorba para seleccionar la información que entra, para ' +
              'memorizarla y también para descargarla: es la triple barrera del modelo.';
    } else if (estado.percibida < 0.34) {
      causa = '<b>Capacidad percibida baja.</b> Aunque la capacidad real alcance, creer que no se ' +
              'puede empuja a descargar.';
    } else if (estado.capacidad < 0.34) {
      causa = '<b>Capacidad de memoria de trabajo baja.</b> Se descarga más, y lo descargado deja ' +
              'de estar disponible para pensar más adelante.';
    } else if (estado.intrinseca > 0.66 && estado.valor < 0.5) {
      causa = '<b>Tema exigente y poco valorado.</b> La combinación empuja a externalizar en vez ' +
              'de aprender.';
    } else if (estado.valor > 0.66 && estado.extrana < 0.4) {
      causa = '<b>La información vale y el camino está despejado.</b> Se invierte esfuerzo en ' +
              'memorizarla en lugar de externalizarla.';
    } else if (estado.intrinseca < 0.3 && estado.extrana < 0.3) {
      causa = '<b>Carga baja en ambos frentes.</b> Hay margen para procesar sin recurrir a una ' +
              'herramienta externa.';
    } else {
      causa = '<b>Situación intermedia.</b> Parte se aprende y parte se externaliza, según el ' +
              'valor que se le atribuya a cada cosa.';
    }

    var efecto;
    if (p > 0.7) {
      efecto = 'La mayor parte sale hacia la herramienta y en la memoria de largo plazo quedan ' +
               'sobre todo punteros: dónde estaba, no qué era.';
    } else if (p > 0.4) {
      efecto = 'Una parte se almacena como conocimiento y otra queda apenas como puntero.';
    } else {
      efecto = 'La mayor parte baja a la memoria de largo plazo como conocimiento declarativo y ' +
               'procedimental.';
    }

    return causa + ' ' + efecto;
  }

  function descripcionSvg() {
    return 'Círculos concéntricos: capacidad de memoria de trabajo ' + nivel(estado.capacidad) +
      ', capacidad percibida ' + nivel(estado.percibida) +
      ', carga cognitiva extraña ' + nivel(estado.extrana) +
      ' y carga intrínseca ' + nivel(estado.intrinseca) + '. ' +
      (geo.desborda ? 'Las cargas superan el límite de capacidad. ' : 'Queda margen libre de capacidad. ') +
      (probDescarga() > 0.55
        ? 'Predomina el flujo hacia la información descargada.'
        : 'Predomina el flujo hacia la memoria de largo plazo.');
  }

  /* --- Dibujo ------------------------------------------------------------- */

  function render() {
    calcularGeometria();

    el.fondo.setAttribute('r', geo.capacidad.toFixed(1));
    el.extrana.setAttribute('r', geo.extrana.toFixed(1));
    el.intr.setAttribute('r', geo.intrinseca.toFixed(1));
    el.percibida.setAttribute('r', geo.percibida.toFixed(1));
    el.wm.setAttribute('r', geo.capacidad.toFixed(1));

    if (el.diagrama) {
      el.diagrama.classList.toggle('diagrama--desborda', geo.desborda);
    }

    el.svg.setAttribute('aria-label', descripcionSvg());
    el.lectura.innerHTML = textoLectura();

    deslizadores.forEach(function (d) {
      var v = Number(d.value) / 100;
      var palabra = nivel(v);
      d.setAttribute('aria-valuetext', palabra);
      var salida = raiz.querySelector('#nivel-' + d.dataset.variable);
      if (salida) { salida.textContent = palabra; }
    });

    marcarEscenario();

    if (sinMovimiento.matches) { memoriaEstatica(); }
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

  function nacer() {
    var nodo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nodo.setAttribute('r', '4');
    nodo.setAttribute('class', 'particula');
    nodo.setAttribute('cy', (CY + (Math.random() * 14 - 7)).toFixed(1));
    nodo.setAttribute('cx', '-8');
    el.capaPart.appendChild(nodo);

    particulas.push({
      nodo: nodo,
      x: -8,
      y: Number(nodo.getAttribute('cy')),
      fase: 'entra',
      ruta: null,
      opacidad: 1,
      revisoEntrada: false,
      revisoSalida: false
    });
  }

  function morir(p) {
    p.fase = 'muere';
    p.nodo.setAttribute('class', 'particula particula--bloqueada');
  }

  function pasoParticula(p, dt) {
    var v = 0.075 * dt;        // px por milisegundo
    var barrera = probBarrera();

    if (p.fase === 'entra') {
      p.x += v;
      // Barrera de selección, al tocar el borde de la carga extraña
      if (!p.revisoEntrada && p.x >= CX - geo.extrana) {
        p.revisoEntrada = true;
        if (Math.random() < barrera) { morir(p); return; }
      }
      if (p.x >= CX) {
        p.x = CX;
        // El centro es la selección de estrategia: memoria biológica o
        // almacén externo.
        p.ruta = Math.random() < probDescarga() ? 'descarga' : 'memoria';
        p.fase = p.ruta === 'descarga' ? 'sale' : 'baja';
      }
    } else if (p.fase === 'sale') {
      p.x += v;
      p.y += (CY - p.y) * 0.1;
      if (!p.revisoSalida && p.x >= CX + geo.extrana) {
        p.revisoSalida = true;
        // Barrera para descargar: la carga extraña del artefacto usado
        if (Math.random() < barrera * 0.8) { morir(p); return; }
      }
      if (p.x > 330) {
        agregarMemoria('puntero');   // de lo descargado queda un puntero
        quitar(p);
        return;
      }
    } else if (p.fase === 'baja') {
      p.y += v;
      p.x += (CX - p.x) * 0.1;
      if (!p.revisoSalida && p.y >= CY + geo.extrana) {
        p.revisoSalida = true;
        // Barrera para memorizar
        if (Math.random() < barrera * 0.8) { morir(p); return; }
      }
      if (p.y > 332) {
        agregarMemoria('saber');
        quitar(p);
        return;
      }
    } else if (p.fase === 'muere') {
      p.opacidad -= 0.035 * (dt / 16);
      if (p.opacidad <= 0) { quitar(p); return; }
      p.nodo.setAttribute('opacity', p.opacidad.toFixed(2));
    }

    p.nodo.setAttribute('cx', p.x.toFixed(1));
    p.nodo.setAttribute('cy', p.y.toFixed(1));
  }

  function quitar(p) {
    if (p.nodo.parentNode) { p.nodo.parentNode.removeChild(p.nodo); }
    p.borrar = true;
  }

  var anterior = 0;

  function bucle(ahora) {
    if (!animando) { return; }
    var dt = anterior ? Math.min(ahora - anterior, 50) : 16;
    anterior = ahora;

    if (ahora - ultimoSpawn > 420 && particulas.length < 16) {
      ultimoSpawn = ahora;
      nacer();
    }

    particulas.forEach(function (p) { pasoParticula(p, dt); });
    particulas = particulas.filter(function (p) { return !p.borrar; });

    requestAnimationFrame(bucle);
  }

  function arrancar() {
    if (sinMovimiento.matches) {
      detener();
      memoriaEstatica();
      return;
    }
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
      memoria = [];
      pintarMemoria();
      render();
    });
  });

  if (sinMovimiento.addEventListener) {
    sinMovimiento.addEventListener('change', function () {
      if (sinMovimiento.matches) { detener(); memoriaEstatica(); } else { arrancar(); }
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
  if (sinMovimiento.matches) { memoriaEstatica(); }
}());
