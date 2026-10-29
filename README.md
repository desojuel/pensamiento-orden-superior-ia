# Pensamiento de Orden Superior e Inteligencia Artificial

Autor: Daniel Sojuel.

Sitio estático de una sola página: qué es el pensamiento de orden superior, cómo funciona la
memoria que lo hace posible, qué necesita entender un docente sobre la inteligencia
artificial, y qué cambia cuando el estudiante la usa. No hay base de datos, ni servidor, ni
paso de compilación. Se edita el archivo, se guarda y se publica.

## Cómo está armado

El sitio se lee desplazándose, como cualquier página. El contenido está dividido en
**bloques**: cada bloque dice una sola cosa y lleva su cita abajo. Lo que no cabe en el
bloque va en un `<details>` («Más detalle»), que se abre solo si alguien lo pide.

Los bloques se agrupan en **quince secciones** (00 a 14), y las secciones en **tres partes más
los anexos**:

1. **La teoría del pensamiento de orden superior** — secciones 01 a 05.
2. **La IA, ¿para quién? El trabajo del docente** — secciones 06 y 07.
3. **La IA, ¿para quién? El uso que hará el estudiante** — secciones 08 a 11.
4. **Anexos** — secciones 12 y 13. Se llama así, no «cuarta parte».

Y al final, las referencias (14).

Los anexos son **dos listas de reflexión**: la 12 revisa una tarea o actividad de los
estudiantes, y la 13 revisa el uso que hace de la IA quien enseña. Las dos funcionan igual:
quince preguntas, sin puntaje y sin recoger respuestas.

```
index.html         Todo el texto del sitio, bloque por bloque
css/styles.css     Colores, tipografía y disposición
js/willingham.js   El modelo de memoria de la sección 02
js/skulmowski.js   El modelo de externalización de la sección 09
js/secciones.js    Índice, rótulo de la barra y el resto de interacciones
```

El texto vive **solo** en `index.html`. Los archivos de JavaScript no contienen contenido del
sitio, salvo las frases que cambian según los deslizadores de los dos modelos, que están
dentro de cada uno de esos archivos.

### Anatomía de un bloque

```html
<section class="bloque" data-seccion="09">
  <div class="bloque__caja">
    <p class="bloque__rotulo"><span class="bloque__num">09</span> Qué es</p>
    <h2 class="bloque__titular">El titular, en una línea</h2>
    <p class="bloque__bajada">Una o dos frases de apoyo.</p>
    <div class="foco">El elemento que se quiere destacar.</div>
    <p class="bloque__remate">La consecuencia, o lo que hay que llevarse.</p>
    <details class="detalle"><summary>Más detalle</summary>…</details>
    <p class="fuente">Autor (año)</p>
  </div>
</section>
```

Variantes: `bloque--portada`, `bloque--parte` (las tres divisiones grandes),
`bloque--seccion` (la apertura de cada sección), `bloque--clave` (una sola idea, en grande),
`bloque--ancho` (para visualizaciones), `bloque--modelo` (los dos modelos interactivos),
`bloque--cierre` y `bloque--doc` (las listas de las secciones 12 y 13 y las referencias, que
se leen como documento).

## Cambiar un texto

1. Abre `index.html` en GitHub y haz clic en el lápiz (**Edit this file**).
2. Busca la sección con `Ctrl+F` (o `Cmd+F`). Cada una empieza con un comentario grande:

   ```html
   <!-- ======================================================================
        /03 DEPENDENCIA DEL DOMINIO
        ====================================================================== -->
   ```

3. Cambia el texto que está entre las etiquetas, sin tocar las etiquetas mismas.
4. Baja hasta **Commit changes**, escribe en una línea qué cambiaste y confirma.
5. GitHub vuelve a publicar solo. Un par de minutos después, recarga la página.

Si el texto lleva acentos, comillas o eñes, se escriben normalmente. Para un «y» comercial hay
que escribir `&amp;`, y para un signo de menor que, `&lt;`.

## Reglas que hay que respetar al editar

Son las que sostienen la honestidad del material. Si se rompe alguna, el sitio deja de ser
citable.

1. **Toda afirmación tomada de una fuente lleva su cita**, con autor y año, aunque esté
   parafraseada. No agregar afirmaciones sin cita.
2. **Parafrasear, no traducir.** No pegar párrafos traducidos de los originales.
3. **Lo que se leyó a través de otro autor se cita así**: «(Autor, citado en Skulmowski,
   2023)». En la lista de referencias va solo la fuente que sí se leyó.
4. **Si se agrega una fuente nueva**, hay que agregarla en tres lugares: la cita en el
   bloque, el bloque «Fuentes de esta sección» del cierre, y la lista de la sección 14.
5. **No agregar números ni porcentajes** a los modelos de las secciones 02 y 09, ni a la 10.
   Los modelos son ilustraciones conceptuales, no mediciones.
6. **No quitar la atribución** de ninguna de las dos figuras: la de Skulmowski con su
   licencia CC BY 4.0 y la nota que aclara que los círculos no significan contención; la de
   memoria con el crédito a Willingham, a Kirschner y a quienes hicieron la versión visual
   que popularizó el modelo.
