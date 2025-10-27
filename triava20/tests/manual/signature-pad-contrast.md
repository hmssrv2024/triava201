# Prueba manual: contraste del trazo en la firma

## Objetivo
Confirmar que el trazo de la firma en `cuentabloqueada.html` se perciba con claridad sobre el lienzo y las guías del pad de firma.

## Pasos
1. Abrir `cuentabloqueada.html` en un navegador moderno.
2. Navegar hasta la sección donde se solicita la firma y esperar a que el lienzo se inicialice.
3. Observar el color del trazo al mover el cursor sobre el lienzo antes de firmar: debe ser visible y contrastar con el fondo.
4. Firmar con trazos largos y cortos, verificando que el color del trazo sea consistente y legible sobre cualquier guía del lienzo.
5. Cambiar el tema o la variable `--accent` (si la página ofrece un selector de tema) y repetir la firma para confirmar que el color seleccionado permanece accesible.

## Resultado esperado
El trazo de la firma se muestra en un color de alto contraste (por defecto `#F7B600` o el valor actual de `--accent`), facilitando su visualización frente al fondo y a las guías del pad de firma.
