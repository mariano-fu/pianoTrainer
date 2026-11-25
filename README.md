Piano Hero

Jugar en línea: https://mariano-fu.github.io/pianoTrainer/

Video (2 min): https://youtu.be/O4T3tex1G5A

Entrenador de piano en el navegador. Las notas caen hacia una línea y se tocan con el teclado de la computadora. Cuando una nota llega a la línea, la canción espera hasta que se toque la tecla correcta.

Proyecto 2 del curso Desarrollo Web 1.

Cómo jugar
Abrir el enlace de arriba.
Elegir una canción del menú, o Free Play para tocar sin notas.
Tocar la tecla que corresponde a cada nota cuando llega a la línea naranja.
Teclado
  W   E       T   Y   U       O   P        teclas negras
A   S   D   F   G   H   J   K   L   ;      teclas blancas
C4  D4  E4  F4  G4  A4  B4  C5  D5  E5

En un teclado en español, la tecla Ñ funciona como ;. También se puede tocar haciendo clic en las teclas con el mouse.

Reglas
La canción se detiene en cada nota hasta que se toca la tecla correcta.
Una tecla incorrecta suena, se marca en rojo y cuenta como fallo.
Arriba se muestran el progreso (por ejemplo 12 / 42) y los fallos.
Al final aparece la pantalla de resultados, con Play again y Back to menu.

Canciones
Twinkle, Twinkle, Little Star (tradicional)
Ode to Joy (Beethoven)
Für Elise, tema inicial (Beethoven)
Jingle Bells, coro (James Lord Pierpont)

Las canciones son solo datos en js/songs.js. Para agregar una canción nueva basta con agregar un objeto al arreglo SONGS, sin cambiar el código.

Tecnologías
HTML, CSS (flexbox, variables de CSS) y JavaScript, sin librerías
requestAnimationFrame para la animación, basada en el tiempo transcurrido
Web Audio API para el sonido

Créditos
El sonido se genera con la Web Audio API (osciladores). No se usan archivos de audio ni librerías externas.
Las canciones son de dominio público.