7. **Las listas de las secciones 12 y 13 no se califican y no recogen respuestas.** No
   agregar puntajes, totales, semáforos ni campos para escribir. Las casillas son dibujos:
   están para imprimirlas y marcarlas a mano. «No aplica» es una respuesta válida.
8. Los ejemplos propios llevan la etiqueta `<span class="propio">Propio</span>` o la frase
   «elaboración propia» en la línea de fuente, pero **nunca las dos cosas juntas**.
9. **Se escribe de tú, no de vos**: «escribe», «puedes», «explicas tú».
10. **Se dice «instrucciones», no «consigna»**, y siempre de qué: «las instrucciones de la
    tarea». Para la categoría general se dice «tarea o actividad de aprendizaje».
11. **Los títulos que son preguntas llevan los dos signos**: «¿Qué aporta cada uno?».

## Agregar o quitar un bloque

Los bloques normales **no llevan identificador**, así que se pueden insertar y quitar sin
renumerar nada. Solo hay que revisar dos cosas:

- El atributo **`data-seccion`** del bloque nuevo, que es lo que lo asocia a su sección y lo
  que hace que la barra superior muestre el nombre correcto.
- Si se agrega una **sección** entera, su bloque de apertura necesita un identificador
  estable (`id="s15"`, por ejemplo) y una entrada en el `<nav class="indice">`.
- Los separadores de parte son `p1`, `p2`, `p3` y `p4`. El cuarto es el de los anexos.

El índice es además la **única fuente de los nombres de sección**: de ahí se arma el rótulo
de la barra superior y el enlace «Siguiente sección» que aparece al final de cada cierre.
Para renombrar una sección se cambia ahí y nada más.

Los bloques divisorios (`bloque--parte`) llevan el `data-seccion` de la sección que empieza
después, para que la barra ya anuncie hacia dónde va.

## Ver el sitio en la computadora antes de publicar

Abrir `index.html` con doble clic funciona para revisar los textos. Para que las rutas
relativas funcionen bien conviene levantar un servidor. Desde esta carpeta:

```bash
python3 -m http.server 8000
```

Y luego abrir `http://localhost:8000` en el navegador. Para detenerlo, `Ctrl+C`.

## Dónde está publicado

El sitio vive en <https://desojuel.github.io/pensamiento-orden-superior-ia/>, y se publica
desde <https://github.com/desojuel/pensamiento-orden-superior-ia> (rama `main`, raíz).

Para actualizarlo hay dos caminos:

- **Desde GitHub**, editando `index.html` con el lápiz y confirmando el cambio, como se
  explica más arriba.
- **Desde la computadora**, con los cambios ya guardados en esta carpeta:

  ```bash
  git add -A && git commit -m "qué cambió" && git push
  ```

En los dos casos, GitHub vuelve a publicar solo en un par de minutos.

**Si el cambio no se ve, es la caché del navegador, no GitHub.** Las hojas de estilo y los
archivos de JavaScript quedan guardados unos minutos. Para forzar que se vuelvan a bajar,
recargar con **`Cmd` `Shift` `R`** (o `Ctrl` `Shift` `R` en Windows). Conviene hacerlo siempre
antes de concluir que algo no se publicó.

**Importante:** este repositorio es público, y la carpeta de arriba contiene PDF de artículos
y libros con derechos de autor y un archivo con respuestas de personas identificables. Nada de
eso puede subirse. El `.gitignore` bloquea los PDF y las hojas de cálculo como red de
seguridad, pero conviene revisar `git status` antes de confirmar cualquier cambio.

## Para proyectar

- El sitio funciona sin conexión una vez que cargó: no usa ninguna librería externa ni
  tipografías descargadas. Conviene abrirlo antes de empezar.
- Se avanza desplazándose, con la rueda, la barra espaciadora o `AvPág` / `RePág`, como en
  cualquier página. En pantalla ancha el índice es una columna a la izquierda que marca la
  sección en la que va el lector; se pliega con el botón `‹` de la columna o con el de la
  barra, y se trae de vuelta con el de la barra. El sitio recuerda si quedó plegado. En
  pantalla angosta se abre y se cierra con el botón de la barra.
- El botón `◐` de la barra cambia entre tema automático, claro y oscuro. Para un proyector
  con poca luz, el claro suele leerse mejor.
- Los deslizadores de los dos modelos funcionan con el teclado: `Tab` para llegar y flechas
  para moverlos.
- Si el sistema tiene activada la reducción de movimiento, los modelos no animan partículas
  y solo muestran los cambios de estado.

## Imprimir las listas de reflexión

Cada lista tiene su botón, y cada botón imprime **solo su lista**: las quince preguntas con
su fundamento y las casillas vacías, para marcarlas a mano. Sirve igual para guardar en PDF
desde el diálogo de impresión.

**El sitio no guarda nada de lo que alguien responda**, porque no hay nada que responder en
pantalla: las casillas no son campos. Lo único que queda en el navegador son dos preferencias
de interfaz: el tema claro u oscuro, y si la columna del índice quedó plegada.
